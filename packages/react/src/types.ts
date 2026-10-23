import type {
  AnnotationStroke,
  DrawTool,
  ExportOptions,
  GalleryItem,
  InteractionMode,
  SlideAnnotations,
  TransformState,
} from "@tbib-image-viewer/core";

export type {
  AnnotationStroke,
  DrawTool,
  ExportOptions,
  GalleryItem,
  InteractionMode,
  SlideAnnotations,
  TransformState,
};

export interface ImageViewerProps {
  /** Source image URL */
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Theme: 'dark' (default Midnight Ocean) or 'light' (Warm Parchment) */
  theme?: "dark" | "light";
  /** Initial tool selected */
  initialTool?: InteractionMode;
  /** Initial stroke color */
  initialColor?: string;
  /** Initial stroke width */
  initialStrokeWidth?: number;
  /** Show top toolbar */
  showToolbar?: boolean;
  /** Allow hand-free drawings (pen, highlighter, eraser) */
  enableAnnotations?: boolean;
  /** Allow laser pointer mode */
  enableLaser?: boolean;
  /** Unique ID for storing strokes (defaults to src URL) */
  slideId?: string;
  /** Initial annotations */
  initialAnnotations?: AnnotationStroke[];
  /** Callback fired whenever annotations change */
  onAnnotationsChange?: (strokes: AnnotationStroke[]) => void;
  /** Custom children to render on top of viewer */
  children?: React.ReactNode;
}

export interface ImageGalleryLightboxProps {
  /** Array of gallery images */
  items: GalleryItem[];
  /** Index of currently active slide (0-based) */
  activeIndex?: number;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Called when the user closes the lightbox */
  onClose: () => void;
  /** Called when the active index changes */
  onIndexChange?: (newIndex: number) => void;
  /** Theme */
  theme?: "dark" | "light";
  /** Initial tool */
  initialTool?: InteractionMode;
  /** Initial color */
  initialColor?: string;
  /** Enable bottom thumbnail strip */
  showThumbnails?: boolean;
  /** Initial annotations for all slides */
  initialAnnotations?: SlideAnnotations[];
  /** Callback fired whenever any slide's annotations update */
  onAnnotationsChange?: (slideId: string, strokes: AnnotationStroke[]) => void;
}
