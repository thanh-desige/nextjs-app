/**
 * Command Context - Context cho việc thực thi command
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import { EntityStyle, IEntity } from "../entities/Entity.types";
import { CadEngine } from "../engine/CadEngine";
import { CommandContext } from "./Command.types";

export function createCommandContext(
  engine: CadEngine,
  points: IVec2[] = [],
  options: Record<string, unknown> = {}
): CommandContext {
  return {
    engine,
    points: points.map((p) => Vec2.from(p)),
    options,
    style: engine.getCurrentStyle(),
    layerId: engine.getActiveLayerId(),
  };
}

/**
 * CommandContextBuilder - Builder pattern cho CommandContext
 */
export class CommandContextBuilder {
  private _engine: CadEngine;
  private _points: IVec2[] = [];
  private _options: Record<string, unknown> = {};
  private _style: EntityStyle;
  private _layerId: string;

  constructor(engine: CadEngine) {
    this._engine = engine;
    this._style = engine.getCurrentStyle();
    this._layerId = engine.getActiveLayerId();
  }

  withPoints(points: IVec2[]): this {
    this._points = [...points];
    return this;
  }

  addPoint(point: IVec2): this {
    this._points.push(point);
    return this;
  }

  withOption(key: string, value: unknown): this {
    this._options[key] = value;
    return this;
  }

  withOptions(options: Record<string, unknown>): this {
    this._options = { ...this._options, ...options };
    return this;
  }

  withStyle(style: Partial<EntityStyle>): this {
    this._style = { ...this._style, ...style };
    return this;
  }

  withLayerId(layerId: string): this {
    this._layerId = layerId;
    return this;
  }

  build(): CommandContext {
    return {
      engine: this._engine,
      points: this._points.map((p) => Vec2.from(p)),
      options: { ...this._options },
      style: { ...this._style },
      layerId: this._layerId,
    };
  }
}

/**
 * Snapshot Manager - Quản lý snapshot để undo
 */
export class SnapshotManager {
  /**
   * Tạo snapshot của entities
   */
  static createEntitiesSnapshot(entities: IEntity[]): EntitySnapshot[] {
    return entities.map((e) => ({
      id: e.id,
      json: e.toJSON(),
    }));
  }

  /**
   * Restore entities từ snapshot
   */
  static restoreEntitiesSnapshot(
    engine: CadEngine,
    snapshots: EntitySnapshot[],
    factory: (json: unknown) => IEntity
  ): void {
    for (const snapshot of snapshots) {
      const existing = engine.getEntity(snapshot.id);
      if (existing) {
        engine.removeEntity(snapshot.id);
      }
      const restored = factory(snapshot.json);
      engine.addEntity(restored);
    }
  }
}

interface EntitySnapshot {
  id: string;
  json: unknown;
}
