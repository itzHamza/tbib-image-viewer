import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHand,
  faPen,
  faHighlighter,
  faCrosshairs,
  faEraser,
  faRotateLeft,
  faRotateRight,
  faTrashCan,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faExpand,
  faRotate,
  faXmark,
  faExpandAlt,
  faCompressAlt,
  faEyeDropper,
} from "@fortawesome/free-solid-svg-icons";
import type { InteractionMode } from "@tbib-image-viewer/core";
import { DownloadMenu } from "./DownloadMenu";

export interface ImageToolbarProps {
  activeTool: InteractionMode;
  onToolChange: (tool: InteractionMode) => void;
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  zoomScale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onRotate: () => void;
  onDownloadAnnotated: () => Promise<void>;
  onDownloadClean: () => Promise<void>;
  onExportJson?: () => void;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  currentIndex?: number;
  totalImages?: number;
}

const PRESET_COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#10b981", // Green
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple
  "#ffffff", // White
  "#0f172a", // Black
];

const THICKNESS_OPTIONS = [
  { label: "Fine", value: 2 },
  { label: "Medium", value: 4 },
  { label: "Bold", value: 7 },
  { label: "Heavy", value: 12 },
];

export const ImageToolbar: React.FC<ImageToolbarProps> = ({
  activeTool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  zoomScale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onRotate,
  onDownloadAnnotated,
  onDownloadClean,
  onExportJson,
  onClose,
  isFullscreen,
  onToggleFullscreen,
  currentIndex,
  totalImages,
}) => {
  const showSubtoolbar = activeTool === "pen" || activeTool === "highlighter" || activeTool === "laser";

  const toolbarRef = React.useRef<HTMLElement>(null);
  const subtoolbarRef = React.useRef<HTMLDivElement>(null);

  const toolbarTouchState = React.useRef({ isDown: false, startX: 0, scrollLeft: 0 });
  const subtoolbarTouchState = React.useRef({ isDown: false, startX: 0, scrollLeft: 0 });

  const handleToolbarTouchStart = (e: React.TouchEvent) => {
    if (!toolbarRef.current) return;
    toolbarTouchState.current = {
      isDown: true,
      startX: e.touches[0].clientX,
      scrollLeft: toolbarRef.current.scrollLeft,
    };
  };

  const handleToolbarTouchMove = (e: React.TouchEvent) => {
    if (!toolbarTouchState.current.isDown || !toolbarRef.current) return;
    const dx = e.touches[0].clientX - toolbarTouchState.current.startX;
    toolbarRef.current.scrollLeft = toolbarTouchState.current.scrollLeft - dx;
  };

  const handleToolbarTouchEnd = () => {
    toolbarTouchState.current.isDown = false;
  };

  const handleSubtoolbarTouchStart = (e: React.TouchEvent) => {
    if (!subtoolbarRef.current) return;
    subtoolbarTouchState.current = {
      isDown: true,
      startX: e.touches[0].clientX,
      scrollLeft: subtoolbarRef.current.scrollLeft,
    };
  };

  const handleSubtoolbarTouchMove = (e: React.TouchEvent) => {
    if (!subtoolbarTouchState.current.isDown || !subtoolbarRef.current) return;
    const dx = e.touches[0].clientX - subtoolbarTouchState.current.startX;
    subtoolbarRef.current.scrollLeft = subtoolbarTouchState.current.scrollLeft - dx;
  };

  const handleSubtoolbarTouchEnd = () => {
    subtoolbarTouchState.current.isDown = false;
  };

  return (
    <div className="tbib-iv-toolbar-wrapper">
      {/* Primary Toolbar Row */}
      <header
        ref={toolbarRef}
        className="tbib-iv-toolbar"
        role="toolbar"
        aria-label="Image tools"
        onTouchStart={handleToolbarTouchStart}
        onTouchMove={handleToolbarTouchMove}
        onTouchEnd={handleToolbarTouchEnd}
      >
        {/* Gallery slide indicator */}
        {currentIndex !== undefined && totalImages !== undefined && totalImages > 1 && (
          <>
            <span className="tbib-iv-tabular" title="Current Image">
              {currentIndex + 1} / {totalImages}
            </span>
            <div className="tbib-iv-divider" />
          </>
        )}

        {/* Hand / Pan tool */}
        <button
          type="button"
          className={`tbib-iv-btn ${activeTool === "hand" ? "tbib-iv-btn-active" : ""}`}
          onClick={() => onToolChange("hand")}
          title="Pan & Move (1-finger / drag)"
          aria-label="Hand Pan Tool"
        >
          <FontAwesomeIcon icon={faHand} />
        </button>

        {/* Pen tool */}
        <button
          type="button"
          className={`tbib-iv-btn ${activeTool === "pen" ? "tbib-iv-btn-active" : ""}`}
          onClick={() => onToolChange("pen")}
          title="Draw Pen"
          aria-label="Pen Tool"
        >
          <FontAwesomeIcon icon={faPen} />
        </button>

        {/* Highlighter tool */}
        <button
          type="button"
          className={`tbib-iv-btn ${activeTool === "highlighter" ? "tbib-iv-btn-active" : ""}`}
          onClick={() => onToolChange("highlighter")}
          title="Highlighter (Semi-transparent)"
          aria-label="Highlighter Tool"
        >
          <FontAwesomeIcon icon={faHighlighter} />
        </button>

        {/* Laser tool */}
        <button
          type="button"
          className={`tbib-iv-btn ${activeTool === "laser" ? "tbib-iv-btn-active" : ""}`}
          onClick={() => onToolChange("laser")}
          title="Laser Pointer (Glowing WebGL trail)"
          aria-label="Laser Pointer"
        >
          <FontAwesomeIcon icon={faCrosshairs} />
        </button>

        {/* Eraser tool */}
        <button
          type="button"
          className={`tbib-iv-btn ${activeTool === "eraser" ? "tbib-iv-btn-active" : ""}`}
          onClick={() => onToolChange("eraser")}
          title="Eraser (Erase strokes on tap)"
          aria-label="Eraser Tool"
        >
          <FontAwesomeIcon icon={faEraser} />
        </button>

        <div className="tbib-iv-divider" />

        {/* Undo / Redo / Clear */}
        <button
          type="button"
          className="tbib-iv-btn"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <FontAwesomeIcon icon={faRotateLeft} />
        </button>

        <button
          type="button"
          className="tbib-iv-btn"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
          aria-label="Redo"
        >
          <FontAwesomeIcon icon={faRotateRight} />
        </button>

        <button
          type="button"
          className="tbib-iv-btn"
          onClick={onClear}
          title="Clear Slide Annotations"
          aria-label="Clear All"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>

        <div className="tbib-iv-divider" />

        {/* Zoom controls & Scale readout */}
        <button
          type="button"
          className="tbib-iv-btn"
          onClick={onZoomOut}
          title="Zoom Out (-)"
          aria-label="Zoom Out"
        >
          <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
        </button>

        <span className="tbib-iv-tabular" title="Current Zoom Scale">
          {Math.round(zoomScale * 100)}%
        </span>

        <button
          type="button"
          className="tbib-iv-btn"
          onClick={onZoomIn}
          title="Zoom In (+)"
          aria-label="Zoom In"
        >
          <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
        </button>

        <button
          type="button"
          className="tbib-iv-btn"
          onClick={onZoomReset}
          title="Reset Fit to Screen (0)"
          aria-label="Reset Zoom"
        >
          <FontAwesomeIcon icon={faExpand} />
        </button>

        {/* Rotate 90 deg */}
        <button
          type="button"
          className="tbib-iv-btn"
          onClick={onRotate}
          title="Rotate 90° Clockwise"
          aria-label="Rotate Image"
        >
          <FontAwesomeIcon icon={faRotate} />
        </button>

        {/* Download action menu */}
        <div className="tbib-iv-divider" />
        <DownloadMenu
          onDownloadAnnotated={onDownloadAnnotated}
          onDownloadClean={onDownloadClean}
          onExportJson={onExportJson}
        />

        {/* Fullscreen toggle */}
        {onToggleFullscreen && (
          <button
            type="button"
            className="tbib-iv-btn"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label="Toggle Fullscreen"
          >
            <FontAwesomeIcon icon={isFullscreen ? faCompressAlt : faExpandAlt} />
          </button>
        )}

        {/* Close button for Lightbox Modal */}
        {onClose && (
          <>
            <div className="tbib-iv-divider" />
            <button
              type="button"
              className="tbib-iv-btn"
              onClick={onClose}
              title="Close Viewer (Esc)"
              aria-label="Close"
              style={{ color: "#ef4444" }}
            >
              <FontAwesomeIcon icon={faXmark} style={{ fontSize: "16px" }} />
            </button>
          </>
        )}
      </header>

      {/* Secondary Subtoolbar: Directly displays Stroke Thickness & Color Swatches */}
      {showSubtoolbar && (
        <div
          ref={subtoolbarRef}
          className="tbib-iv-subtoolbar"
          role="region"
          aria-label="Tool customization"
          onTouchStart={handleSubtoolbarTouchStart}
          onTouchMove={handleSubtoolbarTouchMove}
          onTouchEnd={handleSubtoolbarTouchEnd}
        >
          {/* Thickness buttons (for pen and highlighter) */}
          {activeTool !== "laser" && (
            <div className="tbib-iv-thickness-group">
              {THICKNESS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`tbib-iv-thickness-btn ${strokeWidth === opt.value ? "tbib-iv-thickness-active" : ""}`}
                  onClick={() => onStrokeWidthChange(opt.value)}
                  title={`${opt.label} stroke (${opt.value}px)`}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: `${Math.min(opt.value * 1.5, 12)}px`,
                      height: `${Math.min(opt.value * 1.5, 12)}px`,
                      borderRadius: "50%",
                      backgroundColor: "currentColor",
                    }}
                  />
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {activeTool === "laser" && (
            <span style={{ fontSize: "11px", color: "var(--tbib-iv-text-muted)", fontStyle: "italic", paddingRight: "4px" }}>
              Laser Beam Color:
            </span>
          )}

          <div className="tbib-iv-divider" style={{ height: "16px", margin: "0 2px" }} />

          {/* Color swatches */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            {PRESET_COLORS.map((c) => {
              const isSelected = color.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  className={`tbib-iv-swatch-btn ${isSelected ? "tbib-iv-swatch-active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => onColorChange(c)}
                  title={`Select color: ${c}`}
                  aria-label={`Color ${c}`}
                />
              );
            })}

            {/* Custom Color Picker Input */}
            <label className="tbib-iv-custom-color-btn" title="Custom Color Picker">
              <FontAwesomeIcon icon={faEyeDropper} style={{ fontSize: "10px", opacity: 0.8 }} />
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="tbib-iv-custom-color-input"
                aria-label="Custom color picker"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
