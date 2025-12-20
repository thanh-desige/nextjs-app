/**
 * Block - Định nghĩa Block (như Symbol trong design tools)
 * Block là một nhóm entities có thể tái sử dụng
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import { IEntity, EntityJSON } from "../entities/Entity.types";
import { BoundingBox } from "../geometry/GeometryUtils";

// ==================== Block Definition ====================

export interface BlockDefinition {
  id: string;
  name: string;
  description?: string;
  /** Base point - điểm gốc của block */
  basePoint: IVec2;
  /** Các entities trong block */
  entities: IEntity[];
  /** Preview image (base64 hoặc URL) */
  thumbnail?: string;
  /** Block có thể explode không */
  explodable: boolean;
  /** Metadata */
  metadata?: Record<string, unknown>;
}

export interface BlockJSON {
  id: string;
  name: string;
  description?: string;
  basePoint: IVec2;
  entities: EntityJSON[];
  thumbnail?: string;
  explodable: boolean;
  metadata?: Record<string, unknown>;
}

// ==================== Block Reference ====================

export interface BlockReference {
  id: string;
  blockId: string;
  /** Vị trí chèn */
  insertionPoint: IVec2;
  /** Scale */
  scale: { x: number; y: number };
  /** Góc xoay (radian) */
  rotation: number;
  /** Layer chứa block ref */
  layerId: string;
}

// ==================== Block Class ====================

export class Block implements BlockDefinition {
  public id: string;
  public name: string;
  public description?: string;
  public basePoint: Vec2;
  public entities: IEntity[];
  public thumbnail?: string;
  public explodable: boolean;
  public metadata?: Record<string, unknown>;

  constructor(data: Partial<BlockDefinition> & { id: string; name: string }) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.basePoint = Vec2.from(data.basePoint ?? { x: 0, y: 0 });
    this.entities = data.entities ?? [];
    this.thumbnail = data.thumbnail;
    this.explodable = data.explodable ?? true;
    this.metadata = data.metadata;
  }

  // ==================== Entity Management ====================

  addEntity(entity: IEntity): void {
    this.entities.push(entity);
  }

  removeEntity(entityId: string): boolean {
    const index = this.entities.findIndex((e) => e.id === entityId);
    if (index !== -1) {
      this.entities.splice(index, 1);
      return true;
    }
    return false;
  }

  getEntityCount(): number {
    return this.entities.length;
  }

  // ==================== Geometry ====================

  getBounds(): BoundingBox {
    if (this.entities.length === 0) {
      return {
        min: this.basePoint.clone(),
        max: this.basePoint.clone(),
      };
    }

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    for (const entity of this.entities) {
      const bounds = entity.getBounds();
      minX = Math.min(minX, bounds.min.x);
      minY = Math.min(minY, bounds.min.y);
      maxX = Math.max(maxX, bounds.max.x);
      maxY = Math.max(maxY, bounds.max.y);
    }

    return {
      min: new Vec2(minX, minY),
      max: new Vec2(maxX, maxY),
    };
  }

  // ==================== Serialization ====================

  toJSON(): BlockJSON {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      basePoint: this.basePoint.toObject(),
      entities: this.entities.map((e) => e.toJSON()),
      thumbnail: this.thumbnail,
      explodable: this.explodable,
      metadata: this.metadata,
    };
  }

  // Note: fromJSON cần EntityFactory để reconstruct entities
  static fromJSON(
    data: BlockJSON,
    entityFactory: (json: EntityJSON) => IEntity
  ): Block {
    const block = new Block({
      id: data.id,
      name: data.name,
      description: data.description,
      basePoint: data.basePoint,
      thumbnail: data.thumbnail,
      explodable: data.explodable,
      metadata: data.metadata,
    });

    block.entities = data.entities.map(entityFactory);
    return block;
  }
}

// ==================== Block Manager ====================

export class BlockManager {
  private blocks: Map<string, Block> = new Map();

  // ==================== Block CRUD ====================

  addBlock(block: Block): void {
    if (this.blocks.has(block.id)) {
      throw new Error(`Block '${block.id}' already exists`);
    }
    this.blocks.set(block.id, block);
  }

  createBlock(name: string, entities: IEntity[], basePoint?: IVec2): Block {
    const id = `block_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const block = new Block({
      id,
      name,
      entities: [...entities],
      basePoint: basePoint ?? { x: 0, y: 0 },
    });
    this.addBlock(block);
    return block;
  }

  getBlock(id: string): Block | undefined {
    return this.blocks.get(id);
  }

  getBlockByName(name: string): Block | undefined {
    for (const block of this.blocks.values()) {
      if (block.name === name) return block;
    }
    return undefined;
  }

  removeBlock(id: string): boolean {
    return this.blocks.delete(id);
  }

  getAllBlocks(): Block[] {
    return Array.from(this.blocks.values());
  }

  hasBlock(id: string): boolean {
    return this.blocks.has(id);
  }

  // ==================== Block Instance (Reference) ====================

  createReference(
    blockId: string,
    insertionPoint: IVec2,
    options?: {
      scale?: { x: number; y: number };
      rotation?: number;
      layerId?: string;
    }
  ): BlockReference {
    if (!this.blocks.has(blockId)) {
      throw new Error(`Block '${blockId}' not found`);
    }

    return {
      id: `blockref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      blockId,
      insertionPoint: { ...insertionPoint },
      scale: options?.scale ?? { x: 1, y: 1 },
      rotation: options?.rotation ?? 0,
      layerId: options?.layerId ?? "0",
    };
  }

  // ==================== Serialization ====================

  toJSON(): BlockJSON[] {
    return this.getAllBlocks().map((b) => b.toJSON());
  }

  static fromJSON(
    data: BlockJSON[],
    entityFactory: (json: EntityJSON) => IEntity
  ): BlockManager {
    const manager = new BlockManager();

    for (const blockData of data) {
      const block = Block.fromJSON(blockData, entityFactory);
      manager.blocks.set(block.id, block);
    }

    return manager;
  }
}

export default Block;
