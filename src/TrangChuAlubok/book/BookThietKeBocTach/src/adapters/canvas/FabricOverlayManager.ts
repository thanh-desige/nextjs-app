/**
 * FabricOverlayManager.ts
 *
 * STEP-5.11: Extracted from FabricAdapter.ts
 * Transient UI overlay management — selection box, handles, crosshair,
 * snap indicators, rubber band, highlights, preview.
 * These don't affect entity state — they are ephemeral visual feedback.
 */

import * as fabric from "fabric";
import type { Vec2 } from "../../core/geometry/Vec2";
import type { RenderOptions } from "./CanvasAdapter";
import { createFabricObject, DEFAULT_STROKE, type Entity } from "./FabricEntityFactory";

// ============================================
// OVERLAY STATE
// ============================================

export interface OverlayState {
  selectionBox: fabric.Rect | null;
  crosshairLines: [fabric.Line, fabric.Line] | null;
  rubberBandLine: fabric.Line | null;
  snapIndicator: fabric.Group | null;
  previewObjects: fabric.FabricObject[];
  handleGroups: Map<string, fabric.Group>;
}

export function createOverlayState(): OverlayState {
  return {
    selectionBox: null,
    crosshairLines: null,
    rubberBandLine: null,
    snapIndicator: null,
    previewObjects: [],
    handleGroups: new Map(),
  };
}

// ============================================
// SELECTION BOX
// ============================================

export function showSelectionBox(
  canvas: fabric.Canvas,
  state: OverlayState,
  start: Vec2,
  end: Vec2,
): void {
  hideSelectionBox(canvas, state);

  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  const isCrossing = end.x < start.x;

  state.selectionBox = new fabric.Rect({
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

  canvas.add(state.selectionBox);
  canvas.requestRenderAll();
}

export function hideSelectionBox(
  canvas: fabric.Canvas,
  state: OverlayState,
): void {
  if (state.selectionBox) {
    canvas.remove(state.selectionBox);
    state.selectionBox = null;
    canvas.requestRenderAll();
  }
}

// ============================================
// ENTITY HIGHLIGHT
// ============================================

export function highlightEntity(
  canvas: fabric.Canvas,
  entityMap: Map<string, fabric.FabricObject>,
  entityId: string,
  color = "#ffff00",
): void {
  const obj = entityMap.get(entityId);
  if (obj) {
    obj.set("stroke", color);
    obj.set("strokeWidth", (obj.get("strokeWidth") ?? 1) + 1);
    canvas.requestRenderAll();
  }
}

export function unhighlightEntity(
  canvas: fabric.Canvas,
  entityMap: Map<string, fabric.FabricObject>,
  entityId: string,
): void {
  const obj = entityMap.get(entityId);
  if (obj) {
    obj.set("strokeWidth", (obj.get("strokeWidth") ?? 2) - 1);
    canvas.requestRenderAll();
  }
}

// ============================================
// GRIP HANDLES
// ============================================

export function showHandles(
  canvas: fabric.Canvas,
  state: OverlayState,
  entityId: string,
  handles: Vec2[],
): void {
  hideHandles(canvas, state, entityId);

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
      }),
  );

  const group = new fabric.Group(handleObjects, {
    selectable: false,
    evented: false,
  });

  state.handleGroups.set(entityId, group);
  canvas.add(group);
  canvas.requestRenderAll();
}

export function hideHandles(
  canvas: fabric.Canvas,
  state: OverlayState,
  entityId: string,
): void {
  const group = state.handleGroups.get(entityId);
  if (group) {
    canvas.remove(group);
    state.handleGroups.delete(entityId);
    canvas.requestRenderAll();
  }
}

// ============================================
// CROSSHAIR
// ============================================

export function showCrosshair(
  canvas: fabric.Canvas,
  state: OverlayState,
  screenPos: Vec2,
  canvasWidth: number,
  canvasHeight: number,
): void {
  hideCrosshair(canvas, state);

  const hLine = new fabric.Line(
    [0, screenPos.y, canvasWidth, screenPos.y],
    {
      stroke: "#888888",
      strokeWidth: 0.5,
      strokeDashArray: [5, 5],
    },
  );

  const vLine = new fabric.Line(
    [screenPos.x, 0, screenPos.x, canvasHeight],
    {
      stroke: "#888888",
      strokeWidth: 0.5,
      strokeDashArray: [5, 5],
    },
  );

  state.crosshairLines = [hLine, vLine];
  canvas.add(hLine, vLine);
  canvas.requestRenderAll();
}

export function hideCrosshair(
  canvas: fabric.Canvas,
  state: OverlayState,
): void {
  if (state.crosshairLines) {
    canvas.remove(state.crosshairLines[0], state.crosshairLines[1]);
    state.crosshairLines = null;
    canvas.requestRenderAll();
  }
}

// ============================================
// SNAP INDICATORS
// ============================================

export function showSnapIndicator(
  canvas: fabric.Canvas,
  state: OverlayState,
  position: Vec2,
  type: string,
): void {
  hideSnapIndicator(canvas, state);

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

    case "INTERSECTION": {
      const line1 = new fabric.Line(
        [
          position.x - size,
          position.y - size,
          position.x + size,
          position.y + size,
        ],
        { stroke: "#00ff00", strokeWidth: 2 },
      );
      const line2 = new fabric.Line(
        [
          position.x + size,
          position.y - size,
          position.x - size,
          position.y + size,
        ],
        { stroke: "#00ff00", strokeWidth: 2 },
      );
      indicator = new fabric.Group([line1, line2]);
      break;
    }

    default:
      indicator = new fabric.Circle({
        left: position.x - 3,
        top: position.y - 3,
        radius: 3,
        fill: "#00ff00",
      });
  }

  state.snapIndicator = new fabric.Group([indicator], {
    selectable: false,
    evented: false,
  });

  canvas.add(state.snapIndicator);
  canvas.requestRenderAll();
}

export function hideSnapIndicator(
  canvas: fabric.Canvas,
  state: OverlayState,
): void {
  if (state.snapIndicator) {
    canvas.remove(state.snapIndicator);
    state.snapIndicator = null;
    canvas.requestRenderAll();
  }
}

// ============================================
// PREVIEW & RUBBER BAND
// ============================================

export function drawPreview(
  canvas: fabric.Canvas,
  state: OverlayState,
  entity: Entity,
  options?: RenderOptions,
): void {
  clearPreview(canvas, state);

  const previewStyle: RenderOptions = {
    ...options,
    stroke: {
      ...(options?.stroke ?? DEFAULT_STROKE),
      color: options?.stroke?.color ?? "#00ff00",
      dashArray: [5, 5],
    },
  };

  const fabricObj = createFabricObject(entity, previewStyle);
  if (fabricObj) {
    state.previewObjects.push(fabricObj);
    canvas.add(fabricObj);
    canvas.requestRenderAll();
  }
}

export function clearPreview(
  canvas: fabric.Canvas,
  state: OverlayState,
): void {
  for (const obj of state.previewObjects) {
    canvas.remove(obj);
  }
  state.previewObjects = [];
  canvas.requestRenderAll();
}

export function drawRubberBand(
  canvas: fabric.Canvas,
  state: OverlayState,
  start: Vec2,
  end: Vec2,
): void {
  clearRubberBand(canvas, state);

  state.rubberBandLine = new fabric.Line([start.x, start.y, end.x, end.y], {
    stroke: "#00ff00",
    strokeWidth: 1,
    strokeDashArray: [5, 5],
    selectable: false,
    evented: false,
  });

  canvas.add(state.rubberBandLine);
  canvas.requestRenderAll();
}

export function clearRubberBand(
  canvas: fabric.Canvas,
  state: OverlayState,
): void {
  if (state.rubberBandLine) {
    canvas.remove(state.rubberBandLine);
    state.rubberBandLine = null;
    canvas.requestRenderAll();
  }
}
