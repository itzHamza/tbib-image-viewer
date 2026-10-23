import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPalette } from "@fortawesome/free-solid-svg-icons";

export interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  "#ef4444", // Red (Danger / Anatomy landmark)
  "#f59e0b", // Amber / Orange
  "#eab308", // Yellow (Highlighter classic)
  "#10b981", // Emerald / Green
  "#06b6d4", // Cyan
  "#8b5cf6", // Purple / Violet
  "#ffffff", // White
  "#0f172a", // Slate / Black
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="tbib-iv-btn"
        title="Annotation Color"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span
          style={{
            display: "inline-block",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: color,
            border: "1px solid rgba(255,255,255,0.4)",
            marginRight: "4px",
          }}
        />
        <FontAwesomeIcon icon={faPalette} style={{ fontSize: "12px", opacity: 0.8 }} />
      </button>

      {isOpen && (
        <div className="tbib-iv-popover">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`tbib-iv-color-swatch ${c.toLowerCase() === color.toLowerCase() ? "tbib-iv-color-swatch-active" : ""}`}
              style={{ backgroundColor: c }}
              onClick={() => {
                onChange(c);
                setIsOpen(false);
              }}
              title={c}
            />
          ))}
        </div>
      )}
    </div>
  );
};
