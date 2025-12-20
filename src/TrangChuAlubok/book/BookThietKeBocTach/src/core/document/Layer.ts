/**
 * Layer - Quản lý Layer trong CAD Document
 */

import { EntityStyle, DEFAULT_STYLE } from "../entities/Entity.types";

// ==================== Layer Types ====================

export interface LayerState {
  /** Layer có hiển thị không */
  visible: boolean;
  /** Layer có bị khóa không */
  locked: boolean;
  /** Layer có bị freeze không (không render, không snap) */
  frozen: boolean;
  /** Layer có in ra không */
  printable: boolean;
}

export interface LayerData {
  id: string;
  name: string;
  /** Stroke color (ByLayer visual preset) */
  color: string;
  lineWeight: number;
  lineType: string;
  /** Fill color - visual preset, entity can override (ByObject) */
  fillColor: string | null;
  /** Opacity 0-1 - visual preset, entity can override (ByObject) */
  opacity: number;
  state: LayerState;
  description?: string;
}

export const DEFAULT_LAYER_STATE: LayerState = {
  visible: true,
  locked: false,
  frozen: false,
  printable: true,
};

// ==================== Layer Class ====================

export class Layer {
  public id: string;
  public name: string;
  public color: string;
  public lineWeight: number;
  public lineType: string;
  /** Fill color - visual preset, entity can override (ByObject) */
  public fillColor: string | null;
  /** Opacity 0-1 - visual preset, entity can override (ByObject) */
  public opacity: number;
  public state: LayerState;
  public description?: string;

  constructor(data: Partial<LayerData> & { id: string; name: string }) {
    this.id = data.id;
    this.name = data.name;
    this.color = data.color ?? "#FFFFFF";
    this.lineWeight = data.lineWeight ?? 0.25;
    this.lineType = data.lineType ?? "Continuous";
    // Visual presets - entity can override (ByObject)
    this.fillColor = data.fillColor ?? null;
    this.opacity = data.opacity ?? 1;
    this.state = { ...DEFAULT_LAYER_STATE, ...data.state };
    this.description = data.description;
  }

  // ==================== State Methods ====================

  isVisible(): boolean {
    return this.state.visible && !this.state.frozen;
  }

  isEditable(): boolean {
    return this.state.visible && !this.state.locked && !this.state.frozen;
  }

  setVisible(visible: boolean): void {
    this.state.visible = visible;
  }

  setLocked(locked: boolean): void {
    this.state.locked = locked;
  }

  setFrozen(frozen: boolean): void {
    this.state.frozen = frozen;
  }

  toggle(property: keyof LayerState): void {
    this.state[property] = !this.state[property];
  }

  // ==================== Style Methods ====================

  /**
   * Lấy style mặc định của layer (visual preset)
   * NOTE: Entity có quyền override (ByObject mode)
   * BOM/Cost/CNC không đọc layer style
   */
  getDefaultStyle(): EntityStyle {
    return {
      ...DEFAULT_STYLE,
      strokeColor: this.color,
      strokeWidth: this.lineWeight,
      fillColor: this.fillColor,
      opacity: this.opacity,
    };
  }

  // ==================== Serialization ====================

  toJSON(): LayerData {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      lineWeight: this.lineWeight,
      lineType: this.lineType,
      fillColor: this.fillColor,
      opacity: this.opacity,
      state: { ...this.state },
      description: this.description,
    };
  }

  static fromJSON(data: LayerData): Layer {
    return new Layer(data);
  }

  clone(): Layer {
    return Layer.fromJSON(this.toJSON());
  }
}

// ==================== Layer Manager ====================

export class LayerManager {
  private layers: Map<string, Layer> = new Map();
  private activeLayerId: string;

  constructor() {
    // Tạo layer mặc định
    const defaultLayer = new Layer({
      id: "0",
      name: "Layer 0",
      color: "#FFFFFF",
      lineWeight: 0.25,
    });
    this.layers.set("0", defaultLayer);
    this.activeLayerId = "0";
  }

  // ==================== Layer CRUD ====================

  addLayer(layer: Layer): void {
    if (this.layers.has(layer.id)) {
      throw new Error(`Layer with id '${layer.id}' already exists`);
    }
    this.layers.set(layer.id, layer);
  }

  createLayer(name: string, options?: Partial<LayerData>): Layer {
    const id = `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const layer = new Layer({
      id,
      name,
      ...options,
    });
    this.addLayer(layer);
    return layer;
  }

  getLayer(id: string): Layer | undefined {
    return this.layers.get(id);
  }

  getLayerByName(name: string): Layer | undefined {
    for (const layer of this.layers.values()) {
      if (layer.name === name) return layer;
    }
    return undefined;
  }

  removeLayer(id: string): boolean {
    if (id === "0") {
      throw new Error("Cannot delete default layer");
    }
    if (id === this.activeLayerId) {
      throw new Error("Cannot delete active layer");
    }
    return this.layers.delete(id);
  }

  getAllLayers(): Layer[] {
    return Array.from(this.layers.values());
  }

  getVisibleLayers(): Layer[] {
    return this.getAllLayers().filter((l) => l.isVisible());
  }

  // ==================== Active Layer ====================

  getActiveLayer(): Layer {
    return this.layers.get(this.activeLayerId)!;
  }

  getActiveLayerId(): string {
    return this.activeLayerId;
  }

  setActiveLayer(id: string): void {
    if (!this.layers.has(id)) {
      throw new Error(`Layer '${id}' not found`);
    }
    this.activeLayerId = id;
  }

  // ==================== Bulk Operations ====================

  setAllVisible(visible: boolean): void {
    for (const layer of this.layers.values()) {
      layer.setVisible(visible);
    }
  }

  setAllLocked(locked: boolean): void {
    for (const layer of this.layers.values()) {
      layer.setLocked(locked);
    }
  }

  freezeAllExcept(layerId: string): void {
    for (const layer of this.layers.values()) {
      layer.setFrozen(layer.id !== layerId);
    }
  }

  thawAll(): void {
    for (const layer of this.layers.values()) {
      layer.setFrozen(false);
    }
  }

  // ==================== Serialization ====================

  toJSON(): { layers: LayerData[]; activeLayerId: string } {
    return {
      layers: this.getAllLayers().map((l) => l.toJSON()),
      activeLayerId: this.activeLayerId,
    };
  }

  static fromJSON(data: {
    layers: LayerData[];
    activeLayerId: string;
  }): LayerManager {
    const manager = new LayerManager();
    manager.layers.clear();

    for (const layerData of data.layers) {
      manager.layers.set(layerData.id, Layer.fromJSON(layerData));
    }

    manager.activeLayerId = data.activeLayerId;
    return manager;
  }
}

export default Layer;
