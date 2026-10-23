import type { ImageDimensions, NormalizedPoint, ScreenPoint, TransformState } from "../types";

export const DEFAULT_TRANSFORM: TransformState = {
  scale: 1,
  translateX: 0,
  translateY: 0,
  rotate: 0,
};

export const MIN_SCALE = 0.5;
export const MAX_SCALE = 8.0;

/**
 * Clamps scale between min and max allowed bounds.
 */
export function clampScale(scale: number, min = MIN_SCALE, max = MAX_SCALE): number {
  return Math.min(Math.max(scale, min), max);
}

/**
 * Converts a screen/viewport coordinate (e.g. mouse or touch event)
 * into a normalized image coordinate (0 to 1) based on the image bounding box
 * and current scale/pan/rotation transform.
 */
export function screenToNormalizedImage(
  screenPt: ScreenPoint,
  containerRect: DOMRect,
  imageDimensions: ImageDimensions,
  transform: TransformState
): NormalizedPoint | null {
  if (imageDimensions.width <= 0 || imageDimensions.height <= 0) return null;

  // 1. Point relative to container center
  const centerX = containerRect.left + containerRect.width / 2;
  const centerY = containerRect.top + containerRect.height / 2;

  let dx = screenPt.x - centerX - transform.translateX;
  let dy = screenPt.y - centerY - transform.translateY;

  // 2. Undo rotation
  const rad = (-transform.rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const unrotatedX = dx * cos - dy * sin;
  const unrotatedY = dx * sin + dy * cos;

  // 3. Undo scale
  const scaledX = unrotatedX / transform.scale;
  const scaledY = unrotatedY / transform.scale;

  // 4. Compute displayed image fitted bounds at scale = 1
  const aspect = imageDimensions.width / imageDimensions.height;
  const containerAspect = containerRect.width / containerRect.height;

  let fittedW: number;
  let fittedH: number;

  if (containerAspect > aspect) {
    fittedH = containerRect.height;
    fittedW = fittedH * aspect;
  } else {
    fittedW = containerRect.width;
    fittedH = fittedW / aspect;
  }

  // 5. Convert to normalized 0..1 coordinates relative to fitted image box
  const normX = (scaledX + fittedW / 2) / fittedW;
  const normY = (scaledY + fittedH / 2) / fittedH;

  return {
    x: Math.max(0, Math.min(1, normX)),
    y: Math.max(0, Math.min(1, normY)),
  };
}

/**
 * Converts a normalized image coordinate (0 to 1) to screen/pixel coordinates
 * inside the given container.
 */
export function normalizedImageToScreen(
  normPt: NormalizedPoint,
  containerRect: DOMRect,
  imageDimensions: ImageDimensions,
  transform: TransformState
): ScreenPoint {
  const aspect = imageDimensions.width / imageDimensions.height;
  const containerAspect = containerRect.width / containerRect.height;

  let fittedW: number;
  let fittedH: number;

  if (containerAspect > aspect) {
    fittedH = containerRect.height;
    fittedW = fittedH * aspect;
  } else {
    fittedW = containerRect.width;
    fittedH = fittedW / aspect;
  }

  // Local unscaled, unrotated position relative to center
  const localX = normPt.x * fittedW - fittedW / 2;
  const localY = normPt.y * fittedH - fittedH / 2;

  // Apply scale
  const scaledX = localX * transform.scale;
  const scaledY = localY * transform.scale;

  // Apply rotation
  const rad = (transform.rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const rotatedX = scaledX * cos - scaledY * sin;
  const rotatedY = scaledX * sin + scaledY * cos;

  // Apply translation and container center
  const centerX = containerRect.left + containerRect.width / 2;
  const centerY = containerRect.top + containerRect.height / 2;

  return {
    x: centerX + transform.translateX + rotatedX,
    y: centerY + transform.translateY + rotatedY,
  };
}

/**
 * Computes fitted size of an image inside container maintaining aspect ratio.
 */
export function getFittedImageBounds(
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number
): { width: number; height: number } {
  if (imgW <= 0 || imgH <= 0 || containerW <= 0 || containerH <= 0) {
    return { width: 0, height: 0 };
  }
  const aspect = imgW / imgH;
  const containerAspect = containerW / containerH;

  if (containerAspect > aspect) {
    const height = containerH;
    return { width: height * aspect, height };
  } else {
    const width = containerW;
    return { width, height: width / aspect };
  }
}
