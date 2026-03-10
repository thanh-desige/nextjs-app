/**
 * Quantity Engine - Tổng hợp BOM từ các door engine outputs
 *
 * ⚠️ LUẬT PHỤ THUỘC:
 * - CHỈ được import từ: door-engines (đọc output)
 * - KHÔNG được import từ: domain, UI, store, canvas, systems
 */

import type {
  DoorEngineOutput as _DoorEngineOutput,
  MaterialItem,
  AccessoryItem,
} from "../door-engines/base/Engine.types";
import type {
  BomLineItem,
  BomSummary,
  QuantityEngineInput,
} from "./analysis.types";

/**
 * Generate unique ID
 */
function generateBomId(): string {
  return `bom_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .substring(2, 6)}`;
}

/**
 * Quantity Engine - Tổng hợp BOM
 */
export class QuantityEngine {
  /**
   * Tính BOM từ danh sách engine outputs
   */
  static calculate(input: QuantityEngineInput): BomSummary {
    const { engineOutputs, options = {} } = input;
    const { groupByCode = true } = options;

    // Thu thập tất cả materials và accessories
    const allMaterials: { item: MaterialItem; sourceId: string }[] = [];
    const allAccessories: { item: AccessoryItem; sourceId: string }[] = [];

    for (const output of engineOutputs) {
      for (const mat of output.materials) {
        allMaterials.push({ item: mat, sourceId: output.id });
      }
      for (const acc of output.accessories) {
        allAccessories.push({ item: acc, sourceId: output.id });
      }
    }

    // Tạo line items
    const lineItems: BomLineItem[] = [];

    if (groupByCode) {
      // Nhóm theo code
      const materialGroups = this.groupMaterials(allMaterials);
      const accessoryGroups = this.groupAccessories(allAccessories);

      for (const [code, group] of materialGroups) {
        lineItems.push(this.createMaterialLineItem(code, group));
      }

      for (const [code, group] of accessoryGroups) {
        lineItems.push(this.createAccessoryLineItem(code, group));
      }
    } else {
      // Không nhóm
      let idx = 0;
      for (const { item, sourceId } of allMaterials) {
        lineItems.push({
          id: `line_${idx++}`,
          code: item.code,
          name: item.name,
          category: this.getMaterialCategory(item.type),
          unit: item.unit,
          quantity: item.length
            ? item.length / 1000
            : item.size
            ? (item.size.width * item.size.height) / 1_000_000
            : item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          note: item.cutNote,
          sourceIds: [sourceId],
        });
      }

      for (const { item, sourceId } of allAccessories) {
        lineItems.push({
          id: `line_${idx++}`,
          code: item.code,
          name: item.name,
          category: "accessory",
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          sourceIds: [sourceId],
        });
      }
    }

    // Tính tổng
    const totalAluminum = this.calculateAluminumTotal(lineItems);
    const totalGlass = this.calculateGlassTotal(lineItems);
    const totalAccessories = this.calculateAccessoryTotal(lineItems);
    const grandTotal =
      totalAluminum.cost + totalGlass.cost + totalAccessories.cost;

    return {
      id: generateBomId(),
      createdAt: Date.now(),
      lineItems,
      totalAluminum,
      totalGlass,
      totalAccessories,
      grandTotal,
      sourceOutputIds: engineOutputs.map((o) => o.id),
    };
  }

  /**
   * Nhóm materials theo code
   */
  private static groupMaterials(
    items: { item: MaterialItem; sourceId: string }[]
  ): Map<string, { item: MaterialItem; sourceId: string }[]> {
    const groups = new Map<
      string,
      { item: MaterialItem; sourceId: string }[]
    >();

    for (const entry of items) {
      const key = entry.item.code;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    }

    return groups;
  }

  /**
   * Nhóm accessories theo code
   */
  private static groupAccessories(
    items: { item: AccessoryItem; sourceId: string }[]
  ): Map<string, { item: AccessoryItem; sourceId: string }[]> {
    const groups = new Map<
      string,
      { item: AccessoryItem; sourceId: string }[]
    >();

    for (const entry of items) {
      const key = entry.item.code;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    }

    return groups;
  }

  /**
   * Tạo line item từ nhóm materials
   */
  private static createMaterialLineItem(
    code: string,
    group: { item: MaterialItem; sourceId: string }[]
  ): BomLineItem {
    const first = group[0].item;

    let totalQuantity = 0;
    let totalPrice = 0;
    const sourceIds: string[] = [];

    for (const { item, sourceId } of group) {
      if (item.length) {
        totalQuantity += item.length / 1000; // Convert mm to m
      } else if (item.size) {
        totalQuantity += (item.size.width * item.size.height) / 1_000_000; // Convert mm² to m²
      } else {
        totalQuantity += item.quantity;
      }
      totalPrice += item.totalPrice;
      if (!sourceIds.includes(sourceId)) {
        sourceIds.push(sourceId);
      }
    }

    return {
      id: `line_${code}`,
      code,
      name: first.name,
      category: this.getMaterialCategory(first.type),
      unit: first.unit,
      quantity: Math.round(totalQuantity * 100) / 100,
      unitPrice: first.unitPrice,
      totalPrice,
      sourceIds,
    };
  }

  /**
   * Tạo line item từ nhóm accessories
   */
  private static createAccessoryLineItem(
    code: string,
    group: { item: AccessoryItem; sourceId: string }[]
  ): BomLineItem {
    const first = group[0].item;

    let totalQuantity = 0;
    let totalPrice = 0;
    const sourceIds: string[] = [];

    for (const { item, sourceId } of group) {
      totalQuantity += item.quantity;
      totalPrice += item.totalPrice;
      if (!sourceIds.includes(sourceId)) {
        sourceIds.push(sourceId);
      }
    }

    return {
      id: `line_${code}`,
      code,
      name: first.name,
      category: "accessory",
      unit: first.unit,
      quantity: totalQuantity,
      unitPrice: first.unitPrice,
      totalPrice,
      sourceIds,
    };
  }

  /**
   * Xác định category từ type
   */
  private static getMaterialCategory(
    type: string
  ): "aluminum" | "glass" | "other" {
    if (["frame", "sash", "mullion", "transom", "bead"].includes(type)) {
      return "aluminum";
    }
    if (type === "glass") {
      return "glass";
    }
    return "other";
  }

  /**
   * Tính tổng nhôm
   */
  private static calculateAluminumTotal(items: BomLineItem[]): {
    length: number;
    weight: number;
    cost: number;
  } {
    const aluminumItems = items.filter((i) => i.category === "aluminum");

    const length = aluminumItems.reduce((sum, i) => sum + i.quantity, 0);
    const cost = aluminumItems.reduce((sum, i) => sum + i.totalPrice, 0);

    // Ước tính trọng lượng (trung bình 0.8 kg/m)
    const weight = length * 0.8;

    return { length, weight, cost };
  }

  /**
   * Tính tổng kính
   */
  private static calculateGlassTotal(items: BomLineItem[]): {
    area: number;
    cost: number;
  } {
    const glassItems = items.filter((i) => i.category === "glass");

    const area = glassItems.reduce((sum, i) => sum + i.quantity, 0);
    const cost = glassItems.reduce((sum, i) => sum + i.totalPrice, 0);

    return { area, cost };
  }

  /**
   * Tính tổng phụ kiện
   */
  private static calculateAccessoryTotal(items: BomLineItem[]): {
    count: number;
    cost: number;
  } {
    const accessoryItems = items.filter((i) => i.category === "accessory");

    const count = accessoryItems.reduce((sum, i) => sum + i.quantity, 0);
    const cost = accessoryItems.reduce((sum, i) => sum + i.totalPrice, 0);

    return { count, cost };
  }
}
