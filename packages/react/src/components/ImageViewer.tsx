import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type {
  AnnotationStroke,
  InteractionMode,
  NormalizedPoint,
} from "@tbib-image-viewer/core";
import {
  AnnotationStore,
  downloadAnnotatedImage,
  isPointNearStroke,
} from "@tbib-image-viewer/core";
import type { ImageViewerProps } from "../types";
import { ImageToolbar } from "./ImageToolbar";
import { AnnotationCanvas } from "./AnnotationCanvas";
import { LaserCursorLayer } from "./LaserCursorLayer";
import { useImageTransform } from "../hooks/useImageTransform";

export const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt = "Medical illustration",
  className = "",
  style,
  theme = "dark",
  initialTool = "hand",
  initialColor = "#ef4444",
  initialStrokeWidth = 4,
  showToolbar = true,
  enableAnnotations = true,
  enableLaser = true,
  slideId,
  initialAnnotations,
  onAnnotationsChange,
  children,
}) => {
  const effectiveSlideId = useMemo(() => slideId || src, [slideId, src]);

  // Tools and style states
  const [activeTool, setActiveTool] = useState<InteractionMode>(initialTool);
  const [color, setColor] = useState<string>(initialColor);
  const [strokeWidth, setStrokeWidth] = useState<number>(initialStrokeWidth);

  // Store & strokes
  const storeRef = useRef<AnnotationStore>(
    new AnnotationStore(
      initialAnnotations ? [{ slideId: effectiveSlideId, strokes: initialAnnotations }] : undefined
    )
  );
  const [strokes, setStrokes] = useState<AnnotationStroke[]>(() =>
    storeRef.current.getStrokes(effectiveSlideId)
  );
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Image layout dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ width: 800, height: 600 });

  // Transforms
  const {
    transform,
    zoomIn,
    zoomOut,
    resetTransform,
    rotateClockwise,
    panBy,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useImageTransform();

  // Drag panning when in "hand" mode
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Sync store listener
  useEffect(() => {
    const store = storeRef.current;
    const unsubscribe = store.subscribe((id, updated) => {
      if (id === effectiveSlideId) {
        setStrokes(updated);
        setCanUndo(store.canUndo(effectiveSlideId));
        setCanRedo(store.canRedo(effectiveSlideId));
        onAnnotationsChange?.(updated);
      }
    });
    setStrokes(store.getStrokes(effectiveSlideId));
    setCanUndo(store.canUndo(effectiveSlideId));
    setCanRedo(store.canRedo(effectiveSlideId));
    return unsubscribe;
  }, [effectiveSlideId, onAnnotationsChange]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgSize({
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
    });
  };

  const handleStrokeComplete = useCallback(
    (newStroke: AnnotationStroke) => {
      storeRef.current.addStroke(effectiveSlideId, newStroke);
    },
    [effectiveSlideId]
  );

  const handleEraseStroke = useCallback(
    (point: NormalizedPoint) => {
      storeRef.current.removeStrokesNear(
        effectiveSlideId,
        point,
        0.03, // 3% hit radius in normalized coordinates
        isPointNearStroke
      );
    },
    [effectiveSlideId]
  );

  const handleUndo = useCallback(() => {
    storeRef.current.undo(effectiveSlideId);
  }, [effectiveSlideId]);

  const handleRedo = useCallback(() => {
    storeRef.current.redo(effectiveSlideId);
  }, [effectiveSlideId]);

  const handleClear = useCallback(() => {
    storeRef.current.clear(effectiveSlideId);
  }, [effectiveSlideId]);

  // Stage pointer drag for panning when tool is 'hand'
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeTool !== "hand") return;
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || activeTool !== "hand") return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    panBy(dx, dy);
  };

  const handleStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
  };

  // Keyboard shortcuts (Undo/Redo, Zoom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "+" || e.key === "=") {
        zoomIn();
      } else if (e.key === "-") {
        zoomOut();
      } else if (e.key === "0") {
        resetTransform();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, zoomIn, zoomOut, resetTransform]);

  // Download actions
  const handleDownloadAnnotated = async () => {
    if (!imgRef.current) return;
    await downloadAnnotatedImage(imgRef.current, strokes, {
      format: "image/png",
      includeAnnotations: true,
      fileName: `tbib-annotated-${Date.now()}.png`,
    });
  };

  const handleDownloadClean = async () => {
    if (!imgRef.current) return;
    await downloadAnnotatedImage(imgRef.current, [], {
      format: "image/png",
      includeAnnotations: false,
      fileName: `tbib-clean-${Date.now()}.png`,
    });
  };

  const handleExportJson = () => {
    const data = storeRef.current.exportJSON();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tbib-annotations-${Date.now()}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      ref={containerRef}
      className={`tbib-iv-container ${theme === "light" ? "tbib-iv-light" : ""} ${className}`}
      style={style}
    >
      {/* Top Toolbar */}
      {showToolbar && (
        <ImageToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          color={color}
          onColorChange={setColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onClear={handleClear}
          zoomScale={transform.scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={resetTransform}
          onRotate={rotateClockwise}
          onDownloadAnnotated={handleDownloadAnnotated}
          onDownloadClean={handleDownloadClean}
          onExportJson={handleExportJson}
        />
      )}

      {/* Main Viewport Stage */}
      <div
        className="tbib-iv-stage"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerUp}
        style={{
          cursor: activeTool === "hand" ? (isDraggingRef.current ? "grabbing" : "grab") : "default",
        }}
      >
        <div
          className="tbib-iv-stage-inner"
          style={{
            transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0) scale(${transform.scale}) rotate(${transform.rotate}deg)`,
            transition: isDraggingRef.current ? "none" : "transform 0.05s ease-out",
          }}
        >
          {/* Target Base Image */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className="tbib-iv-image"
            onLoad={handleImageLoad}
            crossOrigin="anonymous"
            draggable={false}
          />

          {/* Hand-Free Annotation Layer */}
          {enableAnnotations && (
            <AnnotationCanvas
              width={imgSize.width}
              height={imgSize.height}
              strokes={strokes}
              activeTool={activeTool}
              color={color}
              strokeWidth={strokeWidth}
              onStrokeComplete={handleStrokeComplete}
              onEraseStroke={handleEraseStroke}
            />
          )}

          {/* Laser Cursor Layer */}
          {enableLaser && activeTool === "laser" && (
            <LaserCursorLayer color={color} secondaryColor={color} enabled={activeTool === "laser"} />
          )}
        </div>
      </div>

      {children}
    </div>
  );
};
