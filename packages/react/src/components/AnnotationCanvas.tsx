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
  currentScale?: number;
  onStrokeComplete: (stroke: AnnotationStroke) => void;
  onEraseStroke: (point: NormalizedPoint) => void;
  onPinchZoom?: (startScale: number, ratio: number) => void;
  onPinchPan?: (dx: number, dy: number) => void;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  width,
  height,
  strokes,
  activeTool,
  color,
  strokeWidth,
  currentScale = 1,
  onStrokeComplete,
  onEraseStroke,
  onPinchZoom,
  onPinchPan,
}) => {
  const [currentPoints, setCurrentPoints] = useState<NormalizedPoint[] | null>(null);
  const isDrawingRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Multi-touch tracking for pinch-zoom vs single-touch drawing
  const activePointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const pinchLastMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const isMultiTouchRef = useRef(false);

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

    activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });

    // Multi-touch detection (2+ fingers = Pinch Zoom & Pan, NEVER draw!)
    if (activePointersRef.current.size >= 2) {
      isMultiTouchRef.current = true;
      isDrawingRef.current = false;
      setCurrentPoints(null); // Instantly discard any accidental initial touch point!

      const pts = Array.from(activePointersRef.current.values());
      const dist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      pinchStartDistRef.current = dist > 0 ? dist : 1;
      pinchStartScaleRef.current = currentScale || 1;
      pinchLastMidpointRef.current = {
        x: (pts[0].clientX + pts[1].clientX) / 2,
        y: (pts[0].clientY + pts[1].clientY) / 2,
      };
      return;
    }

    // Single finger touch / mouse click
    isMultiTouchRef.current = false;
    pinchStartDistRef.current = null;
    pinchLastMidpointRef.current = null;

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
    e.stopPropagation();

    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }

    // If in multi-touch mode (2+ fingers): PERFORM PINCH ZOOM AND PAN, DO NOT DRAW!
    if (isMultiTouchRef.current || activePointersRef.current.size >= 2) {
      if (activePointersRef.current.size >= 2 && pinchStartDistRef.current) {
        const pts = Array.from(activePointersRef.current.values());
        const currentDist = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
        const ratio = currentDist / pinchStartDistRef.current;
        onPinchZoom?.(pinchStartScaleRef.current, ratio);

        const midX = (pts[0].clientX + pts[1].clientX) / 2;
        const midY = (pts[0].clientY + pts[1].clientY) / 2;
        if (pinchLastMidpointRef.current) {
          const dx = midX - pinchLastMidpointRef.current.x;
          const dy = midY - pinchLastMidpointRef.current.y;
          onPinchPan?.(dx, dy);
        }
        pinchLastMidpointRef.current = { x: midX, y: midY };
      }
      return;
    }

    if (!isDrawingRef.current) return;

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
    e.stopPropagation();

    activePointersRef.current.delete(e.pointerId);

    // If finishing a multi-touch pinch gesture:
    if (isMultiTouchRef.current) {
      if (activePointersRef.current.size === 0) {
        isMultiTouchRef.current = false;
        pinchStartDistRef.current = null;
        pinchLastMidpointRef.current = null;
      }
      isDrawingRef.current = false;
      setCurrentPoints(null);
      return;
    }

    if (!isDrawingRef.current) return;
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
