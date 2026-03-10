/**
 * projectQuotationOps.ts — BOM & Quotation operations for ProjectService
 *
 * Extracted in STEP-5.15: calculateBOM, generateQuotation + helpers
 */

import { IProjectRepository } from "./ProjectRepository";
import {
  Project,
  ProjectEventType,
  QuotationItem,
  Quotation,
  QuotationStatus,
  QuotationDiscount,
} from "./Project.types";
import { DoorModel, DoorModelData } from "../door/DoorModel";
import { BomCalculator } from "../bom/BomCalculator";
import { ProfileCatalog } from "../materials/ProfileCatalog";
import { GlassCatalog } from "../materials/GlassCatalog";
import { AccessoryCatalog } from "../materials/AccessoryCatalog";
import { PricingRules, CustomerTier } from "../rules/PricingRules";

// ============================================================================
// Context
// ============================================================================

export interface QuotationOpContext {
  repository: IProjectRepository;
  userId: string;
  userName: string;
  profileCatalog: ProfileCatalog;
  glassCatalog: GlassCatalog;
  accessoryCatalog: AccessoryCatalog;
  pricingRules: PricingRules;
}

// ============================================================================
// Result (structural match with ServiceResult)
// ============================================================================

interface OpResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ============================================================================
// Helpers
// ============================================================================

export function doorDataToModel(data: DoorModelData): DoorModel {
  return data as unknown as DoorModel;
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

export function generateQuotationNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `QT${year}${month}-${random}`;
}

// ============================================================================
// BOM Calculation
// ============================================================================

export async function calculateProjectBOM(
  ctx: QuotationOpContext,
  projectId: string
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    if (project.doors.length === 0) {
      return {
        success: false,
        error: "No doors in project",
        code: "NO_DOORS",
      };
    }

    // Calculate BOM for all doors
    const bomCalculator = new BomCalculator(
      ctx.profileCatalog,
      ctx.glassCatalog,
      ctx.accessoryCatalog
    );

    if (project.doors.length > 0) {
      const firstDoor = project.doors[0];
      const door = doorDataToModel(firstDoor);
      const bom = bomCalculator.calculateBom(
        door,
        project.id,
        project.name,
        ctx.userId
      );

      // Add items from other doors
      for (let i = 1; i < project.doors.length; i++) {
        const additionalDoor = doorDataToModel(project.doors[i]);
        const additionalBom = bomCalculator.calculateBom(
          additionalDoor,
          project.id,
          project.name,
          ctx.userId
        );
        bom.items.push(...additionalBom.items);
      }

      const updated = await ctx.repository.update(projectId, {
        bom,
        lastModifiedBy: ctx.userId,
      });

      return { success: true, data: updated };
    }

    return {
      success: false,
      error: "No doors to calculate",
      code: "NO_DOORS",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to calculate BOM",
      code: "BOM_FAILED",
    };
  }
}

// ============================================================================
// Quotation Generation
// ============================================================================

export async function generateProjectQuotation(
  ctx: QuotationOpContext,
  projectId: string,
  options?: {
    validDays?: number;
    depositPercent?: number;
    notes?: string;
  }
): Promise<OpResult<Project>> {
  try {
    const project = await ctx.repository.findById(projectId);
    if (!project) {
      return { success: false, error: "Project not found", code: "NOT_FOUND" };
    }

    if (project.doors.length === 0) {
      return {
        success: false,
        error: "No doors in project",
        code: "NO_DOORS",
      };
    }

    // Calculate prices for each door
    const items: QuotationItem[] = [];
    let subtotal = 0;

    for (const doorData of project.doors) {
      const door = doorDataToModel(doorData);
      const pricing = ctx.pricingRules.calculatePrice(door, {
        profileSystem: project.settings.defaultProfileSystem,
        customerTier: project.customer.tier as CustomerTier,
        quantity: project.doors.length,
      });

      items.push({
        id: generateId(),
        doorId: doorData.id,
        description: `${doorData.name || door.type} - ${
          door.dimensions.width
        }x${door.dimensions.height}mm`,
        specifications: {
          type: door.type,
          width: door.dimensions.width,
          height: door.dimensions.height,
          profileSystem: project.settings.defaultProfileSystem,
          glassType: door.glassType,
          frameType: door.frameType,
        },
        quantity: 1,
        unitPrice: pricing.finalPrice,
        amount: pricing.finalPrice,
      });

      subtotal += pricing.finalPrice;
    }

    // Calculate totals
    const discounts: QuotationDiscount[] = [];
    let discountTotal = 0;

    // Volume discount
    if (project.doors.length >= 3) {
      const volumeDiscount =
        subtotal *
        (project.doors.length >= 10
          ? 0.08
          : project.doors.length >= 5
          ? 0.05
          : 0.03);
      discounts.push({
        description: `Chiết khấu số lượng (${project.doors.length} bộ)`,
        type: "percent",
        value:
          project.doors.length >= 10 ? 8 : project.doors.length >= 5 ? 5 : 3,
        amount: volumeDiscount,
      });
      discountTotal += volumeDiscount;
    }

    const afterDiscount = subtotal - discountTotal;
    const taxRate = project.settings.taxRate;
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;

    const now = new Date();
    const validDays = options?.validDays || 30;

    const quotation: Quotation = {
      id: generateId(),
      projectId,
      version: (project.quotation?.version || 0) + 1,
      quotationNumber: generateQuotationNumber(),
      issueDate: now,
      validUntil: new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000),
      items,
      subtotal,
      discounts,
      discountTotal,
      taxRate,
      taxAmount,
      total,
      currency: project.settings.currency,
      paymentTerms: {
        depositPercent: options?.depositPercent || 50,
        progressPayments: [{ percent: 30, milestone: "Hoàn thành sản xuất" }],
        finalPaymentPercent: 20,
        paymentMethods: ["Chuyển khoản", "Tiền mặt"],
      },
      deliveryTerms:
        "Giao hàng tại công trình trong vòng 15-20 ngày làm việc",
      warranty: "Bảo hành 24 tháng cho khung nhôm, 12 tháng cho phụ kiện",
      notes: options?.notes || "",
      status: QuotationStatus.DRAFT,
    };

    const updated = await ctx.repository.update(projectId, {
      quotation,
      lastModifiedBy: ctx.userId,
    });

    await ctx.repository.addEvent(projectId, {
      type: ProjectEventType.QUOTATION_CREATED,
      userId: ctx.userId,
      userName: ctx.userName,
      description: `Quotation ${quotation.quotationNumber} created`,
      data: { quotationId: quotation.id, total },
    });

    return { success: true, data: updated };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate quotation",
      code: "QUOTATION_FAILED",
    };
  }
}
