import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons/faExclamationTriangle";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons/faExternalLinkAlt";
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

  // Image layout & load status
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ width: 800, height: 600 });
  const [imageStatus, setImageStatus] = useState<"loading" | "loaded" | "error">("loading");
  const [reloadKey, setReloadKey] = useState(0);

  const effectiveSrc = useMemo(() => {
    if (!src) return "";
    if (reloadKey === 0) return src;
    const sep = src.includes("?") ? "&" : "?";
    return `${src}${sep}_reload=${reloadKey}`;
  }, [src, reloadKey]);

  // Check if image changes or reloadKey changes
  useEffect(() => {
    setImageStatus("loading");
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setImgSize({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      });
      setImageStatus("loaded");
    }
  }, [src, reloadKey]);

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
    setImageStatus("loaded");
  };

  const handleImageError = () => {
    setImageStatus("error");
  };

  const handleReload = () => {
    setImageStatus("loading");
    setReloadKey((prev) => prev + 1);
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
            key={`${src}-${reloadKey}`}
            src={effectiveSrc}
            alt={alt}
            className={`tbib-iv-image ${imageStatus === "loaded" ? "tbib-iv-image-loaded" : "tbib-iv-image-loading"}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />

          {/* Hand-Free Annotation Layer */}
          {enableAnnotations && imageStatus === "loaded" && (
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
        </div>

        {/* Loading Spinner Overlay */}
        {imageStatus === "loading" && (
          <div className="tbib-iv-status-overlay">
            <div className="tbib-iv-spinner">
              <FontAwesomeIcon icon={faSpinner} spin className="tbib-iv-spinner-icon" />
            </div>
            <span className="tbib-iv-status-text">Chargement de l'illustration...</span>
          </div>
        )}

        {/* Error / Reload State Overlay */}
        {imageStatus === "error" && (
          <div className="tbib-iv-status-overlay tbib-iv-error-card">
            <div className="tbib-iv-error-icon">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <h3 className="tbib-iv-error-title">Impossible de charger l'image</h3>
            <p className="tbib-iv-error-desc">
              Le fichier est temporairement inaccessible ou une erreur réseau est survenue.
            </p>
            <div className="tbib-iv-error-actions">
              <button
                type="button"
                className="tbib-iv-btn tbib-iv-btn-primary tbib-iv-retry-btn"
                onClick={handleReload}
              >
                <FontAwesomeIcon icon={faRotateRight} />
                <span>Réessayer</span>
              </button>
              {src && (
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tbib-iv-btn tbib-iv-open-btn"
                >
                  <FontAwesomeIcon icon={faExternalLinkAlt} />
                  <span>Lien direct</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Laser Cursor Layer */}
        {enableLaser && activeTool === "laser" && imageStatus === "loaded" && (
          <LaserCursorLayer color={color} secondaryColor={color} enabled={activeTool === "laser"} />
        )}
      </div>

      {children}
    </div>
  );
};
