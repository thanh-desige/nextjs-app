/**
 * SVG Adapter — Thin facade delegating to extracted modules
 * See: SvgEntityFactory, SvgPrimitiveDrawer, SvgOverlayManager, SvgGridRenderer
 */

import { Vec2 } from "../../core/geometry/Vec2";
import {
  BaseCanvasAdapter,
  RenderOptions,
  RenderedObject,
  StrokeStyle,
  TextStyle,
} from "./CanvasAdapter";
import { SvgElement, Entity, entityToSvg } from "./SvgEntityFactory";
import {
  drawLine as primDrawLine,
  drawRect as primDrawRect,
  drawCircle as primDrawCircle,
  drawArc as primDrawArc,
  drawPolyline as primDrawPolyline,
  drawText as primDrawText,
  drawPath as primDrawPath,
} from "./SvgPrimitiveDrawer";
import {
  showSelectionBox as overlayShowSelectionBox,
  hideSelectionBox as overlayHideSelectionBox,
  highlightEntity as overlayHighlightEntity,
  unhighlightEntity as overlayUnhighlightEntity,
  showHandles as overlayShowHandles,
  hideHandles as overlayHideHandles,
  showCrosshair as overlayShowCrosshair,
  hideCrosshair as overlayHideCrosshair,
  showSnapIndicator as overlayShowSnapIndicator,
  hideSnapIndicator as overlayHideSnapIndicator,
  drawPreview as overlayDrawPreview,
  clearPreview as overlayClearPreview,
  drawRubberBand as overlayDrawRubberBand,
  clearRubberBand as overlayClearRubberBand,
} from "./SvgOverlayManager";
import {
  SvgGridState,
  createSvgGridState,
  showSvgGrid,
  hideSvgGrid,
  updateSvgGrid,
} from "./SvgGridRenderer";

// ===== SvgAdapter Facade =====
export class SvgAdapter extends BaseCanvasAdapter {
  private elements: Map<string, SvgElement> = new Map();
  private svgElement: SVGSVGElement | null = null;
  private defsElement: SVGDefsElement | null = null;
  private mainGroup: SVGGElement | null = null;
  private gridGroup: SVGGElement | null = null;
  private previewGroup: SVGGElement | null = null;
  private uiGroup: SVGGElement | null = null;
  private gridState: SvgGridState = createSvgGridState();
  protected override panOffset = new Vec2(0, 0);

  // === Lifecycle ===

  initialize(container: HTMLElement): void {
    this.container = container;
    this.width = container.clientWidth;
    this.height = container.clientHeight;

    this.svgElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );
    this.svgElement.setAttribute("width", `${this.width}`);
    this.svgElement.setAttribute("height", `${this.height}`);
    this.svgElement.setAttribute("viewBox", `0 0 ${this.width} ${this.height}`);
    this.svgElement.style.backgroundColor = "#1a1a2e";

    this.defsElement = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "defs"
    );
    this.svgElement.appendChild(this.defsElement);

    this.gridGroup = this.createGroup("grid-group");
    this.mainGroup = this.createGroup("main-group");
    this.previewGroup = this.createGroup("preview-group");
    this.uiGroup = this.createGroup("ui-group");

    this.svgElement.appendChild(this.gridGroup);
    this.svgElement.appendChild(this.mainGroup);
    this.svgElement.appendChild(this.previewGroup);
    this.svgElement.appendChild(this.uiGroup);

    container.appendChild(this.svgElement);
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

    const transform = `translate(${this.width / 2 + this.panOffset.x}, ${
      this.height / 2 + this.panOffset.y
    }) scale(${this.viewport.zoom}, ${-this.viewport.zoom})`;
    this.mainGroup.setAttribute("transform", transform);

    if (this.gridGroup && this.gridState.gridVisible) {
      updateSvgGrid(
        this.gridGroup,
        this.gridState,
        (pos) => this.screenToWorld(pos),
        (pos) => this.worldToScreen(pos),
        this.width,
        this.height
      );
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

  // === Entity CRUD ===

  renderEntity(entity: Entity, options?: RenderOptions): RenderedObject {
    const svgString = entityToSvg(entity, options, this.defsElement);

    let bounds: { min: Vec2; max: Vec2 };
    if ("getBounds" in entity && typeof entity.getBounds === "function") {
      bounds = entity.getBounds();
    } else {
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

  // === Primitives (delegate to SvgPrimitiveDrawer) ===

  drawLine(start: Vec2, end: Vec2, style?: StrokeStyle): RenderedObject {
    return primDrawLine(this.mainGroup, start, end, style);
  }

  drawRect(
    position: Vec2,
    width: number,
    height: number,
    style?: RenderOptions
  ): RenderedObject {
    return primDrawRect(this.mainGroup, position, width, height, style);
  }

  drawCircle(
    center: Vec2,
    radius: number,
    style?: RenderOptions
  ): RenderedObject {
    return primDrawCircle(this.mainGroup, center, radius, style);
  }

  drawArc(
    center: Vec2,
    radius: number,
    startAngle: number,
    endAngle: number,
    style?: StrokeStyle
  ): RenderedObject {
    return primDrawArc(
      this.mainGroup,
      center,
      radius,
      startAngle,
      endAngle,
      style
    );
  }

  drawPolyline(
    points: Vec2[],
    closed: boolean,
    style?: RenderOptions
  ): RenderedObject {
    return primDrawPolyline(this.mainGroup, points, closed, style);
  }

  drawText(position: Vec2, text: string, style?: TextStyle): RenderedObject {
    return primDrawText(this.mainGroup, position, text, style);
  }

  drawPath(pathData: string, style?: RenderOptions): RenderedObject {
    return primDrawPath(this.mainGroup, pathData, style);
  }

  // === Grid (delegate to SvgGridRenderer) ===

  showGrid(spacing: number, majorEvery = 10): void {
    showSvgGrid(
      this.gridGroup,
      this.gridState,
      spacing,
      majorEvery,
      (pos) => this.screenToWorld(pos),
      (pos) => this.worldToScreen(pos),
      this.width,
      this.height
    );
  }

  hideGrid(): void {
    hideSvgGrid(this.gridGroup, this.gridState);
  }

  setGridStyle(_minor?: StrokeStyle, _major?: StrokeStyle): void {
    void _minor;
    void _major;
    if (this.gridState.gridVisible) {
      updateSvgGrid(
        this.gridGroup,
        this.gridState,
        (pos) => this.screenToWorld(pos),
        (pos) => this.worldToScreen(pos),
        this.width,
        this.height
      );
    }
  }

  // === Overlays (delegate to SvgOverlayManager) ===

  showSelectionBox(start: Vec2, end: Vec2): void {
    overlayShowSelectionBox(this.uiGroup, start, end);
  }

  hideSelectionBox(): void {
    overlayHideSelectionBox(this.uiGroup);
  }

  highlightEntity(entityId: string, color?: string): void {
    overlayHighlightEntity(this.mainGroup, entityId, color);
  }

  unhighlightEntity(entityId: string): void {
    overlayUnhighlightEntity(this.mainGroup, entityId);
  }

  showHandles(entityId: string, handles: Vec2[]): void {
    overlayShowHandles(this.uiGroup, entityId, handles);
  }

  hideHandles(entityId: string): void {
    overlayHideHandles(this.uiGroup, entityId);
  }

  showCrosshair(position: Vec2): void {
    const screenPos = this.worldToScreen(position);
    overlayShowCrosshair(this.uiGroup, screenPos, this.width, this.height);
  }

  hideCrosshair(): void {
    overlayHideCrosshair(this.uiGroup);
  }

  showSnapIndicator(position: Vec2, type: string): void {
    overlayShowSnapIndicator(this.uiGroup, position, type);
  }

  hideSnapIndicator(): void {
    overlayHideSnapIndicator(this.uiGroup);
  }

  drawPreview(entity: Entity, options?: RenderOptions): void {
    overlayDrawPreview(this.previewGroup, entity, options, this.defsElement);
  }

  clearPreview(): void {
    overlayClearPreview(this.previewGroup);
  }

  drawRubberBand(start: Vec2, end: Vec2): void {
    overlayDrawRubberBand(this.uiGroup, start, end);
  }

  clearRubberBand(): void {
    overlayClearRubberBand(this.uiGroup);
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

  // === Spatial Queries ===

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
    const svgString = this.toSVG();
    return (
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgString)))
    );
  }

  toSVG(): string {
    if (!this.svgElement) return "";

    const clone = this.svgElement.cloneNode(true) as SVGSVGElement;

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

  getSvgElement(): SVGSVGElement | null {
    return this.svgElement;
  }
}
