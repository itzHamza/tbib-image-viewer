import React, { useState, useRef, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
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
import type { ImageGalleryLightboxProps } from "../types";
import { ImageToolbar } from "./ImageToolbar";
import { AnnotationCanvas } from "./AnnotationCanvas";
import { LaserCursorLayer } from "./LaserCursorLayer";
import { ThumbnailStrip } from "./ThumbnailStrip";
import { useImageTransform } from "../hooks/useImageTransform";
import { useSwipeGesture } from "../hooks/useSwipeGesture";

export const ImageGalleryLightbox: React.FC<ImageGalleryLightboxProps> = ({
  items,
  activeIndex = 0,
  isOpen,
  onClose,
  onIndexChange,
  theme = "dark",
  initialTool = "hand",
  initialColor = "#ef4444",
  showThumbnails = true,
  initialAnnotations,
  onAnnotationsChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(activeIndex);
  const [activeTool, setActiveTool] = useState<InteractionMode>(initialTool);
  const [color, setColor] = useState(initialColor);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync index from props
  useEffect(() => {
    setCurrentIndex(activeIndex);
  }, [activeIndex]);

  const currentItem = items[currentIndex] || items[0];
  const slideId = currentItem?.id || currentItem?.src || `slide-${currentIndex}`;

  // Annotation store
  const storeRef = useRef<AnnotationStore>(new AnnotationStore(initialAnnotations));
  const [strokes, setStrokes] = useState<AnnotationStroke[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Transform hook
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

  // Reset zoom on slide change
  useEffect(() => {
    resetTransform();
  }, [currentIndex, resetTransform]);

  // Image size state
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan dragging
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Sync slide strokes
  useEffect(() => {
    const store = storeRef.current;
    const updateStrokes = () => {
      const s = store.getStrokes(slideId);
      setStrokes(s);
      setCanUndo(store.canUndo(slideId));
      setCanRedo(store.canRedo(slideId));
      onAnnotationsChange?.(slideId, s);
    };

    updateStrokes();
    const unsubscribe = store.subscribe((id) => {
      if (id === slideId) {
        updateStrokes();
      }
    });
    return unsubscribe;
  }, [slideId, onAnnotationsChange]);

  // Navigation handlers
  const goToNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      onIndexChange?.(nextIdx);
    }
  }, [currentIndex, items.length, onIndexChange]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      onIndexChange?.(prevIdx);
    }
  }, [currentIndex, onIndexChange]);

  // Swipe gesture
  const { onTouchStart: onSwipeTouchStart, onTouchEnd: onSwipeTouchEnd } = useSwipeGesture({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrev,
    enabled: activeTool === "hand",
  });

  // Stage touch combination
  const combinedTouchStart = (e: React.TouchEvent) => {
    handleTouchStart(e);
    onSwipeTouchStart(e);
  };

  const combinedTouchEnd = (e: React.TouchEvent) => {
    handleTouchEnd();
    onSwipeTouchEnd(e);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          storeRef.current.redo(slideId);
        } else {
          storeRef.current.undo(slideId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        storeRef.current.redo(slideId);
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
  }, [isOpen, onClose, goToNext, goToPrev, slideId, zoomIn, zoomOut, resetTransform]);

  // Stage pointer drag for pan
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

  const handleStagePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Stroke handlers
  const handleStrokeComplete = useCallback(
    (stroke: AnnotationStroke) => {
      storeRef.current.addStroke(slideId, stroke);
    },
    [slideId]
  );

  const handleEraseStroke = useCallback(
    (pt: NormalizedPoint) => {
      storeRef.current.removeStrokesNear(slideId, pt, 0.03, isPointNearStroke);
    },
    [slideId]
  );

  const handleUndo = useCallback(() => storeRef.current.undo(slideId), [slideId]);
  const handleRedo = useCallback(() => storeRef.current.redo(slideId), [slideId]);
  const handleClear = useCallback(() => storeRef.current.clear(slideId), [slideId]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Download actions
  const handleDownloadAnnotated = async () => {
    if (!imgRef.current) return;
    await downloadAnnotatedImage(imgRef.current, strokes, {
      format: "image/png",
      includeAnnotations: true,
      fileName: `tbib-gallery-${currentIndex + 1}-annotated.png`,
    });
  };

  const handleDownloadClean = async () => {
    if (!imgRef.current) return;
    await downloadAnnotatedImage(imgRef.current, [], {
      format: "image/png",
      includeAnnotations: false,
      fileName: `tbib-gallery-${currentIndex + 1}-clean.png`,
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
    link.download = `tbib-gallery-annotations.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!isOpen || !currentItem) return null;

  return (
    <div
      ref={containerRef}
      className={`tbib-iv-lightbox-overlay ${theme === "light" ? "tbib-iv-light" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox Gallery"
    >
      {/* Top Controls Toolbar */}
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
        onClose={onClose}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        currentIndex={currentIndex}
        totalImages={items.length}
      />

      {/* Side Arrow Navigation */}
      {currentIndex > 0 && (
        <button
          type="button"
          className="tbib-iv-nav-prev"
          onClick={goToPrev}
          title="Previous Image (Arrow Left)"
          aria-label="Previous image"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
      )}

      {currentIndex < items.length - 1 && (
        <button
          type="button"
          className="tbib-iv-nav-next"
          onClick={goToNext}
          title="Next Image (Arrow Right)"
          aria-label="Next image"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      )}

      {/* Main Viewport Stage */}
      <div
        className="tbib-iv-stage"
        onWheel={handleWheel}
        onTouchStart={combinedTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={combinedTouchEnd}
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
          <img
            ref={imgRef}
            src={currentItem.src}
            alt={currentItem.alt || currentItem.title || `Gallery slide ${currentIndex + 1}`}
            className="tbib-iv-image"
            onLoad={(e) => {
              const img = e.currentTarget;
              setImgSize({
                width: img.naturalWidth || img.width,
                height: img.naturalHeight || img.height,
              });
            }}
            crossOrigin="anonymous"
            draggable={false}
          />

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
        </div>

        {/* Laser Cursor Layer: Sits at stage viewport level so laser point is 100% 1:1 with cursor at any zoom/pan/rotate */}
        {activeTool === "laser" && (
          <LaserCursorLayer color={color} secondaryColor={color} enabled={activeTool === "laser"} />
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {showThumbnails && (
        <ThumbnailStrip
          items={items}
          activeIndex={currentIndex}
          onSelect={(idx) => {
            setCurrentIndex(idx);
            onIndexChange?.(idx);
          }}
        />
      )}
    </div>
  );
};
