/**
 * DimensionDocumentService - Dimension subsystem for CadDocument
 * STEP-5.8: Extracted from CadDocument.ts
 *
 * Manages all dimension-related operations:
 * - Validation (INVARIANT guard rules)
 * - CRUD (add, get, update, remove, restore)
 * - Entity→Dimension index (O(1) lookup)
 * - Geometry lifecycle (TRỤC SỐNG: commitEntityGeometryChange)
 *
 * ĐIỀU KIỆN 1: Mọi thay đổi dimension PHẢI đi qua đây
 */

import { DimensionEntity } from "../dimensions/DimensionManager";
import type { CanvasEntity } from "./CadDocument.types";

// ==================== Context Interface ====================

/**
 * Dependencies injected from CadDocument.
 * Avoids circular dependency — DimensionDocumentService doesn't import CadDocument.
 */
export interface DimensionDocumentContext {
  getCanvasEntity: (id: string) => CanvasEntity | undefined;
  markModified: () => void;
}

// ==================== DimensionDocumentService ====================

export class DimensionDocumentService {
  // Dimensions storage
  private dimensions: Map<string, DimensionEntity> = new Map();

  // Entity → Dimension relationship index for O(1) lookup
  // Key: entityId, Value: Set of dimensionIds that reference this entity
  private entityToDimensionIndex: Map<string, Set<string>> = new Map();

  constructor(private context: DimensionDocumentContext) {}

  // ==================== Validation ====================

  /**
   * ========================================================================
   * 2D FIRST, 3D READY ARCHITECTURE - LEGACY DIMENSION SUPPORT
   * ========================================================================
   *
   * LEGACY DIMENSIONS (isLegacy = true):
   * - Cho phép tạo dimension trên RECT và CIRCLE
   * - Chỉ dùng để HIỂN THỊ số đo trong 2D
   * - KHÔNG được index vào entityToDimensionIndex
   * - KHÔNG tham gia lifecycle update (commitEntityGeometryChange)
   * - KHÔNG dùng cho BOM / bóc tách / constraints
   * - KHÔNG migrate sang 3D
   *
   * ASSOCIATIVE DIMENSIONS (isLegacy = false/undefined):
   * - Chỉ cho phép trên PRIMITIVE entities (LINE, ARC, POLYLINE)
   * - ĐƯỢC index vào entityToDimensionIndex
   * - ĐƯỢC update bởi lifecycle khi entity thay đổi
   * - ĐƯỢC dùng cho BOM / constraints
   * - ĐƯỢC migrate sang 3D
   *
   * Cờ legacy là tạm thời, sẽ bị loại bỏ khi kiến trúc EDGE-based
   * geometry được triển khai ở Phase 3D.
   * ========================================================================
   */

  /**
   * INVARIANT (GUARD RULE cho ASSOCIATIVE dimensions):
   *
   * "CẤM tạo ASSOCIATIVE Dimension nếu bất kỳ extension point nào
   * không resolve được entityId + pointIndex hợp lệ."
   *
   * RULE CỨNG cho ASSOCIATIVE:
   * 1. Dimension PHẢI có ref1 VÀ ref2 (trừ radius/diameter chỉ cần ref1)
   * 2. Mỗi ref PHẢI có entityId hợp lệ (entity tồn tại trong document)
   * 3. Mỗi ref PHẢI có pointIndex hợp lệ (để lifecycle resolve điểm chính xác)
   * 4. RECT/CIRCLE entity KHÔNG ĐƯỢC làm associative dimension ref
   *
   * LEGACY dimensions (isLegacy = true) BYPASS validation hoàn toàn.
   */
  private validateDimensionRefs(dim: DimensionEntity): {
    valid: boolean;
    error?: string;
  } {
    // ========================================================================
    // 2D FIRST, 3D READY: LEGACY RADIAL/DIAMETER BUG DETECTION
    // ========================================================================
    const isLegacyRadial =
      dim.isLegacy &&
      (dim.dimensionType === "radius" || dim.dimensionType === "diameter");

    if (isLegacyRadial) {
      console.error(
        `[BUG] Legacy radial/diameter dimension ${dim.id} reached validateDimensionRefs! ` +
          `This should have short-circuited in AddDimensionCommand.`
      );
      return { valid: true };
    }

    // ========== LEGACY BYPASS (non-radial) ==========
    if (dim.isLegacy) {
      console.log(
        `[LEGACY DIMENSION] ${dim.id} (${dim.dimensionType}) - bypassing validation (display-only, not indexed)`
      );
      return { valid: true };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = dim as any;
    const dimType = dim.dimensionType;

    // ========== DIMENSION-TYPE AWARE VALIDATION ==========
    const validateRef = (
      ref: unknown,
      refName: string,
      required: boolean,
      expectedSnapTypes: string[],
      requirePointIndex: boolean
    ): { valid: boolean; error?: string } => {
      if (!ref || typeof ref !== "object") {
        if (required) {
          return {
            valid: false,
            error: `Dimension ${dim.id} (${dimType}): ${refName} is REQUIRED but missing - ABORT (no entity reference)`,
          };
        }
        return { valid: true };
      }

      const r = ref as {
        entityId?: string;
        pointIndex?: number;
        snapType?: string;
        entityType?: string;
      };

      // GUARD 1: entityId PHẢI tồn tại
      if (!r.entityId) {
        return {
          valid: false,
          error: `Dimension ${dim.id} (${dimType}): ${refName} exists but has no entityId - ABORT (orphan ref)`,
        };
      }

      // GUARD 2: entity PHẢI tồn tại trong document
      const entity = this.context.getCanvasEntity(r.entityId);
      if (!entity) {
        return {
          valid: false,
          error: `Dimension ${dim.id} (${dimType}): ${refName}.entityId "${r.entityId}" does not exist in document - ABORT`,
        };
      }

      // GUARD 2.5: BLOCK RECT/CIRCLE FOR ASSOCIATIVE DIMENSIONS
      const entityType = entity.type || r.entityType;
      const isRadialType = dimType === "radius" || dimType === "diameter";

      if (entityType === "rect") {
        return {
          valid: false,
          error:
            `Dimension ${dim.id} (${dimType}): ${refName} references RECT entity - ` +
            `ABORT (RECT is CONTAINER, use isLegacy=true for display-only dimensions)`,
        };
      }

      if (entityType === "circle" && !isRadialType) {
        return {
          valid: false,
          error:
            `Dimension ${dim.id} (${dimType}): ${refName} references CIRCLE entity - ` +
            `ABORT (CIRCLE only valid for radius/diameter dims, use isLegacy=true for display-only)`,
        };
      }

      // GUARD 3: SNAP TYPE VALIDATION
      const actualSnapType = r.snapType || "endpoint";
      if (
        expectedSnapTypes.length > 0 &&
        !expectedSnapTypes.includes(actualSnapType)
      ) {
        return {
          valid: false,
          error: `Dimension ${
            dim.id
          } (${dimType}): ${refName} has snapType "${actualSnapType}" but expected one of [${expectedSnapTypes.join(
            ", "
          )}] - ABORT`,
        };
      }

      // GUARD 4: pointIndex REQUIRED ONLY FOR ENDPOINT SNAPS
      if (requirePointIndex) {
        if (r.pointIndex === undefined || r.pointIndex === null) {
          return {
            valid: false,
            error: `Dimension ${dim.id} (${dimType}): ${refName} requires pointIndex but has none - ABORT (cannot resolve)`,
          };
        }

        if (entity && entity.points) {
          if (r.pointIndex < 0 || r.pointIndex >= entity.points.length) {
            return {
              valid: false,
              error: `Dimension ${dim.id} (${dimType}): ${refName}.pointIndex ${r.pointIndex} out of bounds (entity has ${entity.points.length} points) - ABORT`,
            };
          }
        }
      }

      // GUARD 5: ENTITY TYPE VALIDATION FOR RADIUS/DIAMETER
      if (isRadialType && refName === "ref1") {
        if (entityType !== "circle" && entityType !== "arc") {
          return {
            valid: false,
            error: `Dimension ${dim.id} (${dimType}): ${refName} must reference circle/arc but got "${entityType}" - ABORT`,
          };
        }
      }

      return { valid: true };
    };

    // ========== DETERMINE REQUIRED REFS AND VALIDATION RULES ==========
    const isLinearType = [
      "linear",
      "horizontal",
      "vertical",
      "aligned",
    ].includes(dimType);
    const isRadialType = ["radius", "diameter"].includes(dimType);
    const isAngularType = dimType === "angular";
    const isContinueOrBaseline = ["continue", "baseline"].includes(dimType);

    if (isLinearType) {
      const ref1Validation = validateRef(
        d.ref1,
        "ref1",
        true,
        ["endpoint"],
        true
      );
      if (!ref1Validation.valid) return ref1Validation;

      const ref2Validation = validateRef(
        d.ref2,
        "ref2",
        true,
        ["endpoint"],
        true
      );
      if (!ref2Validation.valid) return ref2Validation;
    } else if (isRadialType) {
      const ref1Validation = validateRef(
        d.ref1,
        "ref1",
        true,
        ["center", "endpoint"],
        false
      );
      if (!ref1Validation.valid) return ref1Validation;
    } else if (isAngularType) {
      const ref1Validation = validateRef(
        d.ref1,
        "ref1",
        true,
        ["endpoint"],
        true
      );
      if (!ref1Validation.valid) return ref1Validation;

      const ref2Validation = validateRef(
        d.ref2,
        "ref2",
        true,
        ["endpoint"],
        true
      );
      if (!ref2Validation.valid) return ref2Validation;

      const ref3Validation = validateRef(d.ref3, "ref3", false, [], false);
      if (!ref3Validation.valid) return ref3Validation;
    } else if (isContinueOrBaseline) {
      if (!d.parentDimId) {
        console.warn(
          `[validateDimensionRefs] ${dimType} dimension ${dim.id} missing parentDimId - allowing but may cause issues`
        );
      }
    } else {
      console.warn(
        `[validateDimensionRefs] Unknown dimension type "${dimType}" - applying minimal validation`
      );
      const ref1Validation = validateRef(d.ref1, "ref1", true, [], false);
      if (!ref1Validation.valid) return ref1Validation;
    }

    return { valid: true };
  }

  // ==================== Dimension CRUD ====================

  /**
   * Add a LEGACY radial/diameter dimension WITHOUT any validation
   * CRITICAL: Only call this from AddDimensionCommand short-circuit!
   */
  addLegacyRadialDimension(dimension: DimensionEntity): void {
    if (
      !dimension.isLegacy ||
      (dimension.dimensionType !== "radius" &&
        dimension.dimensionType !== "diameter")
    ) {
      console.error(
        `[BUG] addLegacyRadialDimension called for non-legacy-radial dimension: ` +
          `${dimension.id} (${dimension.dimensionType}, isLegacy=${dimension.isLegacy})`
      );
      return this.addDimension(dimension);
    }

    this.dimensions.set(dimension.id, dimension);
    this.context.markModified();
    console.log(
      `[LEGACY RADIAL] Added ${dimension.id} (${dimension.dimensionType}) - display-only`
    );
  }

  addDimension(dimension: DimensionEntity): void {
    const validation = this.validateDimensionRefs(dimension);
    if (!validation.valid) {
      console.error("[INVARIANT VIOLATION]", validation.error);
      throw new Error(`INVARIANT VIOLATION: ${validation.error}`);
    }

    this.dimensions.set(dimension.id, dimension);
    if (!dimension.isLegacy) {
      this.indexDimensionEntityRefs(dimension);
    }
    this.context.markModified();
  }

  addDimensions(dimensions: DimensionEntity[]): void {
    for (const dim of dimensions) {
      const validation = this.validateDimensionRefs(dim);
      if (!validation.valid) {
        console.error("[INVARIANT VIOLATION]", validation.error);
        throw new Error(`INVARIANT VIOLATION: ${validation.error}`);
      }

      this.dimensions.set(dim.id, dim);
      if (!dim.isLegacy) {
        this.indexDimensionEntityRefs(dim);
      }
    }
    this.context.markModified();
  }

  getDimension(id: string): DimensionEntity | undefined {
    return this.dimensions.get(id);
  }

  /**
   * Restore a dimension from undo/redo without validation.
   * Only use for undo/redo operations, not for new dimension creation!
   */
  restoreDimension(dimension: DimensionEntity): void {
    this.dimensions.set(dimension.id, dimension);
    if (!dimension.isLegacy) {
      this.indexDimensionEntityRefs(dimension);
    }
    this.context.markModified();
  }

  restoreDimensions(dimensions: DimensionEntity[]): void {
    for (const dim of dimensions) {
      this.dimensions.set(dim.id, dim);
      if (!dim.isLegacy) {
        this.indexDimensionEntityRefs(dim);
      }
    }
    this.context.markModified();
  }

  updateDimension(id: string, updates: Partial<DimensionEntity>): boolean {
    const dim = this.dimensions.get(id);
    if (!dim) return false;

    if (!dim.isLegacy) {
      this.unindexDimensionEntityRefs(dim);
    }

    const updated = { ...dim, ...updates };
    this.dimensions.set(id, updated);

    if (!updated.isLegacy) {
      this.indexDimensionEntityRefs(updated);
    }

    this.context.markModified();
    return true;
  }

  removeDimension(id: string): DimensionEntity | undefined {
    const dim = this.dimensions.get(id);
    if (dim) {
      this.unindexDimensionEntityRefs(dim);
      this.dimensions.delete(id);
      this.context.markModified();
    }
    return dim;
  }

  removeDimensions(ids: string[]): number {
    let count = 0;
    for (const id of ids) {
      const dim = this.dimensions.get(id);
      if (dim) {
        this.unindexDimensionEntityRefs(dim);
        this.dimensions.delete(id);
        count++;
      }
    }
    if (count > 0) this.context.markModified();
    return count;
  }

  getAllDimensions(): DimensionEntity[] {
    return Array.from(this.dimensions.values());
  }

  getDimensionCount(): number {
    return this.dimensions.size;
  }

  hasDimension(id: string): boolean {
    return this.dimensions.has(id);
  }

  clearDimensions(): void {
    this.dimensions.clear();
    this.entityToDimensionIndex.clear();
    this.context.markModified();
  }

  // ==================== Entity→Dimension Index ====================

  /**
   * Extract entity references from a dimension.
   * Returns array of entityIds that this dimension references.
   */
  private getDimensionEntityRefs(dim: DimensionEntity): string[] {
    const refs: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = dim as any;

    // Check ref1, ref2, ref3 (EntityReference style)
    if (d.ref1 && typeof d.ref1 === "object") {
      const ref = d.ref1 as { entityId?: string };
      if (ref.entityId) refs.push(ref.entityId);
    }
    if (d.ref2 && typeof d.ref2 === "object") {
      const ref = d.ref2 as { entityId?: string };
      if (ref.entityId) refs.push(ref.entityId);
    }
    if (d.ref3 && typeof d.ref3 === "object") {
      const ref = d.ref3 as { entityId?: string };
      if (ref.entityId) refs.push(ref.entityId);
    }

    // Check attachment1, attachment2, attachment3 (legacy style)
    if (d.attachment1?.entityId) refs.push(d.attachment1.entityId);
    if (d.attachment2?.entityId) refs.push(d.attachment2.entityId);
    if (d.attachment3?.entityId) refs.push(d.attachment3.entityId);

    return [...new Set(refs)]; // Remove duplicates
  }

  private indexDimensionEntityRefs(dim: DimensionEntity): void {
    const entityIds = this.getDimensionEntityRefs(dim);
    for (const entityId of entityIds) {
      let dimSet = this.entityToDimensionIndex.get(entityId);
      if (!dimSet) {
        dimSet = new Set();
        this.entityToDimensionIndex.set(entityId, dimSet);
      }
      dimSet.add(dim.id);
    }
  }

  private unindexDimensionEntityRefs(dim: DimensionEntity): void {
    const entityIds = this.getDimensionEntityRefs(dim);
    for (const entityId of entityIds) {
      const dimSet = this.entityToDimensionIndex.get(entityId);
      if (dimSet) {
        dimSet.delete(dim.id);
        if (dimSet.size === 0) {
          this.entityToDimensionIndex.delete(entityId);
        }
      }
    }
  }

  /**
   * Rebuild entire entity→dimension index.
   * Call this after loading document or when index may be stale.
   */
  rebuildDimensionIndex(): void {
    this.entityToDimensionIndex.clear();
    for (const dim of this.dimensions.values()) {
      this.indexDimensionEntityRefs(dim);
    }
  }

  /**
   * Get all dimensions that reference a specific entity.
   * O(1) lookup using index.
   */
  getDimensionsForEntity(entityId: string): DimensionEntity[] {
    const dimIds = this.entityToDimensionIndex.get(entityId);
    if (!dimIds || dimIds.size === 0) return [];

    const dims: DimensionEntity[] = [];
    for (const dimId of dimIds) {
      const dim = this.dimensions.get(dimId);
      if (dim) dims.push(dim);
    }
    return dims;
  }

  // ==================== Entity Geometry Lifecycle ====================
  // TRỤC SỐNG: Điểm trung tâm duy nhất để xử lý entity geometry changes

  /**
   * TRỤC SỐNG: Commit entity geometry change
   *
   * Call this method after ANY entity geometry modification:
   * - MOVE, DRAG, STRETCH, ROTATE, SCALE, COPY
   * - Parametric changes
   * - Any point modification
   *
   * This will:
   * 1. Find all dimensions referencing this entity
   * 2. Resolve new points from entity references
   * 3. Commit updated dimension data to document
   */
  commitEntityGeometryChange(entityId: string): number {
    const dims = this.getDimensionsForEntity(entityId);
    if (dims.length === 0) return 0;

    const entity = this.context.getCanvasEntity(entityId);
    if (!entity) return 0;

    let updatedCount = 0;

    for (const dim of dims) {
      const updates = this.resolveDimensionFromEntity(dim, entity);
      if (updates) {
        // GUARD: Validate updates before commit
        if (updates.value !== undefined) {
          if (updates.value === 0 || !Number.isFinite(updates.value)) {
            continue;
          }
        }

        // GUARD: Validate points are not (0,0)
        if (
          updates.point1 &&
          updates.point1.x === 0 &&
          updates.point1.y === 0
        ) {
          if (
            updates.point2 &&
            updates.point2.x === 0 &&
            updates.point2.y === 0
          ) {
            continue;
          }
        }

        const updated = { ...dim, ...updates };
        this.dimensions.set(dim.id, updated);
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      this.context.markModified();
    }

    return updatedCount;
  }

  /**
   * TRỤC SỐNG: Commit multiple entity geometry changes.
   * Use this for batch operations (MOVE multiple entities).
   */
  commitEntitiesGeometryChange(entityIds: string[]): number {
    let totalUpdated = 0;
    for (const entityId of entityIds) {
      totalUpdated += this.commitEntityGeometryChange(entityId);
    }
    return totalUpdated;
  }

  /**
   * Handle entity deletion - detach dimensions from deleted entity.
   * Converts associative dimensions to dumb dimensions.
   */
  handleEntityDeleted(entityId: string): void {
    const dims = this.getDimensionsForEntity(entityId);

    for (const dim of dims) {
      const updated = this.detachDimensionFromEntity(dim, entityId);
      this.dimensions.set(dim.id, updated);
    }

    // Remove entity from index
    this.entityToDimensionIndex.delete(entityId);

    if (dims.length > 0) {
      this.context.markModified();
    }
  }

  // ==================== Private Lifecycle Helpers ====================

  /**
   * Resolve dimension points from entity reference.
   *
   * GUARD RULE (Lifecycle):
   * - TUYỆT ĐỐI KHÔNG update/commit Dimension nếu không resolve được đầy đủ refs
   * - Nếu dimension có ref1 và ref2, PHẢI resolve được CẢ HAI mới commit
   * - KHÔNG BAO GIỜ ghi value = 0
   */
  private resolveDimensionFromEntity(
    dim: DimensionEntity,
    entity: CanvasEntity
  ): Partial<DimensionEntity> | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = dim as any;
    const updates: Partial<DimensionEntity> = {};

    const resolveRef = (
      ref:
        | {
            entityId?: string;
            snapType?: string;
            point?: { x: number; y: number };
            pointIndex?: number;
          }
        | undefined,
      targetEntityId: string
    ): { x: number; y: number } | null => {
      if (!ref || ref.entityId !== targetEntityId) return null;
      return this.resolveSnapPoint(
        entity,
        ref.snapType,
        ref.point,
        ref.pointIndex
      );
    };

    const hasRef1 = d.ref1 && d.ref1.entityId;
    const hasRef2 = d.ref2 && d.ref2.entityId;
    const ref1PointsToThisEntity = hasRef1 && d.ref1.entityId === entity.id;
    const ref2PointsToThisEntity = hasRef2 && d.ref2.entityId === entity.id;

    const isSingleEntityDimension =
      (!hasRef1 || ref1PointsToThisEntity) &&
      (!hasRef2 || ref2PointsToThisEntity);

    // Resolve ref1 → point1
    const newPoint1 = resolveRef(d.ref1, entity.id);
    if (newPoint1) {
      updates.point1 = newPoint1;
    }

    // Resolve ref2 → point2
    const newPoint2 = resolveRef(d.ref2, entity.id);
    if (newPoint2) {
      updates.point2 = newPoint2;
    }

    // Resolve ref3 → point3 (for angular dimensions)
    const newPoint3 = resolveRef(d.ref3, entity.id);
    if (newPoint3) {
      updates.point3 = newPoint3;
    }

    if (!newPoint1 && !newPoint2 && !newPoint3) {
      return null;
    }

    // ========== RECALCULATE VALUE ==========
    if (isSingleEntityDimension) {
      const finalPoint1 = updates.point1 || dim.point1;
      const finalPoint2 = updates.point2 || dim.point2;

      if (!finalPoint1 || !finalPoint2) {
        return Object.keys(updates).length > 0 ? updates : null;
      }

      if (
        finalPoint1.x === 0 &&
        finalPoint1.y === 0 &&
        finalPoint2.x === 0 &&
        finalPoint2.y === 0
      ) {
        return null;
      }

      if (dim.dimensionType === "radius") {
        if (entity.type === "circle" || entity.type === "arc") {
          const radius = entity.points[1]?.x;
          if (radius !== undefined && radius > 0) {
            updates.value = radius;
          }
        }
      } else if (dim.dimensionType === "diameter") {
        if (entity.type === "circle" || entity.type === "arc") {
          const radius = entity.points[1]?.x;
          if (radius !== undefined && radius > 0) {
            updates.value = radius * 2;
          }
        }
      } else {
        const dx = finalPoint2.x - finalPoint1.x;
        const dy = finalPoint2.y - finalPoint1.y;
        const calculatedValue = Math.sqrt(dx * dx + dy * dy);

        if (calculatedValue > 0) {
          updates.value = calculatedValue;
        }
      }
    }

    return Object.keys(updates).length > 0 ? updates : null;
  }

  /**
   * Resolve snap point from entity based on snap type.
   *
   * GUARD RULE: TUYỆT ĐỐI KHÔNG fallback về điểm sai
   */
  private resolveSnapPoint(
    entity: CanvasEntity,
    snapType?: string,
    originalPoint?: { x: number; y: number },
    pointIndex?: number
  ): { x: number; y: number } | null {
    if (!entity.points || entity.points.length === 0) return null;

    switch (snapType) {
      case "center":
        if (
          entity.type === "circle" ||
          entity.type === "arc" ||
          entity.type === "ellipse"
        ) {
          return { ...entity.points[0] };
        }
        if (entity.points.length >= 2) {
          const p1 = entity.points[0];
          const p2 = entity.points[entity.points.length - 1];
          return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        }
        return null;

      case "midpoint":
        if (entity.points.length >= 2) {
          const p1 = entity.points[0];
          const p2 = entity.points[1];
          return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        }
        return null;

      case "endpoint":
      default:
        // PRIORITY 1: Use pointIndex
        if (
          pointIndex !== undefined &&
          pointIndex >= 0 &&
          pointIndex < entity.points.length
        ) {
          return { ...entity.points[pointIndex] };
        }

        // ABORT: No pointIndex = Cannot resolve
        return null;
    }
  }

  /**
   * Detach dimension from deleted entity.
   * Clears the reference but keeps current coordinates.
   */
  private detachDimensionFromEntity(
    dim: DimensionEntity,
    deletedEntityId: string
  ): DimensionEntity {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = { ...dim } as any;

    if (updated.ref1 && typeof updated.ref1 === "object") {
      const ref = updated.ref1 as { entityId?: string };
      if (ref.entityId === deletedEntityId) {
        delete updated.ref1;
      }
    }
    if (updated.ref2 && typeof updated.ref2 === "object") {
      const ref = updated.ref2 as { entityId?: string };
      if (ref.entityId === deletedEntityId) {
        delete updated.ref2;
      }
    }
    if (updated.ref3 && typeof updated.ref3 === "object") {
      const ref = updated.ref3 as { entityId?: string };
      if (ref.entityId === deletedEntityId) {
        delete updated.ref3;
      }
    }

    // Clear legacy attachments
    if (updated.attachment1?.entityId === deletedEntityId) {
      delete updated.attachment1;
    }
    if (updated.attachment2?.entityId === deletedEntityId) {
      delete updated.attachment2;
    }
    if (updated.attachment3?.entityId === deletedEntityId) {
      delete updated.attachment3;
    }

    // Check if still has any references
    const hasRefs =
      updated.ref1 ||
      updated.ref2 ||
      updated.ref3 ||
      updated.attachment1 ||
      updated.attachment2 ||
      updated.attachment3;
    if (!hasRefs) {
      updated.isAssociative = false;
    }

    return updated as unknown as DimensionEntity;
  }

  // ==================== Serialization Helpers ====================

  /**
   * Load dimensions from serialized data (used by CadDocument.fromJSON).
   */
  loadFromData(dimensions: DimensionEntity[]): void {
    for (const dim of dimensions) {
      this.dimensions.set(dim.id, dim);
    }
    this.rebuildDimensionIndex();
  }
}
