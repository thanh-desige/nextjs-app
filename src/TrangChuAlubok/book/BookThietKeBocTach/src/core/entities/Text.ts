/**
 * Text Entity - Văn bản trong CAD
 */

import { Vec2, IVec2 } from "../geometry/Vec2";
import { Matrix3 } from "../geometry/Matrix3";
import { BoundingBox } from "../geometry/GeometryUtils";
import { BaseEntity, createGripPoint } from "./BaseEntity";
import {
  EntityType,
  EntityStyle,
  EntityJSON,
  GripPoint,
  GripType,
  ITextEntity,
} from "./Entity.types";

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  textBaseline: "top" | "middle" | "bottom";
}

const DEFAULT_TEXT_STYLE: TextStyle = {
  fontSize: 12,
  fontFamily: "Arial",
  fontWeight: "normal",
  fontStyle: "normal",
  textAlign: "left",
  textBaseline: "middle",
};

export class TextEntity extends BaseEntity implements ITextEntity {
  public readonly type = EntityType.TEXT;
  public position: Vec2;
  public text: string;
  public fontSize: number;
  public fontFamily: string;
  public fontWeight: "normal" | "bold";
  public fontStyle: "normal" | "italic";
  public textAlign: "left" | "center" | "right";
  public textBaseline: "top" | "middle" | "bottom";
  public rotation: number; // radian

  constructor(
    position: IVec2,
    text: string,
    options?: {
      id?: string;
      name?: string;
      layerId?: string;
      style?: Partial<EntityStyle>;
      textStyle?: Partial<TextStyle>;
      rotation?: number;
    }
  ) {
    super(options);
    this.position = Vec2.from(position);
    this.text = text;

    const ts = { ...DEFAULT_TEXT_STYLE, ...options?.textStyle };
    this.fontSize = ts.fontSize;
    this.fontFamily = ts.fontFamily;
    this.fontWeight = ts.fontWeight;
    this.fontStyle = ts.fontStyle;
    this.textAlign = ts.textAlign;
    this.textBaseline = ts.textBaseline;
    this.rotation = options?.rotation ?? 0;
  }

  // ==================== Factory Methods ====================

  static create(
    position: IVec2,
    text: string,
    style?: Partial<EntityStyle>,
    textStyle?: Partial<TextStyle>
  ): TextEntity {
    return new TextEntity(position, text, { style, textStyle });
  }

  static fromJSON(json: EntityJSON): TextEntity {
    const entity = new TextEntity(json.position as IVec2, json.text as string, {
      id: json.id,
      name: json.name,
      layerId: json.layerId,
      style: json.style,
      textStyle: {
        fontSize: json.fontSize as number,
        fontFamily: json.fontFamily as string,
        fontWeight: json.fontWeight as "normal" | "bold",
        fontStyle: json.fontStyle as "normal" | "italic",
        textAlign: json.textAlign as "left" | "center" | "right",
        textBaseline: json.textBaseline as "top" | "middle" | "bottom",
      },
      rotation: json.rotation as number,
    });
    entity.metadata = json.metadata;
    return entity;
  }

  // ==================== Geometry ====================

  /** Lấy font string cho canvas */
  getFontString(): string {
    return `${this.fontStyle} ${this.fontWeight} ${this.fontSize}px ${this.fontFamily}`;
  }

  /** Ước tính chiều rộng text (approximate) */
  estimateWidth(): number {
    // Rough estimate: average character width ≈ 0.6 * fontSize
    return this.text.length * this.fontSize * 0.6;
  }

  /** Ước tính chiều cao text */
  estimateHeight(): number {
    const lineCount = this.text.split("\n").length;
    return lineCount * this.fontSize * 1.2; // 1.2 line height
  }

  /** Lấy các dòng text */
  getLines(): string[] {
    return this.text.split("\n");
  }

  // ==================== BaseEntity Implementation ====================

  clone(): TextEntity {
    const cloned = new TextEntity(this.position.clone(), this.text, {
      textStyle: {
        fontSize: this.fontSize,
        fontFamily: this.fontFamily,
        fontWeight: this.fontWeight,
        fontStyle: this.fontStyle,
        textAlign: this.textAlign,
        textBaseline: this.textBaseline,
      },
      rotation: this.rotation,
    });
    cloned.copyBaseFrom(this);
    return cloned;
  }

  getBounds(): BoundingBox {
    // Ước tính bounds (chính xác hơn cần context.measureText)
    const width = this.estimateWidth();
    const height = this.estimateHeight();

    let offsetX = 0;
    switch (this.textAlign) {
      case "center":
        offsetX = -width / 2;
        break;
      case "right":
        offsetX = -width;
        break;
    }

    let offsetY = 0;
    switch (this.textBaseline) {
      case "middle":
        offsetY = -height / 2;
        break;
      case "bottom":
        offsetY = -height;
        break;
    }

    const corners = [
      new Vec2(offsetX, offsetY),
      new Vec2(offsetX + width, offsetY),
      new Vec2(offsetX + width, offsetY + height),
      new Vec2(offsetX, offsetY + height),
    ];

    // Apply rotation
    if (this.rotation !== 0) {
      const matrix = Matrix3.translation(
        this.position.x,
        this.position.y
      ).rotate(this.rotation);

      let minX = Infinity,
        minY = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity;

      for (const corner of corners) {
        const rotated = matrix.transformPoint(corner);
        if (rotated.x < minX) minX = rotated.x;
        if (rotated.y < minY) minY = rotated.y;
        if (rotated.x > maxX) maxX = rotated.x;
        if (rotated.y > maxY) maxY = rotated.y;
      }

      return { min: new Vec2(minX, minY), max: new Vec2(maxX, maxY) };
    }

    return {
      min: new Vec2(this.position.x + offsetX, this.position.y + offsetY),
      max: new Vec2(
        this.position.x + offsetX + width,
        this.position.y + offsetY + height
      ),
    };
  }

  containsPoint(point: IVec2, tolerance: number = 5): boolean {
    const bounds = this.getBounds();
    return (
      point.x >= bounds.min.x - tolerance &&
      point.x <= bounds.max.x + tolerance &&
      point.y >= bounds.min.y - tolerance &&
      point.y <= bounds.max.y + tolerance
    );
  }

  getGripPoints(): GripPoint[] {
    const bounds = this.getBounds();
    const center = new Vec2(
      (bounds.min.x + bounds.max.x) / 2,
      (bounds.min.y + bounds.max.y) / 2
    );

    return [
      createGripPoint(this.position, GripType.ENDPOINT, this.id, 0),
      createGripPoint(center, GripType.CENTER, this.id, 1),
      // Rotation grip (phía trên text)
      createGripPoint(
        new Vec2(center.x, bounds.min.y - 20),
        GripType.ROTATION,
        this.id,
        2
      ),
    ];
  }

  moveGripPoint(gripIndex: number, newPosition: IVec2): void {
    switch (gripIndex) {
      case 0: // Position
        this.position.copy(newPosition);
        break;
      case 1: // Center - move whole text
        const bounds = this.getBounds();
        const center = new Vec2(
          (bounds.min.x + bounds.max.x) / 2,
          (bounds.min.y + bounds.max.y) / 2
        );
        const dx = newPosition.x - center.x;
        const dy = newPosition.y - center.y;
        this.position.addSelf({ x: dx, y: dy });
        break;
      case 2: // Rotation
        const current = this.getBounds();
        const currentCenter = new Vec2(
          (current.min.x + current.max.x) / 2,
          (current.min.y + current.max.y) / 2
        );
        this.rotation =
          Math.atan2(
            newPosition.y - currentCenter.y,
            newPosition.x - currentCenter.x
          ) +
          Math.PI / 2;
        break;
    }
  }

  getPoints(): Vec2[] {
    return [this.position];
  }

  translate(dx: number, dy: number): void {
    this.position.addSelf({ x: dx, y: dy });
  }

  rotate(angle: number, center: IVec2): void {
    const rotated = this.position.rotateAround(center, angle);
    this.position.copy(rotated);
    this.rotation += angle;
  }

  // ==================== Text-specific Methods ====================

  /** Set text content */
  setText(text: string): void {
    this.text = text;
  }

  /** Set font size */
  setFontSize(size: number): void {
    this.fontSize = size;
  }

  /** Set font family */
  setFontFamily(family: string): void {
    this.fontFamily = family;
  }

  /** Set text alignment */
  setAlignment(align: "left" | "center" | "right"): void {
    this.textAlign = align;
  }

  // ==================== Serialization ====================

  toJSON(): EntityJSON {
    return {
      ...this.serializeBase(),
      type: this.type,
      position: this.position.toObject(),
      text: this.text,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      fontStyle: this.fontStyle,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
      rotation: this.rotation,
    } as EntityJSON;
  }
}
