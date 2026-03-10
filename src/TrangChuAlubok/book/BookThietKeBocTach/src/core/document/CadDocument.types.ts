/**
 * CadDocument Type Definitions
 * STEP-5.8: Extracted from CadDocument.ts for modularity
 *
 * Contains all type/interface definitions used by the document system.
 */

import { IVec2 } from "../geometry/Vec2";
import { EntityJSON } from "../entities/Entity.types";
import { LayerData } from "./Layer";
import { BlockJSON } from "./Block";
import { DimensionEntity } from "../dimensions/DimensionManager";
import { DoorEntity } from "../entities/DoorEntity";

// ==================== Canvas Entity Type ====================
// Canvas entities (line, rect, circle, polyline) - UI drawing entities

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasEntity {
  id: string;
  type: "line" | "polyline" | "rect" | "circle" | "arc" | "ellipse" | "text";
  points: CanvasPoint[];
  color: string;
  lineWidth: number;
  selected?: boolean;
  locked?: boolean;
  visible?: boolean;
  layer?: string;
  /**
   * Use layer style (ByLayer) or entity's own style (ByObject/Custom)
   * - true/undefined: Entity inherits style from layer (default)
   * - false: Entity uses its own color/lineWidth/etc (Custom mode)
   */
  useLayerStyle?: boolean;
  // Stroke style (solid, dashed, dotted, dashdot)
  strokeStyle?: "solid" | "dashed" | "dotted" | "dashdot";
  // Fill properties
  fillColor?: string | null;
  fillOpacity?: number;
  // Entity opacity (0-1)
  opacity?: number;
  // Polyline properties
  closed?: boolean;
  // Arc properties
  startAngle?: number;
  endAngle?: number;
  // Ellipse properties
  radiusX?: number;
  radiusY?: number;
  rotation?: number;
  // Text properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
}

// ==================== Document Metadata ====================

export interface DocumentMetadata {
  title: string;
  author?: string;
  created: Date;
  modified: Date;
  version: string;
  description?: string;
  units: DocumentUnits;
  customProperties?: Record<string, unknown>;
}

export interface DocumentUnits {
  /** Đơn vị chính: mm, cm, m, inch, ft */
  primary: "mm" | "cm" | "m" | "inch" | "ft";
  /** Precision - số chữ số thập phân */
  precision: number;
  /** Scale factor */
  scale: number;
}

export interface DocumentViewport {
  center: IVec2;
  zoom: number;
  rotation: number;
}

// ==================== Document Data (for serialization) ====================

export interface DocumentData {
  metadata: DocumentMetadata;
  layers: LayerData[];
  activeLayerId: string;
  blocks: BlockJSON[];
  entities: EntityJSON[];
  dimensions: DimensionEntity[]; // Dimensions storage
  canvasEntities: CanvasEntity[]; // Canvas entities storage
  doors: DoorEntity[]; // Doors storage (RULE 7: via Commands)
  viewport: DocumentViewport;
}
