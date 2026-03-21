/**
 * createReceiptFromContract — Tạo phiếu thu tạm ứng từ hợp đồng
 *
 * Phase 5: Liên kết TKBT → Thu chi (Phiếu thu)
 *
 * Flow:
 * 1. Tìm hợp đồng (Contract) trong banHangStore qua project.contractId
 * 2. Tạo CashReceipt với số tiền = contract.depositAmount
 * 3. Sinh mã PT-xxxx tự động
 * 4. Thêm phiếu thu vào thuChiStore
 * 5. Ghi receiptId/Code ngược vào ProjectInfo
 */

import { useProjectStore } from '../store/projectStore';
import type { ProjectInfo } from '../store/projectStore';
import { useBanHangStore } from '../../../BookBanHang/src/store/banHangStore';
import { useThuChiStore } from '../../../BookThuChi/src/store/thuChiStore';
import type { CashReceipt } from '../../../BookThuChi/src/types/thuChi.types';
import type { Contract } from '../../../BookBanHang/src/types/banHang.types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/** Sinh mã PT-xxxx tiếp theo dựa trên receipts hiện có */
function nextReceiptCode(existingReceipts: CashReceipt[]): string {
  let maxNum = 0;
  for (const r of existingReceipts) {
    const m = r.receiptCode.match(/^PT-(\d+)$/);
    if (m) maxNum = Math.max(maxNum, Number(m[1]));
  }
  return `PT-${String(maxNum + 1).padStart(4, '0')}`;
}

export interface CreateReceiptResult {
  success: boolean;
  receiptId?: string;
  receiptCode?: string;
  error?: string;
}

/**
 * Tạo phiếu thu tạm ứng từ hợp đồng đã ký của dự án
 * Gọi từ ProjectListView khi click "Tạo phiếu thu"
 */
export function createReceiptFromContract(project: ProjectInfo): CreateReceiptResult {
  const projectStore = useProjectStore.getState();
  const banHangStore = useBanHangStore.getState();
  const thuChiStore = useThuChiStore.getState();

  // Kiểm tra hợp đồng tồn tại
  if (!project.contractId) {
    return { success: false, error: 'Dự án chưa có hợp đồng.' };
  }

  const contract: Contract | undefined = banHangStore.contracts.find(
    (c) => c.contractId === project.contractId,
  );
  if (!contract) {
    return { success: false, error: 'Không tìm thấy hợp đồng.' };
  }

  const receiptCode = nextReceiptCode(thuChiStore.receipts);
  const receiptId = generateId();
  const now = new Date().toISOString();

  const receipt: CashReceipt = {
    receiptId,
    receiptCode,
    customerId: contract.customerId,
    customerName: contract.customerName,
    projectId: project.id,
    contractId: contract.contractId,
    contractCode: contract.contractCode,
    amount: contract.depositAmount,
    paymentMethod: 'bank_transfer',
    description: `Tạm ứng ${contract.depositPercent}% hợp đồng ${contract.contractCode} — ${contract.projectName || project.name}`,
    status: 'confirmed',
    createdBy: project.employee || '',
    createdAt: now,
    updatedAt: now,
    confirmedBy: project.employee || '',
    confirmedAt: now,
  };

  // 1. Tạo receipt trong ThuChi store
  thuChiStore.addReceipt(receipt);

  // 2. Liên kết ngược vào ProjectInfo
  projectStore.loadProject(project.id);
  projectStore.updateProject({
    receiptId,
    receiptCode,
  });

  return { success: true, receiptId, receiptCode };
}
