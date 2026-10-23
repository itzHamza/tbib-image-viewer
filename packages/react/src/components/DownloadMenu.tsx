import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faImage,
  faPaintBrush,
  faFileCode,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

export interface DownloadMenuProps {
  onDownloadAnnotated: () => Promise<void>;
  onDownloadClean: () => Promise<void>;
  onExportJson?: () => void;
}

export const DownloadMenu: React.FC<DownloadMenuProps> = ({
  onDownloadAnnotated,
  onDownloadClean,
  onExportJson,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleAnnotated = async () => {
    setIsExporting(true);
    try {
      await onDownloadAnnotated();
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleClean = async () => {
    setIsExporting(true);
    try {
      await onDownloadClean();
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="tbib-iv-btn"
        title="Download / Export"
        disabled={isExporting}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <FontAwesomeIcon
          icon={isExporting ? faSpinner : faDownload}
          className={isExporting ? "fa-spin" : ""}
          style={{ fontSize: "14px" }}
        />
      </button>

      {isOpen && (
        <div
          className="tbib-iv-popover"
          style={{
            flexDirection: "column",
            minWidth: "190px",
            right: 0,
            left: "auto",
            padding: "6px",
          }}
        >
          <button
            type="button"
            className="tbib-iv-btn"
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: "10px",
              padding: "8px 10px",
              fontSize: "12px",
            }}
            onClick={handleAnnotated}
          >
            <FontAwesomeIcon icon={faPaintBrush} style={{ fontSize: "13px" }} />
            <span>Annotated Image (PNG)</span>
          </button>

          <button
            type="button"
            className="tbib-iv-btn"
            style={{
              width: "100%",
              justifyContent: "flex-start",
              gap: "10px",
              padding: "8px 10px",
              fontSize: "12px",
            }}
            onClick={handleClean}
          >
            <FontAwesomeIcon icon={faImage} style={{ fontSize: "13px" }} />
            <span>Clean Image (Original)</span>
          </button>

          {onExportJson && (
            <button
              type="button"
              className="tbib-iv-btn"
              style={{
                width: "100%",
                justifyContent: "flex-start",
                gap: "10px",
                padding: "8px 10px",
                fontSize: "12px",
              }}
              onClick={() => {
                onExportJson();
                setIsOpen(false);
              }}
            >
              <FontAwesomeIcon icon={faFileCode} style={{ fontSize: "13px" }} />
              <span>Export Strokes (JSON)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
