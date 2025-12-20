/**
 * CAD Engine - Engine chính điều khiển toàn bộ CAD
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import { Matrix3 } from "../geometry/Matrix3";
import {
  BoundingBox,
  doBoundingBoxesIntersect,
  isPointInBoundingBox,
} from "../geometry/GeometryUtils";
import {
  IEntity,
  EntityStyle,
  HitTestResult,
  GripPoint,
  EntityType,
} from "../entities/Entity.types";
import { BaseEntity } from "../entities/BaseEntity";
import {
  EngineState,
  ToolMode,
  SelectionMode,
  ViewportState,
  GridState,
  SnapState,
  createDefaultEngineState,
} from "./EngineState";
import {
  EngineEventEmitter,
  EngineEventType,
  EngineEventListener,
} from "./EngineEvents";
import { CadDocument, CanvasEntity } from "../document/CadDocument";
import {
  ICommand,
  CommandResult,
  CommandContext,
} from "../commands/Command.types";

// ==================== CAD Engine Class ====================

export class CadEngine {
  // State
  private state: EngineState;

  // Event emitter
  private events: EngineEventEmitter;

  // ĐIỀU KIỆN 1: Document là source of truth
  private document: CadDocument;

  // Entities storage (delegate to document)
  private entities: Map<string, IEntity> = new Map();

  // Layers
  private layers: Map<string, LayerInfo> = new Map();
  private activeLayerId: string = "default";

  // Current style
  private currentStyle: EntityStyle;

  // Viewport transform cache
  private worldToScreen: Matrix3 = Matrix3.identity();
  private screenToWorld: Matrix3 = Matrix3.identity();

  constructor() {
    this.state = createDefaultEngineState();
    this.events = new EngineEventEmitter();

    // ĐIỀU KIỆN 1: Khởi tạo Document
    this.document = new CadDocument();

    this.currentStyle = {
      strokeColor: "#FFFFFF",
      strokeWidth: 1,
      strokeStyle: "solid",
      fillColor: null,
      opacity: 1,
    };

    // Create default layer
    this.layers.set("default", {
      id: "default",
      name: "Layer 0",
      visible: true,
      locked: false,
      color: "#FFFFFF",
    });

    this.updateTransformMatrices();
  }

  // ==================== Event System ====================

  on<T extends EngineEventType>(
    event: T,
    listener: EngineEventListener<T>
  ): () => void {
    return this.events.on(event, listener);
  }

  off<T extends EngineEventType>(
    event: T,
    listener: EngineEventListener<T>
  ): void {
    this.events.off(event, listener);
  }

  private emit<T extends EngineEventType>(
    event: T,
    payload: Parameters<EngineEventListener<T>>[0]
  ): void {
    this.events.emit(event, payload);
  }

  // ==================== State Access ====================

  getState(): Readonly<EngineState> {
    return this.state;
  }

  getTool(): ToolMode {
    return this.state.tool;
  }

  setTool(tool: ToolMode): void {
    if (this.state.tool !== tool) {
      const previousTool = this.state.tool;

      // Cancel current drawing if any
      if (this.state.drawing.isDrawing) {
        this.cancelDrawing();
      }

      this.state.tool = tool;
      this.emit(EngineEventType.TOOL_CHANGED, { tool, previousTool });
      this.requestRender();
    }
  }

  // ==================== Viewport Management ====================

  getViewport(): Readonly<ViewportState> {
    return this.state.viewport;
  }

  setViewportSize(width: number, height: number): void {
    this.state.viewport.width = width;
    this.state.viewport.height = height;
    this.updateTransformMatrices();
    this.requestRender();
  }

  pan(dx: number, dy: number): void {
    // dx, dy are in screen pixels, convert to world
    const worldDelta = this.screenToWorld.transformVector({ x: dx, y: dy });
    this.state.viewport.center.subSelf(worldDelta);
    this.updateTransformMatrices();
    this.emit(EngineEventType.VIEWPORT_PAN, {
      center: this.state.viewport.center.toObject(),
      zoom: this.state.viewport.zoom,
    });
    this.requestRender();
  }

  panTo(worldPoint: IVec2): void {
    this.state.viewport.center.copy(worldPoint);
    this.updateTransformMatrices();
    this.emit(EngineEventType.VIEWPORT_CHANGED, {
      center: this.state.viewport.center.toObject(),
      zoom: this.state.viewport.zoom,
    });
    this.requestRender();
  }

  zoom(factor: number, screenCenter?: IVec2): void {
    const center = screenCenter ?? {
      x: this.state.viewport.width / 2,
      y: this.state.viewport.height / 2,
    };

    // Get world point at mouse before zoom
    const worldBefore = this.screenToWorld.transformPoint(center);

    // Apply zoom
    const previousZoom = this.state.viewport.zoom;
    this.state.viewport.zoom = Math.max(
      0.0001,
      Math.min(100000, this.state.viewport.zoom * factor)
    );

    // Update matrices
    this.updateTransformMatrices();

    // Get world point at mouse after zoom
    const worldAfter = this.screenToWorld.transformPoint(center);

    // Adjust center to keep mouse point fixed
    this.state.viewport.center.addSelf(worldBefore.sub(worldAfter));
    this.updateTransformMatrices();

    this.emit(EngineEventType.VIEWPORT_ZOOM, {
      center: this.state.viewport.center.toObject(),
      zoom: this.state.viewport.zoom,
      previousZoom,
    });
    this.requestRender();
  }

  zoomToFit(padding: number = 50): void {
    const bounds = this.getAllEntitiesBounds();
    if (!bounds) return;

    const boundsWidth = bounds.max.x - bounds.min.x;
    const boundsHeight = bounds.max.y - bounds.min.y;

    if (boundsWidth === 0 && boundsHeight === 0) return;

    const availableWidth = this.state.viewport.width - padding * 2;
    const availableHeight = this.state.viewport.height - padding * 2;

    const scaleX = boundsWidth > 0 ? availableWidth / boundsWidth : 1;
    const scaleY = boundsHeight > 0 ? availableHeight / boundsHeight : 1;

    this.state.viewport.zoom = Math.min(scaleX, scaleY);
    this.state.viewport.center.set(
      (bounds.min.x + bounds.max.x) / 2,
      (bounds.min.y + bounds.max.y) / 2
    );

    this.updateTransformMatrices();
    this.emit(EngineEventType.VIEWPORT_CHANGED, {
      center: this.state.viewport.center.toObject(),
      zoom: this.state.viewport.zoom,
    });
    this.requestRender();
  }

  private updateTransformMatrices(): void {
    const { center, zoom, width, height } = this.state.viewport;

    // World to Screen: translate center to origin, scale, translate to screen center
    this.worldToScreen = Matrix3.translation(width / 2, height / 2)
      .scale(zoom, -zoom) // Flip Y axis
      .translate(-center.x, -center.y);

    // Screen to World: inverse
    this.screenToWorld = this.worldToScreen.inverse() ?? Matrix3.identity();
  }

  worldToScreenPoint(worldPoint: IVec2): Vec2 {
    return this.worldToScreen.transformPoint(worldPoint);
  }

  screenToWorldPoint(screenPoint: IVec2): Vec2 {
    return this.screenToWorld.transformPoint(screenPoint);
  }

  // ==================== Grid & Snap ====================

  getGrid(): Readonly<GridState> {
    return this.state.grid;
  }

  setGrid(grid: Partial<GridState>): void {
    Object.assign(this.state.grid, grid);
    this.requestRender();
  }

  getSnap(): Readonly<SnapState> {
    return this.state.snap;
  }

  setSnap(snap: Partial<SnapState>): void {
    Object.assign(this.state.snap, snap);
    this.emit(EngineEventType.SNAP_CHANGED, {
      enabled: this.state.snap.enabled,
    });
  }

  snapPoint(worldPoint: IVec2): Vec2 {
    const snapped = Vec2.from(worldPoint);

    // Grid snap
    if (this.state.grid.snap) {
      const gridSize =
        this.state.grid.majorSpacing / this.state.grid.minorDivisions;
      snapped.x = Math.round(snapped.x / gridSize) * gridSize;
      snapped.y = Math.round(snapped.y / gridSize) * gridSize;
    }

    // Object snap (implemented in OsnapManager)
    // TODO: Integrate with OsnapManager

    return snapped;
  }

  // ==================== Entity Management ====================

  addEntity(entity: IEntity): void {
    this.entities.set(entity.id, entity);
    this.state.isDirty = true;
    this.emit(EngineEventType.ENTITY_ADDED, { entity });
    this.emit(EngineEventType.DOCUMENT_MODIFIED, undefined);
    this.requestRender();
  }

  addEntities(entities: IEntity[]): void {
    for (const entity of entities) {
      this.entities.set(entity.id, entity);
    }
    this.state.isDirty = true;
    this.emit(EngineEventType.ENTITY_ADDED, { entity: entities[0], entities });
    this.emit(EngineEventType.DOCUMENT_MODIFIED, undefined);
    this.requestRender();
  }

  removeEntity(entityId: string): IEntity | undefined {
    const entity = this.entities.get(entityId);
    if (entity) {
      this.entities.delete(entityId);
      this.state.selection.selectedIds.delete(entityId);
      if (this.state.selection.hoveredId === entityId) {
        this.state.selection.hoveredId = null;
      }
      this.state.isDirty = true;
      this.emit(EngineEventType.ENTITY_REMOVED, { entity });
      this.emit(EngineEventType.DOCUMENT_MODIFIED, undefined);
      this.requestRender();
    }
    return entity;
  }

  removeEntities(entityIds: string[]): void {
    for (const id of entityIds) {
      this.removeEntity(id);
    }
  }

  getEntity(entityId: string): IEntity | undefined {
    return this.entities.get(entityId);
  }

  getAllEntities(): IEntity[] {
    return Array.from(this.entities.values());
  }

  getVisibleEntities(): IEntity[] {
    return this.getAllEntities().filter((e) => {
      const layer = this.layers.get(e.layerId);
      return e.state.visible && (!layer || layer.visible);
    });
  }

  clearAllEntities(): void {
    this.entities.clear();
    this.state.selection.selectedIds.clear();
    this.state.selection.hoveredId = null;
    this.state.isDirty = true;
    this.emit(EngineEventType.ENTITIES_CLEARED, undefined);
    this.emit(EngineEventType.DOCUMENT_MODIFIED, undefined);
    this.requestRender();
  }

  getAllEntitiesBounds(): BoundingBox | null {
    const entities = this.getAllEntities();
    if (entities.length === 0) return null;

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const entity of entities) {
      const bounds = entity.getBounds();
      if (bounds.min.x < minX) minX = bounds.min.x;
      if (bounds.min.y < minY) minY = bounds.min.y;
      if (bounds.max.x > maxX) maxX = bounds.max.x;
      if (bounds.max.y > maxY) maxY = bounds.max.y;
    }

    return {
      min: new Vec2(minX, minY),
      max: new Vec2(maxX, maxY),
    };
  }

  // ==================== Selection ====================

  getSelectedIds(): string[] {
    return Array.from(this.state.selection.selectedIds);
  }

  getSelectedEntities(): IEntity[] {
    return this.getSelectedIds()
      .map((id) => this.entities.get(id))
      .filter((e): e is IEntity => e !== undefined);
  }

  select(entityIds: string | string[], addToSelection: boolean = false): void {
    const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
    const previousIds = Array.from(this.state.selection.selectedIds);

    if (!addToSelection) {
      // Deselect all current
      for (const id of this.state.selection.selectedIds) {
        const entity = this.entities.get(id);
        if (entity && "deselect" in entity) {
          (entity as BaseEntity).deselect();
        }
      }
      this.state.selection.selectedIds.clear();
    }

    // Select new
    for (const id of ids) {
      const entity = this.entities.get(id);
      if (entity) {
        this.state.selection.selectedIds.add(id);
        if ("select" in entity) {
          (entity as BaseEntity).select();
        }
      }
    }

    const selectedIds = Array.from(this.state.selection.selectedIds);
    const added = ids.filter((id) => !previousIds.includes(id));
    const removed = previousIds.filter((id) => !selectedIds.includes(id));

    this.emit(EngineEventType.SELECTION_CHANGED, {
      selectedIds,
      previousIds,
      added,
      removed,
    });
    this.requestRender();
  }

  deselect(entityIds?: string | string[]): void {
    if (!entityIds) {
      // Deselect all
      this.clearSelection();
      return;
    }

    const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
    const previousIds = Array.from(this.state.selection.selectedIds);

    for (const id of ids) {
      this.state.selection.selectedIds.delete(id);
      const entity = this.entities.get(id);
      if (entity && "deselect" in entity) {
        (entity as BaseEntity).deselect();
      }
    }

    const selectedIds = Array.from(this.state.selection.selectedIds);
    this.emit(EngineEventType.SELECTION_CHANGED, {
      selectedIds,
      previousIds,
      added: [],
      removed: ids.filter((id) => previousIds.includes(id)),
    });
    this.requestRender();
  }

  clearSelection(): void {
    for (const id of this.state.selection.selectedIds) {
      const entity = this.entities.get(id);
      if (entity && "deselect" in entity) {
        (entity as BaseEntity).deselect();
      }
    }
    this.state.selection.selectedIds.clear();
    this.emit(EngineEventType.SELECTION_CLEARED, undefined);
    this.requestRender();
  }

  selectByBox(start: IVec2, end: IVec2, mode: SelectionMode): void {
    const box: BoundingBox = {
      min: new Vec2(Math.min(start.x, end.x), Math.min(start.y, end.y)),
      max: new Vec2(Math.max(start.x, end.x), Math.max(start.y, end.y)),
    };

    const toSelect: string[] = [];

    for (const entity of this.getVisibleEntities()) {
      const entityBounds = entity.getBounds();

      if (mode === SelectionMode.WINDOW) {
        // Phải nằm hoàn toàn trong box
        if (
          entityBounds.min.x >= box.min.x &&
          entityBounds.min.y >= box.min.y &&
          entityBounds.max.x <= box.max.x &&
          entityBounds.max.y <= box.max.y
        ) {
          toSelect.push(entity.id);
        }
      } else {
        // Chỉ cần giao với box
        if (doBoundingBoxesIntersect(box, entityBounds)) {
          toSelect.push(entity.id);
        }
      }
    }

    this.select(toSelect, this.state.input.shiftKey);
  }

  // ==================== Hit Testing ====================

  hitTest(screenPoint: IVec2, tolerance: number = 5): HitTestResult {
    const worldPoint = this.screenToWorldPoint(screenPoint);
    const worldTolerance = tolerance / this.state.viewport.zoom;

    // Test từ trên xuống (entity mới nhất trước)
    const entities = this.getVisibleEntities().reverse();

    for (const entity of entities) {
      // Quick bounds check
      const bounds = entity.getBounds();
      const expandedBounds: BoundingBox = {
        min: new Vec2(
          bounds.min.x - worldTolerance,
          bounds.min.y - worldTolerance
        ),
        max: new Vec2(
          bounds.max.x + worldTolerance,
          bounds.max.y + worldTolerance
        ),
      };

      if (!isPointInBoundingBox(worldPoint, expandedBounds)) {
        continue;
      }

      // Detailed test
      if (entity.containsPoint(worldPoint, worldTolerance)) {
        return {
          hit: true,
          entity,
          point: worldPoint,
        };
      }
    }

    return { hit: false };
  }

  hitTestGrips(screenPoint: IVec2, tolerance: number = 8): GripPoint | null {
    const worldPoint = this.screenToWorldPoint(screenPoint);
    const worldTolerance = tolerance / this.state.viewport.zoom;

    for (const entity of this.getSelectedEntities()) {
      if ("getGripPoints" in entity) {
        const grips = (entity as BaseEntity).getGripPoints();
        for (const grip of grips) {
          const dist = Vec2.from(grip.position).distanceTo(worldPoint);
          if (dist <= worldTolerance) {
            return grip;
          }
        }
      }
    }

    return null;
  }

  // ==================== Hover ====================

  setHover(entityId: string | null): void {
    if (this.state.selection.hoveredId === entityId) return;

    const previousId = this.state.selection.hoveredId;

    // Unhover previous
    if (previousId) {
      const prev = this.entities.get(previousId);
      if (prev && "unhover" in prev) {
        (prev as BaseEntity).unhover();
      }
    }

    // Hover new
    if (entityId) {
      const entity = this.entities.get(entityId);
      if (entity && "hover" in entity) {
        (entity as BaseEntity).hover();
      }
    }

    this.state.selection.hoveredId = entityId;
    this.emit(EngineEventType.HOVER_CHANGED, { entityId, previousId });
    this.requestRender();
  }

  // ==================== Drawing State ====================

  startDrawing(): void {
    this.state.drawing.isDrawing = true;
    this.state.drawing.points = [];
    this.state.drawing.preview = null;
    this.emit(EngineEventType.DRAWING_START, {
      points: [],
      preview: null,
      tool: this.state.tool,
    });
  }

  addDrawingPoint(point: IVec2): void {
    this.state.drawing.points.push(Vec2.from(point));
    this.emit(EngineEventType.DRAWING_UPDATE, {
      points: this.state.drawing.points.map((p) => p.toObject()),
      preview: this.state.drawing.preview,
      tool: this.state.tool,
    });
    this.requestRender();
  }

  updatePreview(entity: IEntity | null): void {
    this.state.drawing.preview = entity;
    this.requestRender();
  }

  completeDrawing(): IEntity | null {
    const preview = this.state.drawing.preview;

    if (preview) {
      this.addEntity(preview);
    }

    this.emit(EngineEventType.DRAWING_COMPLETE, {
      points: this.state.drawing.points.map((p) => p.toObject()),
      preview,
      tool: this.state.tool,
    });

    this.state.drawing.isDrawing = false;
    this.state.drawing.points = [];
    this.state.drawing.preview = null;
    this.requestRender();

    return preview;
  }

  cancelDrawing(): void {
    this.state.drawing.isDrawing = false;
    this.state.drawing.points = [];
    this.state.drawing.preview = null;
    this.emit(EngineEventType.DRAWING_CANCEL, undefined);
    this.requestRender();
  }

  getDrawingPoints(): Vec2[] {
    return this.state.drawing.points;
  }

  // ==================== Current Style ====================

  getCurrentStyle(): EntityStyle {
    return { ...this.currentStyle };
  }

  setCurrentStyle(style: Partial<EntityStyle>): void {
    Object.assign(this.currentStyle, style);
  }

  // ==================== Layers ====================

  getActiveLayerId(): string {
    return this.activeLayerId;
  }

  setActiveLayer(layerId: string): void {
    if (this.layers.has(layerId)) {
      const previousId = this.activeLayerId;
      this.activeLayerId = layerId;
      this.emit(EngineEventType.LAYER_ACTIVE_CHANGED, { layerId, previousId });
    }
  }

  // ==================== Render Request ====================

  private renderRequested = false;

  requestRender(): void {
    if (!this.renderRequested) {
      this.renderRequested = true;
      requestAnimationFrame(() => {
        this.renderRequested = false;
        this.emit(EngineEventType.RENDER_REQUEST, undefined);
      });
    }
  }

  // ==================== ĐIỀU KIỆN 1: Document Access ====================

  /**
   * Get the document - source of truth for all data
   * ĐIỀU KIỆN 1: Mọi thay đổi phải đi qua Document
   */
  getDocument(): CadDocument {
    return this.document;
  }

  /**
   * Set document (for loading/creating new document)
   */
  setDocument(doc: CadDocument): void {
    this.document = doc;
    // Sync local entities cache
    this.entities.clear();
    for (const entity of doc.getAllEntities()) {
      this.entities.set(entity.id, entity);
    }
    this.emit(EngineEventType.DOCUMENT_MODIFIED, undefined);
    this.requestRender();
  }

  // ==================== ĐIỀU KIỆN 1: Command Execution ====================

  /**
   * Convert IEntity to CanvasEntity format for UI rendering
   * This bridges the gap between core entities and canvas entities
   */
  private convertToCanvasEntity(entity: IEntity): CanvasEntity | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = entity as any;

    // Map EntityType to canvas type string
    // Based on Entity.types.ts: LINE, RECT, CIRCLE, ARC, ELLIPSE, POLYLINE, TEXT, DIMENSION, BLOCK_REF, GROUP, IMAGE, HATCH
    const typeMap: Record<EntityType, CanvasEntity["type"]> = {
      [EntityType.LINE]: "line",
      [EntityType.POLYLINE]: "polyline",
      [EntityType.RECT]: "rect",
      [EntityType.CIRCLE]: "circle",
      [EntityType.ARC]: "arc",
      [EntityType.ELLIPSE]: "ellipse",
      [EntityType.TEXT]: "text",
      [EntityType.HATCH]: "polyline",
      [EntityType.DIMENSION]: "line",
      [EntityType.BLOCK_REF]: "line",
      [EntityType.IMAGE]: "rect",
      [EntityType.GROUP]: "line",
    };

    // Get points from entity based on type
    let points: { x: number; y: number }[] = [];

    // Handle specific entity types
    switch (entity.type) {
      case EntityType.LINE:
        if (e.start && e.end) {
          points = [
            { x: e.start.x, y: e.start.y },
            { x: e.end.x, y: e.end.y },
          ];
        }
        break;

      case EntityType.RECT:
        // RectEntity has origin, width, height - use 2 opposite corners for CadDrawingCanvas
        // CadDrawingCanvas expects points[0] = origin, points[1] = opposite corner
        if (e.origin && e.width !== undefined && e.height !== undefined) {
          const ox = e.origin.x;
          const oy = e.origin.y;
          points = [
            { x: ox, y: oy },
            { x: ox + e.width, y: oy + e.height },
          ];
        }
        break;

      case EntityType.CIRCLE:
        // CircleEntity has center, radius
        if (e.center && e.radius !== undefined) {
          points = [
            { x: e.center.x, y: e.center.y },
            { x: e.radius, y: 0 }, // radius stored in x
          ];
        }
        break;

      case EntityType.ARC:
        // ArcEntity has center, radius, startAngle, endAngle
        if (e.center && e.radius !== undefined) {
          points = [
            { x: e.center.x, y: e.center.y },
            { x: e.radius, y: 0 },
          ];
        }
        break;

      case EntityType.ELLIPSE:
        // EllipseEntity has center, radiusX, radiusY, rotation
        if (e.center) {
          points = [
            { x: e.center.x, y: e.center.y },
            { x: e.radiusX || 0, y: e.radiusY || 0 },
          ];
        }
        break;

      case EntityType.TEXT:
        if (e.position) {
          points = [{ x: e.position.x, y: e.position.y }];
        }
        break;

      case EntityType.POLYLINE:
        if (typeof e.getPoints === "function") {
          points = e.getPoints();
        } else if (e.points) {
          points = e.points;
        }
        break;

      default:
        // Generic fallback
        if (typeof e.getPoints === "function") {
          points = e.getPoints();
        } else if (e.points) {
          points = e.points;
        }
        break;
    }

    // Build base canvas entity
    const canvasEntity: CanvasEntity = {
      id: entity.id,
      type: typeMap[entity.type] || "line",
      points,
      color: entity.style?.strokeColor || "#FFFFFF",
      lineWidth: entity.style?.strokeWidth || 1,
      strokeStyle:
        (entity.style?.strokeStyle as
          | "solid"
          | "dashed"
          | "dotted"
          | "dashdot") || "solid",
      fillColor: entity.style?.fillColor || null,
      fillOpacity: entity.style?.opacity ?? 0.5,
      opacity: entity.style?.opacity ?? 1,
      layer: entity.layerId,
    };

    // Add type-specific properties
    if (entity.type === EntityType.ARC) {
      canvasEntity.startAngle = e.startAngle;
      canvasEntity.endAngle = e.endAngle;
    }

    if (entity.type === EntityType.ELLIPSE) {
      canvasEntity.radiusX = e.radiusX;
      canvasEntity.radiusY = e.radiusY;
      canvasEntity.rotation = e.rotation;
    }

    if (entity.type === EntityType.TEXT) {
      canvasEntity.text = e.content || e.text || "";
      canvasEntity.fontSize = e.fontSize;
      canvasEntity.fontFamily = e.fontFamily;
    }

    return canvasEntity;
  }

  /**
   * Execute a command with proper context
   * ĐIỀU KIỆN 1: UI → CadEngine.executeCommand() → Document → History
   */
  executeCommand(command: ICommand): CommandResult {
    // IMPORTANT: Include document in context for DimensionCommands
    const context: CommandContext & { document: CadDocument } = {
      engine: this,
      points: [],
      options: {},
      style: this.currentStyle,
      layerId: this.activeLayerId,
      document: this.document, // ĐIỀU KIỆN 1: Required for dimension commands
    };

    // Execute command
    const result = command.execute(context);

    if (result.success) {
      // Add created entities to document (both IEntity and CanvasEntity)
      if (result.entities && result.entities.length > 0) {
        for (const entity of result.entities) {
          // Add to IEntity storage
          this.document.addEntity(entity);
          this.addEntity(entity);

          // Also add to CanvasEntity storage for UI rendering
          const canvasEntity = this.convertToCanvasEntity(entity);
          if (canvasEntity) {
            this.document.addCanvasEntity(canvasEntity);
          }
        }
      }

      // Add to history for undo/redo
      this.document.history.push(command, context, result);
      this.emit(EngineEventType.DOCUMENT_MODIFIED, undefined);
      this.requestRender();
    }

    return result;
  }

  /**
   * Execute an interactive command with provided context (for drawing tools)
   * ĐIỀU KIỆN 1: UI → CadEngine.executeInteractiveCommand() → Document → History
   *
   * This method is used when the UI has already collected points and needs to
   * execute the command with those points (e.g., LINE, RECT, CIRCLE).
   */
  executeInteractiveCommand(
    command: ICommand,
    providedContext: Partial<CommandContext>
  ): CommandResult {
    // Merge provided context with engine defaults
    const context: CommandContext & { document: CadDocument } = {
      engine: this,
      points: providedContext.points || [],
      options: providedContext.options || {},
      style: providedContext.style || this.currentStyle,
      layerId: providedContext.layerId || this.activeLayerId,
      document: this.document,
    };

    // Execute command
    const result = command.execute(context);

    if (result.success) {
      // Add created entities to document (both IEntity and CanvasEntity)
      if (result.entities && result.entities.length > 0) {
        for (const entity of result.entities) {
          // Add to IEntity storage
          this.document.addEntity(entity);
          this.addEntity(entity);

          // Also add to CanvasEntity storage for UI rendering
          const canvasEntity = this.convertToCanvasEntity(entity);

          if (canvasEntity) {
            this.document.addCanvasEntity(canvasEntity);
          }
        }
      }

      // Add to history for undo/redo
      this.document.history.push(command, context, result);
      this.emit(EngineEventType.DOCUMENT_MODIFIED, undefined);
      this.requestRender();
    }

    return result;
  }

  /**
   * Undo last command
   * History.undo() đã tự gọi command.undo() rồi
   */
  undo(): boolean {
    const success = this.document.history.undo();
    if (success) {
      this.emit(EngineEventType.DOCUMENT_MODIFIED, undefined);
      this.requestRender();
    }
    return success;
  }

  /**
   * Redo last undone command
   * History.redo() đã tự gọi command.redo() rồi
   */
  redo(): boolean {
    const success = this.document.history.redo();
    if (success) {
      this.emit(EngineEventType.DOCUMENT_MODIFIED, undefined);
      this.requestRender();
    }
    return success;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.document.history.canUndo();
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.document.history.canRedo();
  }

  // ==================== Serialization ====================

  toJSON(): object {
    return {
      entities: this.getAllEntities().map((e) => e.toJSON()),
      layers: Array.from(this.layers.values()),
      activeLayerId: this.activeLayerId,
      viewport: {
        center: this.state.viewport.center.toObject(),
        zoom: this.state.viewport.zoom,
      },
    };
  }
}

// ==================== Layer Info ====================

interface LayerInfo {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
}

// ==================== Singleton Export ====================

let engineInstance: CadEngine | null = null;

export function getCadEngine(): CadEngine {
  if (!engineInstance) {
    engineInstance = new CadEngine();
  }
  return engineInstance;
}

export function createCadEngine(): CadEngine {
  return new CadEngine();
}
