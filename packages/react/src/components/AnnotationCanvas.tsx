import React, { useRef, useState, useCallback, useMemo } from "react";
import type {
  AnnotationStroke,
  DrawTool,
  NormalizedPoint,
} from "@tbib-image-viewer/core";
import {
  pointsToSvgPath,
  isPointNearStroke,
  hexToRgba,
} from "@tbib-image-viewer/core";

export interface AnnotationCanvasProps {
  width: number;
  height: number;
  strokes: AnnotationStroke[];
  activeTool: DrawTool | "hand";
  color: string;
  strokeWidth: number;
  onStrokeComplete: (stroke: AnnotationStroke) => void;
  onEraseStroke: (point: NormalizedPoint) => void;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  width,
  height,
  strokes,
  activeTool,
  color,
  strokeWidth,
  onStrokeComplete,
  onEraseStroke,
}) => {
  const [currentPoints, setCurrentPoints] = useState<NormalizedPoint[] | null>(null);
  const isDrawingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const isDrawableTool = activeTool === "pen" || activeTool === "highlighter";
  const isEraser = activeTool === "eraser";

  const getNormalizedPoint = useCallback(
    (e: React.PointerEvent<SVGSVGElement>): NormalizedPoint | null => {
      const svg = svgRef.current;
      if (!svg || width <= 0 || height <= 0) return null;
      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      return {
        x: Math.max(0, Math.min(1, x)),
        y: Math.max(0, Math.min(1, y)),
        pressure: e.pressure || 0.5,
      };
    },
    [width, height]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawableTool && !isEraser) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);

    const pt = getNormalizedPoint(e);
    if (!pt) return;

    if (isEraser) {
      onEraseStroke(pt);
      isDrawingRef.current = true;
      return;
    }

    if (isDrawableTool) {
      isDrawingRef.current = true;
      setCurrentPoints([pt]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    e.stopPropagation();

    const pt = getNormalizedPoint(e);
    if (!pt) return;

    if (isEraser) {
      onEraseStroke(pt);
      return;
    }

    if (isDrawableTool) {
      setCurrentPoints((prev) => (prev ? [...prev, pt] : [pt]));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    e.stopPropagation();
    isDrawingRef.current = false;

    if (isDrawableTool && currentPoints && currentPoints.length > 0) {
      const isHighlighter = activeTool === "highlighter";
      const newStroke: AnnotationStroke = {
        id: `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tool: isHighlighter ? "highlighter" : "pen",
        color,
        width: isHighlighter ? strokeWidth * 2.5 : strokeWidth,
        opacity: isHighlighter ? 0.35 : 1.0,
        points: currentPoints,
        createdAt: Date.now(),
      };
      onStrokeComplete(newStroke);
      setCurrentPoints(null);
    }
  };

  // Preview path for current active stroke
  const currentPathD = useMemo(() => {
    if (!currentPoints || currentPoints.length === 0) return "";
    return pointsToSvgPath(currentPoints, width, height);
  }, [currentPoints, width, height]);

  const pointerEventsStyle = isDrawableTool || isEraser ? "auto" : "none";

  return (
    <svg
      ref={svgRef}
      className="tbib-iv-annotation-svg"
      viewBox={`0 0 ${width} ${height}`}
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: pointerEventsStyle,
        touchAction: "none",
        cursor: isEraser ? "crosshair" : isDrawableTool ? "crosshair" : "default",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <defs>
        <filter id="highlighter-blend">
          <feBlend mode="multiply" />
        </filter>
      </defs>

      {/* Render persistent strokes */}
      {strokes.map((stroke) => {
        const d = pointsToSvgPath(stroke.points, width, height);
        const isHighlighter = stroke.tool === "highlighter";
        return (
          <path
            key={stroke.id}
            d={d}
            fill="none"
            stroke={isHighlighter ? hexToRgba(stroke.color, stroke.opacity || 0.35) : stroke.color}
            strokeWidth={stroke.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              mixBlendMode: isHighlighter ? "multiply" : "normal",
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Render current active stroke preview */}
      {currentPathD && (
        <path
          d={currentPathD}
          fill="none"
          stroke={activeTool === "highlighter" ? hexToRgba(color, 0.35) : color}
          strokeWidth={activeTool === "highlighter" ? strokeWidth * 2.5 : strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            mixBlendMode: activeTool === "highlighter" ? "multiply" : "normal",
            pointerEvents: "none",
          }}
        />
      )}
    </svg>
  );
};
