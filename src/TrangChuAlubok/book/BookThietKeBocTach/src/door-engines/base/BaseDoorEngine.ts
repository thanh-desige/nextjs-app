/**
 * Base Door Engine - Class cơ sở cho tất cả door engines
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - Được import bởi: các engine con (hingedDoor, slidingDoor...)
 * - CHỈ được import từ: systems (read-only)
 * - KHÔNG được import từ: domain, UI, store, canvas, analysis
 */

import type { SystemData } from "../../systems/system.types";
import { loadSystem } from "../../systems/systemLoader";
import type {
  IDoorEngine,
  DoorEngineInput,
  DoorEngineOutput,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PreviewGeometry,
  DetailedGeometry,
  MaterialItem,
  AccessoryItem,
  Line2D,
} from "./Engine.types";
import { generateId } from "./engine.utils";

/**
 * Base Door Engine - Abstract class
 */
export abstract class BaseDoorEngine implements IDoorEngine {
  abstract readonly name: string;
  abstract readonly supportedTypes: import("../../systems/system.types").DoorType[];

  /**
   * Load system data
   */
  protected loadSystemData(systemId: string): SystemData | null {
    return loadSystem(systemId);
  }

  /**
   * Validate input cơ bản
   */
  validate(input: DoorEngineInput): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Kiểm tra systemId
    const system = this.loadSystemData(input.systemId);
    if (!system) {
      errors.push({
        code: "SYSTEM_NOT_FOUND",
        message: `Không tìm thấy hệ "${input.systemId}"`,
        field: "systemId",
      });
      return { isValid: false, errors, warnings };
    }

    // 2. Kiểm tra loại cửa
    if (!this.supportedTypes.includes(input.doorType)) {
      errors.push({
        code: "UNSUPPORTED_DOOR_TYPE",
        message: `Engine "${this.name}" không hỗ trợ loại "${input.doorType}"`,
        field: "doorType",
      });
    }

    // 3. Kiểm tra kích thước
    const { constraints } = system;

    if (input.width < constraints.minWidth) {
      errors.push({
        code: "WIDTH_TOO_SMALL",
        message: `Chiều rộng ${input.width}mm nhỏ hơn tối thiểu ${constraints.minWidth}mm`,
        field: "width",
      });
    }

    if (input.width > constraints.maxWidth) {
      errors.push({
        code: "WIDTH_TOO_LARGE",
        message: `Chiều rộng ${input.width}mm lớn hơn tối đa ${constraints.maxWidth}mm`,
        field: "width",
      });
    }

    if (input.height < constraints.minHeight) {
      errors.push({
        code: "HEIGHT_TOO_SMALL",
        message: `Chiều cao ${input.height}mm nhỏ hơn tối thiểu ${constraints.minHeight}mm`,
        field: "height",
      });
    }

    if (input.height > constraints.maxHeight) {
      errors.push({
        code: "HEIGHT_TOO_LARGE",
        message: `Chiều cao ${input.height}mm lớn hơn tối đa ${constraints.maxHeight}mm`,
        field: "height",
      });
    }

    // 4. Kiểm tra diện tích
    if (constraints.maxArea) {
      const areaM2 = (input.width * input.height) / 1_000_000;
      if (areaM2 > constraints.maxArea) {
        errors.push({
          code: "AREA_TOO_LARGE",
          message: `Diện tích ${areaM2.toFixed(2)}m² vượt quá tối đa ${
            constraints.maxArea
          }m²`,
        });
      }
    }

    // 5. Cảnh báo về kích thước khuyến nghị
    if (input.width > constraints.maxWidth * 0.9) {
      warnings.push({
        code: "WIDTH_NEAR_MAX",
        message: `Chiều rộng ${input.width}mm gần giới hạn tối đa`,
        suggestion: `Khuyến nghị không vượt quá ${Math.floor(
          constraints.maxWidth * 0.9
        )}mm`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate output - Template method
   */
  generate(input: DoorEngineInput): DoorEngineOutput {
    // Validate trước
    const validation = this.validate(input);

    // Load system
    const system = this.loadSystemData(input.systemId);
    if (!system) {
      throw new Error(`System "${input.systemId}" not found`);
    }

    // Sinh các phần
    const previewGeometry = this.generatePreviewGeometry(input, system);
    const detailedGeometry = this.generateDetailedGeometry(input, system);
    const materials = this.calculateMaterials(input, system);
    const accessories = this.calculateAccessories(input, system);

    return {
      id: generateId(),
      createdAt: Date.now(),
      input,
      previewGeometry,
      detailedGeometry,
      materials,
      accessories,
      validation,
    };
  }

  /**
   * Sinh preview geometry - Override trong subclass
   */
  protected abstract generatePreviewGeometry(
    input: DoorEngineInput,
    system: SystemData
  ): PreviewGeometry;

  /**
   * Sinh detailed geometry - Override trong subclass
   */
  protected abstract generateDetailedGeometry(
    input: DoorEngineInput,
    system: SystemData
  ): DetailedGeometry;

  /**
   * Tính vật liệu - Override trong subclass
   */
  protected abstract calculateMaterials(
    input: DoorEngineInput,
    system: SystemData
  ): MaterialItem[];

  /**
   * Tính phụ kiện - Override trong subclass
   */
  protected abstract calculateAccessories(
    input: DoorEngineInput,
    system: SystemData
  ): AccessoryItem[];

  // ==================== HELPER METHODS ====================

  /**
   * Tạo bounding box outline
   */
  protected createBoundingOutline(
    x: number,
    y: number,
    width: number,
    height: number
  ): Line2D[] {
    return [
      { start: { x, y }, end: { x: x + width, y } },
      { start: { x: x + width, y }, end: { x: x + width, y: y + height } },
      { start: { x: x + width, y: y + height }, end: { x, y: y + height } },
      { start: { x, y: y + height }, end: { x, y } },
    ];
  }

  /**
   * Tính chiều dài profile với trừ hao
   */
  protected calculateProfileLength(
    dimension: number,
    deduction: number,
    quantity: number = 1
  ): number {
    return (dimension - deduction * 2) * quantity;
  }

  /**
   * Tính diện tích kính
   */
  protected calculateGlassArea(
    width: number,
    height: number,
    glassDeduction: number
  ): { width: number; height: number; area: number } {
    const glassWidth = width - glassDeduction * 2;
    const glassHeight = height - glassDeduction * 2;
    return {
      width: glassWidth,
      height: glassHeight,
      area: (glassWidth * glassHeight) / 1_000_000, // m²
    };
  }
}
