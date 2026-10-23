import React, { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

export interface StrokeWidthPickerProps {
  strokeWidth: number;
  onChange: (width: number) => void;
}

const WIDTH_OPTIONS = [
  { label: "Fine (2px)", value: 2, iconSize: "6px" },
  { label: "Medium (4px)", value: 4, iconSize: "10px" },
  { label: "Bold (8px)", value: 8, iconSize: "14px" },
  { label: "Heavy (14px)", value: 14, iconSize: "18px" },
];

export const StrokeWidthPicker: React.FC<StrokeWidthPickerProps> = ({
  strokeWidth,
  onChange,
}) => {
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

  const currentOption = WIDTH_OPTIONS.find((o) => o.value === strokeWidth) || WIDTH_OPTIONS[1];

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="tbib-iv-btn"
        title="Stroke Thickness"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "16px",
            height: "16px",
          }}
        >
          <span
            style={{
              width: currentOption.iconSize,
              height: currentOption.iconSize,
              borderRadius: "50%",
              backgroundColor: "currentColor",
            }}
          />
        </span>
      </button>

      {isOpen && (
        <div
          className="tbib-iv-popover"
          style={{
            flexDirection: "column",
            minWidth: "120px",
            padding: "4px",
          }}
        >
          {WIDTH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`tbib-iv-btn ${opt.value === strokeWidth ? "tbib-iv-btn-active" : ""}`}
              style={{
                width: "100%",
                justifyContent: "flex-start",
                gap: "8px",
                padding: "6px 10px",
                fontSize: "12px",
              }}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: opt.iconSize,
                  height: opt.iconSize,
                  borderRadius: "50%",
                  backgroundColor: "currentColor",
                }}
              />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
