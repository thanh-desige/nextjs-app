/**
 * LayerManager - Manages drawing layers for CAD application
 * Features:
 * - Create, delete, rename layers
 * - Show/hide layers
 * - Lock/unlock layers
 * - Layer color and line weight
 * - Current layer tracking
 */

export interface Layer {
  id: string;
  name: string;
  color: string;
  lineWeight: number;
  visible: boolean;
  locked: boolean;
  frozen: boolean;
  order: number;
}

export interface LayerManagerState {
  layers: Layer[];
  currentLayerId: string;
}

// Default layers
export const DEFAULT_LAYERS: Layer[] = [
  {
    id: "layer-0",
    name: "0",
    color: "#FFFFFF",
    lineWeight: 1,
    visible: true,
    locked: false,
    frozen: false,
    order: 0,
  },
  {
    id: "layer-construction",
    name: "Construction",
    color: "#808080",
    lineWeight: 0.5,
    visible: true,
    locked: false,
    frozen: false,
    order: 1,
  },
  {
    id: "layer-dimensions",
    name: "Dimensions",
    color: "#00FF00",
    lineWeight: 0.5,
    visible: true,
    locked: false,
    frozen: false,
    order: 2,
  },
  {
    id: "layer-annotations",
    name: "Annotations",
    color: "#FFFF00",
    lineWeight: 0.5,
    visible: true,
    locked: false,
    frozen: false,
    order: 3,
  },
  {
    id: "layer-doors",
    name: "Doors",
    color: "#FF6600",
    lineWeight: 2,
    visible: true,
    locked: false,
    frozen: false,
    order: 4,
  },
  {
    id: "layer-glass",
    name: "Glass",
    color: "#00FFFF",
    lineWeight: 1,
    visible: true,
    locked: false,
    frozen: false,
    order: 5,
  },
  {
    id: "layer-aluminum",
    name: "Aluminum",
    color: "#C0C0C0",
    lineWeight: 1.5,
    visible: true,
    locked: false,
    frozen: false,
    order: 6,
  },
];

export class LayerManager {
  private layers: Map<string, Layer> = new Map();
  private currentLayerId: string = "layer-0";

  constructor(initialLayers?: Layer[]) {
    const layers = initialLayers || DEFAULT_LAYERS;
    layers.forEach((layer) => this.layers.set(layer.id, { ...layer }));
  }

  // ==================== Layer CRUD ====================

  createLayer(name: string, options?: Partial<Layer>): Layer {
    const id = `layer-${Date.now()}`;
    const order = this.layers.size;
    const layer: Layer = {
      id,
      name,
      color: options?.color || "#FFFFFF",
      lineWeight: options?.lineWeight || 1,
      visible: options?.visible ?? true,
      locked: options?.locked ?? false,
      frozen: options?.frozen ?? false,
      order,
    };
    this.layers.set(id, layer);
    return layer;
  }

  deleteLayer(id: string): boolean {
    if (id === "layer-0") return false; // Cannot delete default layer
    if (this.currentLayerId === id) {
      this.currentLayerId = "layer-0";
    }
    return this.layers.delete(id);
  }

  renameLayer(id: string, newName: string): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.name = newName;
    return true;
  }

  // ==================== Layer Properties ====================

  setLayerColor(id: string, color: string): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.color = color;
    return true;
  }

  setLayerLineWeight(id: string, weight: number): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.lineWeight = weight;
    return true;
  }

  setLayerVisible(id: string, visible: boolean): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.visible = visible;
    return true;
  }

  setLayerLocked(id: string, locked: boolean): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.locked = locked;
    return true;
  }

  setLayerFrozen(id: string, frozen: boolean): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.frozen = frozen;
    return true;
  }

  toggleLayerVisibility(id: string): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.visible = !layer.visible;
    return true;
  }

  toggleLayerLock(id: string): boolean {
    const layer = this.layers.get(id);
    if (!layer) return false;
    layer.locked = !layer.locked;
    return true;
  }

  // ==================== Current Layer ====================

  setCurrentLayer(id: string): boolean {
    if (!this.layers.has(id)) return false;
    const layer = this.layers.get(id)!;
    if (layer.locked || layer.frozen) return false;
    this.currentLayerId = id;
    return true;
  }

  getCurrentLayer(): Layer | undefined {
    return this.layers.get(this.currentLayerId);
  }

  getCurrentLayerId(): string {
    return this.currentLayerId;
  }

  // ==================== Getters ====================

  getLayer(id: string): Layer | undefined {
    return this.layers.get(id);
  }

  getAllLayers(): Layer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.order - b.order);
  }

  getVisibleLayers(): Layer[] {
    return this.getAllLayers().filter((l) => l.visible && !l.frozen);
  }

  getEditableLayers(): Layer[] {
    return this.getAllLayers().filter((l) => !l.locked && !l.frozen);
  }

  isLayerEditable(id: string): boolean {
    const layer = this.layers.get(id);
    return layer ? !layer.locked && !layer.frozen && layer.visible : false;
  }

  // ==================== Layer Order ====================

  moveLayerUp(id: string): boolean {
    const layers = this.getAllLayers();
    const index = layers.findIndex((l) => l.id === id);
    if (index <= 0) return false;

    const prevLayer = layers[index - 1];
    const currentLayer = layers[index];
    const tempOrder = currentLayer.order;
    currentLayer.order = prevLayer.order;
    prevLayer.order = tempOrder;
    return true;
  }

  moveLayerDown(id: string): boolean {
    const layers = this.getAllLayers();
    const index = layers.findIndex((l) => l.id === id);
    if (index < 0 || index >= layers.length - 1) return false;

    const nextLayer = layers[index + 1];
    const currentLayer = layers[index];
    const tempOrder = currentLayer.order;
    currentLayer.order = nextLayer.order;
    nextLayer.order = tempOrder;
    return true;
  }

  // ==================== Serialization ====================

  getState(): LayerManagerState {
    return {
      layers: this.getAllLayers(),
      currentLayerId: this.currentLayerId,
    };
  }

  loadState(state: LayerManagerState): void {
    this.layers.clear();
    state.layers.forEach((layer) => this.layers.set(layer.id, { ...layer }));
    this.currentLayerId = state.currentLayerId;
  }

  toJSON(): string {
    return JSON.stringify(this.getState());
  }

  static fromJSON(json: string): LayerManager {
    const state = JSON.parse(json) as LayerManagerState;
    const manager = new LayerManager([]);
    manager.loadState(state);
    return manager;
  }
}

export default LayerManager;
