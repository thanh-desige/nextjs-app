/**
 * CadDocument - Document chính chứa toàn bộ dữ liệu CAD
 * STEP-5.8: Refactored — types extracted to CadDocument.types.ts,
 * dimension subsystem extracted to DimensionDocumentService.ts
 *
 * ĐIỀU KIỆN 1: Mọi thay đổi phải đi qua Document
 * UI → CadEngine → CadDocument → History
 * Không được bypass document để sửa entity/dimension trực tiếp
 */

import { IVec2 } from "../geometry/Vec2";
import { IEntity, EntityJSON } from "../entities/Entity.types";
import { serializeIEntity, deserializeIEntity } from "../entities/EntityBridge";
import { LayerManager } from "./Layer";
import { BlockManager } from "./Block";
import { History } from "./History";
import { DimensionEntity } from "../dimensions/DimensionManager";
import { DoorEntity } from "../entities/DoorEntity";

// Types (re-exported for backward compatibility)
export type {
  CanvasPoint,
  CanvasEntity,
  DocumentMetadata,
  DocumentUnits,
  DocumentViewport,
  DocumentData,
} from "./CadDocument.types";
import type {
  CanvasEntity,
  DocumentMetadata,
  DocumentViewport,
  DocumentData,
} from "./CadDocument.types";

// Dimension subsystem
import { DimensionDocumentService } from "./DimensionDocumentService";
export { DimensionDocumentService } from "./DimensionDocumentService";

// ==================== CAD Document Class ====================

export class CadDocument {
  // Metadata
  public metadata: DocumentMetadata;

  // Managers
  public layers: LayerManager;
  public blocks: BlockManager;
  public history: History;

  // Dimension subsystem (STEP-5.8: delegated)
  public dimensionService: DimensionDocumentService;

  // Entities storage
  private entities: Map<string, IEntity> = new Map();

  // Canvas entities storage (ĐIỀU KIỆN 1: Canvas entities phải đi qua Document)
  private canvasEntities: Map<string, CanvasEntity> = new Map();

  // Canvas selection state
  private canvasSelectedIds: Set<string> = new Set();

  // Doors storage (ĐIỀU KIỆN 1: Doors phải đi qua Document)
  // RULE 7: Mọi thay đổi doors phải đi qua Command + History
  private doors: Map<string, DoorEntity> = new Map();

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

    // Dimension subsystem with injected dependencies (avoids circular ref)
    this.dimensionService = new DimensionDocumentService({
      getCanvasEntity: (id: string) => this.canvasEntities.get(id),
      markModified: () => this.markModified(),
    });

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

  // ==================== Dimension CRUD (delegates to DimensionDocumentService) ====================
  // ĐIỀU KIỆN 1: Mọi thay đổi dimension PHẢI đi qua đây

  addLegacyRadialDimension(dimension: DimensionEntity): void {
    this.dimensionService.addLegacyRadialDimension(dimension);
  }

  addDimension(dimension: DimensionEntity): void {
    this.dimensionService.addDimension(dimension);
  }

  addDimensions(dimensions: DimensionEntity[]): void {
    this.dimensionService.addDimensions(dimensions);
  }

  getDimension(id: string): DimensionEntity | undefined {
    return this.dimensionService.getDimension(id);
  }

  restoreDimension(dimension: DimensionEntity): void {
    this.dimensionService.restoreDimension(dimension);
  }

  restoreDimensions(dimensions: DimensionEntity[]): void {
    this.dimensionService.restoreDimensions(dimensions);
  }

  updateDimension(id: string, updates: Partial<DimensionEntity>): boolean {
    return this.dimensionService.updateDimension(id, updates);
  }

  removeDimension(id: string): DimensionEntity | undefined {
    return this.dimensionService.removeDimension(id);
  }

  removeDimensions(ids: string[]): number {
    return this.dimensionService.removeDimensions(ids);
  }

  getAllDimensions(): DimensionEntity[] {
    return this.dimensionService.getAllDimensions();
  }

  getDimensionCount(): number {
    return this.dimensionService.getDimensionCount();
  }

  hasDimension(id: string): boolean {
    return this.dimensionService.hasDimension(id);
  }

  clearDimensions(): void {
    this.dimensionService.clearDimensions();
  }

  // ==================== Dimension Index + Lifecycle (delegates) ====================

  rebuildDimensionIndex(): void {
    this.dimensionService.rebuildDimensionIndex();
  }

  getDimensionsForEntity(entityId: string): DimensionEntity[] {
    return this.dimensionService.getDimensionsForEntity(entityId);
  }

  commitEntityGeometryChange(entityId: string): number {
    return this.dimensionService.commitEntityGeometryChange(entityId);
  }

  commitEntitiesGeometryChange(entityIds: string[]): number {
    return this.dimensionService.commitEntitiesGeometryChange(entityIds);
  }

  handleEntityDeleted(entityId: string): void {
    this.dimensionService.handleEntityDeleted(entityId);
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

  // ==================== Door CRUD ====================
  // ĐIỀU KIỆN 1: Mọi thay đổi doors phải đi qua Document
  // RULE 7: Các methods này CHỈ được gọi từ DoorCommands

  addDoor(door: DoorEntity): void {
    this.doors.set(door.id, door);
    this.markModified();
  }

  addDoors(doors: DoorEntity[]): void {
    for (const door of doors) {
      this.doors.set(door.id, door);
    }
    this.markModified();
  }

  getDoor(id: string): DoorEntity | undefined {
    return this.doors.get(id);
  }

  updateDoor(id: string, updates: Partial<DoorEntity>): boolean {
    const door = this.doors.get(id);
    if (!door) return false;

    // Apply updates immutably - preserve class prototype
    const updated = Object.assign(
      Object.create(Object.getPrototypeOf(door)),
      door,
      updates
    );
    this.doors.set(id, updated);
    this.markModified();
    return true;
  }

  removeDoor(id: string): boolean {
    const result = this.doors.delete(id);
    if (result) this.markModified();
    return result;
  }

  removeDoors(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      if (this.doors.delete(id)) count++;
    }
    if (count > 0) this.markModified();
    return count;
  }

  getAllDoors(): DoorEntity[] {
    return Array.from(this.doors.values());
  }

  getDoorCount(): number {
    return this.doors.size;
  }

  hasDoor(id: string): boolean {
    return this.doors.has(id);
  }

  clearDoors(): void {
    this.doors.clear();
    this.markModified();
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
      entities: this.getAllEntities().map((e) => {
        // Use EntityBridge serialization (EntityRegistry configs)
        // Falls back to e.toJSON() for legacy BaseEntity instances
        try {
          return serializeIEntity(e) as unknown as EntityJSON;
        } catch {
          // Legacy fallback: BaseEntity instances still have toJSON()
          return (e as unknown as { toJSON(): EntityJSON }).toJSON();
        }
      }),
      dimensions: this.getAllDimensions(), // Include dimensions in serialization
      canvasEntities: this.getAllCanvasEntities(), // Include canvas entities
      doors: this.getAllDoors(), // Include doors (RULE 7)
      viewport: { ...this.viewport },
    };
  }

  static fromJSON(
    data: DocumentData,
    entityFactory?: (json: EntityJSON) => IEntity
  ): CadDocument {
    // Default factory: use EntityRegistry-based deserialization
    const factory = entityFactory ?? ((json: EntityJSON) => {
      const type = (json as Record<string, unknown>).entityType as string
        ?? json.type;
      return deserializeIEntity(type, json as Record<string, unknown>);
    });
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
    doc.blocks = BlockManager.fromJSON(data.blocks, factory);

    // Restore entities
    for (const entityJson of data.entities) {
      const entity = factory(entityJson);
      doc.entities.set(entity.id, entity);
    }

    // Restore dimensions (via DimensionDocumentService)
    if (data.dimensions) {
      doc.dimensionService.loadFromData(data.dimensions);
    }

    // Restore canvas entities
    if (data.canvasEntities) {
      for (const entity of data.canvasEntities) {
        doc.canvasEntities.set(entity.id, entity);
      }
    }

    // Restore doors (RULE 7: loaded via Document)
    if (data.doors) {
      for (const door of data.doors) {
        doc.doors.set(door.id, door);
      }
    }

    // Restore viewport
    doc.viewport = { ...data.viewport };

    doc.setEntityFactory(factory);

    return doc;
  }

  // ==================== File Operations ====================

  toJSONString(pretty: boolean = false): string {
    const data = this.toJSON();
    return pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  }

  static fromJSONString(
    jsonString: string,
    entityFactory?: (json: EntityJSON) => IEntity
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
    doorCount: number;
    layerCount: number;
    blockCount: number;
    created: Date;
    modified: Date;
  } {
    return {
      title: this.metadata.title,
      entityCount: this.entities.size,
      dimensionCount: this.dimensionService.getDimensionCount(),
      canvasEntityCount: this.canvasEntities.size,
      doorCount: this.doors.size,
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
