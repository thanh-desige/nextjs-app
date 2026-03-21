/**
 * createContractFromQuote — Tạo hợp đồng từ báo giá đã duyệt
 *
 * Phase 4: Liên kết TKBT → Bán hàng (Hợp đồng)
 *
 * Flow:
 * 1. Tìm báo giá đã approved trong banHangStore
 * 2. Copy items + totals từ Quote → Contract
 * 3. Sinh mã HD-xxxx tự động
 * 4. Tạo Contract trong banHangStore
 * 5. Ghi contractId/Code ngược vào ProjectInfo
 */

import { useProjectStore } from '../store/projectStore';
import type { ProjectInfo } from '../store/projectStore';
import { useBanHangStore } from '../../../BookBanHang/src/store/banHangStore';
import type { Contract, Quote } from '../../../BookBanHang/src/types/banHang.types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Sinh mã HD-xxxx tiếp theo dựa trên contracts hiện có */
function nextContractCode(existingContracts: Contract[]): string {
  let maxNum = 0;
  for (const c of existingContracts) {
    const m = c.contractCode.match(/^HD-(\d+)$/);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  }
  return `HD-${String(maxNum + 1).padStart(4, '0')}`;
}

export interface CreateContractResult {
  success: boolean;
  contractId?: string;
  contractCode?: string;
  error?: string;
}

/**
 * Tạo hợp đồng từ báo giá đã duyệt của dự án
 * Gọi từ ProjectListView khi click "Tạo hợp đồng"
 */
export function createContractFromQuote(project: ProjectInfo): CreateContractResult {
  const projectStore = useProjectStore.getState();
  const banHangStore = useBanHangStore.getState();

  // Kiểm tra báo giá tồn tại
  if (!project.quoteId) {
    return { success: false, error: 'Dự án chưa có báo giá.' };
  }

  const quote: Quote | undefined = banHangStore.quotes.find(q => q.quoteId === project.quoteId);
  if (!quote) {
    return { success: false, error: 'Không tìm thấy báo giá.' };
  }

  const contractCode = nextContractCode(banHangStore.contracts);
  const contractId = generateId();
  const now = new Date().toISOString();

  const contract: Contract = {
    contractId,
    contractCode,
    quoteId: quote.quoteId,
    quoteCode: quote.quoteCode,
    customerId: quote.customerId,
    customerName: quote.customerName,
    projectName: quote.projectName,
    projectId: project.id,
    designRevision: project.designRevision ?? 0,
    items: quote.items.map(item => ({ ...item })), // Deep copy
    subtotal: quote.subtotal,
    taxRate: quote.taxRate,
    taxAmount: quote.taxAmount,
    totalDiscount: quote.totalDiscount,
    totalAmount: quote.totalAmount,
    depositPercent: 30, // Default 30% tạm ứng
    depositAmount: Math.round(quote.totalAmount * 0.3),
    signedDate: now.split('T')[0],
    warrantyMonths: 12,
    status: 'signed',
    createdBy: project.employee || '',
    createdAt: now,
    updatedAt: now,
    signedBy: project.employee || '',
    signedAt: now,
  };

  // 1. Tạo contract trong BanHang store
  banHangStore.addContract(contract);

  // 2. Liên kết ngược vào ProjectInfo
  projectStore.loadProject(project.id);
  projectStore.updateProject({
    contractId,
    contractCode,
  });

  return { success: true, contractId, contractCode };
}
