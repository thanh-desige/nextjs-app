/**
 * EntityData.types.ts — Type definitions for the EntityRegistry system
 *
 * STEP-3.1: Data-only entity config interface.
 * Each entity type provides an EntityConfig that the EntityRegistry dispatches to.
 *
 * COMPLIANCE:
 * - G1: type discriminator → extensible dispatch
 * - R5: All transforms return NEW objects (immutable)
 * - E1: Add new entity type = add new config file (no switch modification)
 *
 * 3 NON-NEGOTIABLE:
 * 1. Easily extensible — new entity = new config + register()
 * 2. 3D-ready — Point2D can be extended to Point3D later
 * 3. External apps — EntityConfig is serializable/introspectable
 */

import type {
  Point2D,
  EntityGeometry,
  BoundingBox,
  UnifiedEntity,
  EntityStyle,
} from "./UnifiedEntity";

// Re-export for consumer convenience
export type { Point2D, EntityGeometry, BoundingBox, UnifiedEntity };

// ==================== Grip Points ====================

/** Grip point type for editing handles */
export type GripPointType =
  | "endpoint"
  | "midpoint"
  | "center"
  | "quadrant"
  | "control"
  | "rotation";

/**
 * A single grip point (editing handle) on an entity.
 * Used by the UI to render draggable handles.
 */
export interface EntityGripPoint {
  /** World position of the grip */
  position: Point2D;
  /** Semantic type of the grip */
  type: GripPointType;
  /** Index used to identify this grip within the entity */
  index: number;
}

// ==================== Entity Config Interface ====================

/**
 * EntityConfig — Configuration for a single entity type.
 *
 * Each entity type (LINE, CIRCLE, RECT, ...) registers one config object
 * with the EntityRegistry. The registry dispatches operations to the
 * correct config based on `entity.geometry.type`.
 *
 * @template G The specific geometry type this config handles
 */
export interface EntityConfig<G extends EntityGeometry = EntityGeometry> {
  /** Type discriminator — must match G['type'] (e.g. 'LINE') */
  readonly type: string;

  // ==================== Factory ====================

  /**
   * Create a new entity with given parameters.
   * Returns a fully initialized UnifiedEntity with generated ID.
   */
  create(
    params: Record<string, unknown>,
    style?: Partial<EntityStyle>,
  ): UnifiedEntity<G>;

  // ==================== Transforms (all immutable) ====================

  /** Translate geometry by (dx, dy) → returns NEW geometry */
  translate(geometry: G, dx: number, dy: number): G;

  /** Rotate geometry around center by angle (radians) → returns NEW geometry */
  rotate(geometry: G, angle: number, center: Point2D): G;

  /** Scale geometry from center by (sx, sy) → returns NEW geometry */
  scale(geometry: G, sx: number, sy: number, center: Point2D): G;

  /** Mirror geometry across axis defined by two points → returns NEW geometry */
  mirror(geometry: G, axisStart: Point2D, axisEnd: Point2D): G;

  // ==================== Queries ====================

  /** Check if a point is within tolerance distance of the geometry */
  containsPoint(geometry: G, point: Point2D, tolerance: number): boolean;

  /** Get axis-aligned bounding box of the geometry */
  getBounds(geometry: G): BoundingBox;

  /** Get grip points (editing handles) for the geometry */
  getGripPoints(geometry: G, entityId: string): EntityGripPoint[];

  // ==================== Clone / Serialize ====================

  /** Deep-clone entity with a new ID, preserving geometry */
  clone(entity: UnifiedEntity<G>): UnifiedEntity<G>;

  /** Serialize entity to a plain JSON object */
  serialize(entity: UnifiedEntity<G>): Record<string, unknown>;

  /** Deserialize from a plain JSON object */
  deserialize(data: Record<string, unknown>): UnifiedEntity<G>;
}
