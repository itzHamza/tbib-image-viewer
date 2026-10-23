import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faImage,
  faPaintBrush,
  faFileCode,
  faSpinner,
  faChevronDown,
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
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick as any);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick as any);
    };
  }, [isOpen]);

  const handleAnnotated = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await onDownloadAnnotated();
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleClean = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await onDownloadClean();
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {/* Primary Download Button: 1-click downloads annotated PNG */}
      <button
        type="button"
        className="tbib-iv-btn"
        title="Download Annotated Image (1-Click PNG)"
        aria-label="Download Image"
        disabled={isExporting}
        onClick={handleAnnotated}
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          paddingRight: "6px",
        }}
      >
        <FontAwesomeIcon
          icon={isExporting ? faSpinner : faDownload}
          className={isExporting ? "fa-spin" : ""}
          style={{ fontSize: "14px" }}
        />
      </button>

      {/* Dropdown Caret: Toggles other export formats */}
      <button
        type="button"
        className="tbib-iv-btn"
        title="More Download Options"
        aria-label="More Download Options"
        disabled={isExporting}
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          paddingLeft: "4px",
          paddingRight: "6px",
          minWidth: "20px",
          borderLeft: "1px solid var(--tbib-iv-border)",
        }}
      >
        <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: "10px", opacity: 0.8 }} />
      </button>

      {isOpen && (
        <div
          className="tbib-iv-popover"
          style={{
            position: "fixed",
            top: `${popoverPos.top}px`,
            right: `${popoverPos.right}px`,
            flexDirection: "column",
            minWidth: "210px",
            zIndex: 9999,
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
            <FontAwesomeIcon icon={faPaintBrush} style={{ fontSize: "13px", color: "var(--tbib-iv-accent)" }} />
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
        </div>
      )}
    </div>
  );
};
