import { useRef, useCallback } from "react";

export interface SwipeHandlers {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  enabled?: boolean;
}

export function useSwipeGesture({ onSwipeLeft, onSwipeRight, enabled = true }: SwipeHandlers) {
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled || e.touches.length !== 1) return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  }, [enabled]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled || touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - touchStartXRef.current;
    const dy = touchEndY - touchStartYRef.current;

    // Must be predominantly horizontal and exceed threshold (50px)
    if (Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 50) {
      if (dx < 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  }, [enabled, onSwipeLeft, onSwipeRight]);

  return {
    onTouchStart,
    onTouchEnd,
  };
}
