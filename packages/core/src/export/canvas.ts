import type { AnnotationStroke, ExportOptions } from "../types";
import { hexToRgba } from "../annotations/smooth";

/**
 * Loads an image from a URL or source element and renders it
 * along with its annotations onto an off-screen HTMLCanvasElement
 * at original native resolution.
 */
export async function renderToOffscreenCanvas(
  imageSource: string | HTMLImageElement,
  strokes: AnnotationStroke[],
  options: ExportOptions = {}
): Promise<HTMLCanvasElement> {
  const { includeAnnotations = true, backgroundColor } = options;

  // 1. Resolve source HTMLImageElement
  let img: HTMLImageElement;
  if (typeof imageSource === "string") {
    img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = (e) => reject(new Error(`Failed to load image from source: ${imageSource}`));
      img.src = imageSource;
    });
  } else {
    img = imageSource;
  }

  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  if (naturalWidth === 0 || naturalHeight === 0) {
    throw new Error("Invalid image dimensions: width or height is 0");
  }

  // 2. Setup high-res canvas matching native dimensions
  const canvas = document.createElement("canvas");
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to obtain 2D canvas context for export");
  }

  // 3. Optional background color
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, naturalWidth, naturalHeight);
  }

  // 4. Draw base image
  ctx.drawImage(img, 0, 0, naturalWidth, naturalHeight);

  // 5. Burn in annotations if requested
  if (includeAnnotations && strokes.length > 0) {
    for (const stroke of strokes) {
      if (stroke.points.length === 0) continue;

      ctx.save();
      ctx.beginPath();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Scale stroke width relative to the maximum dimension of the image
      // Stroke width in model is relative to fitted display (e.g. 3px on 800px)
      // We scale it proportionally so it looks identical to what user saw
      const strokeScale = Math.max(naturalWidth, naturalHeight) / 1000;
      ctx.lineWidth = Math.max(1, stroke.width * strokeScale);

      if (stroke.tool === "highlighter") {
        ctx.globalAlpha = stroke.opacity || 0.35;
        ctx.strokeStyle = hexToRgba(stroke.color, 1);
        // Multiply blend looks most natural on medical illustrations & documents
        ctx.globalCompositeOperation = "multiply";
      } else {
        ctx.globalAlpha = stroke.opacity || 1.0;
        ctx.strokeStyle = stroke.color;
        ctx.globalCompositeOperation = "source-over";
      }

      const p0 = stroke.points[0];
      const startX = p0.x * naturalWidth;
      const startY = p0.y * naturalHeight;
      ctx.moveTo(startX, startY);

      if (stroke.points.length === 1) {
        ctx.lineTo(startX + 0.5, startY + 0.5);
      } else {
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const pt = stroke.points[i];
          const next = stroke.points[i + 1];
          const cx = (pt.x * naturalWidth + next.x * naturalWidth) / 2;
          const cy = (pt.y * naturalHeight + next.y * naturalHeight) / 2;
          ctx.quadraticCurveTo(pt.x * naturalWidth, pt.y * naturalHeight, cx, cy);
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x * naturalWidth, last.y * naturalHeight);
      }

      ctx.stroke();
      ctx.restore();
    }
  }

  return canvas;
}

/**
 * Triggers a browser download of the image (with or without annotations).
 */
export async function downloadAnnotatedImage(
  imageSource: string | HTMLImageElement,
  strokes: AnnotationStroke[],
  options: ExportOptions = {}
): Promise<void> {
  const {
    format = "image/png",
    quality = 0.95,
    fileName = `tbib-annotated-image-${Date.now()}.${format === "image/jpeg" ? "jpg" : format === "image/webp" ? "webp" : "png"}`,
  } = options;

  const canvas = await renderToOffscreenCanvas(imageSource, strokes, options);

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to generate image blob from canvas"));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve();
      },
      format,
      quality
    );
  });
}
