/**
 * Hinged Door Engine - Engine sinh cửa mở (đơn/đôi)
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - CHỈ được import từ: systems (read-only)
 * - KHÔNG được import từ: domain, UI, store, canvas, analysis
 */

import { BaseDoorEngine } from "../base/BaseDoorEngine";
import type {
  DoorEngineInput,
  PreviewGeometry,
  DetailedGeometry,
  MaterialItem,
  AccessoryItem,
  Line2D,
  GeometryLayer,
  DimensionAnnotation,
} from "../base/Engine.types";
import type { SystemData, DoorType } from "../../systems/system.types";
import type { HingedDoorOptions } from "./hingedDoor.types";
import {
  DEFAULT_HINGED_SINGLE_OPTIONS,
  DEFAULT_HINGED_DOUBLE_OPTIONS,
} from "./hingedDoor.types";
import {
  calculateHingeCount,
  calculateCornerBracketCount,
  calculateSealLength,
  calculateBeadLength,
  getFrameProfile,
  getSashProfile,
  getBeadProfile,
  getHingeAccessory,
  getLockAccessory,
  getHandleAccessory,
  getSealAccessory,
  getCornerBracketAccessory,
} from "./hingedDoor.rules";
import { roundToMm, mmToM, mm2ToM2 } from "../base/engine.utils";

/**
 * Hinged Door Engine - Cửa mở đơn/đôi
 */
export class HingedDoorEngine extends BaseDoorEngine {
  readonly name = "HingedDoorEngine";
  readonly supportedTypes: DoorType[] = ["hinged-single", "hinged-double"];

  /**
   * Merge options với defaults
   */
  private getOptions(input: DoorEngineInput): HingedDoorOptions {
    const defaults =
      input.doorType === "hinged-double"
        ? DEFAULT_HINGED_DOUBLE_OPTIONS
        : DEFAULT_HINGED_SINGLE_OPTIONS;

    return { ...defaults, ...input.options } as HingedDoorOptions;
  }

  /**
   * Sinh preview geometry (đơn giản cho canvas)
   */
  protected generatePreviewGeometry(
    input: DoorEngineInput,
    system: SystemData
  ): PreviewGeometry {
    const { width, height } = input;
    const options = this.getOptions(input);
    const frameProfile = getFrameProfile(system);
    const frameWidth = frameProfile.width;

    // Bounding box
    const boundingBox = { x: 0, y: 0, width, height };

    // Outlines: Frame ngoài + Sash bên trong
    const outlines: Line2D[] = [
      // Frame ngoài
      ...this.createBoundingOutline(0, 0, width, height),
      // Sash bên trong (trừ frame)
      ...this.createBoundingOutline(
        frameWidth,
        frameWidth,
        width - frameWidth * 2,
        height - frameWidth * 2
      ),
    ];

    // Vị trí tay nắm
    const isDouble = options.doorStyle === "double";
    const handleX =
      options.openDirection === "left"
        ? width - frameWidth - 100
        : frameWidth + 100;
    const handleY = height / 2;
    const handlePosition = { x: handleX, y: handleY };

    // Arc mở cửa (nếu là cửa đơn)
    let openingArc;
    if (!isDouble) {
      const arcRadius = width - frameWidth * 2;
      const arcCenterX =
        options.openDirection === "left" ? frameWidth : width - frameWidth;
      openingArc = {
        center: { x: arcCenterX, y: frameWidth },
        radius: arcRadius,
        startAngle: options.openDirection === "left" ? 0 : Math.PI,
        endAngle:
          options.openDirection === "left" ? Math.PI / 4 : (Math.PI * 3) / 4,
      };
    }

    return {
      boundingBox,
      outlines,
      handlePosition,
      openingArc,
    };
  }

  /**
   * Sinh detailed geometry (cho CAD export)
   */
  protected generateDetailedGeometry(
    input: DoorEngineInput,
    system: SystemData
  ): DetailedGeometry {
    const { width, height } = input;
    const options = this.getOptions(input);
    const frameProfile = getFrameProfile(system);
    const sashProfile = getSashProfile(system);
    const fw = frameProfile.width;
    const sw = sashProfile.width;

    const layers: GeometryLayer[] = [];

    // Layer 1: Frame
    layers.push({
      name: "FRAME",
      color: "#333333",
      lineType: "solid",
      elements: [
        { type: "rect", data: { x: 0, y: 0, width, height } },
        {
          type: "rect",
          data: {
            x: fw,
            y: fw,
            width: width - fw * 2,
            height: height - fw * 2,
          },
        },
      ],
    });

    // Layer 2: Sash
    const sashInnerX = fw + sw;
    const sashInnerY = fw + sw;
    const sashInnerW = width - (fw + sw) * 2;
    const sashInnerH = height - (fw + sw) * 2;

    if (options.doorStyle === "single") {
      layers.push({
        name: "SASH",
        color: "#666666",
        lineType: "solid",
        elements: [
          {
            type: "rect",
            data: {
              x: fw,
              y: fw,
              width: width - fw * 2,
              height: height - fw * 2,
            },
          },
          {
            type: "rect",
            data: {
              x: sashInnerX,
              y: sashInnerY,
              width: sashInnerW,
              height: sashInnerH,
            },
          },
        ],
      });
    } else {
      // Cửa đôi: 2 cánh
      const halfWidth = (width - fw * 2) / 2;
      layers.push({
        name: "SASH",
        color: "#666666",
        lineType: "solid",
        elements: [
          // Cánh trái
          {
            type: "rect",
            data: { x: fw, y: fw, width: halfWidth, height: height - fw * 2 },
          },
          // Cánh phải
          {
            type: "rect",
            data: {
              x: fw + halfWidth,
              y: fw,
              width: halfWidth,
              height: height - fw * 2,
            },
          },
        ],
      });
    }

    // Layer 3: Glass
    layers.push({
      name: "GLASS",
      color: "#87CEEB",
      lineType: "solid",
      elements: [
        {
          type: "rect",
          data: {
            x: sashInnerX,
            y: sashInnerY,
            width: sashInnerW,
            height: sashInnerH,
          },
        },
      ],
    });

    // Dimensions
    const dimensions: DimensionAnnotation[] = [
      // Chiều rộng tổng
      {
        start: { x: 0, y: -50 },
        end: { x: width, y: -50 },
        value: width,
        unit: "mm",
        offset: 50,
      },
      // Chiều cao tổng
      {
        start: { x: -50, y: 0 },
        end: { x: -50, y: height },
        value: height,
        unit: "mm",
        offset: 50,
      },
    ];

    return { layers, dimensions };
  }

  /**
   * Tính vật liệu
   */
  protected calculateMaterials(
    input: DoorEngineInput,
    system: SystemData
  ): MaterialItem[] {
    const { width, height } = input;
    const options = this.getOptions(input);
    const materials: MaterialItem[] = [];

    const frameProfile = getFrameProfile(system);
    const sashProfile = getSashProfile(system);
    const beadProfile = getBeadProfile(system);
    const formulas = system.formulas;

    // 1. Khung bao (Frame)
    const frameHorizontal = width - formulas.frameDeduction * 2;
    const frameVertical = height - formulas.frameDeduction * 2;
    const frameTotalLength = (frameHorizontal + frameVertical) * 2;

    materials.push({
      code: frameProfile.code,
      name: `${frameProfile.name} (Khung bao)`,
      type: "frame",
      quantity: 1,
      unit: "m",
      length: roundToMm(frameTotalLength),
      unitPrice: frameProfile.price,
      totalPrice: Math.round(mmToM(frameTotalLength) * frameProfile.price),
      cutNote: `2 thanh ${frameHorizontal}mm, 2 thanh ${frameVertical}mm`,
    });

    // 2. Khung cánh (Sash)
    const sashWidth =
      width - frameProfile.width * 2 - formulas.sashDeduction * 2;
    const sashHeight =
      height - frameProfile.width * 2 - formulas.sashDeduction * 2;
    const sashCount = options.doorStyle === "double" ? 2 : 1;
    const sashTotalLength =
      (sashWidth / sashCount + sashHeight) * 2 * sashCount;

    materials.push({
      code: sashProfile.code,
      name: `${sashProfile.name} (Khung cánh)`,
      type: "sash",
      quantity: sashCount,
      unit: "m",
      length: roundToMm(sashTotalLength),
      unitPrice: sashProfile.price,
      totalPrice: Math.round(mmToM(sashTotalLength) * sashProfile.price),
      cutNote:
        options.doorStyle === "double"
          ? `4 thanh ${sashWidth / 2}mm, 4 thanh ${sashHeight}mm`
          : `2 thanh ${sashWidth}mm, 2 thanh ${sashHeight}mm`,
    });

    // 3. Nẹp kính (Bead)
    const glassWidth =
      sashWidth - sashProfile.width * 2 - formulas.glassDeduction * 2;
    const glassHeight =
      sashHeight - sashProfile.width * 2 - formulas.glassDeduction * 2;
    const beadLength =
      calculateBeadLength(glassWidth, glassHeight, formulas.beadOverlap || 5) *
      sashCount;

    materials.push({
      code: beadProfile.code,
      name: `${beadProfile.name} (Nẹp kính)`,
      type: "bead",
      quantity: sashCount,
      unit: "m",
      length: roundToMm(beadLength),
      unitPrice: beadProfile.price,
      totalPrice: Math.round(mmToM(beadLength) * beadProfile.price),
    });

    // 4. Kính
    const glassArea = mm2ToM2(glassWidth * glassHeight) * sashCount;
    const glassThickness =
      options.glassThickness || system.glass.defaultThickness;
    const glassPricePerM2 = 250000; // Giả sử giá kính

    materials.push({
      code: `GLASS-${glassThickness}`,
      name: `Kính ${
        options.glassType || system.glass.defaultType
      } ${glassThickness}mm`,
      type: "glass",
      quantity: sashCount,
      unit: "m2",
      size: { width: roundToMm(glassWidth), height: roundToMm(glassHeight) },
      unitPrice: glassPricePerM2,
      totalPrice: Math.round(glassArea * glassPricePerM2),
      cutNote: `${sashCount} tấm ${glassWidth}x${glassHeight}mm`,
    });

    return materials;
  }

  /**
   * Tính phụ kiện
   */
  protected calculateAccessories(
    input: DoorEngineInput,
    system: SystemData
  ): AccessoryItem[] {
    const { height } = input;
    const options = this.getOptions(input);
    const accessories: AccessoryItem[] = [];

    const isDouble = options.doorStyle === "double";

    // 1. Bản lề
    const hinge = getHingeAccessory(system, options.hingeType);
    const hingeCount = options.hingeCount || calculateHingeCount(height);
    const totalHinges = isDouble ? hingeCount * 2 : hingeCount;

    accessories.push({
      code: hinge.code,
      name: hinge.name,
      type: "hinge",
      quantity: totalHinges,
      unit: "pcs",
      unitPrice: hinge.price,
      totalPrice: totalHinges * hinge.price,
    });

    // 2. Khóa
    const lock = getLockAccessory(system, options.doorStyle);
    accessories.push({
      code: lock.code,
      name: lock.name,
      type: "lock",
      quantity: 1,
      unit: "set",
      unitPrice: lock.price,
      totalPrice: lock.price,
    });

    // 3. Tay nắm
    const handle = getHandleAccessory(system);
    const handleCount = isDouble ? 2 : 1;
    accessories.push({
      code: handle.code,
      name: handle.name,
      type: "handle",
      quantity: handleCount,
      unit: "set",
      unitPrice: handle.price,
      totalPrice: handleCount * handle.price,
    });

    // 4. Ron
    const seal = getSealAccessory(system);
    const sealLength = calculateSealLength(
      input.width,
      input.height,
      options.doorStyle
    );
    accessories.push({
      code: seal.code,
      name: seal.name,
      type: "seal",
      quantity: Math.ceil(mmToM(sealLength)),
      unit: "m",
      unitPrice: seal.price,
      totalPrice: Math.ceil(mmToM(sealLength)) * seal.price,
    });

    // 5. Ke góc
    const cornerBracket = getCornerBracketAccessory(system);
    const cornerCount = calculateCornerBracketCount(options.doorStyle);
    accessories.push({
      code: cornerBracket.code,
      name: cornerBracket.name,
      type: "corner",
      quantity: cornerCount,
      unit: "pcs",
      unitPrice: cornerBracket.price,
      totalPrice: cornerCount * cornerBracket.price,
    });

    return accessories;
  }
}
