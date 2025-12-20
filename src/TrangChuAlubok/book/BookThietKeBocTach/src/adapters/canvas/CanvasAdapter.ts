/**
 * Canvas Adapter Interface
 * Abstract interface for canvas rendering implementations
 */

import { Vec2, IVec2 } from "../../core/geometry/Vec2";
import { Matrix3 } from "../../core/geometry/Matrix3";
import { LineEntity } from "../../core/entities/Line";
import { RectEntity } from "../../core/entities/Rect";
import { CircleEntity } from "../../core/entities/Circle";
import { ArcEntity } from "../../core/entities/Arc";
import { PolylineEntity } from "../../core/entities/Polyline";
import { TextEntity } from "../../core/entities/Text";
import { DimensionEntity } from "../../core/entities/Dimension";
import { ViewportState } from "../../core/engine/EngineState";

// Local Entity type union
type Entity =
  | LineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity
  | PolylineEntity
  | TextEntity
  | DimensionEntity;

// ===== Render Styles =====
export interface StrokeStyle {
  color: string;
  width: number;
  dashArray?: number[];
  lineCap?: "butt" | "round" | "square";
  lineJoin?: "miter" | "round" | "bevel";
  opacity?: number;
}

export interface FillStyle {
  color: string;
  opacity?: number;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight?: "normal" | "bold" | "lighter" | number;
  fontStyle?: "normal" | "italic";
  color: string;
  textAlign?: "left" | "center" | "right";
  verticalAlign?: "top" | "middle" | "bottom";
}

// ===== Render Options =====
export interface RenderOptions {
  stroke?: StrokeStyle;
  fill?: FillStyle;
  text?: TextStyle;
  selectable?: boolean;
  visible?: boolean;
  opacity?: number;
}

// ===== Canvas Events =====
export interface CanvasPointerEvent {
  position: Vec2; // Screen position
  worldPosition: Vec2; // World position after viewport transform
  button: "left" | "middle" | "right";
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

export interface CanvasWheelEvent {
  position: Vec2;
  worldPosition: Vec2;
  deltaY: number;
  shiftKey: boolean;
  ctrlKey: boolean;
}

export interface CanvasKeyEvent {
  key: string;
  code: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}

// ===== Event Handlers =====
export type PointerEventHandler = (event: CanvasPointerEvent) => void;
export type WheelEventHandler = (event: CanvasWheelEvent) => void;
export type KeyEventHandler = (event: CanvasKeyEvent) => void;

// ===== Rendered Object Reference =====
export interface RenderedObject {
  id: string;
  entityId?: string;
  type: string;
  bounds: { min: IVec2; max: IVec2 };
  data?: unknown;
}

// ===== Canvas Adapter Interface =====
export interface ICanvasAdapter {
  // === Initialization ===
  initialize(container: HTMLElement): void;
  dispose(): void;
  resize(width: number, height: number): void;

  // === Viewport ===
  setViewport(viewport: ViewportState): void;
  getViewport(): ViewportState;
  pan(delta: Vec2): void;
  zoom(factor: number, center?: Vec2): void;
  zoomToFit(padding?: number): void;
  screenToWorld(screenPos: Vec2): Vec2;
  worldToScreen(worldPos: Vec2): Vec2;

  // === Entity Rendering ===
  renderEntity(entity: Entity, options?: RenderOptions): RenderedObject;
  renderEntities(entities: Entity[], options?: RenderOptions): RenderedObject[];
  updateEntity(entityId: string, entity: Entity, options?: RenderOptions): void;
  removeEntity(entityId: string): void;
  clearEntities(): void;

  // === Primitive Drawing ===
  drawLine(start: Vec2, end: Vec2, style?: StrokeStyle): RenderedObject;
  drawRect(
    position: Vec2,
    width: number,
    height: number,
    style?: RenderOptions
  ): RenderedObject;
  drawCircle(
    center: Vec2,
    radius: number,
    style?: RenderOptions
  ): RenderedObject;
  drawArc(
    center: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: StrokeStyle
  ): RenderedObject;
  drawPolyline(
    points: Vec2[],
    closed: boolean,
    style?: RenderOptions
  ): RenderedObject;
  drawText(position: Vec2, text: string, style?: TextStyle): RenderedObject;
  drawPath(pathData: string, style?: RenderOptions): RenderedObject;

  // === Grid ===
  showGrid(spacing: number, majorEvery?: number): void;
  hideGrid(): void;
  setGridStyle(minor?: StrokeStyle, major?: StrokeStyle): void;

  // === Selection Visual ===
  showSelectionBox(start: Vec2, end: Vec2): void;
  hideSelectionBox(): void;
  highlightEntity(entityId: string, color?: string): void;
  unhighlightEntity(entityId: string): void;
  showHandles(entityId: string, handles: Vec2[]): void;
  hideHandles(entityId: string): void;

  // === Crosshair / Cursor ===
  showCrosshair(position: Vec2): void;
  hideCrosshair(): void;
  setCursor(cursor: string): void;

  // === Snap Indicators ===
  showSnapIndicator(position: Vec2, type: string): void;
  hideSnapIndicator(): void;

  // === Temporary / Preview ===
  drawPreview(entity: Entity, options?: RenderOptions): void;
  clearPreview(): void;
  drawRubberBand(start: Vec2, end: Vec2): void;
  clearRubberBand(): void;

  // === Layers ===
  setLayerVisibility(layerId: string, visible: boolean): void;
  setLayerLock(layerId: string, locked: boolean): void;

  // === Events ===
  onPointerDown(handler: PointerEventHandler): void;
  onPointerMove(handler: PointerEventHandler): void;
  onPointerUp(handler: PointerEventHandler): void;
  onWheel(handler: WheelEventHandler): void;
  onKeyDown(handler: KeyEventHandler): void;
  onKeyUp(handler: KeyEventHandler): void;
  offPointerDown(handler: PointerEventHandler): void;
  offPointerMove(handler: PointerEventHandler): void;
  offPointerUp(handler: PointerEventHandler): void;
  offWheel(handler: WheelEventHandler): void;
  offKeyDown(handler: KeyEventHandler): void;
  offKeyUp(handler: KeyEventHandler): void;

  // === Query ===
  getObjectAtPoint(point: Vec2): RenderedObject | null;
  getObjectsInRect(rect: { min: Vec2; max: Vec2 }): RenderedObject[];
  getAllObjects(): RenderedObject[];

  // === Export ===
  toDataURL(format?: "png" | "jpeg" | "webp", quality?: number): string;
  toSVG(): string;
  toJSON(): object;
}

// ===== Abstract Base Class =====
export abstract class BaseCanvasAdapter implements ICanvasAdapter {
  protected container: HTMLElement | null = null;
  protected viewport: ViewportState = {
    center: new Vec2(0, 0),
    zoom: 1,
    rotation: 0,
    width: 0,
    height: 0,
  };
  protected panOffset = new Vec2(0, 0);
  protected width = 0;
  protected height = 0;

  // Event handler storage
  protected pointerDownHandlers: Set<PointerEventHandler> = new Set();
  protected pointerMoveHandlers: Set<PointerEventHandler> = new Set();
  protected pointerUpHandlers: Set<PointerEventHandler> = new Set();
  protected wheelHandlers: Set<WheelEventHandler> = new Set();
  protected keyDownHandlers: Set<KeyEventHandler> = new Set();
  protected keyUpHandlers: Set<KeyEventHandler> = new Set();

  // === Initialization ===
  abstract initialize(container: HTMLElement): void;
  abstract dispose(): void;
  abstract resize(width: number, height: number): void;

  // === Viewport ===
  setViewport(viewport: ViewportState): void {
    this.viewport = { ...viewport };
    this.updateViewport();
  }

  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  pan(delta: Vec2): void {
    this.panOffset = this.panOffset.add(delta);
    this.updateViewport();
  }

  zoom(factor: number, center?: Vec2): void {
    const zoomCenter = center ?? new Vec2(this.width / 2, this.height / 2);

    // Zoom towards the center point
    const worldCenter = this.screenToWorld(zoomCenter);
    this.viewport.zoom *= factor;

    // Clamp zoom level
    this.viewport.zoom = Math.max(0.0001, Math.min(100000, this.viewport.zoom));

    // Adjust pan to keep center point fixed
    const newWorldCenter = this.screenToWorld(zoomCenter);
    const diff = newWorldCenter.sub(worldCenter);
    this.panOffset = this.panOffset.add(diff.mul(this.viewport.zoom));

    this.updateViewport();
  }

  abstract zoomToFit(padding?: number): void;

  screenToWorld(screenPos: Vec2): Vec2 {
    return new Vec2(
      (screenPos.x - this.width / 2 - this.panOffset.x) / this.viewport.zoom,
      (this.height / 2 - screenPos.y + this.panOffset.y) / this.viewport.zoom
    );
  }

  worldToScreen(worldPos: Vec2): Vec2 {
    return new Vec2(
      worldPos.x * this.viewport.zoom + this.width / 2 + this.panOffset.x,
      this.height / 2 - worldPos.y * this.viewport.zoom + this.panOffset.y
    );
  }

  protected abstract updateViewport(): void;

  // === Entity Rendering ===
  abstract renderEntity(
    entity: Entity,
    options?: RenderOptions
  ): RenderedObject;
  abstract renderEntities(
    entities: Entity[],
    options?: RenderOptions
  ): RenderedObject[];
  abstract updateEntity(
    entityId: string,
    entity: Entity,
    options?: RenderOptions
  ): void;
  abstract removeEntity(entityId: string): void;
  abstract clearEntities(): void;

  // === Primitive Drawing ===
  abstract drawLine(
    start: Vec2,
    end: Vec2,
    style?: StrokeStyle
  ): RenderedObject;
  abstract drawRect(
    position: Vec2,
    width: number,
    height: number,
    style?: RenderOptions
  ): RenderedObject;
  abstract drawCircle(
    center: Vec2,
    radius: number,
    style?: RenderOptions
  ): RenderedObject;
  abstract drawArc(
    center: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: StrokeStyle
  ): RenderedObject;
  abstract drawPolyline(
    points: Vec2[],
    closed: boolean,
    style?: RenderOptions
  ): RenderedObject;
  abstract drawText(
    position: Vec2,
    text: string,
    style?: TextStyle
  ): RenderedObject;
  abstract drawPath(pathData: string, style?: RenderOptions): RenderedObject;

  // === Grid ===
  abstract showGrid(spacing: number, majorEvery?: number): void;
  abstract hideGrid(): void;
  abstract setGridStyle(minor?: StrokeStyle, major?: StrokeStyle): void;

  // === Selection Visual ===
  abstract showSelectionBox(start: Vec2, end: Vec2): void;
  abstract hideSelectionBox(): void;
  abstract highlightEntity(entityId: string, color?: string): void;
  abstract unhighlightEntity(entityId: string): void;
  abstract showHandles(entityId: string, handles: Vec2[]): void;
  abstract hideHandles(entityId: string): void;

  // === Crosshair / Cursor ===
  abstract showCrosshair(position: Vec2): void;
  abstract hideCrosshair(): void;

  setCursor(cursor: string): void {
    if (this.container) {
      this.container.style.cursor = cursor;
    }
  }

  // === Snap Indicators ===
  abstract showSnapIndicator(position: Vec2, type: string): void;
  abstract hideSnapIndicator(): void;

  // === Temporary / Preview ===
  abstract drawPreview(entity: Entity, options?: RenderOptions): void;
  abstract clearPreview(): void;
  abstract drawRubberBand(start: Vec2, end: Vec2): void;
  abstract clearRubberBand(): void;

  // === Layers ===
  abstract setLayerVisibility(layerId: string, visible: boolean): void;
  abstract setLayerLock(layerId: string, locked: boolean): void;

  // === Events ===
  onPointerDown(handler: PointerEventHandler): void {
    this.pointerDownHandlers.add(handler);
  }

  onPointerMove(handler: PointerEventHandler): void {
    this.pointerMoveHandlers.add(handler);
  }

  onPointerUp(handler: PointerEventHandler): void {
    this.pointerUpHandlers.add(handler);
  }

  onWheel(handler: WheelEventHandler): void {
    this.wheelHandlers.add(handler);
  }

  onKeyDown(handler: KeyEventHandler): void {
    this.keyDownHandlers.add(handler);
  }

  onKeyUp(handler: KeyEventHandler): void {
    this.keyUpHandlers.add(handler);
  }

  offPointerDown(handler: PointerEventHandler): void {
    this.pointerDownHandlers.delete(handler);
  }

  offPointerMove(handler: PointerEventHandler): void {
    this.pointerMoveHandlers.delete(handler);
  }

  offPointerUp(handler: PointerEventHandler): void {
    this.pointerUpHandlers.delete(handler);
  }

  offWheel(handler: WheelEventHandler): void {
    this.wheelHandlers.delete(handler);
  }

  offKeyDown(handler: KeyEventHandler): void {
    this.keyDownHandlers.delete(handler);
  }

  offKeyUp(handler: KeyEventHandler): void {
    this.keyUpHandlers.delete(handler);
  }

  protected emitPointerDown(event: CanvasPointerEvent): void {
    this.pointerDownHandlers.forEach((handler) => handler(event));
  }

  protected emitPointerMove(event: CanvasPointerEvent): void {
    this.pointerMoveHandlers.forEach((handler) => handler(event));
  }

  protected emitPointerUp(event: CanvasPointerEvent): void {
    this.pointerUpHandlers.forEach((handler) => handler(event));
  }

  protected emitWheel(event: CanvasWheelEvent): void {
    this.wheelHandlers.forEach((handler) => handler(event));
  }

  protected emitKeyDown(event: CanvasKeyEvent): void {
    this.keyDownHandlers.forEach((handler) => handler(event));
  }

  protected emitKeyUp(event: CanvasKeyEvent): void {
    this.keyUpHandlers.forEach((handler) => handler(event));
  }

  // === Query ===
  abstract getObjectAtPoint(point: Vec2): RenderedObject | null;
  abstract getObjectsInRect(rect: { min: Vec2; max: Vec2 }): RenderedObject[];
  abstract getAllObjects(): RenderedObject[];

  // === Export ===
  abstract toDataURL(
    format?: "png" | "jpeg" | "webp",
    quality?: number
  ): string;
  abstract toSVG(): string;
  abstract toJSON(): object;

  // === Utility Methods ===
  protected getTransformMatrix(): Matrix3 {
    return Matrix3.translation(
      this.width / 2 + this.panOffset.x,
      this.height / 2 + this.panOffset.y
    )
      .multiply(Matrix3.rotation(this.viewport.rotation))
      .multiply(Matrix3.scaling(this.viewport.zoom, -this.viewport.zoom)); // Flip Y axis
  }

  protected createPointerEvent(e: MouseEvent): CanvasPointerEvent {
    const rect = this.container?.getBoundingClientRect();
    const screenPos = new Vec2(
      e.clientX - (rect?.left ?? 0),
      e.clientY - (rect?.top ?? 0)
    );

    let button: "left" | "middle" | "right" = "left";
    if (e.button === 1) button = "middle";
    else if (e.button === 2) button = "right";

    return {
      position: screenPos,
      worldPosition: this.screenToWorld(screenPos),
      button,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
    };
  }

  protected createWheelEvent(e: WheelEvent): CanvasWheelEvent {
    const rect = this.container?.getBoundingClientRect();
    const screenPos = new Vec2(
      e.clientX - (rect?.left ?? 0),
      e.clientY - (rect?.top ?? 0)
    );

    return {
      position: screenPos,
      worldPosition: this.screenToWorld(screenPos),
      deltaY: e.deltaY,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
    };
  }
}
