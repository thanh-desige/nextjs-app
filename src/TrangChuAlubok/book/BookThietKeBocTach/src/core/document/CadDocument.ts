/**
 * CadDocument - Document chính chứa toàn bộ dữ liệu CAD
 *
 * ĐIỀU KIỆN 1: Mọi thay đổi phải đi qua Document
 * UI → CadEngine → CadDocument → History
 * Không được bypass document để sửa entity/dimension trực tiếp
 */

import { IVec2 } from "../geometry/Vec2";
import { IEntity, EntityJSON } from "../entities/Entity.types";
import { LayerManager, LayerData } from "./Layer";
import { BlockManager, BlockJSON } from "./Block";
import { History } from "./History";
import { DimensionEntity } from "../dimensions/DimensionManager";

// ==================== Canvas Entity Type ====================
// Canvas entities (line, rect, circle, polyline) - UI drawing entities

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasEntity {
  id: string;
  type: "line" | "polyline" | "rect" | "circle" | "arc" | "ellipse" | "text";
  points: CanvasPoint[];
  color: string;
  lineWidth: number;
  selected?: boolean;
  locked?: boolean;
  visible?: boolean;
  layer?: string;
  /**
   * Use layer style (ByLayer) or entity's own style (ByObject/Custom)
   * - true/undefined: Entity inherits style from layer (default)
   * - false: Entity uses its own color/lineWidth/etc (Custom mode)
   */
  useLayerStyle?: boolean;
  // Stroke style (solid, dashed, dotted, dashdot)
  strokeStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  // Fill properties
  fillColor?: string | null;
  fillOpacity?: number;
  // Entity opacity (0-1)
  opacity?: number;
  // Polyline properties
  closed?: boolean;
  // Arc properties
  startAngle?: number;
  endAngle?: number;
  // Ellipse properties
  radiusX?: number;
  radiusY?: number;
  rotation?: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

// ==================== Document Metadata ====================

export interface DocumentMetadata {
  title: string;
  author?: string;
  created: Date;
  modified: Date;
  version: string;
  description?: string;
  units: DocumentUnits;
  customProperties?: Record<string, unknown>;
}

export interface DocumentUnits {
  /** Đơn vị chính: mm, cm, m, inch, ft */
  primary: "mm" | "cm" | "m" | "inch" | "ft";
  /** Precision - số chữ số thập phân */
  precision: number;
  /** Scale factor */
  scale: number;
}

export interface DocumentViewport {
  center: IVec2;
  zoom: number;
  rotation: number;
}

// ==================== Document Data (for serialization) ====================

export interface DocumentData {
  metadata: DocumentMetadata;
  layers: LayerData[];
  activeLayerId: string;
  blocks: BlockJSON[];
  entities: EntityJSON[];
  dimensions: DimensionEntity[]; // Dimensions storage
  canvasEntities: CanvasEntity[]; // Canvas entities storage
  viewport: DocumentViewport;
}

// ==================== CAD Document Class ====================

export class CadDocument {
  // Metadata
  public metadata: DocumentMetadata;

  // Managers
  public layers: LayerManager;
  public blocks: BlockManager;
  public history: History;

  // Entities storage
  private entities: Map<string, IEntity> = new Map();

  // Dimensions storage (ĐIỀU KIỆN 1: Dimensions phải đi qua Document)
  private dimensions: Map<string, DimensionEntity> = new Map();

  // Canvas entities storage (ĐIỀU KIỆN 1: Canvas entities phải đi qua Document)
  private canvasEntities: Map<string, CanvasEntity> = new Map();

  // Canvas selection state
  private canvasSelectedIds: Set<string> = new Set();

  // Viewport state
  public viewport: DocumentViewport;

  // Entity factory (to be set externally)
  private entityFactory?: (json: EntityJSON) => IEntity;

  constructor(metadata?: Partial<DocumentMetadata>) {
    this.metadata = {
      title: metadata?.title ?? "Untitled",
      author: metadata?.author,
      created: metadata?.created ?? new Date(),
      modified: new Date(),
      version: "1.0.0",
      description: metadata?.description,
      units: metadata?.units ?? {
        primary: "mm",
        precision: 2,
        scale: 1,
      },
      customProperties: metadata?.customProperties,
    };

    this.layers = new LayerManager();
    this.blocks = new BlockManager();
    this.history = new History(100);

    this.viewport = {
      center: { x: 0, y: 0 },
      zoom: 1,
      rotation: 0,
    };
  }

  // ==================== Entity Factory ====================

  setEntityFactory(factory: (json: EntityJSON) => IEntity): void {
    this.entityFactory = factory;
  }

  // ==================== Entity CRUD ====================

  addEntity(entity: IEntity): void {
    this.entities.set(entity.id, entity);
    this.markModified();
  }

  addEntities(entities: IEntity[]): void {
    for (const entity of entities) {
      this.entities.set(entity.id, entity);
    }
    this.markModified();
  }

  getEntity(id: string): IEntity | undefined {
    return this.entities.get(id);
  }

  removeEntity(id: string): boolean {
    const result = this.entities.delete(id);
    if (result) this.markModified();
    return result;
  }

  removeEntities(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.entities.delete(id)) count++;
    }
    if (count > 0) this.markModified();
    return count;
  }

  getAllEntities(): IEntity[] {
    return Array.from(this.entities.values());
  }

  getEntitiesOnLayer(layerId: string): IEntity[] {
    return this.getAllEntities().filter((e) => e.layerId === layerId);
  }

  getVisibleEntities(): IEntity[] {
    const visibleLayerIds = new Set(
      this.layers.getVisibleLayers().map((l) => l.id)
    );
    return this.getAllEntities().filter((e) => visibleLayerIds.has(e.layerId));
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  hasEntity(id: string): boolean {
    return this.entities.has(id);
  }

  clearEntities(): void {
    this.entities.clear();
    this.markModified();
  }

  // ==================== Dimension CRUD ====================
  // ĐIỀU KIỆN 1: Mọi thay đổi dimension PHẢI đi qua đây

  addDimension(dimension: DimensionEntity): void {
    this.dimensions.set(dimension.id, dimension);
    this.markModified();
  }

  addDimensions(dimensions: DimensionEntity[]): void {
    for (const dim of dimensions) {
      this.dimensions.set(dim.id, dim);
    }
    this.markModified();
  }

  getDimension(id: string): DimensionEntity | undefined {
    return this.dimensions.get(id);
  }

  updateDimension(id: string, updates: Partial<DimensionEntity>): boolean {
    const dim = this.dimensions.get(id);
    if (!dim) return false;

    // Apply updates immutably
    const updated = { ...dim, ...updates };
    this.dimensions.set(id, updated);
    this.markModified();
    return true;
  }

  removeDimension(id: string): DimensionEntity | undefined {
    const dim = this.dimensions.get(id);
    if (dim) {
      this.dimensions.delete(id);
      this.markModified();
    }
    return dim;
  }

  removeDimensions(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.dimensions.delete(id)) count++;
    }
    if (count > 0) this.markModified();
    return count;
  }

  getAllDimensions(): DimensionEntity[] {
    return Array.from(this.dimensions.values());
  }

  getDimensionCount(): number {
    return this.dimensions.size;
  }

  hasDimension(id: string): boolean {
    return this.dimensions.has(id);
  }

  clearDimensions(): void {
    this.dimensions.clear();
    this.markModified();
  }

  // ==================== Canvas Entity CRUD ====================
  // ĐIỀU KIỆN 1: Mọi thay đổi canvas entity PHẢI đi qua đây

  addCanvasEntity(entity: CanvasEntity): void {
    this.canvasEntities.set(entity.id, entity);
    this.markModified();
  }

  addCanvasEntities(entities: CanvasEntity[]): void {
    for (const entity of entities) {
      this.canvasEntities.set(entity.id, entity);
    }
    this.markModified();
  }

  getCanvasEntity(id: string): CanvasEntity | undefined {
    return this.canvasEntities.get(id);
  }

  updateCanvasEntity(id: string, updates: Partial<CanvasEntity>): boolean {
    const entity = this.canvasEntities.get(id);
    if (!entity) return false;

    // Apply updates immutably
    const updated = { ...entity, ...updates };
    this.canvasEntities.set(id, updated);
    this.markModified();
    return true;
  }

  deleteCanvasEntity(id: string): CanvasEntity | undefined {
    const entity = this.canvasEntities.get(id);
    if (entity) {
      this.canvasEntities.delete(id);
      this.canvasSelectedIds.delete(id);
      this.markModified();
    }
    return entity;
  }

  deleteCanvasEntities(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.canvasEntities.delete(id)) {
        this.canvasSelectedIds.delete(id);
        count++;
      }
    }
    if (count > 0) this.markModified();
    return count;
  }

  getAllCanvasEntities(): CanvasEntity[] {
    return Array.from(this.canvasEntities.values());
  }

  getCanvasEntityCount(): number {
    return this.canvasEntities.size;
  }

  hasCanvasEntity(id: string): boolean {
    return this.canvasEntities.has(id);
  }

  clearCanvasEntities(): void {
    this.canvasEntities.clear();
    this.canvasSelectedIds.clear();
    this.markModified();
  }

  // ==================== Canvas Selection ====================

  selectCanvasEntities(ids: string[], additive = false): void {
    if (!additive) {
      this.canvasSelectedIds.clear();
    }

    for (const id of ids) {
      if (this.canvasEntities.has(id)) {
        if (additive && this.canvasSelectedIds.has(id)) {
          // Toggle off if already selected
          this.canvasSelectedIds.delete(id);
        } else {
          this.canvasSelectedIds.add(id);
        }
      }
    }

    // Update entity selected state
    for (const [id, entity] of this.canvasEntities) {
      const isSelected = this.canvasSelectedIds.has(id);
      if (entity.selected !== isSelected) {
        this.canvasEntities.set(id, { ...entity, selected: isSelected });
      }
    }
  }

  clearCanvasSelection(): void {
    this.canvasSelectedIds.clear();

    // Update all entities to not selected
    for (const [id, entity] of this.canvasEntities) {
      if (entity.selected) {
        this.canvasEntities.set(id, { ...entity, selected: false });
      }
    }
  }

  getCanvasSelectedIds(): string[] {
    return Array.from(this.canvasSelectedIds);
  }

  getSelectedCanvasEntities(): CanvasEntity[] {
    return this.getAllCanvasEntities().filter((e) =>
      this.canvasSelectedIds.has(e.id)
    );
  }

  isCanvasEntitySelected(id: string): boolean {
    return this.canvasSelectedIds.has(id);
  }

  // ==================== Selection Helpers ====================

  getEntitiesInBounds(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number
  ): IEntity[] {
    return this.getAllEntities().filter((entity) => {
      const bounds = entity.getBounds();
      return (
        bounds.min.x >= minX &&
        bounds.max.x <= maxX &&
        bounds.min.y >= minY &&
        bounds.max.y <= maxY
      );
    });
  }

  getEntitiesAtPoint(point: IVec2, tolerance: number = 5): IEntity[] {
    return this.getAllEntities().filter((entity) =>
      entity.containsPoint(point, tolerance)
    );
  }

  // ==================== Document State ====================

  private markModified(): void {
    this.metadata.modified = new Date();
  }

  isModified(): boolean {
    return this.metadata.modified > this.metadata.created;
  }

  // ==================== Serialization ====================

  toJSON(): DocumentData {
    return {
      metadata: {
        ...this.metadata,
        created: this.metadata.created,
        modified: this.metadata.modified,
      },
      layers: this.layers.toJSON().layers,
      activeLayerId: this.layers.getActiveLayerId(),
      blocks: this.blocks.toJSON(),
      entities: this.getAllEntities().map((e) => e.toJSON()),
      dimensions: this.getAllDimensions(), // Include dimensions in serialization
      canvasEntities: this.getAllCanvasEntities(), // Include canvas entities
      viewport: { ...this.viewport },
    };
  }

  static fromJSON(
    data: DocumentData,
    entityFactory: (json: EntityJSON) => IEntity
  ): CadDocument {
    const doc = new CadDocument({
      title: data.metadata.title,
      author: data.metadata.author,
      created: new Date(data.metadata.created),
      description: data.metadata.description,
      units: data.metadata.units,
      customProperties: data.metadata.customProperties,
    });

    doc.metadata.modified = new Date(data.metadata.modified);
    doc.metadata.version = data.metadata.version;

    // Restore layers
    doc.layers = LayerManager.fromJSON({
      layers: data.layers,
      activeLayerId: data.activeLayerId,
    });

    // Restore blocks
    doc.blocks = BlockManager.fromJSON(data.blocks, entityFactory);

    // Restore entities
    for (const entityJson of data.entities) {
      const entity = entityFactory(entityJson);
      doc.entities.set(entity.id, entity);
    }

    // Restore dimensions
    if (data.dimensions) {
      for (const dim of data.dimensions) {
        doc.dimensions.set(dim.id, dim);
      }
    }

    // Restore canvas entities
    if (data.canvasEntities) {
      for (const entity of data.canvasEntities) {
        doc.canvasEntities.set(entity.id, entity);
      }
    }

    // Restore viewport
    doc.viewport = { ...data.viewport };

    doc.setEntityFactory(entityFactory);

    return doc;
  }

  // ==================== File Operations ====================

  toJSONString(pretty: boolean = false): string {
    const data = this.toJSON();
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  static fromJSONString(
    jsonString: string,
    entityFactory: (json: EntityJSON) => IEntity
  ): CadDocument {
    const data = JSON.parse(jsonString) as DocumentData;
    return CadDocument.fromJSON(data, entityFactory);
  }

  // ==================== Document Info ====================

  getInfo(): {
    title: string;
    entityCount: number;
    dimensionCount: number;
    canvasEntityCount: number;
    layerCount: number;
    blockCount: number;
    created: Date;
    modified: Date;
  } {
    return {
      title: this.metadata.title,
      entityCount: this.entities.size,
      dimensionCount: this.dimensions.size,
      canvasEntityCount: this.canvasEntities.size,
      layerCount: this.layers.getAllLayers().length,
      blockCount: this.blocks.getAllBlocks().length,
      created: this.metadata.created,
      modified: this.metadata.modified,
    };
  }

  // ==================== Static Factory ====================

  static createNew(title: string = "Untitled"): CadDocument {
    return new CadDocument({ title });
  }
}

export default CadDocument;
