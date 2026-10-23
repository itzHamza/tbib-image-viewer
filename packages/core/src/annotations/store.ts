import type { AnnotationStroke, SlideAnnotations } from "../types";

export interface HistoryState {
  past: AnnotationStroke[][];
  present: AnnotationStroke[];
  future: AnnotationStroke[][];
}

export class AnnotationStore {
  private slides = new Map<string, HistoryState>();
  private listeners = new Set<(slideId: string, strokes: AnnotationStroke[]) => void>();

  constructor(initialData?: SlideAnnotations[]) {
    if (initialData) {
      for (const item of initialData) {
        this.slides.set(item.slideId, {
          past: [],
          present: [...item.strokes],
          future: [],
        });
      }
    }
  }

  private getOrCreate(slideId: string): HistoryState {
    let state = this.slides.get(slideId);
    if (!state) {
      state = {
        past: [],
        present: [],
        future: [],
      };
      this.slides.set(slideId, state);
    }
    return state;
  }

  public getStrokes(slideId: string): AnnotationStroke[] {
    return this.getOrCreate(slideId).present;
  }

  public canUndo(slideId: string): boolean {
    return this.getOrCreate(slideId).past.length > 0;
  }

  public canRedo(slideId: string): boolean {
    return this.getOrCreate(slideId).future.length > 0;
  }

  public addStroke(slideId: string, stroke: AnnotationStroke): void {
    const state = this.getOrCreate(slideId);
    state.past.push([...state.present]);
    state.present = [...state.present, stroke];
    state.future = []; // Clear redo tree on new action
    this.notify(slideId);
  }

  public removeStroke(slideId: string, strokeId: string): void {
    const state = this.getOrCreate(slideId);
    const filtered = state.present.filter((s) => s.id !== strokeId);
    if (filtered.length !== state.present.length) {
      state.past.push([...state.present]);
      state.present = filtered;
      state.future = [];
      this.notify(slideId);
    }
  }

  public removeStrokesNear(
    slideId: string,
    testPt: { x: number; y: number },
    thresholdNorm: number,
    isPointNearStrokeFn: (pt: { x: number; y: number }, pts: { x: number; y: number }[], thresh: number) => boolean
  ): boolean {
    const state = this.getOrCreate(slideId);
    const toKeep: AnnotationStroke[] = [];
    let removedAny = false;

    for (const stroke of state.present) {
      if (isPointNearStrokeFn(testPt, stroke.points, thresholdNorm)) {
        removedAny = true;
      } else {
        toKeep.push(stroke);
      }
    }

    if (removedAny) {
      state.past.push([...state.present]);
      state.present = toKeep;
      state.future = [];
      this.notify(slideId);
      return true;
    }
    return false;
  }

  public clear(slideId: string): void {
    const state = this.getOrCreate(slideId);
    if (state.present.length === 0) return;
    state.past.push([...state.present]);
    state.present = [];
    state.future = [];
    this.notify(slideId);
  }

  public undo(slideId: string): boolean {
    const state = this.getOrCreate(slideId);
    if (state.past.length === 0) return false;

    const previous = state.past.pop()!;
    state.future.unshift([...state.present]);
    state.present = previous;
    this.notify(slideId);
    return true;
  }

  public redo(slideId: string): boolean {
    const state = this.getOrCreate(slideId);
    if (state.future.length === 0) return false;

    const next = state.future.shift()!;
    state.past.push([...state.present]);
    state.present = next;
    this.notify(slideId);
    return true;
  }

  public subscribe(listener: (slideId: string, strokes: AnnotationStroke[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(slideId: string): void {
    const strokes = this.getStrokes(slideId);
    for (const listener of this.listeners) {
      listener(slideId, strokes);
    }
  }

  public exportJSON(): SlideAnnotations[] {
    const result: SlideAnnotations[] = [];
    for (const [slideId, state] of this.slides.entries()) {
      if (state.present.length > 0) {
        result.push({
          slideId,
          strokes: [...state.present],
        });
      }
    }
    return result;
  }

  public importJSON(data: SlideAnnotations[]): void {
    for (const item of data) {
      this.slides.set(item.slideId, {
        past: [],
        present: [...item.strokes],
        future: [],
      });
      this.notify(item.slideId);
    }
  }
}
