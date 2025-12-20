/**
 * SelectionEventHandler - Pure functions for handling selection events
 *
 * ĐIỀU KIỆN 1: Các hàm này chỉ xử lý logic selection và hit testing
 * Việc update selection state được thực hiện qua callbacks
 *
 * File này cung cấp:
 * 1. Hit testing cho entities
 * 2. Selection box logic
 * 3. Grip detection
 * 4. Move/resize logic
 */

import { Point, CadEntity } from "../utils/types";
import { hitTestEntity, entityBounds } from "../utils/entityUtils";

// ==================== Types ====================

export interface SelectionState {
  mode: "idle" | "selecting" | "moving" | "grip-editing";
  selectionBox?: { start: Point; end: Point } | null;
  moveStart?: Point | null;
  originalPositions?: Point[][];
}

export interface GripInfo {
  entityId: string;
  gripIndex: number;
  point: Point;
}

export interface SelectionResult {
  entityIds: string[];
  additive: boolean;
}

// ==================== Hit Testing ====================

/**
 * Find entity at a world position
 */
export function findEntityAtPoint(
  entities: CadEntity[],
  worldPos: Point,
  hitTolerance: number
): CadEntity | null {
  // Iterate in reverse to hit top-most entities first
  for (let i = entities.length - 1; i >= 0; i--) {
    const entity = entities[i];
    if (hitTestEntity(entity, worldPos, hitTolerance)) {
      return entity;
    }
  }
  return null;
}

/**
 * Find all entities within a selection box
 */
export function findEntitiesInBox(
  entities: CadEntity[],
  box: { start: Point; end: Point },
  crossingMode: boolean = false
): CadEntity[] {
  const minX = Math.min(box.start.x, box.end.x);
  const maxX = Math.max(box.start.x, box.end.x);
  const minY = Math.min(box.start.y, box.end.y);
  const maxY = Math.max(box.start.y, box.end.y);

  return entities.filter((entity) => {
    const bounds = entityBounds(entity);

    if (crossingMode) {
      // Crossing mode: any intersection counts
      return (
        bounds.min.x <= maxX &&
        bounds.max.x >= minX &&
        bounds.min.y <= maxY &&
        bounds.max.y >= minY
      );
    } else {
      // Window mode: must be fully contained
      return (
        bounds.min.x >= minX &&
        bounds.max.x <= maxX &&
        bounds.min.y >= minY &&
        bounds.max.y <= maxY
      );
    }
  });
}

/**
 * Determine selection mode based on box direction
 * - Dragging left-to-right: Window mode (fully contained)
 * - Dragging right-to-left: Crossing mode (any intersection)
 */
export function getSelectionMode(
  start: Point,
  end: Point
): "window" | "crossing" {
  return end.x >= start.x ? "window" : "crossing";
}

// ==================== Grip Detection ====================

/**
 * Get grip points for an entity
 */
export function getEntityGrips(entity: CadEntity): GripInfo[] {
  const grips: GripInfo[] = [];

  switch (entity.type) {
    case "line":
    case "polyline":
      entity.points.forEach((point, index) => {
        grips.push({
          entityId: entity.id,
          gripIndex: index,
          point: { ...point },
        });
      });
      break;

    case "rect":
      if (entity.points.length >= 2) {
        const [p1, p2] = entity.points;
        // 4 corners
        grips.push({ entityId: entity.id, gripIndex: 0, point: { ...p1 } });
        grips.push({
          entityId: entity.id,
          gripIndex: 1,
          point: { x: p2.x, y: p1.y },
        });
        grips.push({ entityId: entity.id, gripIndex: 2, point: { ...p2 } });
        grips.push({
          entityId: entity.id,
          gripIndex: 3,
          point: { x: p1.x, y: p2.y },
        });
      }
      break;

    case "circle":
      if (entity.points.length >= 2) {
        const center = entity.points[0];
        const radius = entity.points[1].x; // radius stored in x
        // Center and 4 quadrant points
        grips.push({ entityId: entity.id, gripIndex: 0, point: { ...center } });
        grips.push({
          entityId: entity.id,
          gripIndex: 1,
          point: { x: center.x + radius, y: center.y },
        });
        grips.push({
          entityId: entity.id,
          gripIndex: 2,
          point: { x: center.x, y: center.y + radius },
        });
        grips.push({
          entityId: entity.id,
          gripIndex: 3,
          point: { x: center.x - radius, y: center.y },
        });
        grips.push({
          entityId: entity.id,
          gripIndex: 4,
          point: { x: center.x, y: center.y - radius },
        });
      }
      break;

    case "arc":
      // Arc uses points[0] as center and points[1].x as radius
      // Plus startAngle and endAngle for arc endpoints
      if (entity.points.length >= 2) {
        const arcCenter = entity.points[0];
        const arcRadius = entity.points[1].x; // radius stored in x
        grips.push({
          entityId: entity.id,
          gripIndex: 0,
          point: { ...arcCenter },
        });
        if (entity.startAngle !== undefined) {
          const startPt = {
            x: arcCenter.x + arcRadius * Math.cos(entity.startAngle),
            y: arcCenter.y + arcRadius * Math.sin(entity.startAngle),
          };
          grips.push({ entityId: entity.id, gripIndex: 1, point: startPt });
        }
        if (entity.endAngle !== undefined) {
          const endPt = {
            x: arcCenter.x + arcRadius * Math.cos(entity.endAngle),
            y: arcCenter.y + arcRadius * Math.sin(entity.endAngle),
          };
          grips.push({ entityId: entity.id, gripIndex: 2, point: endPt });
        }
      }
      break;

    case "ellipse":
      // Ellipse uses points[0] as center with radiusX, radiusY, rotation properties
      if (entity.points.length >= 1) {
        const ellipseCenter = entity.points[0];
        grips.push({
          entityId: entity.id,
          gripIndex: 0,
          point: { ...ellipseCenter },
        });
        if (entity.radiusX !== undefined && entity.rotation !== undefined) {
          const axisEnd = {
            x: ellipseCenter.x + entity.radiusX * Math.cos(entity.rotation),
            y: ellipseCenter.y + entity.radiusX * Math.sin(entity.rotation),
          };
          grips.push({ entityId: entity.id, gripIndex: 1, point: axisEnd });
        }
        if (entity.radiusY !== undefined && entity.rotation !== undefined) {
          const axisEnd2 = {
            x:
              ellipseCenter.x +
              entity.radiusY * Math.cos(entity.rotation + Math.PI / 2),
            y:
              ellipseCenter.y +
              entity.radiusY * Math.sin(entity.rotation + Math.PI / 2),
          };
          grips.push({ entityId: entity.id, gripIndex: 2, point: axisEnd2 });
        }
      }
      break;

    case "text":
      // Text has single anchor point grip
      if (entity.points.length > 0) {
        grips.push({
          entityId: entity.id,
          gripIndex: 0,
          point: { ...entity.points[0] },
        });
      }
      break;

    default:
      // Generic: use all points
      entity.points.forEach((point, index) => {
        grips.push({
          entityId: entity.id,
          gripIndex: index,
          point: { ...point },
        });
      });
  }

  return grips;
}

/**
 * Find grip at a world position
 */
export function findGripAtPoint(
  entities: CadEntity[],
  selectedIds: string[],
  worldPos: Point,
  gripSize: number
): GripInfo | null {
  for (const entity of entities) {
    if (!selectedIds.includes(entity.id)) continue;

    const grips = getEntityGrips(entity);
    for (const grip of grips) {
      const dx = grip.point.x - worldPos.x;
      const dy = grip.point.y - worldPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= gripSize) {
        return grip;
      }
    }
  }

  return null;
}

// ==================== Selection Box Rendering Helper ====================

/**
 * Get selection box style based on mode
 */
export function getSelectionBoxStyle(mode: "window" | "crossing"): {
  fill: string;
  stroke: string;
  strokeDash: number[];
} {
  if (mode === "window") {
    return {
      fill: "rgba(0, 100, 255, 0.1)",
      stroke: "rgba(0, 100, 255, 0.8)",
      strokeDash: [],
    };
  } else {
    return {
      fill: "rgba(0, 255, 100, 0.1)",
      stroke: "rgba(0, 255, 100, 0.8)",
      strokeDash: [5, 5],
    };
  }
}

// ==================== Move/Transform Helpers ====================

/**
 * Calculate move delta from start and end positions
 */
export function calculateMoveDelta(startPos: Point, currentPos: Point): Point {
  return {
    x: currentPos.x - startPos.x,
    y: currentPos.y - startPos.y,
  };
}

/**
 * Apply ortho constraint to move
 */
export function applyOrthoToMove(delta: Point): Point {
  if (Math.abs(delta.x) > Math.abs(delta.y)) {
    return { x: delta.x, y: 0 };
  } else {
    return { x: 0, y: delta.y };
  }
}

/**
 * Snap move delta to grid
 */
export function snapMoveToGrid(delta: Point, gridSpacing: number): Point {
  return {
    x: Math.round(delta.x / gridSpacing) * gridSpacing,
    y: Math.round(delta.y / gridSpacing) * gridSpacing,
  };
}

// ==================== Selection Operations ====================

/**
 * Toggle entity in selection
 */
export function toggleEntityInSelection(
  currentSelection: string[],
  entityId: string
): string[] {
  if (currentSelection.includes(entityId)) {
    return currentSelection.filter((id) => id !== entityId);
  } else {
    return [...currentSelection, entityId];
  }
}

/**
 * Add entity to selection
 */
export function addEntityToSelection(
  currentSelection: string[],
  entityId: string
): string[] {
  if (currentSelection.includes(entityId)) {
    return currentSelection;
  }
  return [...currentSelection, entityId];
}

/**
 * Add multiple entities to selection
 */
export function addEntitiesToSelection(
  currentSelection: string[],
  entityIds: string[]
): string[] {
  const newSelection = [...currentSelection];
  for (const id of entityIds) {
    if (!newSelection.includes(id)) {
      newSelection.push(id);
    }
  }
  return newSelection;
}

/**
 * Replace selection with new entities
 */
export function replaceSelection(entityIds: string[]): string[] {
  return [...entityIds];
}
