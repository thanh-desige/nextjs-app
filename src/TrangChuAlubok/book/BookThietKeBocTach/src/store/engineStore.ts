/**
 * Engine Store - Zustand store for CAD Engine state
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { CadEngine } from "../core/engine/CadEngine";
import { IEntity, EntityStyle } from "../core/entities/Entity.types";
import { ToolMode, SelectionMode } from "../core/engine/EngineState";
import { EngineEventType } from "../core/engine/EngineEvents";
import { IVec2 } from "../core/geometry/Vec2";
import { ICommand, CommandResult } from "../core/commands/Command.types";
import { CadDocument } from "../core/document/CadDocument";
import type { LayerData } from "../core/document/Layer";

// ==================== Types ====================

export interface OsnapSettings {
  enabled: boolean;
  endpoint: boolean;
  midpoint: boolean;
  center: boolean;
  quadrant: boolean;
  intersection: boolean;
  perpendicular: boolean;
  tangent: boolean;
  nearest: boolean;
}

export interface GridSettings {
  visible: boolean;
  snapToGrid: boolean;
  majorSpacing: number;
  minorSpacing: number;
}

export interface EngineStoreState {
  // Engine instance
  engine: CadEngine | null;

  // Tool state
  activeTool: ToolMode;
  selectionMode: SelectionMode;

  // Selection
  selectedIds: string[];
  hoveredId: string | null;

  // Viewport
  zoom: number;
  panOffset: IVec2;

  // Current style
  currentStyle: EntityStyle;

  // Osnap
  osnap: OsnapSettings;

  // Grid
  grid: GridSettings;

  // Ortho mode
  orthoMode: boolean;

  // Mouse position
  mouseWorld: IVec2;
  mouseScreen: IVec2;

  // Command state
  activeCommand: string | null;
  commandPrompt: string;
  commandHistory: string[];

  // Document state
  isModified: boolean;
  canUndo: boolean;
  canRedo: boolean;

  // Document version counter - triggers re-render when document data changes
  documentVersion: number;

  // Layer state
  layers: LayerData[];
  activeLayerId: string;
  /** Use ByLayer style (true) or custom style (false) */
  useByLayer: boolean;
}

export interface EngineStoreActions {
  // Engine management
  initEngine: () => CadEngine;
  destroyEngine: () => void;

  // Tool actions
  setActiveTool: (tool: ToolMode) => void;
  setSelectionMode: (mode: SelectionMode) => void;

  // Selection actions
  select: (ids: string[]) => void;
  addToSelection: (ids: string[]) => void;
  removeFromSelection: (ids: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setHovered: (id: string | null) => void;

  // Viewport actions
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: IVec2) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomFit: () => void;
  zoomToSelection: () => void;

  // Style actions
  setCurrentStyle: (style: Partial<EntityStyle>) => void;

  // Osnap actions
  setOsnap: (settings: Partial<OsnapSettings>) => void;
  toggleOsnap: () => void;

  // Grid actions
  setGrid: (settings: Partial<GridSettings>) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;

  // Ortho actions
  toggleOrtho: () => void;

  // Mouse tracking
  setMousePosition: (screen: IVec2, world: IVec2) => void;

  // Command actions
  executeCommand: (command: string, args?: string[]) => void;
  executeCommandObject: (command: ICommand) => CommandResult | null;
  cancelCommand: () => void;
  setCommandPrompt: (prompt: string) => void;

  // Document actions
  getDocument: () => CadDocument | null;
  undo: () => void;
  redo: () => void;
  newDocument: () => void;

  // Entity actions
  addEntity: (entity: Partial<IEntity> & { type: IEntity["type"] }) => void;
  deleteEntities: (ids: string[]) => void;
  updateEntity: (id: string, updates: Partial<IEntity>) => void;
  getEntity: (id: string) => IEntity | undefined;
  getAllEntities: () => IEntity[];

  // Layer actions
  addLayer: (name: string, options?: Partial<LayerData>) => void;
  deleteLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<LayerData>) => void;
  setActiveLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  refreshLayers: () => void;
  toggleByLayer: () => void;
  setByLayer: (value: boolean) => void;
}

type EngineStore = EngineStoreState & EngineStoreActions;

// ==================== Default Values ====================

const defaultOsnap: OsnapSettings = {
  enabled: true, // Re-enabled OSNAP
  endpoint: true,
  midpoint: true,
  center: true,
  quadrant: false,
  intersection: true,
  perpendicular: false,
  tangent: false,
  nearest: false,
};

const defaultGrid: GridSettings = {
  visible: true,
  snapToGrid: false,
  majorSpacing: 100,
  minorSpacing: 0.1, // 0.1mm step for precise drawing
};

const defaultStyle: EntityStyle = {
  strokeColor: "#FFFFFF",
  strokeWidth: 1,
  strokeStyle: "solid",
  fillColor: null,
  opacity: 1,
};

// ==================== Store Creation ====================

/**
 * Default preset layers (CAD standard)
 * 🔐 RULE: Layer fill/opacity = visual preset
 *    - Entity có quyền override (ByObject)
 *    - BOM / Cost / CNC không đọc layer style
 *    - Layer không tự ý thay entity.style
 */
const defaultLayers: LayerData[] = [
  {
    id: "0",
    name: "Layer 0",
    color: "#FFFFFF",
    lineWeight: 1,
    lineType: "Continuous",
    fillColor: null,
    opacity: 1,
    state: { visible: true, locked: false, frozen: false, printable: true },
  },
  {
    id: "walls",
    name: "Walls",
    color: "#FF0000",
    lineWeight: 2,
    lineType: "Continuous",
    fillColor: null,
    opacity: 1,
    state: { visible: true, locked: false, frozen: false, printable: true },
  },
  {
    id: "doors",
    name: "Doors",
    color: "#00AAFF",
    lineWeight: 1,
    lineType: "Dashed",
    fillColor: "rgba(0, 170, 255, 0.1)",
    opacity: 0.9,
    state: { visible: true, locked: false, frozen: false, printable: true },
  },
  {
    id: "glass",
    name: "Glass",
    color: "#00FF00",
    lineWeight: 1,
    lineType: "Continuous",
    fillColor: "rgba(0, 255, 255, 0.15)",
    opacity: 0.7,
    state: { visible: true, locked: false, frozen: false, printable: true },
  },
  {
    id: "accessories",
    name: "Accessories",
    color: "#FFFF00",
    lineWeight: 0.5,
    lineType: "Continuous",
    fillColor: null,
    opacity: 1,
    state: { visible: true, locked: false, frozen: false, printable: true },
  },
];

export const useEngineStore = create<EngineStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    engine: null,
    activeTool: ToolMode.SELECT,
    selectionMode: SelectionMode.SINGLE,
    selectedIds: [],
    hoveredId: null,
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    currentStyle: defaultStyle,
    osnap: defaultOsnap,
    grid: defaultGrid,
    orthoMode: false,
    mouseWorld: { x: 0, y: 0 },
    mouseScreen: { x: 0, y: 0 },
    activeCommand: null,
    commandPrompt: "Ready",
    commandHistory: [],
    isModified: false,
    canUndo: false,
    canRedo: false,
    documentVersion: 0,
    layers: defaultLayers,
    activeLayerId: "0",
    useByLayer: true, // Default to ByLayer mode (CAD standard)

    // Engine management
    initEngine: () => {
      const existing = get().engine;
      if (existing) return existing;

      const engine = new CadEngine();

      // Subscribe to engine events
      engine.on(EngineEventType.SELECTION_CHANGED, (data) => {
        if (data && "selectedIds" in data) {
          set({ selectedIds: data.selectedIds });
        }
      });

      engine.on(EngineEventType.TOOL_CHANGED, (data) => {
        if (data && "tool" in data) {
          set({ activeTool: data.tool });
        }
      });

      engine.on(EngineEventType.VIEWPORT_CHANGED, (data) => {
        if (data && "zoom" in data && "center" in data) {
          set({
            zoom: data.zoom,
            panOffset: data.center,
          });
        }
      });

      engine.on(EngineEventType.HOVER_CHANGED, (data) => {
        if (data && "entityId" in data) {
          set({ hoveredId: data.entityId });
        }
      });

      // ĐIỀU KIỆN 1: Listen for document changes to sync UI
      // When entities are added/removed via Commands, increment documentVersion
      engine.on(EngineEventType.DOCUMENT_MODIFIED, () => {
        set((state) => ({
          documentVersion: state.documentVersion + 1,
          isModified: true,
          canUndo: engine.canUndo(),
          canRedo: engine.canRedo(),
        }));
      });

      set({ engine });
      return engine;
    },

    destroyEngine: () => {
      // Engine doesn't have dispose, just clear reference
      set({ engine: null });
    },

    // Tool actions
    setActiveTool: (tool) => {
      const { engine } = get();
      if (engine) {
        engine.setTool(tool);
      }
      set({ activeTool: tool });
    },

    setSelectionMode: (mode) => {
      set({ selectionMode: mode });
    },

    // Selection actions
    select: (ids) => {
      const { engine } = get();
      if (engine) {
        engine.select(ids);
      }
      set({ selectedIds: ids });
    },

    addToSelection: (ids) => {
      const { selectedIds, engine } = get();
      const newSelection = [...new Set([...selectedIds, ...ids])];
      if (engine) {
        engine.select(newSelection, true); // additive
      }
      set({ selectedIds: newSelection });
    },

    removeFromSelection: (ids) => {
      const { selectedIds, engine } = get();
      const newSelection = selectedIds.filter((id) => !ids.includes(id));
      if (engine) {
        engine.deselect(ids);
      }
      set({ selectedIds: newSelection });
    },

    clearSelection: () => {
      const { engine } = get();
      if (engine) {
        engine.clearSelection();
      }
      set({ selectedIds: [] });
    },

    selectAll: () => {
      const { engine } = get();
      if (engine) {
        const allEntities = engine.getAllEntities();
        const allIds = allEntities.map((e) => e.id);
        engine.select(allIds);
        set({ selectedIds: allIds });
      }
    },

    setHovered: (id) => {
      const { engine } = get();
      if (engine) {
        engine.setHover(id);
      }
      set({ hoveredId: id });
    },

    // Viewport actions
    setZoom: (zoom) => {
      const { engine } = get();
      const clampedZoom = Math.max(0.0001, Math.min(100000, zoom));
      if (engine) {
        const currentZoom = engine.getViewport().zoom;
        const factor = clampedZoom / currentZoom;
        engine.zoom(factor);
      }
      set({ zoom: clampedZoom });
    },

    setPanOffset: (offset) => {
      const { engine } = get();
      if (engine) {
        engine.panTo(offset);
      }
      set({ panOffset: offset });
    },

    zoomIn: () => {
      const { engine } = get();
      if (engine) {
        engine.zoom(1.25);
        set({ zoom: engine.getViewport().zoom });
      }
    },

    zoomOut: () => {
      const { engine } = get();
      if (engine) {
        engine.zoom(1 / 1.25);
        set({ zoom: engine.getViewport().zoom });
      }
    },

    zoomFit: () => {
      const { engine } = get();
      if (engine) {
        engine.zoomToFit();
        const viewport = engine.getViewport();
        set({
          zoom: viewport.zoom,
          panOffset: { x: viewport.center.x, y: viewport.center.y },
        });
      }
    },

    zoomToSelection: () => {
      const { engine, selectedIds } = get();
      if (engine && selectedIds.length > 0) {
        // Get bounds of selected entities and zoom to fit
        // For now, just zoom to fit all
        engine.zoomToFit();
        const viewport = engine.getViewport();
        set({
          zoom: viewport.zoom,
          panOffset: { x: viewport.center.x, y: viewport.center.y },
        });
      }
    },

    // Style actions
    setCurrentStyle: (style) => {
      const { currentStyle, engine } = get();
      const newStyle = { ...currentStyle, ...style };
      if (engine) {
        engine.setCurrentStyle(newStyle);
      }
      set({ currentStyle: newStyle });
    },

    // Osnap actions
    setOsnap: (settings) => {
      const { osnap } = get();
      set({ osnap: { ...osnap, ...settings } });
    },

    toggleOsnap: () => {
      const { osnap } = get();
      set({ osnap: { ...osnap, enabled: !osnap.enabled } });
    },

    // Grid actions
    setGrid: (settings) => {
      const { grid, engine } = get();
      const newGrid = { ...grid, ...settings };
      if (engine) {
        engine.setGrid({
          visible: newGrid.visible,
          snap: newGrid.snapToGrid,
          majorSpacing: newGrid.majorSpacing,
          minorDivisions: Math.round(
            newGrid.majorSpacing / newGrid.minorSpacing
          ),
        });
      }
      set({ grid: newGrid });
    },

    toggleGrid: () => {
      const { grid, engine } = get();
      const newVisible = !grid.visible;
      if (engine) {
        engine.setGrid({ visible: newVisible });
      }
      set({ grid: { ...grid, visible: newVisible } });
    },

    toggleSnapToGrid: () => {
      const { grid, engine } = get();
      const newSnap = !grid.snapToGrid;
      if (engine) {
        engine.setGrid({ snap: newSnap });
      }
      set({ grid: { ...grid, snapToGrid: newSnap } });
    },

    // Ortho actions
    toggleOrtho: () => {
      const { orthoMode } = get();
      set({ orthoMode: !orthoMode });
    },

    // Mouse tracking
    setMousePosition: (screen, world) => {
      set({ mouseScreen: screen, mouseWorld: world });
    },

    // Command actions
    executeCommand: (command) => {
      const { commandHistory } = get();
      set({
        activeCommand: command,
        commandPrompt: `Executing: ${command}`,
        commandHistory: [...commandHistory, command],
      });

      // Commands will be handled by specific handlers
      // This is just for tracking
    },

    cancelCommand: () => {
      const { engine } = get();
      if (engine) {
        engine.cancelDrawing();
      }
      set({
        activeCommand: null,
        commandPrompt: "Ready",
      });
    },

    setCommandPrompt: (prompt) => {
      set({ commandPrompt: prompt });
    },

    // ĐIỀU KIỆN 1: Execute Command Object qua CadEngine
    executeCommandObject: (command: ICommand): CommandResult | null => {
      const { engine, documentVersion } = get();
      if (!engine) {
        console.warn("Engine not available for command execution");
        return null;
      }

      const result = engine.executeCommand(command);

      // Update undo/redo state AND increment documentVersion to trigger re-render
      set({
        canUndo: engine.canUndo(),
        canRedo: engine.canRedo(),
        isModified: true,
        documentVersion: documentVersion + 1,
      });

      return result;
    },

    // ĐIỀU KIỆN 1: Get Document from Engine
    getDocument: (): CadDocument | null => {
      const { engine } = get();
      return engine?.getDocument() ?? null;
    },

    // Document actions - ĐIỀU KIỆN 1: Use History system
    undo: () => {
      const { engine, documentVersion } = get();
      if (engine) {
        const success = engine.undo();
        if (success) {
          set({
            canUndo: engine.canUndo(),
            canRedo: engine.canRedo(),
            documentVersion: documentVersion + 1,
          });
        }
      }
    },

    redo: () => {
      const { engine, documentVersion } = get();
      if (engine) {
        const success = engine.redo();
        if (success) {
          set({
            canUndo: engine.canUndo(),
            canRedo: engine.canRedo(),
            documentVersion: documentVersion + 1,
          });
        }
      }
    },

    newDocument: () => {
      const { engine, clearSelection } = get();
      if (engine) {
        // Clear all entities
        const allEntities = engine.getAllEntities();
        for (const entity of allEntities) {
          engine.removeEntity(entity.id);
        }
      }
      clearSelection();
      set({
        isModified: false,
        commandHistory: [],
        commandPrompt: "Ready",
      });
    },

    // Entity actions
    addEntity: (entityData) => {
      const { engine } = get();
      if (engine) {
        // Create entity using factory based on type
        // For now, just add directly if it's a complete entity
        engine.addEntity(entityData as IEntity);
      }
      set({ isModified: true });
    },

    deleteEntities: (ids) => {
      const { engine, selectedIds, clearSelection } = get();
      if (engine) {
        for (const id of ids) {
          engine.removeEntity(id);
        }
      }
      // Clear selection if any selected were deleted
      if (ids.some((id) => selectedIds.includes(id))) {
        clearSelection();
      }
      set({ isModified: true });
    },

    /**
     * @deprecated ĐIỀU KIỆN 1: Use executeCommandObject(UpdateEntityPropertiesCommand) instead
     * This method bypasses History and should NOT be used for user-initiated changes.
     * Only use internally for undo/redo operations.
     */
    updateEntity: (id, updates) => {
      const { engine } = get();
      if (engine) {
        const entity = engine.getEntity(id);
        if (entity) {
          // WARNING: This bypasses History! Use Commands for user actions.
          Object.assign(entity, updates);
          engine.requestRender();
        }
      }
      set({ isModified: true });
    },

    getEntity: (id) => {
      const { engine } = get();
      if (engine) {
        return engine.getEntity(id);
      }
      return undefined;
    },

    getAllEntities: () => {
      const { engine } = get();
      if (engine) {
        return engine.getAllEntities();
      }
      return [];
    },

    // ==================== Layer Actions ====================

    addLayer: (name, options) => {
      const { engine } = get();
      if (engine) {
        const doc = engine.getDocument();
        doc.layers.createLayer(name, options);
        // Sync to store
        set({
          layers: doc.layers.getAllLayers().map((l) => l.toJSON()),
          isModified: true,
        });
      }
    },

    deleteLayer: (id) => {
      const { engine } = get();
      if (engine) {
        const doc = engine.getDocument();
        try {
          doc.layers.removeLayer(id);
          set({
            layers: doc.layers.getAllLayers().map((l) => l.toJSON()),
            isModified: true,
          });
        } catch (err) {
          console.error("Cannot delete layer:", err);
        }
      }
    },

    updateLayer: (id, updates) => {
      const { engine } = get();
      if (engine) {
        const doc = engine.getDocument();
        const layer = doc.layers.getLayer(id);
        if (layer) {
          if (updates.name !== undefined) layer.name = updates.name;
          if (updates.color !== undefined) layer.color = updates.color;
          if (updates.lineWeight !== undefined)
            layer.lineWeight = updates.lineWeight;
          if (updates.lineType !== undefined) layer.lineType = updates.lineType;
          // 🔐 Fill & Opacity - visual preset only
          if (updates.fillColor !== undefined)
            layer.fillColor = updates.fillColor;
          if (updates.opacity !== undefined) layer.opacity = updates.opacity;
          if (updates.state !== undefined) {
            layer.state = { ...layer.state, ...updates.state };
          }
          set({
            layers: doc.layers.getAllLayers().map((l) => l.toJSON()),
            isModified: true,
          });
        }
      }
    },

    setActiveLayer: (id) => {
      const { engine } = get();
      if (engine) {
        const doc = engine.getDocument();
        try {
          doc.layers.setActiveLayer(id);
          set({ activeLayerId: id });
        } catch (err) {
          console.error("Cannot set active layer:", err);
        }
      }
    },

    toggleLayerVisibility: (id) => {
      const { engine } = get();
      if (engine) {
        const doc = engine.getDocument();
        const layer = doc.layers.getLayer(id);
        if (layer) {
          layer.toggle("visible");
          set({
            layers: doc.layers.getAllLayers().map((l) => l.toJSON()),
            documentVersion: get().documentVersion + 1, // Trigger re-render
          });
        }
      }
    },

    toggleLayerLock: (id) => {
      const { engine } = get();
      if (engine) {
        const doc = engine.getDocument();
        const layer = doc.layers.getLayer(id);
        if (layer) {
          layer.toggle("locked");
          set({
            layers: doc.layers.getAllLayers().map((l) => l.toJSON()),
          });
        }
      }
    },

    refreshLayers: () => {
      const { engine } = get();
      if (engine) {
        const doc = engine.getDocument();
        set({
          layers: doc.layers.getAllLayers().map((l) => l.toJSON()),
          activeLayerId: doc.layers.getActiveLayerId(),
        });
      }
    },

    toggleByLayer: () => {
      set((state) => ({ useByLayer: !state.useByLayer }));
    },

    setByLayer: (value) => {
      set({ useByLayer: value });
    },
  }))
);

// ==================== Selectors ====================

export const selectSelectedEntities = (state: EngineStoreState) =>
  state.selectedIds;

export const selectHasSelection = (state: EngineStoreState) =>
  state.selectedIds.length > 0;

export const selectActiveTool = (state: EngineStoreState) => state.activeTool;

export const selectViewport = (state: EngineStoreState) => ({
  zoom: state.zoom,
  panOffset: state.panOffset,
});

export const selectMousePosition = (state: EngineStoreState) => ({
  screen: state.mouseScreen,
  world: state.mouseWorld,
});

export const selectOsnap = (state: EngineStoreState) => state.osnap;

export const selectGrid = (state: EngineStoreState) => state.grid;

export const selectDocumentState = (state: EngineStoreState) => ({
  isModified: state.isModified,
  canUndo: state.canUndo,
  canRedo: state.canRedo,
});

// Layer selectors
export const selectLayers = (state: EngineStoreState) => state.layers;
export const selectActiveLayerId = (state: EngineStoreState) =>
  state.activeLayerId;
export const selectActiveLayer = (state: EngineStoreState) =>
  state.layers.find((l) => l.id === state.activeLayerId);

/**
 * Get ByLayer style from active layer (visual preset)
 * Converts layer properties to EntityStyle format
 * 🔐 RULE: Entity can override (ByObject), BOM/Cost/CNC don't read this
 */
export const selectActiveLayerStyle = (state: EngineStoreState) => {
  const layer = state.layers.find((l) => l.id === state.activeLayerId);
  if (!layer) return null;

  // Map layer lineType to strokeStyle
  const strokeStyleMap: Record<
    string,
    "solid" | "dashed" | "dotted" | "dashdot"
  > = {
    Continuous: "solid",
    Dashed: "dashed",
    Dotted: "dotted",
    DashDot: "dashdot",
  };

  return {
    strokeColor: layer.color,
    strokeWidth: layer.lineWeight,
    strokeStyle: strokeStyleMap[layer.lineType] || "solid",
    fillColor: layer.fillColor ?? null,
    opacity: layer.opacity ?? 1,
  };
};

export default useEngineStore;
