/**
 * OsnapManager - Quản lý Object Snap
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import { IEntity, EntityType } from "../entities/Entity.types";
import { LineEntity } from "../entities/Line";
import { CircleEntity } from "../entities/Circle";
import { ArcEntity } from "../entities/Arc";
import { PolylineEntity } from "../entities/Polyline";
import {
  midpoint,
  projectPointToSegment,
  intersectSegments,
} from "../geometry/GeometryUtils";
import {
  OsnapMode,
  OsnapResult,
  OsnapSettings,
  DEFAULT_OSNAP_SETTINGS,
  OSNAP_MODE_NAMES,
  isModeEnabled,
} from "./Osnap.types";

// ==================== Osnap Manager ====================

export class OsnapManager {
  private settings: OsnapSettings;
  private entities: IEntity[] = [];
  private lastResult: OsnapResult | null = null;

  constructor(settings?: Partial<OsnapSettings>) {
    this.settings = { ...DEFAULT_OSNAP_SETTINGS, ...settings };
  }

  // ==================== Settings ====================

  getSettings(): OsnapSettings {
    return { ...this.settings };
  }

  updateSettings(settings: Partial<OsnapSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.settings.enabled;
  }

  toggleMode(mode: OsnapMode): void {
    this.settings.enabledModes ^= mode;
  }

  // ==================== Entity Management ====================

  setEntities(entities: IEntity[]): void {
    this.entities = entities;
  }

  // ==================== Main Snap Function ====================

  /**
   * Tìm snap point gần cursor nhất
   */
  findSnapPoint(cursorWorld: IVec2, apertureWorld: number): OsnapResult | null {
    if (!this.settings.enabled || this.entities.length === 0) {
      return null;
    }

    const candidates: OsnapResult[] = [];

    // Tìm tất cả snap points trong aperture
    for (const entity of this.entities) {
      if (!entity.state.visible) continue;

      const entitySnaps = this.findEntitySnapPoints(
        entity,
        cursorWorld,
        apertureWorld
      );
      candidates.push(...entitySnaps);
    }

    // Tìm intersections
    if (isModeEnabled(this.settings, OsnapMode.INTERSECTION)) {
      const intersections = this.findIntersections(cursorWorld, apertureWorld);
      candidates.push(...intersections);
    }

    if (candidates.length === 0) {
      this.lastResult = null;
      return null;
    }

    // Sort by distance and priority
    candidates.sort((a, b) => {
      // Priority: INTERSECTION > ENDPOINT > MIDPOINT > CENTER > others
      const priorityA = this.getModePriority(a.mode);
      const priorityB = this.getModePriority(b.mode);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.distance - b.distance;
    });

    this.lastResult = candidates[0];
    return this.lastResult;
  }

  getLastResult(): OsnapResult | null {
    return this.lastResult;
  }

  // ==================== Entity-specific Snap Points ====================

  private findEntitySnapPoints(
    entity: IEntity,
    cursor: IVec2,
    aperture: number
  ): OsnapResult[] {
    const results: OsnapResult[] = [];

    switch (entity.type) {
      case EntityType.LINE:
        results.push(
          ...this.findLineSnapPoints(entity as LineEntity, cursor, aperture)
        );
        break;

      case EntityType.CIRCLE:
        results.push(
          ...this.findCircleSnapPoints(entity as CircleEntity, cursor, aperture)
        );
        break;

      case EntityType.ARC:
        results.push(
          ...this.findArcSnapPoints(entity as ArcEntity, cursor, aperture)
        );
        break;

      case EntityType.POLYLINE:
        results.push(
          ...this.findPolylineSnapPoints(
            entity as PolylineEntity,
            cursor,
            aperture
          )
        );
        break;
    }

    // Nearest point (cho tất cả entity types)
    if (isModeEnabled(this.settings, OsnapMode.NEAREST)) {
      const nearest = this.findNearestPoint(entity, cursor, aperture);
      if (nearest) results.push(nearest);
    }

    return results;
  }

  private findLineSnapPoints(
    line: LineEntity,
    cursor: IVec2,
    aperture: number
  ): OsnapResult[] {
    const results: OsnapResult[] = [];
    const start = line.start;
    const end = line.end;

    // Endpoint
    if (isModeEnabled(this.settings, OsnapMode.ENDPOINT)) {
      const distStart = Vec2.from(cursor).distanceTo(start);
      if (distStart <= aperture) {
        results.push({
          point: start,
          mode: OsnapMode.ENDPOINT,
          entity: line,
          distance: distStart,
          description: OSNAP_MODE_NAMES[OsnapMode.ENDPOINT],
        });
      }

      const distEnd = Vec2.from(cursor).distanceTo(end);
      if (distEnd <= aperture) {
        results.push({
          point: end,
          mode: OsnapMode.ENDPOINT,
          entity: line,
          distance: distEnd,
          description: OSNAP_MODE_NAMES[OsnapMode.ENDPOINT],
        });
      }
    }

    // Midpoint
    if (isModeEnabled(this.settings, OsnapMode.MIDPOINT)) {
      const mid = midpoint(start, end);
      const distMid = Vec2.from(cursor).distanceTo(mid);
      if (distMid <= aperture) {
        results.push({
          point: mid,
          mode: OsnapMode.MIDPOINT,
          entity: line,
          distance: distMid,
          description: OSNAP_MODE_NAMES[OsnapMode.MIDPOINT],
        });
      }
    }

    return results;
  }

  private findCircleSnapPoints(
    circle: CircleEntity,
    cursor: IVec2,
    aperture: number
  ): OsnapResult[] {
    const results: OsnapResult[] = [];
    const center = Vec2.from(circle.center);

    // Center
    if (isModeEnabled(this.settings, OsnapMode.CENTER)) {
      const distCenter = Vec2.from(cursor).distanceTo(center);
      if (distCenter <= aperture) {
        results.push({
          point: center,
          mode: OsnapMode.CENTER,
          entity: circle,
          distance: distCenter,
          description: OSNAP_MODE_NAMES[OsnapMode.CENTER],
        });
      }
    }

    // Quadrant points
    if (isModeEnabled(this.settings, OsnapMode.QUADRANT)) {
      const quadrants = [
        new Vec2(center.x + circle.radius, center.y), // Right
        new Vec2(center.x, center.y + circle.radius), // Top
        new Vec2(center.x - circle.radius, center.y), // Left
        new Vec2(center.x, center.y - circle.radius), // Bottom
      ];

      for (const quad of quadrants) {
        const dist = Vec2.from(cursor).distanceTo(quad);
        if (dist <= aperture) {
          results.push({
            point: quad,
            mode: OsnapMode.QUADRANT,
            entity: circle,
            distance: dist,
            description: OSNAP_MODE_NAMES[OsnapMode.QUADRANT],
          });
        }
      }
    }

    return results;
  }

  private findArcSnapPoints(
    arc: ArcEntity,
    cursor: IVec2,
    aperture: number
  ): OsnapResult[] {
    const results: OsnapResult[] = [];
    const center = Vec2.from(arc.center);

    // Center
    if (isModeEnabled(this.settings, OsnapMode.CENTER)) {
      const distCenter = Vec2.from(cursor).distanceTo(center);
      if (distCenter <= aperture) {
        results.push({
          point: center,
          mode: OsnapMode.CENTER,
          entity: arc,
          distance: distCenter,
          description: OSNAP_MODE_NAMES[OsnapMode.CENTER],
        });
      }
    }

    // Endpoints
    if (isModeEnabled(this.settings, OsnapMode.ENDPOINT)) {
      const startPoint = new Vec2(
        center.x + arc.radius * Math.cos(arc.startAngle),
        center.y + arc.radius * Math.sin(arc.startAngle)
      );
      const endPoint = new Vec2(
        center.x + arc.radius * Math.cos(arc.endAngle),
        center.y + arc.radius * Math.sin(arc.endAngle)
      );

      const distStart = Vec2.from(cursor).distanceTo(startPoint);
      if (distStart <= aperture) {
        results.push({
          point: startPoint,
          mode: OsnapMode.ENDPOINT,
          entity: arc,
          distance: distStart,
          description: OSNAP_MODE_NAMES[OsnapMode.ENDPOINT],
        });
      }

      const distEnd = Vec2.from(cursor).distanceTo(endPoint);
      if (distEnd <= aperture) {
        results.push({
          point: endPoint,
          mode: OsnapMode.ENDPOINT,
          entity: arc,
          distance: distEnd,
          description: OSNAP_MODE_NAMES[OsnapMode.ENDPOINT],
        });
      }
    }

    // Midpoint
    if (isModeEnabled(this.settings, OsnapMode.MIDPOINT)) {
      const midAngle = (arc.startAngle + arc.endAngle) / 2;
      const midPoint = new Vec2(
        center.x + arc.radius * Math.cos(midAngle),
        center.y + arc.radius * Math.sin(midAngle)
      );
      const distMid = Vec2.from(cursor).distanceTo(midPoint);
      if (distMid <= aperture) {
        results.push({
          point: midPoint,
          mode: OsnapMode.MIDPOINT,
          entity: arc,
          distance: distMid,
          description: OSNAP_MODE_NAMES[OsnapMode.MIDPOINT],
        });
      }
    }

    return results;
  }

  private findPolylineSnapPoints(
    polyline: PolylineEntity,
    cursor: IVec2,
    aperture: number
  ): OsnapResult[] {
    const results: OsnapResult[] = [];
    const points = polyline.points;

    // Endpoints và vertices
    if (isModeEnabled(this.settings, OsnapMode.ENDPOINT)) {
      for (const point of points) {
        const dist = Vec2.from(cursor).distanceTo(point);
        if (dist <= aperture) {
          results.push({
            point,
            mode: OsnapMode.ENDPOINT,
            entity: polyline,
            distance: dist,
            description: OSNAP_MODE_NAMES[OsnapMode.ENDPOINT],
          });
        }
      }
    }

    // Midpoints của từng segment
    if (isModeEnabled(this.settings, OsnapMode.MIDPOINT)) {
      for (let i = 0; i < points.length - 1; i++) {
        const mid = midpoint(points[i], points[i + 1]);
        const dist = Vec2.from(cursor).distanceTo(mid);
        if (dist <= aperture) {
          results.push({
            point: mid,
            mode: OsnapMode.MIDPOINT,
            entity: polyline,
            distance: dist,
            description: OSNAP_MODE_NAMES[OsnapMode.MIDPOINT],
          });
        }
      }

      // Closed polyline - midpoint của segment cuối
      if (polyline.closed && points.length >= 2) {
        const mid = midpoint(points[points.length - 1], points[0]);
        const dist = Vec2.from(cursor).distanceTo(mid);
        if (dist <= aperture) {
          results.push({
            point: mid,
            mode: OsnapMode.MIDPOINT,
            entity: polyline,
            distance: dist,
            description: OSNAP_MODE_NAMES[OsnapMode.MIDPOINT],
          });
        }
      }
    }

    return results;
  }

  // ==================== Special Snap Modes ====================

  private findNearestPoint(
    entity: IEntity,
    cursor: IVec2,
    aperture: number
  ): OsnapResult | null {
    // Get nearest point on entity
    let nearest: Vec2 | null = null;
    let minDist = Infinity;

    if (entity.type === EntityType.LINE) {
      const line = entity as LineEntity;
      nearest = projectPointToSegment(cursor, line.start, line.end);
      minDist = Vec2.from(cursor).distanceTo(nearest);
    } else if (entity.type === EntityType.POLYLINE) {
      const polyline = entity as PolylineEntity;
      const points = polyline.points;

      for (let i = 0; i < points.length - 1; i++) {
        const proj = projectPointToSegment(cursor, points[i], points[i + 1]);
        const dist = Vec2.from(cursor).distanceTo(proj);
        if (dist < minDist) {
          minDist = dist;
          nearest = proj;
        }
      }
    } else if (entity.type === EntityType.CIRCLE) {
      const circle = entity as CircleEntity;
      const center = Vec2.from(circle.center);
      const toPoint = Vec2.from(cursor).sub(center);
      nearest = center.add(toPoint.normalize().mul(circle.radius));
      minDist = Vec2.from(cursor).distanceTo(nearest);
    }

    if (nearest && minDist <= aperture) {
      return {
        point: nearest,
        mode: OsnapMode.NEAREST,
        entity,
        distance: minDist,
        description: OSNAP_MODE_NAMES[OsnapMode.NEAREST],
      };
    }

    return null;
  }

  private findIntersections(cursor: IVec2, aperture: number): OsnapResult[] {
    const results: OsnapResult[] = [];
    const lineEntities = this.entities.filter(
      (e) => e.type === EntityType.LINE
    ) as LineEntity[];

    // Find all line-line intersections
    for (let i = 0; i < lineEntities.length; i++) {
      for (let j = i + 1; j < lineEntities.length; j++) {
        const line1 = lineEntities[i];
        const line2 = lineEntities[j];

        const result = intersectSegments(
          line1.start,
          line1.end,
          line2.start,
          line2.end
        );

        if (result.intersects && result.points.length > 0) {
          const point = result.points[0];
          const dist = Vec2.from(cursor).distanceTo(point);

          if (dist <= aperture) {
            results.push({
              point,
              mode: OsnapMode.INTERSECTION,
              entity: line1,
              entity2: line2,
              distance: dist,
              description: OSNAP_MODE_NAMES[OsnapMode.INTERSECTION],
            });
          }
        }
      }
    }

    return results;
  }

  // ==================== Helpers ====================

  private getModePriority(mode: OsnapMode): number {
    // Lower = higher priority
    switch (mode) {
      case OsnapMode.INTERSECTION:
        return 1;
      case OsnapMode.ENDPOINT:
        return 2;
      case OsnapMode.MIDPOINT:
        return 3;
      case OsnapMode.CENTER:
        return 4;
      case OsnapMode.QUADRANT:
        return 5;
      case OsnapMode.PERPENDICULAR:
        return 6;
      case OsnapMode.TANGENT:
        return 7;
      case OsnapMode.NEAREST:
        return 10;
      default:
        return 20;
    }
  }
}

export default OsnapManager;
