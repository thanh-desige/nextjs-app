/**
 * DoorOverlay — STEP-5 extraction from CadDrawingCanvas JSX
 *
 * SVG overlay that renders door entities on top of the canvas,
 * including selection, hover, ghost preview for MOVE/COPY.
 */

"use client";

import React from "react";
import type { DoorEntity } from "../../../core/entities/DoorEntity";
import type { CadEntity, DrawingState, Point } from "../canvas.types";
import { DoorRendererDefs } from "../DoorRenderer";
import { DoorRendererDetailed } from "../DoorRendererDetailed";

// ==================== Interface ====================

export interface DoorOverlayProps {
  /** All door entities from store */
  doors: DoorEntity[];
  /** Set of selected door IDs */
  selectedDoorIds: Set<string>;
  /** Currently hovered door ID */
  hoveredDoorId: string | null;
  /** Canvas dimensions */
  canvasDimensions: { width: number; height: number };
  /** Pan offset */
  pan: { x: number; y: number };
  /** Zoom level */
  zoom: number;
  /** Whether to show dimensions on doors */
  showDimensions: boolean;
  /** Current drawing state */
  drawState: DrawingState;
  /** Set draw state */
  setDrawState: React.Dispatch<React.SetStateAction<DrawingState>>;
  /** Moving preview delta for ghost doors */
  movingPreviewDelta: Point | null;
  /** Container ref for bounding rect calculation */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Screen-to-world coordinate converter */
  screenToWorld: (screenX: number, screenY: number) => Point;
  /** Get selected CAD entities */
  getSelectedEntities: () => CadEntity[];
  /** Select/deselect a door */
  selectDoor: (id: string, addToSelection?: boolean) => void;
  /** Set hovered door */
  setHoveredDoor: (id: string | null) => void;
  /** Prompt callback */
  onPromptChange?: (msg: string) => void;
  /** Door double-click callback */
  onDoorDoubleClick?: (doorId: string) => void;
}

// ==================== Component ====================

export const DoorOverlay: React.FC<DoorOverlayProps> = ({
  doors,
  selectedDoorIds,
  hoveredDoorId,
  canvasDimensions,
  pan,
  zoom,
  showDimensions,
  drawState,
  setDrawState,
  movingPreviewDelta,
  containerRef,
  screenToWorld,
  getSelectedEntities,
  selectDoor,
  setHoveredDoor,
  onPromptChange,
  onDoorDoubleClick,
}) => {
  if (doors.length === 0) return null;

  return (
    <svg
      key={`door-svg-${showDimensions}`}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: canvasDimensions.width,
        height: canvasDimensions.height,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <DoorRendererDefs />
      <g
        transform={`
          translate(${canvasDimensions.width / 2 + pan.x}, ${
            canvasDimensions.height / 2 + pan.y
          })
          scale(${zoom}, ${-zoom})
        `}
        style={{ pointerEvents: "all" }}
      >
        {doors.map((door) => (
          <DoorRendererDetailed
            key={door.id}
            door={door}
            isSelected={selectedDoorIds.has(door.id)}
            isHovered={hoveredDoorId === door.id}
            canvasScale={zoom}
            showDimensions={showDimensions}
            onClick={(d, e) => {
              e.stopPropagation();

              // Modify mode handling
              if (
                drawState.mode === "modifyCopy" ||
                drawState.mode === "modifyMove"
              ) {
                if (drawState.step === "selectObjects") {
                  selectDoor(d.id, true);
                  return;
                }
                if (e.shiftKey) {
                  selectDoor(d.id, true);
                }
                return;
              }

              const isAlreadySelected = selectedDoorIds.has(d.id);

              if (isAlreadySelected && !e.shiftKey) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  const screenX = e.clientX - rect.left;
                  const screenY = e.clientY - rect.top;
                  const worldPos = screenToWorld(screenX, screenY);

                  setDrawState({
                    mode: "moving",
                    startPos: worldPos,
                    entities: getSelectedEntities(),
                    originalPositions: getSelectedEntities().map((ent) => [
                      ...ent.points,
                    ]),
                  });
                  onPromptChange?.(
                    "MOVE: type distance<angle or click destination",
                  );
                }
              } else {
                selectDoor(d.id, e.shiftKey);
              }
            }}
            onDoubleClick={(d, e) => {
              e.stopPropagation();
              onDoorDoubleClick?.(d.id);
            }}
            onMouseEnter={(d) => setHoveredDoor(d.id)}
            onMouseLeave={() => setHoveredDoor(null)}
          />
        ))}

        {/* Ghost Door Preview for MOVE/COPY */}
        {movingPreviewDelta &&
          (drawState.mode === "modifyMove" ||
            drawState.mode === "modifyCopy") &&
          drawState.step === "selectDestination" &&
          doors
            .filter((door) => selectedDoorIds.has(door.id))
            .map((door) => {
              const ghostPosition = {
                x: door.position.x + movingPreviewDelta.x,
                y: door.position.y + movingPreviewDelta.y,
              };
              const width = door.doorInfo.width;
              const height = door.doorInfo.height;

              return (
                <g
                  key={`ghost-door-${door.id}`}
                  transform={`translate(${ghostPosition.x}, ${ghostPosition.y})`}
                  style={{ pointerEvents: "none" }}
                >
                  <rect
                    x={0}
                    y={0}
                    width={width}
                    height={height}
                    fill="none"
                    stroke="#00ff00"
                    strokeWidth={2 / zoom}
                    strokeDasharray={`${8 / zoom} ${4 / zoom}`}
                    opacity={0.7}
                  />
                  <line
                    x1={width / 2 - 20}
                    y1={height / 2}
                    x2={width / 2 + 20}
                    y2={height / 2}
                    stroke="#00ff00"
                    strokeWidth={1 / zoom}
                    opacity={0.5}
                  />
                  <line
                    x1={width / 2}
                    y1={height / 2 - 20}
                    x2={width / 2}
                    y2={height / 2 + 20}
                    stroke="#00ff00"
                    strokeWidth={1 / zoom}
                    opacity={0.5}
                  />
                  <text
                    x={width / 2}
                    y={-10}
                    textAnchor="middle"
                    fill="#00ff00"
                    fontSize={12 / zoom}
                    style={{
                      transform: "scaleY(-1)",
                      transformOrigin: `${width / 2}px -10px`,
                    }}
                  >
                    {drawState.mode === "modifyCopy" ? "COPY" : "MOVE"}
                  </text>
                </g>
              );
            })}
      </g>
    </svg>
  );
};
