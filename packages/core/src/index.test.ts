import { describe, it, expect } from "vitest";
import {
  clampScale,
  pointsToSvgPath,
  AnnotationStore,
  distanceSq,
  isPointNearStroke,
  hexToRgba,
  MIN_SCALE,
  MAX_SCALE,
} from "./index";

describe("Transform Engine", () => {
  it("clamps scale within bounds", () => {
    expect(clampScale(0.1)).toBe(MIN_SCALE);
    expect(clampScale(2.5)).toBe(2.5);
    expect(clampScale(10)).toBe(MAX_SCALE);
  });
});

describe("Annotation Smooth & Path", () => {
  it("converts points to smooth quadratic SVG path", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 0.5, y: 0.5 },
      { x: 1, y: 1 },
    ];
    const path = pointsToSvgPath(points, 100, 100);
    expect(path).toContain("M 0 0");
    expect(path).toContain("Q 50 50");
  });

  it("calculates distance and stroke proximity", () => {
    const p1 = { x: 0.2, y: 0.2 };
    const p2 = { x: 0.21, y: 0.21 };
    expect(isPointNearStroke(p1, [p2], 0.05)).toBe(true);
    expect(isPointNearStroke(p1, [{ x: 0.9, y: 0.9 }], 0.05)).toBe(false);
  });

  it("converts hex color to rgba", () => {
    expect(hexToRgba("#ff0000", 0.5)).toBe("rgba(255, 0, 0, 0.5)");
  });
});

describe("Annotation Store", () => {
  it("supports add, undo, and redo", () => {
    const store = new AnnotationStore();
    const slideId = "slide-1";

    expect(store.getStrokes(slideId)).toHaveLength(0);
    expect(store.canUndo(slideId)).toBe(false);

    store.addStroke(slideId, {
      id: "s1",
      tool: "pen",
      color: "#ff0000",
      width: 4,
      opacity: 1,
      points: [{ x: 0.1, y: 0.1 }],
      createdAt: Date.now(),
    });

    expect(store.getStrokes(slideId)).toHaveLength(1);
    expect(store.canUndo(slideId)).toBe(true);

    // Undo
    store.undo(slideId);
    expect(store.getStrokes(slideId)).toHaveLength(0);
    expect(store.canRedo(slideId)).toBe(true);

    // Redo
    store.redo(slideId);
    expect(store.getStrokes(slideId)).toHaveLength(1);

    // Clear
    store.clear(slideId);
    expect(store.getStrokes(slideId)).toHaveLength(0);
    store.undo(slideId);
    expect(store.getStrokes(slideId)).toHaveLength(1);
  });
});
