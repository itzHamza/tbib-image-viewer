import type { AnnotationStroke, ExportOptions } from "../types";
import { hexToRgba } from "../annotations/smooth";

/**
 * Loads an image from a source URL or HTMLImageElement cleanly without
 * tainting the canvas, using fetch->Blob or crossOrigin cache-busting.
 */
async function loadCleanImage(
  imageSource: string | HTMLImageElement
): Promise<{ img: HTMLImageElement; cleanup?: () => void }> {
  const src = typeof imageSource === "string" ? imageSource : imageSource.src;

  // Strategy 1: Fetch as Blob URL (Guarantees same-origin blob: URL, zero canvas tainting)
  try {
    const res = await fetch(src, { mode: "cors" });
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = blobUrl;
      });
      return {
        img,
        cleanup: () => URL.revokeObjectURL(blobUrl),
      };
    }
  } catch {
    // Strategy 1 failed (e.g. strict origin restrictions on fetch)
  }

  // Strategy 2: In-memory Image with crossOrigin = "anonymous" and cache buster
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const sep = src.includes("?") ? "&" : "?";
    const corsSrc = `${src}${sep}_export=${Date.now()}`;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = corsSrc;
    });
    return { img };
  } catch {
    // Strategy 2 failed
  }

  // Strategy 3: Fall back to existing image element or non-CORS element
  if (typeof imageSource !== "string" && imageSource.naturalWidth > 0) {
    return { img: imageSource };
  }

  const fallbackImg = new Image();
  await new Promise<void>((resolve, reject) => {
    fallbackImg.onload = () => resolve();
    fallbackImg.onerror = reject;
    fallbackImg.src = src;
  });
  return { img: fallbackImg };
}

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
  const { canvas, cleanup } = await renderToOffscreenCanvasWithCleanup(imageSource, strokes, options);
  cleanup?.();
  return canvas;
}

export async function renderToOffscreenCanvasWithCleanup(
  imageSource: string | HTMLImageElement,
  strokes: AnnotationStroke[],
  options: ExportOptions = {}
): Promise<{ canvas: HTMLCanvasElement; cleanup?: () => void }> {
  const { includeAnnotations = true, backgroundColor } = options;

  // 1. Resolve clean HTMLImageElement
  const { img, cleanup } = await loadCleanImage(imageSource);

  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;

  if (naturalWidth === 0 || naturalHeight === 0) {
    cleanup?.();
    throw new Error("Invalid image dimensions: width or height is 0");
  }

  // 2. Setup high-res canvas matching native dimensions
  const canvas = document.createElement("canvas");
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    cleanup?.();
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
      const strokeScale = Math.max(naturalWidth, naturalHeight) / 1000;
      ctx.lineWidth = Math.max(1, stroke.width * strokeScale);

      if (stroke.tool === "highlighter") {
        ctx.globalAlpha = stroke.opacity || 0.35;
        ctx.strokeStyle = hexToRgba(stroke.color, 1);
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

  return { canvas, cleanup };
}

/**
 * Triggers a browser download of the image (with or without annotations).
 * Guarantees zero unhandled SecurityError on tainted canvases with automatic fallback.
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

  const src = typeof imageSource === "string" ? imageSource : imageSource.src;

  const directDownload = (downloadUrl: string, name: string) => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  try {
    const { canvas, cleanup } = await renderToOffscreenCanvasWithCleanup(imageSource, strokes, options);

    await new Promise<void>((resolve) => {
      try {
        canvas.toBlob(
          (blob) => {
            cleanup?.();
            if (!blob) {
              directDownload(src, fileName);
              resolve();
              return;
            }

            const url = URL.createObjectURL(blob);
            directDownload(url, fileName);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            resolve();
          },
          format,
          quality
        );
      } catch (taintedErr) {
        cleanup?.();
        console.warn("Canvas was tainted by cross-origin security rules, downloading direct asset:", taintedErr);
        directDownload(src, fileName);
        resolve();
      }
    });
  } catch (err) {
    console.warn("Offscreen canvas render encountered an issue, falling back to direct asset download:", err);
    directDownload(src, fileName);
  }
}
