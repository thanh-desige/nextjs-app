/**
 * EntityRegistry — Central registry mapping entity type → EntityConfig.
 *
 * STEP-3.1: Replaces switch-based dispatch in EntityUtils.ts with
 * extensible config lookup. New entity types are added by calling
 * `entityRegistry.register(config)` — no switch modifications needed.
 *
 * COMPLIANCE:
 * - G1: Gating — discriminator-based dispatch
 * - R5: Immutable transforms (delegates to config)
 * - E1: Extensible — register() adds new types at runtime
 *
 * 3 NON-NEGOTIABLE:
 * 1. Easily extensible — entityRegistry.register(myConfig)
 * 2. 3D-ready — works with any EntityGeometry variant
 * 3. External apps — register custom entity types via plugin
 */

import type {
  EntityGeometry,
  BoundingBox,
  UnifiedEntity,
  Point2D,
} from "./UnifiedEntity";
import type { EntityConfig, EntityGripPoint } from "./EntityData.types";

/**
 * EntityRegistry — Singleton registry for entity type configs.
 *
 * Usage:
 *   entityRegistry.register(lineConfig);
 *   const config = entityRegistry.get('LINE');
 *   const line = config.create({ start: {x:0,y:0}, end: {x:100,y:0} });
 */
export class EntityRegistry {
  private configs = new Map<string, EntityConfig<EntityGeometry>>();

  // ==================== Registration ====================

  /**
   * Register an entity config. Throws if type already registered.
   */
  register<G extends EntityGeometry>(config: EntityConfig<G>): void {
    if (this.configs.has(config.type)) {
      throw new Error(
        `EntityRegistry: type '${config.type}' is already registered`,
      );
    }
    this.configs.set(config.type, config);
  }

  /**
   * Get config for a given type. Throws if not registered.
   */
  get<G extends EntityGeometry = EntityGeometry>(
    type: string,
  ): EntityConfig<G> {
    const config = this.configs.get(type);
    if (!config) {
      throw new Error(
        `EntityRegistry: no config registered for type '${type}'`,
      );
    }
    return config as EntityConfig<G>;
  }

  /** Check if a type is registered */
  has(type: string): boolean {
    return this.configs.has(type);
  }

  /** Get all registered type names */
  getRegisteredTypes(): string[] {
    return Array.from(this.configs.keys());
  }

  // ==================== Convenience: Entity-level operations ====================
  // These dispatch to the correct config based on entity.geometry.type

  /**
   * Translate entity → returns NEW entity with translated geometry
   */
  translate<G extends EntityGeometry>(
    entity: UnifiedEntity<G>,
    dx: number,
    dy: number,
  ): UnifiedEntity<G> {
    const config = this.get<G>(entity.geometry.type);
    return {
      ...entity,
      geometry: config.translate(entity.geometry, dx, dy),
    };
  }

  /**
   * Rotate entity around center → returns NEW entity
   */
  rotate<G extends EntityGeometry>(
    entity: UnifiedEntity<G>,
    angle: number,
    center: Point2D,
  ): UnifiedEntity<G> {
    const config = this.get<G>(entity.geometry.type);
    return {
      ...entity,
      geometry: config.rotate(entity.geometry, angle, center),
    };
  }

  /**
   * Scale entity from center → returns NEW entity
   */
  scale<G extends EntityGeometry>(
    entity: UnifiedEntity<G>,
    sx: number,
    sy: number,
    center: Point2D,
  ): UnifiedEntity<G> {
    const config = this.get<G>(entity.geometry.type);
    return {
      ...entity,
      geometry: config.scale(entity.geometry, sx, sy, center),
    };
  }

  /**
   * Mirror entity across axis → returns NEW entity
   */
  mirror<G extends EntityGeometry>(
    entity: UnifiedEntity<G>,
    axisStart: Point2D,
    axisEnd: Point2D,
  ): UnifiedEntity<G> {
    const config = this.get<G>(entity.geometry.type);
    return {
      ...entity,
      geometry: config.mirror(entity.geometry, axisStart, axisEnd),
    };
  }

  /**
   * Check if point hits entity
   */
  containsPoint(
    entity: UnifiedEntity,
    point: Point2D,
    tolerance: number,
  ): boolean {
    const config = this.get(entity.geometry.type);
    return config.containsPoint(entity.geometry, point, tolerance);
  }

  /**
   * Get bounding box of entity
   */
  getBounds(entity: UnifiedEntity): BoundingBox {
    const config = this.get(entity.geometry.type);
    return config.getBounds(entity.geometry);
  }

  /**
   * Get grip points of entity
   */
  getGripPoints(entity: UnifiedEntity): EntityGripPoint[] {
    const config = this.get(entity.geometry.type);
    return config.getGripPoints(entity.geometry, entity.id);
  }

  /**
   * Clone entity with new ID
   */
  clone<G extends EntityGeometry>(entity: UnifiedEntity<G>): UnifiedEntity<G> {
    const config = this.get<G>(entity.geometry.type);
    return config.clone(entity);
  }
}

// ==================== Singleton ====================

/**
 * Global entity registry instance.
 * Import configs/index.ts to auto-register all built-in types.
 */
export const entityRegistry = new EntityRegistry();
