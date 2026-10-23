import { useState, useCallback, useRef } from "react";
import type { TransformState } from "@tbib-image-viewer/core";
import { clampScale, DEFAULT_TRANSFORM, MIN_SCALE, MAX_SCALE } from "@tbib-image-viewer/core";

export function useImageTransform() {
  const [transform, setTransform] = useState<TransformState>(DEFAULT_TRANSFORM);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);

  const zoomIn = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: clampScale(prev.scale * 1.25),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      scale: clampScale(prev.scale / 1.25),
    }));
  }, []);

  const resetTransform = useCallback(() => {
    setTransform(DEFAULT_TRANSFORM);
  }, []);

  const rotateClockwise = useCallback(() => {
    setTransform((prev) => ({
      ...prev,
      rotate: (prev.rotate + 90) % 360,
    }));
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    setTransform((prev) => ({
      ...prev,
      translateX: prev.translateX + dx,
      translateY: prev.translateY + dy,
    }));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    setTransform((prev) => ({
      ...prev,
      scale: clampScale(prev.scale * factor),
    }));
  }, []);

  // Multi-touch pinch handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = transform.scale;
    }
  }, [transform.scale]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / pinchStartDistRef.current;
      setTransform((prev) => ({
        ...prev,
        scale: clampScale(pinchStartScaleRef.current * ratio),
      }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchStartDistRef.current = null;
  }, []);

  return {
    transform,
    setTransform,
    zoomIn,
    zoomOut,
    resetTransform,
    rotateClockwise,
    panBy,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
