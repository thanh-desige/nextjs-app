/**
 * dimensionMouseMove — Handles mouseMove for dimension interactions
 *
 * Extracted from useMouseHandlers.ts to reduce file size.
 * Handles:
 * - Dimension moving (adjusting offset by dragging)
 * - Dimension grip editing (point1, point2, dimP1, dimP2, text grips)
 * - Radius/diameter dimension grip editing
 */

import type { DimensionEntity } from "../../../../core/dimensions/DimensionManager";
import type { DrawingState } from "../../canvas.types";
import type { Point } from "../../types/CadEntity";

export interface DimensionMouseMoveParams {
  drawState: DrawingState;
  dimensions: DimensionEntity[];
  onDimensionUpdate?: (id: string, updates: Partial<DimensionEntity>) => void;
  onPromptChange?: (prompt: string) => void;
}

/**
 * Handle mouseMove for dimension moving (adjusting offset).
 * Returns true if handled (caller should return early).
 */
export function handleDimensionMoving(
  p: DimensionMouseMoveParams,
  worldPos: Point,
): boolean {
  const { drawState, dimensions, onDimensionUpdate } = p;

  if (drawState.mode !== "movingDimension") return false;

  const dim = dimensions.find((d) => d.id === drawState.dimensionId);
  if (!dim) return true;

  const direction = dim.direction || "aligned";
  const midX = (dim.point1.x + dim.point2.x) / 2;
  const midY = (dim.point1.y + dim.point2.y) / 2;
  let newOffset: number;

  if (direction === "horizontal") {
    // Horizontal: offset theo Y, đảo dấu để di chuột lên thì dim đi lên
    newOffset = -(worldPos.y - midY);
  } else if (direction === "vertical") {
    // Vertical: offset theo X
    newOffset = worldPos.x - midX;
  } else {
    // Aligned: offset vuông góc với đường
    const dx = dim.point2.x - dim.point1.x;
    const dy = dim.point2.y - dim.point1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      const perpX = -dy / length;
      const perpY = dx / length;
      newOffset = -((worldPos.x - midX) * perpX + (worldPos.y - midY) * perpY);
    } else {
      newOffset = 0;
    }
  }

  // Update dimension
  onDimensionUpdate?.(dim.id, { offset: newOffset });
  return true;
}

/**
 * Handle mouseMove for dimension grip editing.
 * Returns true if handled (caller should return early).
 */
export function handleDimensionGripMove(
  p: DimensionMouseMoveParams,
  worldPos: Point,
): boolean {
  const { drawState, onDimensionUpdate } = p;

  if (drawState.mode !== "editingDimensionGrip") return false;

  const originalDim = drawState.originalDimension;
  const dx = worldPos.x - drawState.startPos.x;
  const dy = worldPos.y - drawState.startPos.y;
  const direction = originalDim.direction || "aligned";

  // Handle radius/diameter dimension grip editing
  if (
    originalDim.dimensionType === "radius" ||
    originalDim.dimensionType === "diameter"
  ) {
    const center = originalDim.point1;

    if (drawState.gripType === "point1") {
      // Di chuyển tâm - di chuyển cả dimension
      onDimensionUpdate?.(originalDim.id, {
        point1: {
          x: originalDim.point1.x + dx,
          y: originalDim.point1.y + dy,
        },
        point2: {
          x: originalDim.point2.x + dx,
          y: originalDim.point2.y + dy,
        },
      });
    } else if (drawState.gripType === "point2") {
      // Kéo điểm trên đường tròn - chỉ thay đổi GÓC, giữ nguyên bán kính
      const oldDx = originalDim.point2.x - center.x;
      const oldDy = originalDim.point2.y - center.y;
      const radius = Math.sqrt(oldDx * oldDx + oldDy * oldDy);

      // Tính góc mới từ tâm đến vị trí chuột
      const newAngle = Math.atan2(worldPos.y - center.y, worldPos.x - center.x);

      // Điểm mới trên đường tròn (giữ nguyên bán kính)
      onDimensionUpdate?.(originalDim.id, {
        point2: {
          x: center.x + radius * Math.cos(newAngle),
          y: center.y + radius * Math.sin(newAngle),
        },
      });
    } else if (drawState.gripType === "text") {
      // Kéo text grip - chỉ thay đổi GÓC, giữ nguyên bán kính
      const oldDx = originalDim.point2.x - center.x;
      const oldDy = originalDim.point2.y - center.y;
      const radius = Math.sqrt(oldDx * oldDx + oldDy * oldDy);

      const newAngle = Math.atan2(worldPos.y - center.y, worldPos.x - center.x);

      onDimensionUpdate?.(originalDim.id, {
        point2: {
          x: center.x + radius * Math.cos(newAngle),
          y: center.y + radius * Math.sin(newAngle),
        },
      });
    } else if (drawState.gripType === "dimP1") {
      // For diameter: di chuyển opposite point - thay đổi góc
      const oldDx = originalDim.point2.x - center.x;
      const oldDy = originalDim.point2.y - center.y;
      const radius = Math.sqrt(oldDx * oldDx + oldDy * oldDy);

      const newAngle = Math.atan2(worldPos.y - center.y, worldPos.x - center.x);

      // Point2 là điểm đối diện với opposite
      onDimensionUpdate?.(originalDim.id, {
        point2: {
          x: center.x - radius * Math.cos(newAngle),
          y: center.y - radius * Math.sin(newAngle),
        },
      });
    }
    return true;
  }

  if (drawState.gripType === "point1") {
    // Di chuyển điểm gốc 1
    onDimensionUpdate?.(originalDim.id, {
      point1: {
        x: originalDim.point1.x + dx,
        y: originalDim.point1.y + dy,
      },
    });
  } else if (drawState.gripType === "point2") {
    // Di chuyển điểm gốc 2
    onDimensionUpdate?.(originalDim.id, {
      point2: {
        x: originalDim.point2.x + dx,
        y: originalDim.point2.y + dy,
      },
    });
  } else if (drawState.gripType === "dimP1") {
    // Di chuyển đầu dim line 1 - thay đổi cả point1 và offset
    if (direction === "horizontal") {
      onDimensionUpdate?.(originalDim.id, {
        point1: { x: originalDim.point1.x + dx, y: originalDim.point1.y },
        offset: originalDim.offset + dy,
      });
    } else if (direction === "vertical") {
      onDimensionUpdate?.(originalDim.id, {
        point1: { x: originalDim.point1.x, y: originalDim.point1.y + dy },
        offset: originalDim.offset + dx,
      });
    } else {
      onDimensionUpdate?.(originalDim.id, {
        point1: {
          x: originalDim.point1.x + dx,
          y: originalDim.point1.y + dy,
        },
      });
    }
  } else if (drawState.gripType === "dimP2") {
    // Di chuyển đầu dim line 2 - thay đổi cả point2 và offset
    if (direction === "horizontal") {
      onDimensionUpdate?.(originalDim.id, {
        point2: { x: originalDim.point2.x + dx, y: originalDim.point2.y },
        offset: originalDim.offset + dy,
      });
    } else if (direction === "vertical") {
      onDimensionUpdate?.(originalDim.id, {
        point2: { x: originalDim.point2.x, y: originalDim.point2.y + dy },
        offset: originalDim.offset + dx,
      });
    } else {
      onDimensionUpdate?.(originalDim.id, {
        point2: {
          x: originalDim.point2.x + dx,
          y: originalDim.point2.y + dy,
        },
      });
    }
  } else if (drawState.gripType === "text") {
    // Di chuyển text - chỉ thay đổi offset
    const midX = (originalDim.point1.x + originalDim.point2.x) / 2;
    const midY = (originalDim.point1.y + originalDim.point2.y) / 2;

    if (direction === "horizontal") {
      const newOffset = worldPos.y - midY;
      onDimensionUpdate?.(originalDim.id, { offset: newOffset });
    } else if (direction === "vertical") {
      const newOffset = worldPos.x - midX;
      onDimensionUpdate?.(originalDim.id, { offset: newOffset });
    } else {
      // Aligned - dim line song song với đoạn, đi qua vị trí chuột
      const dimDx = originalDim.point2.x - originalDim.point1.x;
      const dimDy = originalDim.point2.y - originalDim.point1.y;
      const lengthSq = dimDx * dimDx + dimDy * dimDy;
      if (lengthSq > 0) {
        const length = Math.sqrt(lengthSq);
        const perpX = -dimDy / length;
        const perpY = dimDx / length;
        const newOffset =
          (worldPos.x - originalDim.point1.x) * perpX +
          (worldPos.y - originalDim.point1.y) * perpY;
        onDimensionUpdate?.(originalDim.id, { offset: newOffset });
      }
    }
  }
  return true;
}
