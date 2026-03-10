/**
 * TEXT Command - Tạo văn bản với nhiều tùy chọn nâng cao
 *
 * Workflow:
 * 1. Click vị trí đặt text
 * 2. Nhập nội dung text
 * 3. Tùy chọn: Justify (căn chỉnh), Height (chiều cao), Rotation (góc xoay)
 */

import { IVec2 } from "../../geometry/Vec2";
import { TextEntity } from "../../entities/Text";
import { IEntity } from "../../entities/Entity.types";
import { ToolMode } from "../../engine/EngineState";
import {
  IInteractiveCommand,
  CommandContext,
  CommandResult,
  CommandOption,
} from "../Command.types";

export interface TextOptions {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  textAlign?: "left" | "center" | "right";
  textBaseline?: "top" | "middle" | "bottom";
  rotation?: number;
  lineHeight?: number;
  scale?: number; // Text scale factor (1 = normal, 2 = double size, etc.)
}

export class TextCommand implements IInteractiveCommand {
  readonly name = "TEXT";
  readonly description = "Tạo văn bản đơn hoặc đa dòng";
  readonly canUndo = true;
  readonly toolMode = ToolMode.DRAW_TEXT;
  readonly requiredPoints = 1;
  readonly autoComplete = false; // Don't auto-complete - wait for text input

  private createdEntity: IEntity | null = null;
  private textContent: string = "";
  private textOptions: TextOptions = {
    fontSize: 14,
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "left",
    textBaseline: "middle",
    rotation: 0,
    lineHeight: 1.2,
    scale: 1, // Default scale
  };

  getPrompt(pointCount: number): string {
    const scaleInfo =
      this.textOptions.scale !== 1
        ? ` [Scale: ${this.textOptions.scale}x]`
        : "";
    const heightInfo = `H=${this.textOptions.fontSize}`;

    if (pointCount === 0) {
      return `TEXT (${heightInfo}${scaleInfo}): Chọn vị trí chèn văn bản [Height/Justify/Style/Rotation/X=scale]:`;
    }
    return `TEXT (${heightInfo}${scaleInfo}): Nhập nội dung văn bản (Enter để hoàn thành):`;
  }

  getOptions(pointCount: number): CommandOption[] {
    if (pointCount === 0) {
      return [
        { key: "H", label: "Height", description: "Đặt chiều cao chữ" },
        { key: "J", label: "Justify", description: "Căn chỉnh văn bản" },
        { key: "S", label: "Style", description: "Chọn kiểu chữ" },
        { key: "R", label: "Rotation", description: "Góc xoay văn bản" },
        { key: "X", label: "Scale", description: "Tỷ lệ văn bản (1 = 100%)" },
      ];
    }
    return [
      { key: "B", label: "Bold", description: "In đậm" },
      { key: "I", label: "Italic", description: "In nghiêng" },
      { key: "X", label: "Scale", description: "Tỷ lệ văn bản" },
    ];
  }

  /**
   * Get scaled font size
   */
  private getScaledFontSize(): number {
    const baseFontSize = this.textOptions.fontSize || 14;
    const scale = this.textOptions.scale || 1;
    return baseFontSize * scale;
  }

  createPreview(context: CommandContext, currentPoint: IVec2): IEntity | null {
    const scaledFontSize = this.getScaledFontSize();

    if (context.points.length === 0) {
      // Preview tại vị trí chuột với text placeholder
      return TextEntity.create(
        currentPoint,
        this.textContent || "ABC",
        context.style,
        {
          fontSize: scaledFontSize,
          fontFamily: this.textOptions.fontFamily,
          fontWeight: this.textOptions.fontWeight,
          fontStyle: this.textOptions.fontStyle,
          textAlign: this.textOptions.textAlign,
          textBaseline: this.textOptions.textBaseline,
        }
      );
    } else if (context.points.length === 1 && this.textContent) {
      // Preview với text content thực tế
      const textEntity = TextEntity.create(
        context.points[0],
        this.textContent,
        context.style,
        {
          fontSize: scaledFontSize,
          fontFamily: this.textOptions.fontFamily,
          fontWeight: this.textOptions.fontWeight,
          fontStyle: this.textOptions.fontStyle,
          textAlign: this.textOptions.textAlign,
          textBaseline: this.textOptions.textBaseline,
        }
      );

      if (this.textOptions.rotation) {
        textEntity.rotation = this.textOptions.rotation;
      }

      return textEntity;
    }
    return null;
  }

  canComplete(pointCount: number): boolean {
    // Cần 1 điểm và có text content
    return pointCount >= 1 && this.textContent.length > 0;
  }

  handleOption(option: string, _context: CommandContext): void {
    const opt = option.toUpperCase();

    switch (opt) {
      case "H": // Height
        // Trong thực tế, cần input từ user
        // Tạm thời cycle qua các size phổ biến
        const sizes = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48];
        const currentIndex = sizes.indexOf(this.textOptions.fontSize || 14);
        const nextIndex = (currentIndex + 1) % sizes.length;
        this.textOptions.fontSize = sizes[nextIndex];
        break;

      case "J": // Justify
        // Cycle through justify options
        const alignments: Array<"left" | "center" | "right"> = [
          "left",
          "center",
          "right",
        ];
        const currentAlign = alignments.indexOf(
          this.textOptions.textAlign || "left"
        );
        this.textOptions.textAlign = alignments[(currentAlign + 1) % 3];

        // Also cycle baseline
        const baselines: Array<"top" | "middle" | "bottom"> = [
          "top",
          "middle",
          "bottom",
        ];
        const currentBase = baselines.indexOf(
          this.textOptions.textBaseline || "middle"
        );
        this.textOptions.textBaseline = baselines[(currentBase + 1) % 3];
        break;

      case "S": // Style
        // Cycle through font families
        const fonts = [
          "Arial",
          "Times New Roman",
          "Courier New",
          "Georgia",
          "Verdana",
          "Helvetica",
        ];
        const currentFont = fonts.indexOf(
          this.textOptions.fontFamily || "Arial"
        );
        this.textOptions.fontFamily = fonts[(currentFont + 1) % fonts.length];
        break;

      case "R": // Rotation
        // Cycle through common angles
        const angles = [0, 45, 90, 135, 180, 225, 270, 315];
        const currentAngle = angles.indexOf(
          ((this.textOptions.rotation || 0) * 180) / Math.PI
        );
        const nextAngle = angles[(currentAngle + 1) % angles.length];
        this.textOptions.rotation = (nextAngle * Math.PI) / 180;
        break;

      case "B": // Bold
        this.textOptions.fontWeight =
          this.textOptions.fontWeight === "bold" ? "normal" : "bold";
        break;

      case "I": // Italic
        this.textOptions.fontStyle =
          this.textOptions.fontStyle === "italic" ? "normal" : "italic";
        break;

      case "X": // Scale (dùng X thay vì SC để dễ nhập)
        // Cycle through common scale values
        const scales = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5];
        const currentScaleIndex = scales.indexOf(this.textOptions.scale || 1);
        const nextScaleIndex = (currentScaleIndex + 1) % scales.length;
        this.textOptions.scale = scales[nextScaleIndex];
        break;
    }
  }

  /**
   * Set text content (được gọi từ UI sau khi user nhập text)
   */
  setTextContent(text: string): void {
    this.textContent = text;
  }

  /**
   * Set text options
   */
  setTextOptions(options: Partial<TextOptions>): void {
    this.textOptions = { ...this.textOptions, ...options };
  }

  /**
   * Get current text options (for UI display)
   */
  getTextOptions(): TextOptions {
    return { ...this.textOptions };
  }

  /**
   * Handle numeric input for height or rotation
   */
  handleNumericInput(value: number, type: "height" | "rotation"): void {
    if (type === "height" && value > 0) {
      this.textOptions.fontSize = value;
    } else if (type === "rotation") {
      this.textOptions.rotation = (value * Math.PI) / 180; // Convert degrees to radians
    }
  }

  execute(context: CommandContext): CommandResult {
    if (context.points.length < 1) {
      return { success: false, message: "Cần chọn vị trí đặt văn bản" };
    }

    // Text content có thể được truyền qua context.options hoặc từ setTextContent
    const text = this.textContent || (context.options.text as string) || "";

    if (!text.trim()) {
      return {
        success: false,
        message: "Nội dung văn bản không được để trống",
      };
    }

    const textEntity = TextEntity.create(
      context.points[0],
      text,
      context.style,
      {
        fontSize: this.getScaledFontSize(),
        fontFamily: this.textOptions.fontFamily,
        fontWeight: this.textOptions.fontWeight,
        fontStyle: this.textOptions.fontStyle,
        textAlign: this.textOptions.textAlign,
        textBaseline: this.textOptions.textBaseline,
      }
    );

    if (this.textOptions.rotation) {
      textEntity.rotation = this.textOptions.rotation;
    }

    if (context.layerId) textEntity.layerId = context.layerId;
    this.createdEntity = textEntity;

    // Reset text content for next use
    this.textContent = "";

    return {
      success: true,
      message: `Đã tạo văn bản "${text.substring(0, 20)}${
        text.length > 20 ? "..." : ""
      }"`,
      entities: [textEntity],
    };
  }

  undo(context: CommandContext): void {
    if (this.createdEntity) {
      context.engine.removeEntity(this.createdEntity.id);
    }
  }

  redo(context: CommandContext): CommandResult {
    if (this.createdEntity) {
      context.engine.addEntity(this.createdEntity);
      return {
        success: true,
        message: `Redo: Đã tạo lại văn bản`,
        entities: [this.createdEntity],
      };
    }
    return { success: false, message: "Không có entity để redo" };
  }

  /**
   * Reset command to initial state
   */
  reset(): void {
    this.textContent = "";
    this.createdEntity = null;
    // Keep text options for consistency across multiple text creations
  }
}
