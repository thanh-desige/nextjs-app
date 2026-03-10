/**
 * Door Store - Zustand store quản lý cửa trên canvas
 *
 * ⚠️ COMPLIANCE: G1 — Store là derived state từ Document
 * - Store CHỈ đọc từ Document qua syncFromDocument()
 * - KHÔNG được gọi addDoor/updateDoor/removeDoor trực tiếp từ UI
 * - UI thay đổi qua Commands → Document → syncFromDocument()
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: UI, hooks
 * - KHÔNG được import từ: door-engines, analysis, systems
 */

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import type { DoorEntity, DoorPoint } from "../core/entities/DoorEntity";

// Use DoorPoint from DoorEntity
type Point = DoorPoint;

/**
 * Door Store State
 */
export interface DoorStoreState {
  /** Danh sách cửa trên canvas */
  doors: Map<string, DoorEntity>;

  /** ID cửa đang được chọn */
  selectedDoorIds: Set<string>;

  /** ID cửa đang hover */
  hoveredDoorId: string | null;

  /** Đang kéo thả cửa nào */
  draggingDoor: {
    variant: string;
    systemId: string;
    previewPosition: Point | null;
  } | null;
}

/**
 * Door Store Actions
 */
export interface DoorStoreActions {
  // Sync from Document (ĐIỀU KIỆN 1 compliant)
  syncFromDocument: (doors: DoorEntity[]) => void;

  // INTERNAL CRUD - CHỈ được gọi từ syncFromDocument hoặc trong tests
  // UI KHÔNG được gọi trực tiếp
  _addDoor: (door: DoorEntity) => void;
  _removeDoor: (id: string) => void;
  _updateDoor: (id: string, updates: Partial<DoorEntity>) => void;
  _clearAllDoors: () => void;

  // Selection (UI-only state, không cần qua Command)
  selectDoor: (id: string, addToSelection?: boolean) => void;
  deselectDoor: (id: string) => void;
  selectAllDoors: () => void;
  clearSelection: () => void;

  // Hover (UI-only state)
  setHoveredDoor: (id: string | null) => void;

  // Drag & Drop (UI-only state)
  startDragging: (variant: string, systemId: string) => void;
  updateDragPosition: (position: Point) => void;
  endDragging: () => void;

  // Getters
  getDoor: (id: string) => DoorEntity | undefined;
  getSelectedDoors: () => DoorEntity[];
  getAllDoors: () => DoorEntity[];
}

/**
 * Door Store
 */
export const useDoorStore = create<DoorStoreState & DoorStoreActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // Initial state
      doors: new Map(),
      selectedDoorIds: new Set(),
      hoveredDoorId: null,
      draggingDoor: null,

      // ==================== Sync from Document ====================
      // ĐIỀU KIỆN 1 COMPLIANT: UI State syncs from Document

      syncFromDocument: (doorsFromDoc) => {
        set((state) => {
          const newDoors = new Map<string, DoorEntity>();
          for (const door of doorsFromDoc) {
            newDoors.set(door.id, door);
          }

          // Clean up selection - remove IDs that no longer exist
          const newSelection = new Set<string>();
          for (const id of state.selectedDoorIds) {
            if (newDoors.has(id)) {
              newSelection.add(id);
            }
          }

          // Clean up hover
          const newHoveredId =
            state.hoveredDoorId && newDoors.has(state.hoveredDoorId)
              ? state.hoveredDoorId
              : null;

          return {
            doors: newDoors,
            selectedDoorIds: newSelection,
            hoveredDoorId: newHoveredId,
          };
        });
      },

      // ==================== Internal CRUD ====================
      // Prefix _ = internal, KHÔNG gọi từ UI hooks

      _addDoor: (door) => {
        set((state) => {
          const newDoors = new Map(state.doors);
          newDoors.set(door.id, door);
          return { doors: newDoors };
        });
      },

      _removeDoor: (id) => {
        set((state) => {
          const newDoors = new Map(state.doors);
          newDoors.delete(id);

          const newSelection = new Set(state.selectedDoorIds);
          newSelection.delete(id);

          return {
            doors: newDoors,
            selectedDoorIds: newSelection,
            hoveredDoorId:
              state.hoveredDoorId === id ? null : state.hoveredDoorId,
          };
        });
      },

      _updateDoor: (id, updates) => {
        set((state) => {
          const door = state.doors.get(id);
          if (!door) return state;

          const newDoors = new Map(state.doors);
          const updatedDoor = Object.assign(
            Object.create(Object.getPrototypeOf(door)),
            door,
            updates
          );
          newDoors.set(id, updatedDoor);

          return { doors: newDoors };
        });
      },

      _clearAllDoors: () => {
        set({
          doors: new Map(),
          selectedDoorIds: new Set(),
          hoveredDoorId: null,
        });
      },

      // Selection Actions
      selectDoor: (id, addToSelection = false) => {
        set((state) => {
          const newSelection = addToSelection
            ? new Set(state.selectedDoorIds)
            : new Set<string>();
          newSelection.add(id);
          return { selectedDoorIds: newSelection };
        });
      },

      deselectDoor: (id) => {
        set((state) => {
          const newSelection = new Set(state.selectedDoorIds);
          newSelection.delete(id);
          return { selectedDoorIds: newSelection };
        });
      },

      selectAllDoors: () => {
        set((state) => ({
          selectedDoorIds: new Set(state.doors.keys()),
        }));
      },

      clearSelection: () => {
        set({ selectedDoorIds: new Set() });
      },

      // Hover Actions
      setHoveredDoor: (id) => {
        set({ hoveredDoorId: id });
      },

      // Drag & Drop Actions
      startDragging: (variant, systemId) => {
        set({
          draggingDoor: {
            variant,
            systemId,
            previewPosition: null,
          },
        });
      },

      updateDragPosition: (position) => {
        set((state) => {
          if (!state.draggingDoor) return state;
          return {
            draggingDoor: {
              ...state.draggingDoor,
              previewPosition: position,
            },
          };
        });
      },

      endDragging: () => {
        set({ draggingDoor: null });
      },

      // Getters
      getDoor: (id) => {
        return get().doors.get(id);
      },

      getSelectedDoors: () => {
        const { doors, selectedDoorIds } = get();
        return Array.from(selectedDoorIds)
          .map((id) => doors.get(id))
          .filter((door): door is DoorEntity => door !== undefined);
      },

      getAllDoors: () => {
        return Array.from(get().doors.values());
      },
    })),
    { name: "door-store" }
  )
);

/**
 * Selector: Số lượng cửa
 */
export const selectDoorCount = (state: DoorStoreState) => state.doors.size;

/**
 * Selector: Đang kéo thả không
 */
export const selectIsDragging = (state: DoorStoreState) =>
  state.draggingDoor !== null;

/**
 * Selector: Có cửa được chọn không
 */
export const selectHasSelection = (state: DoorStoreState) =>
  state.selectedDoorIds.size > 0;
