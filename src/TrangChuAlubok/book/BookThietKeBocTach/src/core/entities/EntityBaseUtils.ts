/**
 * EntityBaseUtils — Standalone utility functions formerly in BaseEntity.
 *
 * STEP-3.9: Extracted from BaseEntity so entity classes can initialize
 * base properties without class inheritance.
 *
 * These are pure functions — no class, no mutation.
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import {
  EntityStyle,
  EntityState,
  EntityJSON,
  GripPoint,
  GripType,
  DEFAULT_STYLE,
  DEFAULT_STATE,
} from "./Entity.types";

// ==================== ID Generation ====================

/** Generate a unique entity ID */
export function generateEntityId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ==================== Base Property Initialization ====================

export interface EntityBaseOptions {
  id?: string;
  name?: string;
  layerId?: string;
  style?: Partial<EntityStyle>;
  metadata?: Record<string, unknown>;
}

export interface EntityBaseProps {
  id: string;
  name?: string;
  layerId: string;
  style: EntityStyle;
  state: EntityState;
  metadata?: Record<string, unknown>;
}

/**
 * Initialize base entity properties.
 * Replaces the BaseEntity constructor.
 */
export function initEntityBase(options?: EntityBaseOptions): EntityBaseProps {
  return {
    id: options?.id ?? generateEntityId(),
    name: options?.name,
    layerId: options?.layerId ?? "default",
    style: { ...DEFAULT_STYLE, ...options?.style },
    state: { ...DEFAULT_STATE },
    metadata: options?.metadata,
  };
}

// ==================== Serialization Helpers ====================

/**
 * Serialize base entity properties to JSON.
 * Replaces BaseEntity.serializeBase().
 */
export function serializeEntityBase(entity: {
  id: string;
  type: string;
  name?: string;
  layerId: string;
  style: EntityStyle;
  metadata?: Record<string, unknown>;
}): Partial<EntityJSON> {
  return {
    id: entity.id,
    type: entity.type as EntityJSON["type"],
    name: entity.name,
    layerId: entity.layerId,
    style: { ...entity.style },
    metadata: entity.metadata ? { ...entity.metadata } : undefined,
  };
}

/**
 * Copy base properties from one entity to another.
 * Replaces BaseEntity.copyBaseFrom().
 */
export function copyEntityBase(
  target: EntityBaseProps,
  source: EntityBaseProps,
): void {
  target.name = source.name;
  target.layerId = source.layerId;
  target.style = { ...source.style };
  target.state = { ...source.state };
  target.metadata = source.metadata ? { ...source.metadata } : undefined;
}

// ==================== Grip Point Helper ====================

/**
 * Create a grip point for entity editing.
 * Moved from BaseEntity.ts.
 */
export function createGripPoint(
  position: IVec2,
  type: GripType,
  entityId: string,
  index?: number,
): GripPoint {
  return {
    position: Vec2.from(position),
    type,
    entityId,
    index,
  };
}
