/**
 * ConstraintSolver - Giải hệ constraints
 * Sử dụng phương pháp iterative để thỏa mãn constraints
 */

import { IEntity, EntityType } from "../entities/Entity.types";
import { LineEntity } from "../entities/Line";
import { CircleEntity } from "../entities/Circle";
import {
  IConstraint,
  ConstraintType,
  ConstraintStatus,
  DistanceConstraint,
  AngleConstraint,
  RadiusConstraint,
} from "./Constraint.types";

// ==================== Solver Configuration ====================

export interface SolverConfig {
  /** Số lần lặp tối đa */
  maxIterations: number;
  /** Sai số chấp nhận được */
  tolerance: number;
  /** Hệ số relaxation (0-1) */
  relaxation: number;
}

export const DEFAULT_SOLVER_CONFIG: SolverConfig = {
  maxIterations: 100,
  tolerance: 0.001,
  relaxation: 0.5,
};

// ==================== Solver Result ====================

export interface SolverResult {
  success: boolean;
  iterations: number;
  maxError: number;
  violatedConstraints: string[];
  messages: string[];
}

// ==================== Constraint Solver ====================

export class ConstraintSolver {
  private config: SolverConfig;
  private constraints: Map<string, IConstraint> = new Map();
  private entities: Map<string, IEntity> = new Map();

  constructor(config?: Partial<SolverConfig>) {
    this.config = { ...DEFAULT_SOLVER_CONFIG, ...config };
  }

  // ==================== Configuration ====================

  setConfig(config: Partial<SolverConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ==================== Constraint Management ====================

  addConstraint(constraint: IConstraint): void {
    this.constraints.set(constraint.id, constraint);
  }

  removeConstraint(id: string): boolean {
    return this.constraints.delete(id);
  }

  getConstraint(id: string): IConstraint | undefined {
    return this.constraints.get(id);
  }

  getAllConstraints(): IConstraint[] {
    return Array.from(this.constraints.values());
  }

  getConstraintsForEntity(entityId: string): IConstraint[] {
    return this.getAllConstraints().filter((c) =>
      c.entityIds.includes(entityId)
    );
  }

  clearConstraints(): void {
    this.constraints.clear();
  }

  // ==================== Entity Management ====================

  setEntities(entities: IEntity[]): void {
    this.entities.clear();
    for (const entity of entities) {
      this.entities.set(entity.id, entity);
    }
  }

  // ==================== Main Solve Function ====================

  solve(): SolverResult {
    const result: SolverResult = {
      success: true,
      iterations: 0,
      maxError: 0,
      violatedConstraints: [],
      messages: [],
    };

    const activeConstraints = this.getAllConstraints().filter((c) => c.active);

    if (activeConstraints.length === 0) {
      return result;
    }

    // Iterative solving
    for (let i = 0; i < this.config.maxIterations; i++) {
      result.iterations = i + 1;
      let maxError = 0;
      let converged = true;

      for (const constraint of activeConstraints) {
        const error = this.evaluateConstraint(constraint);

        if (error > this.config.tolerance) {
          converged = false;
          maxError = Math.max(maxError, error);

          // Cố gắng thỏa mãn constraint
          this.applyConstraint(constraint);
        }
      }

      result.maxError = maxError;

      if (converged) {
        break;
      }
    }

    // Check final status
    for (const constraint of activeConstraints) {
      const error = this.evaluateConstraint(constraint);

      if (error > this.config.tolerance) {
        constraint.status = ConstraintStatus.VIOLATED;
        result.violatedConstraints.push(constraint.id);
        result.success = false;
      } else {
        constraint.status = ConstraintStatus.SATISFIED;
      }
    }

    if (!result.success) {
      result.messages.push(
        `${result.violatedConstraints.length} constraint(s) could not be satisfied`
      );
    }

    return result;
  }

  // ==================== Constraint Evaluation ====================

  private evaluateConstraint(constraint: IConstraint): number {
    switch (constraint.type) {
      case ConstraintType.HORIZONTAL:
        return this.evaluateHorizontal(constraint);

      case ConstraintType.VERTICAL:
        return this.evaluateVertical(constraint);

      case ConstraintType.PARALLEL:
        return this.evaluateParallel(constraint);

      case ConstraintType.PERPENDICULAR:
        return this.evaluatePerpendicular(constraint);

      case ConstraintType.DISTANCE:
        return this.evaluateDistance(constraint as DistanceConstraint);

      case ConstraintType.ANGLE:
        return this.evaluateAngle(constraint as AngleConstraint);

      case ConstraintType.RADIUS:
        return this.evaluateRadius(constraint as RadiusConstraint);

      default:
        return 0;
    }
  }

  private evaluateHorizontal(constraint: IConstraint): number {
    const entity = this.entities.get(constraint.entityIds[0]);
    if (!entity || entity.type !== EntityType.LINE) return 0;

    const line = entity as LineEntity;
    return Math.abs(line.end.y - line.start.y);
  }

  private evaluateVertical(constraint: IConstraint): number {
    const entity = this.entities.get(constraint.entityIds[0]);
    if (!entity || entity.type !== EntityType.LINE) return 0;

    const line = entity as LineEntity;
    return Math.abs(line.end.x - line.start.x);
  }

  private evaluateParallel(constraint: IConstraint): number {
    const entity1 = this.entities.get(constraint.entityIds[0]);
    const entity2 = this.entities.get(constraint.entityIds[1]);

    if (!entity1 || !entity2) return 0;
    if (entity1.type !== EntityType.LINE || entity2.type !== EntityType.LINE)
      return 0;

    const line1 = entity1 as LineEntity;
    const line2 = entity2 as LineEntity;

    const dir1 = line1.end.sub(line1.start).normalize();
    const dir2 = line2.end.sub(line2.start).normalize();

    // Cross product should be 0 for parallel lines
    return Math.abs(dir1.cross(dir2));
  }

  private evaluatePerpendicular(constraint: IConstraint): number {
    const entity1 = this.entities.get(constraint.entityIds[0]);
    const entity2 = this.entities.get(constraint.entityIds[1]);

    if (!entity1 || !entity2) return 0;
    if (entity1.type !== EntityType.LINE || entity2.type !== EntityType.LINE)
      return 0;

    const line1 = entity1 as LineEntity;
    const line2 = entity2 as LineEntity;

    const dir1 = line1.end.sub(line1.start).normalize();
    const dir2 = line2.end.sub(line2.start).normalize();

    // Dot product should be 0 for perpendicular lines
    return Math.abs(dir1.dot(dir2));
  }

  private evaluateDistance(constraint: DistanceConstraint): number {
    const entity1 = this.entities.get(constraint.from.entityId);
    const entity2 = this.entities.get(constraint.to.entityId);

    if (!entity1 || !entity2) return 0;

    // Simplified: distance between first points
    const points1 = (entity1 as LineEntity).getPoints?.() ?? [];
    const points2 = (entity2 as LineEntity).getPoints?.() ?? [];

    if (points1.length === 0 || points2.length === 0) return 0;

    const p1 = points1[constraint.from.pointIndex ?? 0];
    const p2 = points2[constraint.to.pointIndex ?? 0];

    const actualDistance = p1.distanceTo(p2);
    return Math.abs(actualDistance - (constraint.value ?? 0));
  }

  private evaluateAngle(constraint: AngleConstraint): number {
    const entity1 = this.entities.get(constraint.entityIds[0]);
    const entity2 = this.entities.get(constraint.entityIds[1]);

    if (!entity1 || !entity2) return 0;
    if (entity1.type !== EntityType.LINE || entity2.type !== EntityType.LINE)
      return 0;

    const line1 = entity1 as LineEntity;
    const line2 = entity2 as LineEntity;

    const dir1 = line1.end.sub(line1.start).normalize();
    const dir2 = line2.end.sub(line2.start).normalize();

    const actualAngle = Math.acos(Math.min(1, Math.max(-1, dir1.dot(dir2))));
    return Math.abs(actualAngle - (constraint.value ?? 0));
  }

  private evaluateRadius(constraint: RadiusConstraint): number {
    const entity = this.entities.get(constraint.entityIds[0]);
    if (!entity || entity.type !== EntityType.CIRCLE) return 0;

    const circle = entity as CircleEntity;
    return Math.abs(circle.radius - (constraint.value ?? 0));
  }

  // ==================== Constraint Application ====================

  private applyConstraint(constraint: IConstraint): void {
    switch (constraint.type) {
      case ConstraintType.HORIZONTAL:
        this.applyHorizontal(constraint);
        break;

      case ConstraintType.VERTICAL:
        this.applyVertical(constraint);
        break;

      case ConstraintType.RADIUS:
        this.applyRadius(constraint as RadiusConstraint);
        break;

      // TODO: Implement other constraint applications
    }
  }

  private applyHorizontal(constraint: IConstraint): void {
    const entity = this.entities.get(constraint.entityIds[0]);
    if (!entity || entity.type !== EntityType.LINE) return;

    const line = entity as LineEntity;
    const avgY = (line.start.y + line.end.y) / 2;

    // Move towards horizontal with relaxation
    const delta = (avgY - line.start.y) * this.config.relaxation;
    line.start.y += delta;
    line.end.y = line.start.y;
  }

  private applyVertical(constraint: IConstraint): void {
    const entity = this.entities.get(constraint.entityIds[0]);
    if (!entity || entity.type !== EntityType.LINE) return;

    const line = entity as LineEntity;
    const avgX = (line.start.x + line.end.x) / 2;

    const delta = (avgX - line.start.x) * this.config.relaxation;
    line.start.x += delta;
    line.end.x = line.start.x;
  }

  private applyRadius(constraint: RadiusConstraint): void {
    const entity = this.entities.get(constraint.entityIds[0]);
    if (!entity || entity.type !== EntityType.CIRCLE) return;

    const circle = entity as CircleEntity;
    const targetRadius = constraint.value ?? circle.radius;

    circle.radius += (targetRadius - circle.radius) * this.config.relaxation;
  }

  // ==================== Validation ====================

  /**
   * Kiểm tra hệ constraints có well-defined không
   */
  validate(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check for missing entities
    for (const constraint of this.constraints.values()) {
      for (const entityId of constraint.entityIds) {
        if (!this.entities.has(entityId)) {
          issues.push(
            `Constraint ${constraint.id} references missing entity ${entityId}`
          );
        }
      }
    }

    // TODO: Check for over-constrained situations
    // TODO: Check for inconsistent constraints

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

export default ConstraintSolver;
