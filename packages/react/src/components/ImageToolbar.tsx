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
} from "@fortawesome/free-solid-svg-icons";
import type { InteractionMode } from "@tbib-image-viewer/core";
import { ColorPicker } from "./ColorPicker";
import { StrokeWidthPicker } from "./StrokeWidthPicker";
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
  const showColorStroke = activeTool === "pen" || activeTool === "highlighter" || activeTool === "laser";

  return (
    <div className="tbib-iv-toolbar-wrapper">
      <header className="tbib-iv-toolbar" role="toolbar" aria-label="Image tools">
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

        {/* Color and stroke width if drawing tool active */}
        {showColorStroke && (
          <>
            <div className="tbib-iv-divider" />
            <ColorPicker color={color} onChange={onColorChange} />
            {activeTool !== "laser" && (
              <StrokeWidthPicker strokeWidth={strokeWidth} onChange={onStrokeWidthChange} />
            )}
          </>
        )}

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
    </div>
  );
};
