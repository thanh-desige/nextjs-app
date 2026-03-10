/**
 * SvgOverlayManager — UI overlay management for SVG canvas
 * Selection box, handles, crosshair, snap indicators, preview, rubber band
 * Extracted from SvgAdapter (STEP-5.13)
 */

import { Vec2 } from "../../core/geometry/Vec2";
import { RenderOptions } from "./CanvasAdapter";
import { entityToSvg, DEFAULT_STROKE, Entity } from "./SvgEntityFactory";

// ===== Selection Box =====

export function showSelectionBox(
  uiGroup: SVGGElement | null,
  start: Vec2,
  end: Vec2
): void {
  hideSelectionBox(uiGroup);
  if (!uiGroup) return;

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

  uiGroup.appendChild(rect);
}

export function hideSelectionBox(uiGroup: SVGGElement | null): void {
  const box = uiGroup?.querySelector("#selection-box");
  if (box) {
    uiGroup?.removeChild(box);
  }
}

// ===== Entity Highlight =====

export function highlightEntity(
  mainGroup: SVGGElement | null,
  entityId: string,
  color = "#ffff00"
): void {
  const element = mainGroup?.querySelector(`#entity-${entityId}`);
  if (element) {
    element.setAttribute(
      "data-original-stroke",
      element.getAttribute("stroke") ?? ""
    );
    element.setAttribute("stroke", color);
  }
}

export function unhighlightEntity(
  mainGroup: SVGGElement | null,
  entityId: string
): void {
  const element = mainGroup?.querySelector(`#entity-${entityId}`);
  if (element) {
    const original = element.getAttribute("data-original-stroke");
    if (original) {
      element.setAttribute("stroke", original);
    }
  }
}

// ===== Handles =====

export function showHandles(
  uiGroup: SVGGElement | null,
  entityId: string,
  handles: Vec2[]
): void {
  hideHandles(uiGroup, entityId);
  if (!uiGroup) return;

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

  uiGroup.appendChild(group);
}

export function hideHandles(
  uiGroup: SVGGElement | null,
  entityId: string
): void {
  const handles = uiGroup?.querySelector(`#handles-${entityId}`);
  if (handles) {
    uiGroup?.removeChild(handles);
  }
}

// ===== Crosshair =====

export function showCrosshair(
  uiGroup: SVGGElement | null,
  screenPos: Vec2,
  width: number,
  height: number
): void {
  hideCrosshair(uiGroup);
  if (!uiGroup) return;

  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("id", "crosshair");

  const hLine = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  hLine.setAttribute("x1", "0");
  hLine.setAttribute("y1", `${screenPos.y}`);
  hLine.setAttribute("x2", `${width}`);
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
  vLine.setAttribute("y2", `${height}`);
  vLine.setAttribute("stroke", "#888888");
  vLine.setAttribute("stroke-width", "0.5");
  vLine.setAttribute("stroke-dasharray", "5,5");

  group.appendChild(hLine);
  group.appendChild(vLine);
  uiGroup.appendChild(group);
}

export function hideCrosshair(uiGroup: SVGGElement | null): void {
  const crosshair = uiGroup?.querySelector("#crosshair");
  if (crosshair) {
    uiGroup?.removeChild(crosshair);
  }
}

// ===== Snap Indicators =====

export function showSnapIndicator(
  uiGroup: SVGGElement | null,
  position: Vec2,
  type: string
): void {
  hideSnapIndicator(uiGroup);
  if (!uiGroup) return;

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
  uiGroup.appendChild(group);
}

export function hideSnapIndicator(uiGroup: SVGGElement | null): void {
  const indicator = uiGroup?.querySelector("#snap-indicator");
  if (indicator) {
    uiGroup?.removeChild(indicator);
  }
}

// ===== Preview / Rubber Band =====

export function drawPreview(
  previewGroup: SVGGElement | null,
  entity: Entity,
  options?: RenderOptions,
  defsElement?: SVGDefsElement | null
): void {
  clearPreview(previewGroup);
  if (!previewGroup) return;

  const previewOptions: RenderOptions = {
    ...options,
    stroke: {
      ...(options?.stroke ?? DEFAULT_STROKE),
      color: "#00ff00",
      dashArray: [5, 5],
    },
  };

  const svgString = entityToSvg(entity, previewOptions, defsElement);
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.innerHTML = svgString;
  previewGroup.appendChild(g);
}

export function clearPreview(previewGroup: SVGGElement | null): void {
  if (previewGroup) {
    previewGroup.innerHTML = "";
  }
}

export function drawRubberBand(
  uiGroup: SVGGElement | null,
  start: Vec2,
  end: Vec2
): void {
  clearRubberBand(uiGroup);
  if (!uiGroup) return;

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("id", "rubber-band");
  line.setAttribute("x1", `${start.x}`);
  line.setAttribute("y1", `${start.y}`);
  line.setAttribute("x2", `${end.x}`);
  line.setAttribute("y2", `${end.y}`);
  line.setAttribute("stroke", "#00ff00");
  line.setAttribute("stroke-width", "1");
  line.setAttribute("stroke-dasharray", "5,5");

  uiGroup.appendChild(line);
}

export function clearRubberBand(uiGroup: SVGGElement | null): void {
  const line = uiGroup?.querySelector("#rubber-band");
  if (line) {
    uiGroup?.removeChild(line);
  }
}
