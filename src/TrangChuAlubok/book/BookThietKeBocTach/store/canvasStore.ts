import { create } from "zustand";

export interface CanvasObject {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor: string;
  color?: string;
  locked: boolean;
  [key: string]: unknown;
}

interface CanvasStore {
  objects: CanvasObject[];
  selectedObject: string | null;
  setSelectedObject: (id: string | null) => void;
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, updates: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  objects: [],
  selectedObject: null,
  setSelectedObject: (id) => set({ selectedObject: id }),
  addObject: (obj) => set((state) => ({ objects: [...state.objects, obj] })),
  updateObject: (id, updates) =>
    set((state) => ({
      objects: state.objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    })),
  removeObject: (id) =>
    set((state) => ({
      objects: state.objects.filter((obj) => obj.id !== id),
    })),
}));
