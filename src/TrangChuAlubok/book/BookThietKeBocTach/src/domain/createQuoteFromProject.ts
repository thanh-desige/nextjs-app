/**
 * createQuoteFromProject — Tạo / cập nhật báo giá từ BOM của dự án
 *
 * Phase 3: Liên kết TKBT → Bán hàng
 *
 * Flow:
 * 1. Đọc BOM items từ projectStore
 * 2. Chuyển BomItem[] → QuoteItem[]
 * 3. Sinh mã BG-xxxx tự động
 * 4. Tạo Quote trong banHangStore
 * 5. Ghi quoteId/Code/DesignRevision ngược vào ProjectInfo
 */

import { useProjectStore } from '../store/projectStore';
import type { ProjectInfo, BomItem } from '../store/projectStore';
import { useBanHangStore } from '../../../BookBanHang/src/store/banHangStore';
import type { Quote, QuoteItem } from '../../../BookBanHang/src/types/banHang.types';
import { calcTotals } from '../../../BookBanHang/src/types/banHang.types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Sinh mã BG-xxxx tiếp theo dựa trên quotes hiện có */
function nextQuoteCode(existingQuotes: Quote[]): string {
  let maxNum = 0;
  for (const q of existingQuotes) {
    const m = q.quoteCode.match(/^BG-(\d+)$/);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  }
  return `BG-${String(maxNum + 1).padStart(4, '0')}`;
}

/** Chuyển BomItem → QuoteItem */
function bomToQuoteItems(bomItems: BomItem[]): QuoteItem[] {
  return bomItems.map((bom) => ({
    itemId: generateId(),
    description: bom.name,
    unit: bom.unit,
    quantity: bom.quantity,
    unitPrice: bom.unitPrice,
    discountPercent: 0,
    amount: bom.quantity * bom.unitPrice,
    bomRef: bom.id,
    notes: bom.notes,
  }));
}

export interface CreateQuoteResult {
  success: boolean;
  quoteId?: string;
  quoteCode?: string;
  error?: string;
}

/**
 * Tạo mới báo giá từ BOM hiện tại của dự án
 * Gọi từ ProjectListView khi click "Tạo báo giá"
 */
export function createQuoteFromProject(project: ProjectInfo): CreateQuoteResult {
  const projectStore = useProjectStore.getState();
  const banHangStore = useBanHangStore.getState();

  const bomItems = projectStore.bomItems;
  if (bomItems.length === 0) {
    return { success: false, error: 'Chưa có BOM. Hãy tính BOM trước.' };
  }

  const quoteItems = bomToQuoteItems(bomItems);
  const taxRate = 10;
  const totals = calcTotals(quoteItems, taxRate);
  const quoteCode = nextQuoteCode(banHangStore.quotes);
  const quoteId = generateId();
  const now = new Date().toISOString();

  const quote: Quote = {
    quoteId,
    quoteCode,
    customerId: '',
    customerName: project.investor || project.customer || '',
    projectName: project.name,
    projectRef: project.projectCode,
    projectId: project.id,
    designRevision: project.designRevision ?? 0,
    items: quoteItems,
    subtotal: totals.subtotal,
    taxRate,
    taxAmount: totals.taxAmount,
    totalDiscount: totals.totalDiscount,
    totalAmount: totals.totalAmount,
    validUntil: new Date(Date.now() + 30 * 86_400_000).toISOString().split('T')[0],
    status: 'draft',
    createdBy: project.employee || '',
    createdAt: now,
    updatedAt: now,
  };

  // 1. Tạo quote trong BanHang store
  banHangStore.addQuote(quote);

  // 2. Liên kết ngược vào ProjectInfo
  projectStore.loadProject(project.id);
  projectStore.updateProject({
    quoteId,
    quoteCode,
    quoteDesignRevision: project.designRevision ?? 0,
  });

  return { success: true, quoteId, quoteCode };
}

/**
 * Cập nhật báo giá hiện có khi design đã thay đổi
 * Gọi từ ProjectListView khi click "Cập nhật báo giá"
 */
export function updateQuoteFromProject(project: ProjectInfo): CreateQuoteResult {
  const projectStore = useProjectStore.getState();
  const banHangStore = useBanHangStore.getState();

  if (!project.quoteId) {
    return { success: false, error: 'Dự án chưa có báo giá để cập nhật.' };
  }

  const bomItems = projectStore.bomItems;
  if (bomItems.length === 0) {
    return { success: false, error: 'Chưa có BOM. Hãy tính BOM trước.' };
  }

  const quoteItems = bomToQuoteItems(bomItems);
  const existing = banHangStore.quotes.find((q) => q.quoteId === project.quoteId);
  const taxRate = existing?.taxRate ?? 10;
  const totals = calcTotals(quoteItems, taxRate);
  const now = new Date().toISOString();

  // 1. Cập nhật quote trong BanHang store
  banHangStore.updateQuote(project.quoteId, {
    items: quoteItems,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    totalDiscount: totals.totalDiscount,
    totalAmount: totals.totalAmount,
    designRevision: project.designRevision ?? 0,
    updatedAt: now,
    status: 'draft', // Reset to draft since design changed
  });

  // 2. Cập nhật quoteDesignRevision trong ProjectInfo
  projectStore.loadProject(project.id);
  projectStore.updateProject({
    quoteDesignRevision: project.designRevision ?? 0,
  });

  return { success: true, quoteId: project.quoteId, quoteCode: project.quoteCode };
}
