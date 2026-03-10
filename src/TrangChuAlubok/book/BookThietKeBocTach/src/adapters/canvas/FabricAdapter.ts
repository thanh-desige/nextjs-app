/**
 * FabricAdapter.ts
 *
 * Fabric.js Canvas Adapter — Thin facade (STEP-5.11)
 *
 * Delegates to extracted modules:
 * - FabricEntityFactory.ts: Entity → Fabric object factories
 * - FabricPrimitiveDrawer.ts: Standalone primitive drawing API
 * - FabricOverlayManager.ts: Transient UI overlays (selection, handles, snap, etc.)
 * - FabricGridRenderer.ts: Grid rendering and configuration
 *
 * Keeps: Lifecycle, viewport, entity CRUD, layers, queries, export.
 */

import * as fabric from "fabric";
import { Vec2 } from "../../core/geometry/Vec2";
import {
  BaseCanvasAdapter,
  RenderOptions,
  RenderedObject,
  StrokeStyle,
  TextStyle,
} from "./CanvasAdapter";

// Extracted modules
import {
  createFabricObject,
  createRenderedObject,
  type Entity,
} from "./FabricEntityFactory";
import {
  drawLine as _drawLine,
  drawRect as _drawRect,
  drawCircle as _drawCircle,
  drawArc as _drawArc,
  drawPolyline as _drawPolyline,
  drawText as _drawText,
  drawPath as _drawPath,
} from "./FabricPrimitiveDrawer";
import {
  type OverlayState,
  createOverlayState,
  showSelectionBox as _showSelectionBox,
  hideSelectionBox as _hideSelectionBox,
  highlightEntity as _highlightEntity,
  unhighlightEntity as _unhighlightEntity,
  showHandles as _showHandles,
  hideHandles as _hideHandles,
  showCrosshair as _showCrosshair,
  hideCrosshair as _hideCrosshair,
  showSnapIndicator as _showSnapIndicator,
  hideSnapIndicator as _hideSnapIndicator,
  drawPreview as _drawPreview,
  clearPreview as _clearPreview,
  drawRubberBand as _drawRubberBand,
  clearRubberBand as _clearRubberBand,
} from "./FabricOverlayManager";
import {
  type GridState,
  createGridState,
  showGrid as _showGrid,
  hideGrid as _hideGrid,
  setGridStyle as _setGridStyle,
  updateGrid as _updateGrid,
} from "./FabricGridRenderer";

// ===== FabricAdapter Implementation =====
export class FabricAdapter extends BaseCanvasAdapter {
  private canvas: fabric.Canvas | null = null;
  private entityMap: Map<string, fabric.FabricObject> = new Map();
  private layerGroups: Map<string, fabric.Group> = new Map();
  protected override panOffset = new Vec2(0, 0);

  // Extracted state
  private overlayState: OverlayState = createOverlayState();
  private gridState: GridState = createGridState();

  // ============================================
  // LIFECYCLE
  // ============================================

  initialize(container: HTMLElement): void {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    const canvasElement = document.createElement("canvas");
    canvasElement.width = this.width;
    canvasElement.height = this.height;
    container.appendChild(canvasElement);

    this.canvas = new fabric.Canvas(canvasElement, {
      width: this.width,
      height: this.height,
      backgroundColor: "#1E1E1E",
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      stopContextMenu: true,
      fireRightClick: true,
      fireMiddleClick: true,
    });

    this.canvas.selection = false;
    this.setupEventListeners();
  }

  dispose(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    this.entityMap.clear();
    this.layerGroups.clear();
    this.overlayState.handleGroups.clear();
    this.container = null;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    if (this.canvas) {
      this.canvas.setDimensions({ width, height });
      this.updateViewport();
      this.canvas.requestRenderAll();
    }
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  private setupEventListeners(): void {
    if (!this.canvas) return;

    this.canvas.on("mouse:down", (e) => {
      const pointer = this.canvas!.getViewportPoint(e.e);
      const screenPos = new Vec2(pointer.x, pointer.y);

      let button: "left" | "middle" | "right" = "left";
      const evt = e.e as MouseEvent;
      if (evt.button === 1) button = "middle";
      else if (evt.button === 2) button = "right";

      this.emitPointerDown({
        position: screenPos,
        worldPosition: this.screenToWorld(screenPos),
        button,
        shiftKey: e.e.shiftKey,
        ctrlKey: e.e.ctrlKey,
        altKey: e.e.altKey,
      });
    });

    this.canvas.on("mouse:move", (e) => {
      const pointer = this.canvas!.getViewportPoint(e.e);
      const screenPos = new Vec2(pointer.x, pointer.y);

      this.emitPointerMove({
        position: screenPos,
        worldPosition: this.screenToWorld(screenPos),
        button: "left",
        shiftKey: e.e.shiftKey,
        ctrlKey: e.e.ctrlKey,
        altKey: e.e.altKey,
      });
    });

    this.canvas.on("mouse:up", (e) => {
      const pointer = this.canvas!.getViewportPoint(e.e);
      const screenPos = new Vec2(pointer.x, pointer.y);

      let button: "left" | "middle" | "right" = "left";
      const evtUp = e.e as MouseEvent;
      if (evtUp.button === 1) button = "middle";
      else if (evtUp.button === 2) button = "right";

      this.emitPointerUp({
        position: screenPos,
        worldPosition: this.screenToWorld(screenPos),
        button,
        shiftKey: e.e.shiftKey,
        ctrlKey: e.e.ctrlKey,
        altKey: e.e.altKey,
      });
    });

    this.canvas.on("mouse:wheel", (e) => {
      e.e.preventDefault();
      const pointer = this.canvas!.getViewportPoint(e.e);
      const screenPos = new Vec2(pointer.x, pointer.y);

      this.emitWheel({
        position: screenPos,
        worldPosition: this.screenToWorld(screenPos),
        deltaY: e.e.deltaY,
        shiftKey: e.e.shiftKey,
        ctrlKey: e.e.ctrlKey,
      });
    });

    if (this.container) {
      this.container.tabIndex = 0;

      this.container.addEventListener("keydown", (e) => {
        this.emitKeyDown({
          key: e.key,
          code: e.code,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
        });
      });

      this.container.addEventListener("keyup", (e) => {
        this.emitKeyUp({
          key: e.key,
          code: e.code,
          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
        });
      });
    }
  }

  // ============================================
  // VIEWPORT
  // ============================================

  protected updateViewport(): void {
    if (!this.canvas) return;

    const vpt = this.canvas.viewportTransform;
    if (vpt) {
      vpt[0] = this.viewport.zoom;
      vpt[3] = -this.viewport.zoom;
      vpt[4] = this.width / 2 + this.panOffset.x;
      vpt[5] = this.height / 2 + this.panOffset.y;
    }

    if (this.gridState.config.visible) {
      _updateGrid(
        this.canvas,
        this.gridState,
        this.screenToWorld.bind(this),
        this.width,
        this.height,
      );
    }

    this.canvas.requestRenderAll();
  }

  zoomToFit(padding = 50): void {
    if (!this.canvas) return;

    const objects = this.canvas
      .getObjects()
      .filter(
        (obj) =>
          obj !== this.gridState.group &&
          !this.overlayState.previewObjects.includes(obj),
      );

    if (objects.length === 0) return;

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const entity of this.entityMap.values()) {
      const bounds = entity.getBoundingRect();
      minX = Math.min(minX, bounds.left);
      minY = Math.min(minY, bounds.top);
      maxX = Math.max(maxX, bounds.left + bounds.width);
      maxY = Math.max(maxY, bounds.top + bounds.height);
    }

    if (!isFinite(minX)) return;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const availableWidth = this.width - 2 * padding;
    const availableHeight = this.height - 2 * padding;

    const zoomX = availableWidth / contentWidth;
    const zoomY = availableHeight / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 100000);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.viewport.zoom = newZoom;
    this.panOffset = new Vec2(-centerX * newZoom, centerY * newZoom);

    this.updateViewport();
  }

  // ============================================
  // ENTITY CRUD — delegates to FabricEntityFactory
  // ============================================

  renderEntity(entity: Entity, options?: RenderOptions): RenderedObject {
    const fabricObj = createFabricObject(entity, options);

    if (fabricObj && this.canvas) {
      fabricObj.set("data", { entityId: entity.id });
      this.entityMap.set(entity.id, fabricObj);
      this.canvas.add(fabricObj);
      this.canvas.requestRenderAll();
    }

    return createRenderedObject(entity.id, entity, fabricObj);
  }

  renderEntities(
    entities: Entity[],
    options?: RenderOptions,
  ): RenderedObject[] {
    const results: RenderedObject[] = [];
    for (const entity of entities) {
      results.push(this.renderEntity(entity, options));
    }
    return results;
  }

  updateEntity(
    entityId: string,
    entity: Entity,
    options?: RenderOptions,
  ): void {
    const existing = this.entityMap.get(entityId);

    if (existing && this.canvas) {
      this.canvas.remove(existing);
      this.entityMap.delete(entityId);
    }

    this.renderEntity(entity, options);
  }

  removeEntity(entityId: string): void {
    const obj = this.entityMap.get(entityId);

    if (obj && this.canvas) {
      this.canvas.remove(obj);
      this.entityMap.delete(entityId);
      this.canvas.requestRenderAll();
    }
  }

  clearEntities(): void {
    if (!this.canvas) return;

    for (const obj of this.entityMap.values()) {
      this.canvas.remove(obj);
    }

    this.entityMap.clear();
    this.canvas.requestRenderAll();
  }

  // ============================================
  // PRIMITIVE DRAWING — delegates to FabricPrimitiveDrawer
  // ============================================

  drawLine(start: Vec2, end: Vec2, style?: StrokeStyle): RenderedObject {
    if (!this.canvas) return { id: "", type: "line", bounds: { min: start, max: end } };
    return _drawLine(this.canvas, start, end, style);
  }

  drawRect(
    position: Vec2,
    width: number,
    height: number,
    style?: RenderOptions,
  ): RenderedObject {
    if (!this.canvas) return { id: "", type: "rect", bounds: { min: position, max: { x: position.x + width, y: position.y + height } } };
    return _drawRect(this.canvas, position, width, height, style);
  }

  drawCircle(
    center: Vec2,
    radius: number,
    style?: RenderOptions,
  ): RenderedObject {
    if (!this.canvas) return { id: "", type: "circle", bounds: { min: { x: center.x - radius, y: center.y - radius }, max: { x: center.x + radius, y: center.y + radius } } };
    return _drawCircle(this.canvas, center, radius, style);
  }

  drawArc(
    center: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: StrokeStyle,
  ): RenderedObject {
    if (!this.canvas) return { id: "", type: "arc", bounds: { min: { x: center.x - radius, y: center.y - radius }, max: { x: center.x + radius, y: center.y + radius } } };
    return _drawArc(this.canvas, center, radius, startAngle, endAngle, style);
  }

  drawPolyline(
    points: Vec2[],
    closed: boolean,
    style?: RenderOptions,
  ): RenderedObject {
    if (!this.canvas) return { id: "", type: "polyline", bounds: { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } } };
    return _drawPolyline(this.canvas, points, closed, style);
  }

  drawText(position: Vec2, text: string, style?: TextStyle): RenderedObject {
    if (!this.canvas) return { id: "", type: "text", bounds: { min: position, max: position } };
    return _drawText(this.canvas, position, text, style);
  }

  drawPath(pathData: string, style?: RenderOptions): RenderedObject {
    if (!this.canvas) return { id: "", type: "path", bounds: { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } } };
    return _drawPath(this.canvas, pathData, style);
  }

  // ============================================
  // GRID — delegates to FabricGridRenderer
  // ============================================

  showGrid(spacing: number, majorEvery = 10): void {
    if (!this.canvas) return;
    _showGrid(
      this.canvas,
      this.gridState,
      spacing,
      majorEvery,
      this.screenToWorld.bind(this),
      this.width,
      this.height,
    );
  }

  hideGrid(): void {
    if (!this.canvas) return;
    _hideGrid(this.canvas, this.gridState);
  }

  setGridStyle(minor?: StrokeStyle, major?: StrokeStyle): void {
    if (!this.canvas) return;
    _setGridStyle(
      this.canvas,
      this.gridState,
      minor,
      major,
      this.screenToWorld.bind(this),
      this.width,
      this.height,
    );
  }

  // ============================================
  // OVERLAYS — delegates to FabricOverlayManager
  // ============================================

  showSelectionBox(start: Vec2, end: Vec2): void {
    if (!this.canvas) return;
    _showSelectionBox(this.canvas, this.overlayState, start, end);
  }

  hideSelectionBox(): void {
    if (!this.canvas) return;
    _hideSelectionBox(this.canvas, this.overlayState);
  }

  highlightEntity(entityId: string, color = "#ffff00"): void {
    if (!this.canvas) return;
    _highlightEntity(this.canvas, this.entityMap, entityId, color);
  }

  unhighlightEntity(entityId: string): void {
    if (!this.canvas) return;
    _unhighlightEntity(this.canvas, this.entityMap, entityId);
  }

  showHandles(entityId: string, handles: Vec2[]): void {
    if (!this.canvas) return;
    _showHandles(this.canvas, this.overlayState, entityId, handles);
  }

  hideHandles(entityId: string): void {
    if (!this.canvas) return;
    _hideHandles(this.canvas, this.overlayState, entityId);
  }

  showCrosshair(position: Vec2): void {
    if (!this.canvas) return;
    const screenPos = this.worldToScreen(position);
    _showCrosshair(this.canvas, this.overlayState, screenPos, this.width, this.height);
  }

  hideCrosshair(): void {
    if (!this.canvas) return;
    _hideCrosshair(this.canvas, this.overlayState);
  }

  showSnapIndicator(position: Vec2, type: string): void {
    if (!this.canvas) return;
    _showSnapIndicator(this.canvas, this.overlayState, position, type);
  }

  hideSnapIndicator(): void {
    if (!this.canvas) return;
    _hideSnapIndicator(this.canvas, this.overlayState);
  }

  drawPreview(entity: Entity, options?: RenderOptions): void {
    if (!this.canvas) return;
    _drawPreview(this.canvas, this.overlayState, entity, options);
  }

  clearPreview(): void {
    if (!this.canvas) return;
    _clearPreview(this.canvas, this.overlayState);
  }

  drawRubberBand(start: Vec2, end: Vec2): void {
    if (!this.canvas) return;
    _drawRubberBand(this.canvas, this.overlayState, start, end);
  }

  clearRubberBand(): void {
    if (!this.canvas) return;
    _clearRubberBand(this.canvas, this.overlayState);
  }

  // ============================================
  // LAYERS
  // ============================================

  setLayerVisibility(layerId: string, visible: boolean): void {
    const group = this.layerGroups.get(layerId);
    if (group) {
      group.set("visible", visible);
      this.canvas?.requestRenderAll();
    }
  }

  setLayerLock(layerId: string, locked: boolean): void {
    const group = this.layerGroups.get(layerId);
    if (group) {
      group.set("evented", !locked);
      group.set("selectable", !locked);
    }
  }

  // ============================================
  // SPATIAL QUERIES
  // ============================================

  getObjectAtPoint(point: Vec2): RenderedObject | null {
    if (!this.canvas) return null;

    const objects = this.canvas.getObjects();

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (
        obj === this.gridState.group ||
        this.overlayState.previewObjects.includes(obj)
      )
        continue;

      const bounds = obj.getBoundingRect();
      if (
        point.x >= bounds.left &&
        point.x <= bounds.left + bounds.width &&
        point.y >= bounds.top &&
        point.y <= bounds.top + bounds.height
      ) {
        const data = obj.get("data") as { entityId?: string } | undefined;
        return {
          id: data?.entityId ?? "",
          entityId: data?.entityId,
          type: "object",
          bounds: {
            min: { x: bounds.left, y: bounds.top },
            max: {
              x: bounds.left + bounds.width,
              y: bounds.top + bounds.height,
            },
          },
        };
      }
    }

    return null;
  }

  getObjectsInRect(rect: { min: Vec2; max: Vec2 }): RenderedObject[] {
    if (!this.canvas) return [];

    const results: RenderedObject[] = [];
    const objects = this.canvas.getObjects();

    for (const obj of objects) {
      if (
        obj === this.gridState.group ||
        this.overlayState.previewObjects.includes(obj)
      )
        continue;

      const bounds = obj.getBoundingRect();

      if (
        bounds.left >= rect.min.x &&
        bounds.left + bounds.width <= rect.max.x &&
        bounds.top >= rect.min.y &&
        bounds.top + bounds.height <= rect.max.y
      ) {
        const data = obj.get("data") as { entityId?: string } | undefined;
        results.push({
          id: data?.entityId ?? "",
          entityId: data?.entityId,
          type: "object",
          bounds: {
            min: { x: bounds.left, y: bounds.top },
            max: {
              x: bounds.left + bounds.width,
              y: bounds.top + bounds.height,
            },
          },
        });
      }
    }

    return results;
  }

  getAllObjects(): RenderedObject[] {
    const results: RenderedObject[] = [];

    for (const [entityId, obj] of this.entityMap) {
      const bounds = obj.getBoundingRect();
      results.push({
        id: entityId,
        entityId,
        type: "object",
        bounds: {
          min: { x: bounds.left, y: bounds.top },
          max: { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
        },
      });
    }

    return results;
  }

  // ============================================
  // EXPORT
  // ============================================

  toDataURL(format: "png" | "jpeg" | "webp" = "png", quality = 1): string {
    if (!this.canvas) return "";

    return this.canvas.toDataURL({
      format,
      quality,
      multiplier: 1,
    });
  }

  toSVG(): string {
    if (!this.canvas) return "";
    return this.canvas.toSVG();
  }

  toJSON(): object {
    if (!this.canvas) return {};
    return this.canvas.toJSON();
  }

  // ============================================
  // UTILITY
  // ============================================

  getCanvas(): fabric.Canvas | null {
    return this.canvas;
  }

  requestRender(): void {
    this.canvas?.requestRenderAll();
  }
}
