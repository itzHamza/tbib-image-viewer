import type { NormalizedPoint } from "../types";

/**
 * Converts a list of normalized points into a smooth SVG path definition
 * using quadratic Bézier midpoint interpolation.
 */
export function pointsToSvgPath(
  points: NormalizedPoint[],
  width: number,
  height: number
): string {
  if (points.length === 0) return "";
  if (points.length === 1) {
    const p = points[0];
    const px = p.x * width;
    const py = p.y * height;
    return `M ${px} ${py} L ${px + 0.1} ${py + 0.1}`;
  }

  const p0 = points[0];
  let d = `M ${p0.x * width} ${p0.y * height}`;

  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    const cx = (current.x * width + next.x * width) / 2;
    const cy = (current.y * height + next.y * height) / 2;

    d += ` Q ${current.x * width} ${current.y * height}, ${cx} ${cy}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x * width} ${last.y * height}`;

  return d;
}

/**
 * Calculates squared Euclidean distance between two points in normalized coordinates.
 */
export function distanceSq(p1: NormalizedPoint, p2: NormalizedPoint): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

/**
 * Checks if a test point in normalized coordinates is close to any point in the stroke
 * within an interaction threshold (used for eraser hit detection).
 */
export function isPointNearStroke(
  testPt: NormalizedPoint,
  points: NormalizedPoint[],
  thresholdNorm: number
): boolean {
  const thresholdSq = thresholdNorm * thresholdNorm;
  for (let i = 0; i < points.length; i++) {
    if (distanceSq(testPt, points[i]) <= thresholdSq) {
      return true;
    }
  }
  return false;
}

/**
 * Converts hex color (#rrggbb or #rgb) to an rgba string with alpha.
 */
export function hexToRgba(hex: string, alpha = 1): string {
  if (hex.startsWith("rgba")) return hex;
  const clean = hex.trim().replace("#", "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
}
