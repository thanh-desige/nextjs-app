/**
 * SVG Adapter
 * Implements canvas rendering to SVG format for export
 */

import { Vec2 } from "../../core/geometry/Vec2";
import { EntityType } from "../../core/entities/Entity.types";
import { LineEntity } from "../../core/entities/Line";
import { RectEntity } from "../../core/entities/Rect";
import { CircleEntity } from "../../core/entities/Circle";
import { ArcEntity } from "../../core/entities/Arc";
import { PolylineEntity } from "../../core/entities/Polyline";
import { TextEntity } from "../../core/entities/Text";
import { DimensionEntity } from "../../core/entities/Dimension";
import {
  BaseCanvasAdapter,
  RenderOptions,
  RenderedObject,
  StrokeStyle,
  TextStyle,
} from "./CanvasAdapter";

// ===== SVG Element Interface =====
interface SvgElement {
  id: string;
  type: string;
  svgString: string;
  bounds: { min: Vec2; max: Vec2 };
  entityId?: string;
}

// ===== Default Styles =====
const DEFAULT_STROKE: StrokeStyle = {
  color: "#000000",
  width: 1,
  lineCap: "round",
  lineJoin: "round",
  opacity: 1,
};

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: "Arial",
  fontSize: 12,
  fontWeight: "normal",
  fontStyle: "normal",
  color: "#000000",
  textAlign: "left",
};

// Local Entity type union
type Entity =
  | LineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity
  | PolylineEntity
  | TextEntity
  | DimensionEntity;

// ===== SvgAdapter Implementation =====
export class SvgAdapter extends BaseCanvasAdapter {
  private elements: Map<string, SvgElement> = new Map();
  private svgElement: SVGSVGElement | null = null;
  private defsElement: SVGDefsElement | null = null;
  private mainGroup: SVGGElement | null = null;
  private gridGroup: SVGGElement | null = null;
  private previewGroup: SVGGElement | null = null;
  private uiGroup: SVGGElement | null = null;

  private gridVisible = false;
  private gridSpacing = 10;
  private gridMajorEvery = 10;
  protected override panOffset = new Vec2(0, 0);

  // === Initialization ===
  initialize(container: HTMLElement): void {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    // Create SVG element
    this.svgElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    this.svgElement.setAttribute("width", `${this.width}`);
    this.svgElement.setAttribute("height", `${this.height}`);
    this.svgElement.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    this.svgElement.style.backgroundColor = "#1a1a2e";

    // Create defs for patterns, gradients, etc.
    this.defsElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "defs"
    );
    this.svgElement.appendChild(this.defsElement);

    // Create groups in rendering order
    this.gridGroup = this.createGroup("grid-group");
    this.mainGroup = this.createGroup("main-group");
    this.previewGroup = this.createGroup("preview-group");
    this.uiGroup = this.createGroup("ui-group");

    this.svgElement.appendChild(this.gridGroup);
    this.svgElement.appendChild(this.mainGroup);
    this.svgElement.appendChild(this.previewGroup);
    this.svgElement.appendChild(this.uiGroup);

    container.appendChild(this.svgElement);

    // Setup event listeners
    this.setupEventListeners();
  }

  dispose(): void {
    if (this.svgElement && this.container) {
      this.container.removeChild(this.svgElement);
    }
    this.elements.clear();
    this.svgElement = null;
    this.container = null;
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;

    if (this.svgElement) {
      this.svgElement.setAttribute("width", `${width}`);
      this.svgElement.setAttribute("height", `${height}`);
      this.updateViewport();
    }
  }

  private createGroup(id: string): SVGGElement {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", id);
    return group;
  }

  private setupEventListeners(): void {
    if (!this.svgElement || !this.container) return;

    this.container.tabIndex = 0;

    this.svgElement.addEventListener("mousedown", (e) => {
      this.emitPointerDown(this.createPointerEvent(e));
    });

    this.svgElement.addEventListener("mousemove", (e) => {
      this.emitPointerMove(this.createPointerEvent(e));
    });

    this.svgElement.addEventListener("mouseup", (e) => {
      this.emitPointerUp(this.createPointerEvent(e));
    });

    this.svgElement.addEventListener("wheel", (e) => {
      e.preventDefault();
      this.emitWheel(this.createWheelEvent(e));
    });

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

  // === Viewport ===
  protected updateViewport(): void {
    if (!this.mainGroup) return;

    // Apply transform to main group
    const transform = `translate(${this.width / 2 + this.panOffset.x}, ${
      this.height / 2 + this.panOffset.y
    }) scale(${this.viewport.zoom}, ${-this.viewport.zoom})`;
    this.mainGroup.setAttribute("transform", transform);

    if (this.gridGroup && this.gridVisible) {
      this.updateGrid();
    }
  }

  zoomToFit(padding = 50): void {
    if (this.elements.size === 0) return;

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const element of this.elements.values()) {
      minX = Math.min(minX, element.bounds.min.x);
      minY = Math.min(minY, element.bounds.min.y);
      maxX = Math.max(maxX, element.bounds.max.x);
      maxY = Math.max(maxY, element.bounds.max.y);
    }

    if (!isFinite(minX)) return;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    const availableWidth = this.width - 2 * padding;
    const availableHeight = this.height - 2 * padding;

    const zoomX = availableWidth / contentWidth;
    const zoomY = availableHeight / contentHeight;
    this.viewport.zoom = Math.min(zoomX, zoomY, 100000);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.panOffset = new Vec2(
      -centerX * this.viewport.zoom,
      centerY * this.viewport.zoom
    );

    this.updateViewport();
  }

  // === Entity Rendering ===
  renderEntity(entity: Entity, options?: RenderOptions): RenderedObject {
    const svgString = this.entityToSvg(entity, options);

    // Use getBounds method if available, otherwise create a default bounding box
    let bounds: { min: Vec2; max: Vec2 };
    if ("getBounds" in entity && typeof entity.getBounds === "function") {
      bounds = entity.getBounds();
    } else {
      // Fallback: create empty bounds
      bounds = { min: new Vec2(0, 0), max: new Vec2(0, 0) };
    }

    const element: SvgElement = {
      id: entity.id,
      type: entity.type,
      svgString,
      bounds,
      entityId: entity.id,
    };

    this.elements.set(entity.id, element);

    // Add to DOM
    if (this.mainGroup) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("id", `entity-${entity.id}`);
      g.innerHTML = svgString;
      this.mainGroup.appendChild(g);
    }

    return {
      id: entity.id,
      entityId: entity.id,
      type: entity.type,
      bounds,
    };
  }

  renderEntities(
    entities: Entity[],
    options?: RenderOptions
  ): RenderedObject[] {
    return entities.map((entity) => this.renderEntity(entity, options));
  }

  updateEntity(
    entityId: string,
    entity: Entity,
    options?: RenderOptions
  ): void {
    this.removeEntity(entityId);
    this.renderEntity(entity, options);
  }

  removeEntity(entityId: string): void {
    this.elements.delete(entityId);

    if (this.mainGroup) {
      const element = this.mainGroup.querySelector(`#entity-${entityId}`);
      if (element) {
        this.mainGroup.removeChild(element);
      }
    }
  }

  clearEntities(): void {
    this.elements.clear();
    if (this.mainGroup) {
      this.mainGroup.innerHTML = "";
    }
  }

  private entityToSvg(entity: Entity, options?: RenderOptions): string {
    const entityColor =
      "style" in entity && entity.style?.strokeColor
        ? entity.style.strokeColor
        : "#000000";
    const stroke = options?.stroke ?? { ...DEFAULT_STROKE, color: entityColor };
    const fill = options?.fill ?? { color: "none", opacity: 0 };

    switch (entity.type) {
      case EntityType.LINE:
        return this.lineToSvg(entity as LineEntity, stroke);
      case EntityType.RECT:
        return this.rectToSvg(entity as RectEntity, stroke, fill);
      case EntityType.CIRCLE:
        return this.circleToSvg(entity as CircleEntity, stroke, fill);
      case EntityType.ARC:
        return this.arcToSvg(entity as ArcEntity, stroke);
      case EntityType.POLYLINE:
        return this.polylineToSvg(entity as PolylineEntity, stroke, fill);
      case EntityType.TEXT:
        return this.textToSvg(entity as TextEntity, options?.text);
      case EntityType.DIMENSION:
        return this.dimensionToSvg(
          entity as DimensionEntity,
          stroke,
          options?.text
        );
      default:
        return "";
    }
  }

  private lineToSvg(entity: LineEntity, stroke: StrokeStyle): string {
    const dashArray = stroke.dashArray
      ? `stroke-dasharray="${stroke.dashArray.join(",")}"`
      : "";
    return `<line x1="${entity.start.x}" y1="${entity.start.y}" x2="${
      entity.end.x
    }" y2="${entity.end.y}" 
      stroke="${stroke.color}" stroke-width="${stroke.width}" 
      stroke-linecap="${stroke.lineCap ?? "round"}" stroke-linejoin="${
      stroke.lineJoin ?? "round"
    }"
      ${dashArray} opacity="${stroke.opacity ?? 1}"/>`;
  }

  private rectToSvg(
    entity: RectEntity,
    stroke: StrokeStyle,
    fill: { color: string; opacity?: number }
  ): string {
    const transform =
      entity.rotation !== 0
        ? `transform="rotate(${(entity.rotation * 180) / Math.PI}, ${
            entity.origin.x + entity.width / 2
          }, ${entity.origin.y + entity.height / 2})"`
        : "";
    return `<rect x="${entity.origin.x}" y="${entity.origin.y}" 
      width="${entity.width}" height="${entity.height}"
      stroke="${stroke.color}" stroke-width="${stroke.width}"
      fill="${fill.color}" fill-opacity="${fill.opacity ?? 1}"
      ${transform}/>`;
  }

  private circleToSvg(
    entity: CircleEntity,
    stroke: StrokeStyle,
    fill: { color: string; opacity?: number }
  ): string {
    return `<circle cx="${entity.center.x}" cy="${entity.center.y}" r="${
      entity.radius
    }"
      stroke="${stroke.color}" stroke-width="${stroke.width}"
      fill="${fill.color}" fill-opacity="${fill.opacity ?? 1}"/>`;
  }

  private arcToSvg(entity: ArcEntity, stroke: StrokeStyle): string {
    const { center, radius, startAngle, endAngle } = entity;

    const startX = center.x + radius * Math.cos(startAngle);
    const startY = center.y + radius * Math.sin(startAngle);
    const endX = center.x + radius * Math.cos(endAngle);
    const endY = center.y + radius * Math.sin(endAngle);

    const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    const sweepFlag = endAngle > startAngle ? 1 : 0;

    return `<path d="M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}"
      stroke="${stroke.color}" stroke-width="${stroke.width}" fill="none"/>`;
  }

  private polylineToSvg(
    entity: PolylineEntity,
    stroke: StrokeStyle,
    fill: { color: string; opacity?: number }
  ): string {
    const points = entity.points.map((p) => `${p.x},${p.y}`).join(" ");
    const tag = entity.closed ? "polygon" : "polyline";
    const fillValue = entity.closed ? fill.color : "none";

    return `<${tag} points="${points}"
      stroke="${stroke.color}" stroke-width="${stroke.width}"
      fill="${fillValue}" fill-opacity="${fill.opacity ?? 1}"
      stroke-linecap="${stroke.lineCap ?? "round"}" stroke-linejoin="${
      stroke.lineJoin ?? "round"
    }"/>`;
  }

  private textToSvg(entity: TextEntity, textStyle?: TextStyle): string {
    const entityColor = entity.style?.strokeColor ?? "#000000";
    const style = textStyle ?? { ...DEFAULT_TEXT_STYLE, color: entityColor };
    const transform =
      entity.rotation !== 0
        ? `transform="rotate(${(entity.rotation * 180) / Math.PI}, ${
            entity.position.x
          }, ${entity.position.y})"`
        : "";

    return `<text x="${entity.position.x}" y="${entity.position.y}"
      font-family="${style.fontFamily}" font-size="${style.fontSize}"
      font-weight="${style.fontWeight ?? "normal"}" font-style="${
      style.fontStyle ?? "normal"
    }"
      fill="${style.color}" text-anchor="${this.getTextAnchor(style.textAlign)}"
      ${transform}>${this.escapeXml(entity.text)}</text>`;
  }

  private dimensionToSvg(
    entity: DimensionEntity,
    stroke: StrokeStyle,
    textStyle?: TextStyle
  ): string {
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

    // Display value
    const displayValue =
      value !== undefined ? value : startPoint.distanceTo(endPoint);
    const text = `${prefix ?? ""}${displayValue.toFixed(precision ?? 2)}${
      suffix ?? ""
    }`;
    const entityColor = entity.style?.strokeColor ?? "#000000";
    const style = textStyle ?? { ...DEFAULT_TEXT_STYLE, color: entityColor };

    const svg = `
      <g class="dimension">
        <!-- Extension lines -->
        <line x1="${startPoint.x}" y1="${startPoint.y}" x2="${
      dimStart.x
    }" y2="${dimStart.y}"
          stroke="${stroke.color}" stroke-width="${stroke.width * 0.5}"/>
        <line x1="${endPoint.x}" y1="${endPoint.y}" x2="${dimEnd.x}" y2="${
      dimEnd.y
    }"
          stroke="${stroke.color}" stroke-width="${stroke.width * 0.5}"/>
        <!-- Dimension line -->
        <line x1="${dimStart.x}" y1="${dimStart.y}" x2="${dimEnd.x}" y2="${
      dimEnd.y
    }"
          stroke="${stroke.color}" stroke-width="${stroke.width}"
          marker-start="url(#arrowhead)" marker-end="url(#arrowhead)"/>
        <!-- Text -->
        <text x="${midPoint.x}" y="${midPoint.y - 5}"
          font-family="${style.fontFamily}" font-size="${style.fontSize}"
          fill="${style.color}" text-anchor="middle">${text}</text>
      </g>
    `;

    // Add arrowhead marker to defs if not exists
    this.ensureArrowheadMarker(stroke.color);

    return svg;
  }

  private ensureArrowheadMarker(color: string): void {
    if (!this.defsElement) return;

    const existingMarker = this.defsElement.querySelector("#arrowhead");
    if (!existingMarker) {
      const marker = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "marker"
      );
      marker.setAttribute("id", "arrowhead");
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "7");
      marker.setAttribute("refX", "0");
      marker.setAttribute("refY", "3.5");
      marker.setAttribute("orient", "auto");
      marker.innerHTML = `<polygon points="0 0, 10 3.5, 0 7" fill="${color}"/>`;
      this.defsElement.appendChild(marker);
    }
  }

  private getTextAnchor(align?: string): string {
    switch (align) {
      case "center":
        return "middle";
      case "right":
        return "end";
      default:
        return "start";
    }
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  // === Primitive Drawing ===
  drawLine(start: Vec2, end: Vec2, style?: StrokeStyle): RenderedObject {
    const stroke = style ?? DEFAULT_STROKE;
    const id = this.generateId("line");

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", id);
    line.setAttribute("x1", `${start.x}`);
    line.setAttribute("y1", `${start.y}`);
    line.setAttribute("x2", `${end.x}`);
    line.setAttribute("y2", `${end.y}`);
    line.setAttribute("stroke", stroke.color);
    line.setAttribute("stroke-width", `${stroke.width}`);

    this.mainGroup?.appendChild(line);

    return {
      id,
      type: "line",
      bounds: {
        min: { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
        max: { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) },
      },
    };
  }

  drawRect(
    position: Vec2,
    width: number,
    height: number,
    style?: RenderOptions
  ): RenderedObject {
    const stroke = style?.stroke ?? DEFAULT_STROKE;
    const fill = style?.fill ?? { color: "none" };
    const id = this.generateId("rect");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("id", id);
    rect.setAttribute("x", `${position.x}`);
    rect.setAttribute("y", `${position.y}`);
    rect.setAttribute("width", `${width}`);
    rect.setAttribute("height", `${height}`);
    rect.setAttribute("stroke", stroke.color);
    rect.setAttribute("stroke-width", `${stroke.width}`);
    rect.setAttribute("fill", fill.color);

    this.mainGroup?.appendChild(rect);

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
    const fill = style?.fill ?? { color: "none" };
    const id = this.generateId("circle");

    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("id", id);
    circle.setAttribute("cx", `${center.x}`);
    circle.setAttribute("cy", `${center.y}`);
    circle.setAttribute("r", `${radius}`);
    circle.setAttribute("stroke", stroke.color);
    circle.setAttribute("stroke-width", `${stroke.width}`);
    circle.setAttribute("fill", fill.color);

    this.mainGroup?.appendChild(circle);

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
    const id = this.generateId("arc");

    const startX = center.x + radius * Math.cos(startAngle);
    const startY = center.y + radius * Math.sin(startAngle);
    const endX = center.x + radius * Math.cos(endAngle);
    const endY = center.y + radius * Math.sin(endAngle);

    const largeArcFlag = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
    const sweepFlag = endAngle > startAngle ? 1 : 0;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("id", id);
    path.setAttribute(
      "d",
      `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`
    );
    path.setAttribute("stroke", stroke.color);
    path.setAttribute("stroke-width", `${stroke.width}`);
    path.setAttribute("fill", "none");

    this.mainGroup?.appendChild(path);

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
    const fill = style?.fill ?? { color: "none" };
    const id = this.generateId("polyline");

    const pointsStr = points.map((p) => `${p.x},${p.y}`).join(" ");
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      closed ? "polygon" : "polyline"
    );
    element.setAttribute("id", id);
    element.setAttribute("points", pointsStr);
    element.setAttribute("stroke", stroke.color);
    element.setAttribute("stroke-width", `${stroke.width}`);
    element.setAttribute("fill", closed ? fill.color : "none");

    this.mainGroup?.appendChild(element);

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
    const id = this.generateId("text");

    const textElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    textElement.setAttribute("id", id);
    textElement.setAttribute("x", `${position.x}`);
    textElement.setAttribute("y", `${position.y}`);
    textElement.setAttribute("font-family", textStyle.fontFamily);
    textElement.setAttribute("font-size", `${textStyle.fontSize}`);
    textElement.setAttribute("fill", textStyle.color);
    textElement.textContent = text;

    this.mainGroup?.appendChild(textElement);

    // Estimate text bounds (rough approximation)
    const estimatedWidth = text.length * textStyle.fontSize * 0.6;
    const estimatedHeight = textStyle.fontSize;

    return {
      id,
      type: "text",
      bounds: {
        min: position,
        max: {
          x: position.x + estimatedWidth,
          y: position.y + estimatedHeight,
        },
      },
    };
  }

  drawPath(pathData: string, style?: RenderOptions): RenderedObject {
    const stroke = style?.stroke ?? DEFAULT_STROKE;
    const fill = style?.fill ?? { color: "none" };
    const id = this.generateId("path");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("id", id);
    path.setAttribute("d", pathData);
    path.setAttribute("stroke", stroke.color);
    path.setAttribute("stroke-width", `${stroke.width}`);
    path.setAttribute("fill", fill.color);

    this.mainGroup?.appendChild(path);

    // Get bounding box after adding to DOM
    const bbox = path.getBBox();

    return {
      id,
      type: "path",
      bounds: {
        min: { x: bbox.x, y: bbox.y },
        max: { x: bbox.x + bbox.width, y: bbox.y + bbox.height },
      },
    };
  }

  // === Grid ===
  showGrid(spacing: number, majorEvery = 10): void {
    this.gridSpacing = spacing;
    this.gridMajorEvery = majorEvery;
    this.gridVisible = true;
    this.updateGrid();
  }

  hideGrid(): void {
    this.gridVisible = false;
    if (this.gridGroup) {
      this.gridGroup.innerHTML = "";
    }
  }

  setGridStyle(_minor?: StrokeStyle, _major?: StrokeStyle): void {
    void _minor;
    void _major;
    // Store styles and update grid
    if (this.gridVisible) {
      this.updateGrid();
    }
  }

  private updateGrid(): void {
    if (!this.gridGroup || !this.gridVisible) return;

    this.gridGroup.innerHTML = "";

    const topLeft = this.screenToWorld(new Vec2(0, 0));
    const bottomRight = this.screenToWorld(new Vec2(this.width, this.height));

    const startX = Math.floor(topLeft.x / this.gridSpacing) * this.gridSpacing;
    const endX = Math.ceil(bottomRight.x / this.gridSpacing) * this.gridSpacing;
    const startY =
      Math.floor(bottomRight.y / this.gridSpacing) * this.gridSpacing;
    const endY = Math.ceil(topLeft.y / this.gridSpacing) * this.gridSpacing;

    // Vertical lines
    for (let x = startX; x <= endX; x += this.gridSpacing) {
      const isMajor = x % (this.gridSpacing * this.gridMajorEvery) === 0;
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      const screenStart = this.worldToScreen(new Vec2(x, startY));
      const screenEnd = this.worldToScreen(new Vec2(x, endY));

      line.setAttribute("x1", `${screenStart.x}`);
      line.setAttribute("y1", `${screenStart.y}`);
      line.setAttribute("x2", `${screenEnd.x}`);
      line.setAttribute("y2", `${screenEnd.y}`);
      line.setAttribute("stroke", isMajor ? "#555555" : "#333333");
      line.setAttribute("stroke-width", isMajor ? "1" : "0.5");

      this.gridGroup.appendChild(line);
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += this.gridSpacing) {
      const isMajor = y % (this.gridSpacing * this.gridMajorEvery) === 0;
      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      const screenStart = this.worldToScreen(new Vec2(startX, y));
      const screenEnd = this.worldToScreen(new Vec2(endX, y));

      line.setAttribute("x1", `${screenStart.x}`);
      line.setAttribute("y1", `${screenStart.y}`);
      line.setAttribute("x2", `${screenEnd.x}`);
      line.setAttribute("y2", `${screenEnd.y}`);
      line.setAttribute("stroke", isMajor ? "#555555" : "#333333");
      line.setAttribute("stroke-width", isMajor ? "1" : "0.5");

      this.gridGroup.appendChild(line);
    }
  }

  // === Selection Visual ===
  showSelectionBox(start: Vec2, end: Vec2): void {
    this.hideSelectionBox();
    if (!this.uiGroup) return;

    const left = Math.min(start.x, end.x);
    const top = Math.min(start.y, end.y);
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);
    const isCrossing = end.x < start.x;

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("id", "selection-box");
    rect.setAttribute("x", `${left}`);
    rect.setAttribute("y", `${top}`);
    rect.setAttribute("width", `${width}`);
    rect.setAttribute("height", `${height}`);
    rect.setAttribute(
      "fill",
      isCrossing ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 128, 255, 0.1)"
    );
    rect.setAttribute("stroke", isCrossing ? "#00ff00" : "#0080ff");
    rect.setAttribute("stroke-width", "1");
    if (isCrossing) {
      rect.setAttribute("stroke-dasharray", "5,5");
    }

    this.uiGroup.appendChild(rect);
  }

  hideSelectionBox(): void {
    const box = this.uiGroup?.querySelector("#selection-box");
    if (box) {
      this.uiGroup?.removeChild(box);
    }
  }

  highlightEntity(entityId: string, color = "#ffff00"): void {
    const element = this.mainGroup?.querySelector(`#entity-${entityId}`);
    if (element) {
      element.setAttribute(
        "data-original-stroke",
        element.getAttribute("stroke") ?? ""
      );
      element.setAttribute("stroke", color);
    }
  }

  unhighlightEntity(entityId: string): void {
    const element = this.mainGroup?.querySelector(`#entity-${entityId}`);
    if (element) {
      const original = element.getAttribute("data-original-stroke");
      if (original) {
        element.setAttribute("stroke", original);
      }
    }
  }

  showHandles(entityId: string, handles: Vec2[]): void {
    this.hideHandles(entityId);
    if (!this.uiGroup) return;

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", `handles-${entityId}`);

    for (const pos of handles) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("cx", `${pos.x}`);
      circle.setAttribute("cy", `${pos.y}`);
      circle.setAttribute("r", "4");
      circle.setAttribute("fill", "#ffffff");
      circle.setAttribute("stroke", "#0080ff");
      circle.setAttribute("stroke-width", "1");
      group.appendChild(circle);
    }

    this.uiGroup.appendChild(group);
  }

  hideHandles(entityId: string): void {
    const handles = this.uiGroup?.querySelector(`#handles-${entityId}`);
    if (handles) {
      this.uiGroup?.removeChild(handles);
    }
  }

  // === Crosshair / Cursor ===
  showCrosshair(position: Vec2): void {
    this.hideCrosshair();
    if (!this.uiGroup) return;

    const screenPos = this.worldToScreen(position);

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", "crosshair");

    const hLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    hLine.setAttribute("x1", "0");
    hLine.setAttribute("y1", `${screenPos.y}`);
    hLine.setAttribute("x2", `${this.width}`);
    hLine.setAttribute("y2", `${screenPos.y}`);
    hLine.setAttribute("stroke", "#888888");
    hLine.setAttribute("stroke-width", "0.5");
    hLine.setAttribute("stroke-dasharray", "5,5");

    const vLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line"
    );
    vLine.setAttribute("x1", `${screenPos.x}`);
    vLine.setAttribute("y1", "0");
    vLine.setAttribute("x2", `${screenPos.x}`);
    vLine.setAttribute("y2", `${this.height}`);
    vLine.setAttribute("stroke", "#888888");
    vLine.setAttribute("stroke-width", "0.5");
    vLine.setAttribute("stroke-dasharray", "5,5");

    group.appendChild(hLine);
    group.appendChild(vLine);
    this.uiGroup.appendChild(group);
  }

  hideCrosshair(): void {
    const crosshair = this.uiGroup?.querySelector("#crosshair");
    if (crosshair) {
      this.uiGroup?.removeChild(crosshair);
    }
  }

  // === Snap Indicators ===
  showSnapIndicator(position: Vec2, type: string): void {
    this.hideSnapIndicator();
    if (!this.uiGroup) return;

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("id", "snap-indicator");

    const size = 8;
    let indicator: SVGElement;

    switch (type) {
      case "ENDPOINT":
        indicator = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "rect"
        );
        indicator.setAttribute("x", `${position.x - size / 2}`);
        indicator.setAttribute("y", `${position.y - size / 2}`);
        indicator.setAttribute("width", `${size}`);
        indicator.setAttribute("height", `${size}`);
        indicator.setAttribute("fill", "none");
        indicator.setAttribute("stroke", "#00ff00");
        indicator.setAttribute("stroke-width", "2");
        break;

      case "MIDPOINT":
        indicator = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "polygon"
        );
        indicator.setAttribute(
          "points",
          `${position.x},${position.y - size} ${position.x - size},${
            position.y + size
          } ${position.x + size},${position.y + size}`
        );
        indicator.setAttribute("fill", "none");
        indicator.setAttribute("stroke", "#00ff00");
        indicator.setAttribute("stroke-width", "2");
        break;

      case "CENTER":
        indicator = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        indicator.setAttribute("cx", `${position.x}`);
        indicator.setAttribute("cy", `${position.y}`);
        indicator.setAttribute("r", `${size / 2}`);
        indicator.setAttribute("fill", "none");
        indicator.setAttribute("stroke", "#00ff00");
        indicator.setAttribute("stroke-width", "2");
        break;

      default:
        indicator = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "circle"
        );
        indicator.setAttribute("cx", `${position.x}`);
        indicator.setAttribute("cy", `${position.y}`);
        indicator.setAttribute("r", "3");
        indicator.setAttribute("fill", "#00ff00");
    }

    group.appendChild(indicator);
    this.uiGroup.appendChild(group);
  }

  hideSnapIndicator(): void {
    const indicator = this.uiGroup?.querySelector("#snap-indicator");
    if (indicator) {
      this.uiGroup?.removeChild(indicator);
    }
  }

  // === Preview / Rubber Band ===
  drawPreview(entity: Entity, options?: RenderOptions): void {
    this.clearPreview();
    if (!this.previewGroup) return;

    const previewOptions: RenderOptions = {
      ...options,
      stroke: {
        ...(options?.stroke ?? DEFAULT_STROKE),
        color: "#00ff00",
        dashArray: [5, 5],
      },
    };

    const svgString = this.entityToSvg(entity, previewOptions);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.innerHTML = svgString;
    this.previewGroup.appendChild(g);
  }

  clearPreview(): void {
    if (this.previewGroup) {
      this.previewGroup.innerHTML = "";
    }
  }

  drawRubberBand(start: Vec2, end: Vec2): void {
    this.clearRubberBand();
    if (!this.uiGroup) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("id", "rubber-band");
    line.setAttribute("x1", `${start.x}`);
    line.setAttribute("y1", `${start.y}`);
    line.setAttribute("x2", `${end.x}`);
    line.setAttribute("y2", `${end.y}`);
    line.setAttribute("stroke", "#00ff00");
    line.setAttribute("stroke-width", "1");
    line.setAttribute("stroke-dasharray", "5,5");

    this.uiGroup.appendChild(line);
  }

  clearRubberBand(): void {
    const line = this.uiGroup?.querySelector("#rubber-band");
    if (line) {
      this.uiGroup?.removeChild(line);
    }
  }

  // === Layers ===
  setLayerVisibility(layerId: string, visible: boolean): void {
    const elements = this.mainGroup?.querySelectorAll(
      `[data-layer="${layerId}"]`
    );
    elements?.forEach((el) => {
      el.setAttribute("visibility", visible ? "visible" : "hidden");
    });
  }

  setLayerLock(layerId: string, locked: boolean): void {
    const elements = this.mainGroup?.querySelectorAll(
      `[data-layer="${layerId}"]`
    );
    elements?.forEach((el) => {
      el.setAttribute("pointer-events", locked ? "none" : "auto");
    });
  }

  // === Query ===
  getObjectAtPoint(point: Vec2): RenderedObject | null {
    if (!this.svgElement) return null;

    const element = document.elementFromPoint(point.x, point.y);
    if (element && element.id && element.id.startsWith("entity-")) {
      const entityId = element.id.replace("entity-", "");
      const storedElement = this.elements.get(entityId);
      if (storedElement) {
        return {
          id: entityId,
          entityId,
          type: storedElement.type,
          bounds: storedElement.bounds,
        };
      }
    }

    return null;
  }

  getObjectsInRect(rect: { min: Vec2; max: Vec2 }): RenderedObject[] {
    const results: RenderedObject[] = [];

    for (const [entityId, element] of this.elements) {
      if (
        element.bounds.min.x >= rect.min.x &&
        element.bounds.max.x <= rect.max.x &&
        element.bounds.min.y >= rect.min.y &&
        element.bounds.max.y <= rect.max.y
      ) {
        results.push({
          id: entityId,
          entityId,
          type: element.type,
          bounds: element.bounds,
        });
      }
    }

    return results;
  }

  getAllObjects(): RenderedObject[] {
    const results: RenderedObject[] = [];

    for (const [entityId, element] of this.elements) {
      results.push({
        id: entityId,
        entityId,
        type: element.type,
        bounds: element.bounds,
      });
    }

    return results;
  }

  // === Export ===
  toDataURL(_format: "png" | "jpeg" | "webp" = "png", _quality = 1): string {
    void _format;
    void _quality;
    // SVG to Data URL conversion
    const svgString = this.toSVG();
    return (
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgString)))
    );
  }

  toSVG(): string {
    if (!this.svgElement) return "";

    // Clone the SVG and clean up UI elements
    const clone = this.svgElement.cloneNode(true) as SVGSVGElement;

    // Remove UI and preview groups from export
    const uiGroup = clone.querySelector("#ui-group");
    const previewGroup = clone.querySelector("#preview-group");
    const gridGroup = clone.querySelector("#grid-group");

    if (uiGroup) clone.removeChild(uiGroup);
    if (previewGroup) clone.removeChild(previewGroup);
    if (gridGroup) clone.removeChild(gridGroup);

    return new XMLSerializer().serializeToString(clone);
  }

  toJSON(): object {
    const entities: object[] = [];

    for (const [id, element] of this.elements) {
      entities.push({
        id,
        type: element.type,
        bounds: element.bounds,
        svg: element.svgString,
      });
    }

    return {
      width: this.width,
      height: this.height,
      viewport: this.viewport,
      entities,
    };
  }

  // === Utility ===
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getSvgElement(): SVGSVGElement | null {
    return this.svgElement;
  }
}
