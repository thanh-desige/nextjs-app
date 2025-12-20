/**
 * Constraint Types - Định nghĩa Constraints cho CAD
 * Constraints dùng để ràng buộc geometry (horizontal, vertical, parallel, etc.)
 */

import { IVec2 } from "../geometry/Vec2";

// ==================== Constraint Type Enum ====================

export enum ConstraintType {
  // Geometric constraints
  HORIZONTAL = "horizontal",
  VERTICAL = "vertical",
  PARALLEL = "parallel",
  PERPENDICULAR = "perpendicular",
  TANGENT = "tangent",
  COINCIDENT = "coincident",
  CONCENTRIC = "concentric",
  COLLINEAR = "collinear",
  EQUAL = "equal",
  SYMMETRIC = "symmetric",
  MIDPOINT = "midpoint",

  // Dimensional constraints
  DISTANCE = "distance",
  ANGLE = "angle",
  RADIUS = "radius",
  DIAMETER = "diameter",

  // Fix constraints
  FIX = "fix",
  FIX_X = "fix_x",
  FIX_Y = "fix_y",
}

// ==================== Constraint Status ====================

export enum ConstraintStatus {
  SATISFIED = "satisfied", // Constraint được thỏa mãn
  VIOLATED = "violated", // Constraint bị vi phạm
  UNDER_CONSTRAINED = "under", // Chưa đủ constraints
  OVER_CONSTRAINED = "over", // Quá nhiều constraints
  INCONSISTENT = "inconsistent", // Constraints mâu thuẫn
}

// ==================== Base Constraint Interface ====================

export interface IConstraint {
  id: string;
  type: ConstraintType;
  /** Entity IDs liên quan */
  entityIds: string[];
  /** Point indices trong entity (nếu cần) */
  pointIndices?: number[];
  /** Giá trị (cho dimensional constraints) */
  value?: number;
  /** Constraint có active không */
  active: boolean;
  /** Trạng thái hiện tại */
  status: ConstraintStatus;
  /** Sai số cho phép */
  tolerance: number;
}

// ==================== Specific Constraint Types ====================

export interface HorizontalConstraint extends IConstraint {
  type: ConstraintType.HORIZONTAL;
}

export interface VerticalConstraint extends IConstraint {
  type: ConstraintType.VERTICAL;
}

export interface ParallelConstraint extends IConstraint {
  type: ConstraintType.PARALLEL;
  entityIds: [string, string]; // 2 entities
}

export interface PerpendicularConstraint extends IConstraint {
  type: ConstraintType.PERPENDICULAR;
  entityIds: [string, string];
}

export interface CoincidentConstraint extends IConstraint {
  type: ConstraintType.COINCIDENT;
  /** Điểm trên entity 1 */
  point1: { entityId: string; pointIndex: number };
  /** Điểm trên entity 2 */
  point2: { entityId: string; pointIndex: number };
}

export interface DistanceConstraint extends IConstraint {
  type: ConstraintType.DISTANCE;
  value: number;
  /** Khoảng cách giữa 2 điểm hoặc point đến line */
  from: { entityId: string; pointIndex?: number };
  to: { entityId: string; pointIndex?: number };
}

export interface AngleConstraint extends IConstraint {
  type: ConstraintType.ANGLE;
  value: number; // radian
  entityIds: [string, string];
}

export interface RadiusConstraint extends IConstraint {
  type: ConstraintType.RADIUS;
  value: number;
  entityIds: [string]; // Circle or Arc
}

export interface FixConstraint extends IConstraint {
  type: ConstraintType.FIX;
  /** Điểm cố định */
  point: IVec2;
}

// ==================== Constraint Creation Helpers ====================

export function createConstraintId(): string {
  return `constraint_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createHorizontalConstraint(
  entityId: string
): HorizontalConstraint {
  return {
    id: createConstraintId(),
    type: ConstraintType.HORIZONTAL,
    entityIds: [entityId],
    active: true,
    status: ConstraintStatus.SATISFIED,
    tolerance: 0.001,
  };
}

export function createVerticalConstraint(entityId: string): VerticalConstraint {
  return {
    id: createConstraintId(),
    type: ConstraintType.VERTICAL,
    entityIds: [entityId],
    active: true,
    status: ConstraintStatus.SATISFIED,
    tolerance: 0.001,
  };
}

export function createParallelConstraint(
  entityId1: string,
  entityId2: string
): ParallelConstraint {
  return {
    id: createConstraintId(),
    type: ConstraintType.PARALLEL,
    entityIds: [entityId1, entityId2],
    active: true,
    status: ConstraintStatus.SATISFIED,
    tolerance: 0.001,
  };
}

export function createDistanceConstraint(
  fromEntityId: string,
  toEntityId: string,
  distance: number,
  fromPointIndex?: number,
  toPointIndex?: number
): DistanceConstraint {
  return {
    id: createConstraintId(),
    type: ConstraintType.DISTANCE,
    entityIds: [fromEntityId, toEntityId],
    value: distance,
    from: { entityId: fromEntityId, pointIndex: fromPointIndex },
    to: { entityId: toEntityId, pointIndex: toPointIndex },
    active: true,
    status: ConstraintStatus.SATISFIED,
    tolerance: 0.001,
  };
}

export function createAngleConstraint(
  entityId1: string,
  entityId2: string,
  angle: number
): AngleConstraint {
  return {
    id: createConstraintId(),
    type: ConstraintType.ANGLE,
    entityIds: [entityId1, entityId2],
    value: angle,
    active: true,
    status: ConstraintStatus.SATISFIED,
    tolerance: 0.001,
  };
}

export function createRadiusConstraint(
  entityId: string,
  radius: number
): RadiusConstraint {
  return {
    id: createConstraintId(),
    type: ConstraintType.RADIUS,
    entityIds: [entityId],
    value: radius,
    active: true,
    status: ConstraintStatus.SATISFIED,
    tolerance: 0.001,
  };
}

export function createFixConstraint(
  entityId: string,
  point: IVec2
): FixConstraint {
  return {
    id: createConstraintId(),
    type: ConstraintType.FIX,
    entityIds: [entityId],
    point: { ...point },
    active: true,
    status: ConstraintStatus.SATISFIED,
    tolerance: 0.001,
  };
}

// ==================== Constraint Utilities ====================

export function isGeometricConstraint(type: ConstraintType): boolean {
  return [
    ConstraintType.HORIZONTAL,
    ConstraintType.VERTICAL,
    ConstraintType.PARALLEL,
    ConstraintType.PERPENDICULAR,
    ConstraintType.TANGENT,
    ConstraintType.COINCIDENT,
    ConstraintType.CONCENTRIC,
    ConstraintType.COLLINEAR,
    ConstraintType.EQUAL,
    ConstraintType.SYMMETRIC,
    ConstraintType.MIDPOINT,
  ].includes(type);
}

export function isDimensionalConstraint(type: ConstraintType): boolean {
  return [
    ConstraintType.DISTANCE,
    ConstraintType.ANGLE,
    ConstraintType.RADIUS,
    ConstraintType.DIAMETER,
  ].includes(type);
}

export function getConstraintDescription(constraint: IConstraint): string {
  switch (constraint.type) {
    case ConstraintType.HORIZONTAL:
      return "Horizontal";
    case ConstraintType.VERTICAL:
      return "Vertical";
    case ConstraintType.PARALLEL:
      return "Parallel";
    case ConstraintType.PERPENDICULAR:
      return "Perpendicular";
    case ConstraintType.DISTANCE:
      return `Distance: ${constraint.value?.toFixed(2)}`;
    case ConstraintType.ANGLE:
      return `Angle: ${(((constraint.value ?? 0) * 180) / Math.PI).toFixed(
        1
      )}°`;
    case ConstraintType.RADIUS:
      return `Radius: ${constraint.value?.toFixed(2)}`;
    case ConstraintType.FIX:
      return "Fixed";
    default:
      return constraint.type;
  }
}
