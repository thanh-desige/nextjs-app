/**
 * Fabric.js Canvas Adapter
 * Implements canvas rendering using Fabric.js library
 */

import * as fabric from "fabric";
import { Vec2 } from "../../core/geometry/Vec2";
import { EntityType } from "../../core/entities/Entity.types";
import { LineEntity } from "../../core/entities/Line";
import { RectEntity } from "../../core/entities/Rect";
import { CircleEntity } from "../../core/entities/Circle";
import { ArcEntity } from "../../core/entities/Arc";
import { PolylineEntity } from "../../core/entities/Polyline";
import { TextEntity } from "../../core/entities/Text";
import { DimensionEntity } from "../../core/entities/Dimension";

// Entity union type for this adapter
type Entity =
  | LineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity
  | PolylineEntity
  | TextEntity
  | DimensionEntity;
import {
  BaseCanvasAdapter,
  RenderOptions,
  RenderedObject,
  StrokeStyle,
  TextStyle,
} from "./CanvasAdapter";

// ===== Default Styles =====
const DEFAULT_STROKE: StrokeStyle = {
  color: "#ffffff",
  width: 1,
  lineCap: "round",
  lineJoin: "round",
  opacity: 1,
};

const DEFAULT_FILL = {
  color: "transparent",
  opacity: 0,
};

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "Arial",
  fontSize: 12,
  fontWeight: "normal",
  fontStyle: "normal",
  color: "#ffffff",
  textAlign: "left",
};

// ===== Grid Configuration =====
interface GridConfig {
  spacing: number;
  majorEvery: number;
  minorStyle: StrokeStyle;
  majorStyle: StrokeStyle;
  visible: boolean;
}

// ===== FabricAdapter Implementation =====
export class FabricAdapter extends BaseCanvasAdapter {
  private canvas: fabric.Canvas | null = null;
  private entityMap: Map<string, fabric.FabricObject> = new Map();
  private gridGroup: fabric.Group | null = null;
  private gridConfig: GridConfig = {
    spacing: 10,
    majorEvery: 10,
    minorStyle: { color: "#333333", width: 0.5 },
    majorStyle: { color: "#555555", width: 1 },
    visible: false,
  };

  private previewObjects: fabric.FabricObject[] = [];
  private selectionBox: fabric.Rect | null = null;
  private crosshairLines: [fabric.Line, fabric.Line] | null = null;
  private rubberBandLine: fabric.Line | null = null;
  private snapIndicator: fabric.Group | null = null;
  private handleGroups: Map<string, fabric.Group> = new Map();
  private layerGroups: Map<string, fabric.Group> = new Map();
  protected override panOffset = new Vec2(0, 0);

  // === Initialization ===
  initialize(container: HTMLElement): void {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // Create canvas element
    const canvasElement = document.createElement("canvas");
    canvasElement.width = this.width;
    canvasElement.height = this.height;
    container.appendChild(canvasElement);

    // Initialize Fabric.js canvas
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

    // Disable default Fabric.js selection for CAD control
    this.canvas.selection = false;

    // Set up event listeners
    this.setupEventListeners();
  }

  dispose(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    this.entityMap.clear();
    this.layerGroups.clear();
    this.handleGroups.clear();
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

  private setupEventListeners(): void {
    if (!this.canvas) return;

    // Mouse events
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

    // Keyboard events (on container)
    if (this.container) {
      this.container.tabIndex = 0; // Make focusable

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

  // === Viewport ===
  protected updateViewport(): void {
    if (!this.canvas) return;

    // Reset and apply viewport transform
    const vpt = this.canvas.viewportTransform;
    if (vpt) {
      vpt[0] = this.viewport.zoom; // scaleX
      vpt[3] = -this.viewport.zoom; // scaleY (flipped for CAD coordinate system)
      vpt[4] = this.width / 2 + this.panOffset.x; // translateX
      vpt[5] = this.height / 2 + this.panOffset.y; // translateY
    }

    // Update grid if visible
    if (this.gridConfig.visible) {
      this.updateGrid();
    }

    this.canvas.requestRenderAll();
  }

  zoomToFit(padding = 50): void {
    if (!this.canvas) return;

    const objects = this.canvas
      .getObjects()
      .filter(
        (obj) => obj !== this.gridGroup && !this.previewObjects.includes(obj)
      );

    if (objects.length === 0) return;

    // Calculate bounding box of all entities
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

  // === Entity Rendering ===
  renderEntity(entity: Entity, options?: RenderOptions): RenderedObject {
    const fabricObj = this.createFabricObject(entity, options);

    if (fabricObj && this.canvas) {
      fabricObj.set("data", { entityId: entity.id });
      this.entityMap.set(entity.id, fabricObj);
      this.canvas.add(fabricObj);
      this.canvas.requestRenderAll();
    }

    return this.createRenderedObject(entity.id, entity, fabricObj);
  }

  renderEntities(
    entities: Entity[],
    options?: RenderOptions
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
    options?: RenderOptions
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

  private createFabricObject(
    entity: Entity,
    options?: RenderOptions
  ): fabric.FabricObject | null {
    const entityColor =
      "style" in entity && entity.style?.strokeColor
        ? entity.style.strokeColor
        : "#ffffff";
    const stroke = options?.stroke ?? { ...DEFAULT_STROKE, color: entityColor };
    const fill = options?.fill ?? DEFAULT_FILL;

    switch (entity.type) {
      case EntityType.LINE:
        return this.createLineObject(entity as LineEntity, stroke);

      case EntityType.RECT:
        return this.createRectObject(entity as RectEntity, stroke, fill);

      case EntityType.CIRCLE:
        return this.createCircleObject(entity as CircleEntity, stroke, fill);

      case EntityType.ARC:
        return this.createArcObject(entity as ArcEntity, stroke);

      case EntityType.POLYLINE:
        return this.createPolylineObject(
          entity as PolylineEntity,
          stroke,
          fill
        );

      case EntityType.TEXT:
        return this.createTextObject(entity as TextEntity, options?.text);

      case EntityType.DIMENSION:
        return this.createDimensionObject(
          entity as DimensionEntity,
          stroke,
          options?.text
        );

      default:
        console.warn(
          `Unknown entity type: ${(entity as { type: string }).type}`
        );
        return null;
    }
  }

  private createLineObject(
    entity: LineEntity,
    stroke: StrokeStyle
  ): fabric.Line {
    return new fabric.Line(
      [entity.start.x, entity.start.y, entity.end.x, entity.end.y],
      {
        stroke: stroke.color,
        strokeWidth: stroke.width,
        strokeLineCap: stroke.lineCap,
        strokeLineJoin: stroke.lineJoin,
        strokeDashArray: stroke.dashArray,
        selectable: false,
        evented: false,
      }
    );
  }

  private createRectObject(
    entity: RectEntity,
    stroke: StrokeStyle,
    fill: { color: string; opacity?: number }
  ): fabric.Rect {
    return new fabric.Rect({
      left: entity.origin.x,
      top: entity.origin.y,
      width: entity.width,
      height: entity.height,
      angle: (entity.rotation * 180) / Math.PI,
      stroke: stroke.color,
      strokeWidth: stroke.width,
      fill: fill.color,
      opacity: fill.opacity ?? 1,
      selectable: false,
      evented: false,
    });
  }

  private createCircleObject(
    entity: CircleEntity,
    stroke: StrokeStyle,
    fill: { color: string; opacity?: number }
  ): fabric.Circle {
    return new fabric.Circle({
      left: entity.center.x - entity.radius,
      top: entity.center.y - entity.radius,
      radius: entity.radius,
      stroke: stroke.color,
      strokeWidth: stroke.width,
      fill: fill.color,
      opacity: fill.opacity ?? 1,
      selectable: false,
      evented: false,
    });
  }

  private createArcObject(entity: ArcEntity, stroke: StrokeStyle): fabric.Path {
    // Create SVG arc path
    const { center, radius, startAngle, endAngle } = entity;

    const startX = center.x + radius * Math.cos(startAngle);
    const startY = center.y + radius * Math.sin(startAngle);
    const endX = center.x + radius * Math.cos(endAngle);
    const endY = center.y + radius * Math.sin(endAngle);

    const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    const sweepFlag = endAngle > startAngle ? 1 : 0;

    const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

    return new fabric.Path(pathData, {
      stroke: stroke.color,
      strokeWidth: stroke.width,
      fill: "transparent",
      selectable: false,
      evented: false,
    });
  }

  private createPolylineObject(
    entity: PolylineEntity,
    stroke: StrokeStyle,
    fill: { color: string; opacity?: number }
  ): fabric.Polyline | fabric.Polygon {
    const points = entity.points.map((p) => ({ x: p.x, y: p.y }));

    if (entity.closed) {
      return new fabric.Polygon(points, {
        stroke: stroke.color,
        strokeWidth: stroke.width,
        fill: fill.color,
        opacity: fill.opacity ?? 1,
        selectable: false,
        evented: false,
      });
    } else {
      return new fabric.Polyline(points, {
        stroke: stroke.color,
        strokeWidth: stroke.width,
        fill: "transparent",
        selectable: false,
        evented: false,
      });
    }
  }

  private createTextObject(
    entity: TextEntity,
    textStyle?: TextStyle
  ): fabric.Text {
    const entityColor = entity.style?.strokeColor ?? "#ffffff";
    const style = textStyle ?? { ...DEFAULT_TEXT_STYLE, color: entityColor };

    return new fabric.Text(entity.text, {
      left: entity.position.x,
      top: entity.position.y,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      fontStyle: style.fontStyle,
      fill: style.color,
      textAlign: style.textAlign,
      angle: (entity.rotation * 180) / Math.PI,
      selectable: false,
      evented: false,
    });
  }

  private createDimensionObject(
    entity: DimensionEntity,
    stroke: StrokeStyle,
    textStyle?: TextStyle
  ): fabric.Group {
    const { startPoint, endPoint, offset, value, prefix, suffix, dimStyle } =
      entity;
    const precision = dimStyle.precision;

    // Calculate dimension line position
    const direction = endPoint.sub(startPoint).normalize();
    const perpendicular = new Vec2(-direction.y, direction.x);
    const offsetVec = perpendicular.mul(offset);

    const dimStart = startPoint.add(offsetVec);
    const dimEnd = endPoint.add(offsetVec);
    const midPoint = dimStart.add(dimEnd).mul(0.5);

    // Create extension lines
    const extLine1 = new fabric.Line(
      [startPoint.x, startPoint.y, dimStart.x, dimStart.y],
      { stroke: stroke.color, strokeWidth: stroke.width * 0.5 }
    );

    const extLine2 = new fabric.Line(
      [endPoint.x, endPoint.y, dimEnd.x, dimEnd.y],
      { stroke: stroke.color, strokeWidth: stroke.width * 0.5 }
    );

    // Create dimension line
    const dimLine = new fabric.Line(
      [dimStart.x, dimStart.y, dimEnd.x, dimEnd.y],
      { stroke: stroke.color, strokeWidth: stroke.width }
    );

    // Create text
    const displayValue =
      value !== undefined ? value : startPoint.distanceTo(endPoint);
    const text = `${prefix ?? ""}${displayValue.toFixed(precision ?? 2)}${
      suffix ?? ""
    }`;
    const entityColor = entity.style?.strokeColor ?? "#ffffff";
    const style = textStyle ?? { ...DEFAULT_TEXT_STYLE, color: entityColor };

    const dimText = new fabric.Text(text, {
      left: midPoint.x,
      top: midPoint.y - 10,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fill: style.color,
      textAlign: "center",
      originX: "center",
      originY: "bottom",
    });

    // Create arrow heads
    const arrowSize = 8;
    const arrow1 = this.createArrowHead(
      dimStart,
      direction,
      arrowSize,
      stroke.color
    );
    const arrow2 = this.createArrowHead(
      dimEnd,
      direction.mul(-1),
      arrowSize,
      stroke.color
    );

    return new fabric.Group(
      [extLine1, extLine2, dimLine, arrow1, arrow2, dimText],
      {
        selectable: false,
        evented: false,
      }
    );
  }

  private createArrowHead(
    tip: Vec2,
    direction: Vec2,
    size: number,
    color: string
  ): fabric.Triangle {
    const angle = (Math.atan2(direction.y, direction.x) * 180) / Math.PI;

    return new fabric.Triangle({
      left: tip.x,
      top: tip.y,
      width: size,
      height: size * 0.6,
      fill: color,
      angle: angle + 90,
      originX: "center",
      originY: "center",
    });
  }

  private createRenderedObject(
    id: string,
    entity: Entity,
    fabricObj: fabric.FabricObject | null
  ): RenderedObject {
    void fabricObj; // Intentionally unused - kept for future use

    // Use getBounds method if available, otherwise create a default bounding box
    let bounds: {
      min: { x: number; y: number };
      max: { x: number; y: number };
    };
    if ("getBounds" in entity && typeof entity.getBounds === "function") {
      bounds = entity.getBounds();
    } else {
      // Fallback: create empty bounds
      bounds = { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }

    return {
      id,
      entityId: entity.id,
      type: entity.type,
      bounds: {
        min: bounds.min,
        max: bounds.max,
      },
    };
  }

  // === Primitive Drawing ===
  drawLine(start: Vec2, end: Vec2, style?: StrokeStyle): RenderedObject {
    const stroke = style ?? DEFAULT_STROKE;
    const line = new fabric.Line([start.x, start.y, end.x, end.y], {
      stroke: stroke.color,
      strokeWidth: stroke.width,
      strokeLineCap: stroke.lineCap,
      strokeLineJoin: stroke.lineJoin,
      strokeDashArray: stroke.dashArray,
      selectable: false,
      evented: false,
    });

    const id = `line_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (this.canvas) {
      this.canvas.add(line);
      this.canvas.requestRenderAll();
    }

    return {
      id,
      type: "line",
      bounds: { min: start, max: end },
    };
  }

  drawRect(
    position: Vec2,
    width: number,
    height: number,
    style?: RenderOptions
  ): RenderedObject {
    const stroke = style?.stroke ?? DEFAULT_STROKE;
    const fill = style?.fill ?? DEFAULT_FILL;

    const rect = new fabric.Rect({
      left: position.x,
      top: position.y,
      width,
      height,
      stroke: stroke.color,
      strokeWidth: stroke.width,
      fill: fill.color,
      opacity: fill.opacity ?? 1,
      selectable: false,
      evented: false,
    });

    const id = `rect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (this.canvas) {
      this.canvas.add(rect);
      this.canvas.requestRenderAll();
    }

    return {
      id,
      type: "rect",
      bounds: {
        min: position,
        max: { x: position.x + width, y: position.y + height },
      },
    };
  }

  drawCircle(
    center: Vec2,
    radius: number,
    style?: RenderOptions
  ): RenderedObject {
    const stroke = style?.stroke ?? DEFAULT_STROKE;
    const fill = style?.fill ?? DEFAULT_FILL;

    const circle = new fabric.Circle({
      left: center.x - radius,
      top: center.y - radius,
      radius,
      stroke: stroke.color,
      strokeWidth: stroke.width,
      fill: fill.color,
      opacity: fill.opacity ?? 1,
      selectable: false,
      evented: false,
    });

    const id = `circle_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    if (this.canvas) {
      this.canvas.add(circle);
      this.canvas.requestRenderAll();
    }

    return {
      id,
      type: "circle",
      bounds: {
        min: { x: center.x - radius, y: center.y - radius },
        max: { x: center.x + radius, y: center.y + radius },
      },
    };
  }

  drawArc(
    center: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: StrokeStyle
  ): RenderedObject {
    const stroke = style ?? DEFAULT_STROKE;

    const startX = center.x + radius * Math.cos(startAngle);
    const startY = center.y + radius * Math.sin(startAngle);
    const endX = center.x + radius * Math.cos(endAngle);
    const endY = center.y + radius * Math.sin(endAngle);

    const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    const sweepFlag = endAngle > startAngle ? 1 : 0;

    const pathData = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;

    const path = new fabric.Path(pathData, {
      stroke: stroke.color,
      strokeWidth: stroke.width,
      fill: "transparent",
      selectable: false,
      evented: false,
    });

    const id = `arc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (this.canvas) {
      this.canvas.add(path);
      this.canvas.requestRenderAll();
    }

    return {
      id,
      type: "arc",
      bounds: {
        min: { x: center.x - radius, y: center.y - radius },
        max: { x: center.x + radius, y: center.y + radius },
      },
    };
  }

  drawPolyline(
    points: Vec2[],
    closed: boolean,
    style?: RenderOptions
  ): RenderedObject {
    const stroke = style?.stroke ?? DEFAULT_STROKE;
    const fill = style?.fill ?? DEFAULT_FILL;
    const fabricPoints = points.map((p) => ({ x: p.x, y: p.y }));

    const poly = closed
      ? new fabric.Polygon(fabricPoints, {
          stroke: stroke.color,
          strokeWidth: stroke.width,
          fill: fill.color,
          opacity: fill.opacity ?? 1,
          selectable: false,
          evented: false,
        })
      : new fabric.Polyline(fabricPoints, {
          stroke: stroke.color,
          strokeWidth: stroke.width,
          fill: "transparent",
          selectable: false,
          evented: false,
        });

    const id = `polyline_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    if (this.canvas) {
      this.canvas.add(poly);
      this.canvas.requestRenderAll();
    }

    // Calculate bounds
    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }

    return {
      id,
      type: closed ? "polygon" : "polyline",
      bounds: { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } },
    };
  }

  drawText(position: Vec2, text: string, style?: TextStyle): RenderedObject {
    const textStyle = style ?? DEFAULT_TEXT_STYLE;

    const textObj = new fabric.Text(text, {
      left: position.x,
      top: position.y,
      fontSize: textStyle.fontSize,
      fontFamily: textStyle.fontFamily,
      fontWeight: textStyle.fontWeight,
      fontStyle: textStyle.fontStyle,
      fill: textStyle.color,
      textAlign: textStyle.textAlign,
      selectable: false,
      evented: false,
    });

    const id = `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (this.canvas) {
      this.canvas.add(textObj);
      this.canvas.requestRenderAll();
    }

    const bounds = textObj.getBoundingRect();
    return {
      id,
      type: "text",
      bounds: {
        min: { x: bounds.left, y: bounds.top },
        max: { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
      },
    };
  }

  drawPath(pathData: string, style?: RenderOptions): RenderedObject {
    const stroke = style?.stroke ?? DEFAULT_STROKE;
    const fill = style?.fill ?? DEFAULT_FILL;

    const path = new fabric.Path(pathData, {
      stroke: stroke.color,
      strokeWidth: stroke.width,
      fill: fill.color,
      opacity: fill.opacity ?? 1,
      selectable: false,
      evented: false,
    });

    const id = `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    if (this.canvas) {
      this.canvas.add(path);
      this.canvas.requestRenderAll();
    }

    const bounds = path.getBoundingRect();
    return {
      id,
      type: "path",
      bounds: {
        min: { x: bounds.left, y: bounds.top },
        max: { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
      },
    };
  }

  // === Grid ===
  showGrid(spacing: number, majorEvery = 10): void {
    this.gridConfig.spacing = spacing;
    this.gridConfig.majorEvery = majorEvery;
    this.gridConfig.visible = true;
    this.updateGrid();
  }

  hideGrid(): void {
    this.gridConfig.visible = false;
    if (this.gridGroup && this.canvas) {
      this.canvas.remove(this.gridGroup);
      this.gridGroup = null;
      this.canvas.requestRenderAll();
    }
  }

  setGridStyle(minor?: StrokeStyle, major?: StrokeStyle): void {
    if (minor) this.gridConfig.minorStyle = minor;
    if (major) this.gridConfig.majorStyle = major;
    if (this.gridConfig.visible) {
      this.updateGrid();
    }
  }

  private updateGrid(): void {
    if (!this.canvas || !this.gridConfig.visible) return;

    // Remove existing grid
    if (this.gridGroup) {
      this.canvas.remove(this.gridGroup);
    }

    const { spacing, majorEvery, minorStyle, majorStyle } = this.gridConfig;
    const lines: fabric.Line[] = [];

    // Calculate visible area in world coordinates
    const topLeft = this.screenToWorld(new Vec2(0, 0));
    const bottomRight = this.screenToWorld(new Vec2(this.width, this.height));

    const startX = Math.floor(topLeft.x / spacing) * spacing;
    const endX = Math.ceil(bottomRight.x / spacing) * spacing;
    const startY = Math.floor(bottomRight.y / spacing) * spacing;
    const endY = Math.ceil(topLeft.y / spacing) * spacing;

    // Vertical lines
    for (let x = startX; x <= endX; x += spacing) {
      const isMajor = x % (spacing * majorEvery) === 0;
      const style = isMajor ? majorStyle : minorStyle;

      lines.push(
        new fabric.Line([x, startY, x, endY], {
          stroke: style.color,
          strokeWidth: style.width,
        })
      );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += spacing) {
      const isMajor = y % (spacing * majorEvery) === 0;
      const style = isMajor ? majorStyle : minorStyle;

      lines.push(
        new fabric.Line([startX, y, endX, y], {
          stroke: style.color,
          strokeWidth: style.width,
        })
      );
    }

    this.gridGroup = new fabric.Group(lines, {
      selectable: false,
      evented: false,
    });

    this.canvas.add(this.gridGroup);
    this.canvas.sendObjectToBack(this.gridGroup);
    this.canvas.requestRenderAll();
  }

  // === Selection Visual ===
  showSelectionBox(start: Vec2, end: Vec2): void {
    this.hideSelectionBox();

    if (!this.canvas) return;

    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    // Crossing selection (right to left) = dashed, Window selection (left to right) = solid
    const isCrossing = end.x < start.x;

    this.selectionBox = new fabric.Rect({
      left,
      top,
      width,
      height,
      fill: isCrossing ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 128, 255, 0.1)",
      stroke: isCrossing ? "#00ff00" : "#0080ff",
      strokeWidth: 1,
      strokeDashArray: isCrossing ? [5, 5] : undefined,
      selectable: false,
      evented: false,
    });

    this.canvas.add(this.selectionBox);
    this.canvas.requestRenderAll();
  }

  hideSelectionBox(): void {
    if (this.selectionBox && this.canvas) {
      this.canvas.remove(this.selectionBox);
      this.selectionBox = null;
      this.canvas.requestRenderAll();
    }
  }

  highlightEntity(entityId: string, color = "#ffff00"): void {
    const obj = this.entityMap.get(entityId);
    if (obj) {
      obj.set("stroke", color);
      obj.set("strokeWidth", (obj.get("strokeWidth") ?? 1) + 1);
      this.canvas?.requestRenderAll();
    }
  }

  unhighlightEntity(entityId: string): void {
    // Re-render entity with original style
    const obj = this.entityMap.get(entityId);
    if (obj) {
      // Reset to original - would need to store original values
      obj.set("strokeWidth", (obj.get("strokeWidth") ?? 2) - 1);
      this.canvas?.requestRenderAll();
    }
  }

  showHandles(entityId: string, handles: Vec2[]): void {
    this.hideHandles(entityId);

    if (!this.canvas) return;

    const handleObjects: fabric.Circle[] = handles.map(
      (pos) =>
        new fabric.Circle({
          left: pos.x - 4,
          top: pos.y - 4,
          radius: 4,
          fill: "#ffffff",
          stroke: "#0080ff",
          strokeWidth: 1,
          selectable: false,
          evented: false,
        })
    );

    const group = new fabric.Group(handleObjects, {
      selectable: false,
      evented: false,
    });

    this.handleGroups.set(entityId, group);
    this.canvas.add(group);
    this.canvas.requestRenderAll();
  }

  hideHandles(entityId: string): void {
    const group = this.handleGroups.get(entityId);
    if (group && this.canvas) {
      this.canvas.remove(group);
      this.handleGroups.delete(entityId);
      this.canvas.requestRenderAll();
    }
  }

  // === Crosshair / Cursor ===
  showCrosshair(position: Vec2): void {
    this.hideCrosshair();

    if (!this.canvas) return;

    const screenPos = this.worldToScreen(position);

    const hLine = new fabric.Line([0, screenPos.y, this.width, screenPos.y], {
      stroke: "#888888",
      strokeWidth: 0.5,
      strokeDashArray: [5, 5],
    });

    const vLine = new fabric.Line([screenPos.x, 0, screenPos.x, this.height], {
      stroke: "#888888",
      strokeWidth: 0.5,
      strokeDashArray: [5, 5],
    });

    this.crosshairLines = [hLine, vLine];
    this.canvas.add(hLine, vLine);
    this.canvas.requestRenderAll();
  }

  hideCrosshair(): void {
    if (this.crosshairLines && this.canvas) {
      this.canvas.remove(this.crosshairLines[0], this.crosshairLines[1]);
      this.crosshairLines = null;
      this.canvas.requestRenderAll();
    }
  }

  // === Snap Indicators ===
  showSnapIndicator(position: Vec2, type: string): void {
    this.hideSnapIndicator();

    if (!this.canvas) return;

    const size = 8;
    let indicator: fabric.FabricObject;

    switch (type) {
      case "ENDPOINT":
        indicator = new fabric.Rect({
          left: position.x - size / 2,
          top: position.y - size / 2,
          width: size,
          height: size,
          fill: "transparent",
          stroke: "#00ff00",
          strokeWidth: 2,
        });
        break;

      case "MIDPOINT":
        indicator = new fabric.Triangle({
          left: position.x,
          top: position.y - size / 2,
          width: size,
          height: size,
          fill: "transparent",
          stroke: "#00ff00",
          strokeWidth: 2,
          originX: "center",
        });
        break;

      case "CENTER":
        indicator = new fabric.Circle({
          left: position.x - size / 2,
          top: position.y - size / 2,
          radius: size / 2,
          fill: "transparent",
          stroke: "#00ff00",
          strokeWidth: 2,
        });
        break;

      case "INTERSECTION":
        const line1 = new fabric.Line(
          [
            position.x - size,
            position.y - size,
            position.x + size,
            position.y + size,
          ],
          { stroke: "#00ff00", strokeWidth: 2 }
        );
        const line2 = new fabric.Line(
          [
            position.x + size,
            position.y - size,
            position.x - size,
            position.y + size,
          ],
          { stroke: "#00ff00", strokeWidth: 2 }
        );
        indicator = new fabric.Group([line1, line2]);
        break;

      default:
        indicator = new fabric.Circle({
          left: position.x - 3,
          top: position.y - 3,
          radius: 3,
          fill: "#00ff00",
        });
    }

    this.snapIndicator = new fabric.Group([indicator], {
      selectable: false,
      evented: false,
    });

    this.canvas.add(this.snapIndicator);
    this.canvas.requestRenderAll();
  }

  hideSnapIndicator(): void {
    if (this.snapIndicator && this.canvas) {
      this.canvas.remove(this.snapIndicator);
      this.snapIndicator = null;
      this.canvas.requestRenderAll();
    }
  }

  // === Temporary / Preview ===
  drawPreview(entity: Entity, options?: RenderOptions): void {
    this.clearPreview();

    const previewStyle: RenderOptions = {
      ...options,
      stroke: {
        ...(options?.stroke ?? DEFAULT_STROKE),
        color: options?.stroke?.color ?? "#00ff00",
        dashArray: [5, 5],
      },
    };

    const fabricObj = this.createFabricObject(entity, previewStyle);
    if (fabricObj && this.canvas) {
      this.previewObjects.push(fabricObj);
      this.canvas.add(fabricObj);
      this.canvas.requestRenderAll();
    }
  }

  clearPreview(): void {
    if (!this.canvas) return;

    for (const obj of this.previewObjects) {
      this.canvas.remove(obj);
    }
    this.previewObjects = [];
    this.canvas.requestRenderAll();
  }

  drawRubberBand(start: Vec2, end: Vec2): void {
    this.clearRubberBand();

    if (!this.canvas) return;

    this.rubberBandLine = new fabric.Line([start.x, start.y, end.x, end.y], {
      stroke: "#00ff00",
      strokeWidth: 1,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
    });

    this.canvas.add(this.rubberBandLine);
    this.canvas.requestRenderAll();
  }

  clearRubberBand(): void {
    if (this.rubberBandLine && this.canvas) {
      this.canvas.remove(this.rubberBandLine);
      this.rubberBandLine = null;
      this.canvas.requestRenderAll();
    }
  }

  // === Layers ===
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

  // === Query ===
  getObjectAtPoint(point: Vec2): RenderedObject | null {
    if (!this.canvas) return null;

    const objects = this.canvas.getObjects();

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj === this.gridGroup || this.previewObjects.includes(obj)) continue;

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
      if (obj === this.gridGroup || this.previewObjects.includes(obj)) continue;

      const bounds = obj.getBoundingRect();

      // Check if object is within rect
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

  // === Export ===
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

  // === Additional Utility Methods ===
  getCanvas(): fabric.Canvas | null {
    return this.canvas;
  }

  requestRender(): void {
    this.canvas?.requestRenderAll();
  }
}
