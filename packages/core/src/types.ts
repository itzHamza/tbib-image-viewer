/**
 * Normalized 2D point on an image.
 * x: 0 (left edge) to 1 (right edge)
 * y: 0 (top edge) to 1 (bottom edge)
 */
export interface NormalizedPoint {
  x: number;
  y: number;
  pressure?: number;
}

/**
 * Pixel coordinate point relative to the rendered canvas or screen.
 */
export interface ScreenPoint {
  x: number;
  y: number;
}

export type DrawTool = "pen" | "highlighter" | "laser" | "eraser";
export type InteractionMode = "hand" | DrawTool;

export interface AnnotationStroke {
  id: string;
  tool: "pen" | "highlighter";
  color: string;
  /** Stroke width normalized relative to the image max dimension, or in base image px */
  width: number;
  opacity: number;
  points: NormalizedPoint[];
  createdAt: number;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface TransformState {
  scale: number;
  translateX: number;
  translateY: number;
  rotate: number; // In degrees (0, 90, 180, 270)
}

export interface SlideAnnotations {
  slideId: string;
  strokes: AnnotationStroke[];
}

export type ExportFormat = "image/png" | "image/jpeg" | "image/webp";

export interface ExportOptions {
  format?: ExportFormat;
  quality?: number; // 0.1 to 1.0 (for jpeg/webp)
  includeAnnotations?: boolean;
  fileName?: string;
  backgroundColor?: string;
}

export interface GalleryItem {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  description?: string;
  thumbnailSrc?: string;
  width?: number;
  height?: number;
}
