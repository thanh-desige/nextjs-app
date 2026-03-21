/**
 * computeProjectStatus — Tự tính trạng thái quy trình dự án
 *
 * Rule ưu tiên từ cao → thấp (dừng khi gặp điều kiện đầu tiên):
 * 1. Có lệnh SX hợp lệ → in_production
 * 2. Có phiếu thu hợp lệ → deposited
 * 3. Có hợp đồng hợp lệ → contracted
 * 4. Có báo giá hợp lệ → quoted
 * 5. soLuongBo > 0 → designing
 * 6. soLuongBo === 0 → draft
 *
 * "Hợp lệ" = chứng từ.designRevision === project.designRevision hiện tại
 */

import type { ProjectInfo } from '../store/projectStore';

export type ComputedStatus =
  | 'draft'
  | 'designing'
  | 'quoted'
  | 'contracted'
  | 'deposited'
  | 'in_production';

export type StaleDocumentType = 'quote' | 'contract' | 'receipt' | 'production_order';

export interface StatusResult {
  /** Trạng thái tính được */
  status: ComputedStatus;
  /** Label hiển thị cột Hiện trạng */
  statusLabel: string;
  /** Nội dung cột Liên kết / Hành động */
  actionLabel: string;
  /** Mã chứng từ (BG-xxxx, HD-xxxx...) nếu có */
  actionCode: string;
  /** Loại hành động */
  actionType: 'none' | 'create_quote' | 'update_quote' | 'view_quote' | 'create_contract' | 'view_contract' | 'create_receipt' | 'view_receipt' | 'create_production_order' | 'view_production_order';
  /** Phase 8: Danh sách chứng từ đã mất hiệu lực (revision mismatch) */
  staleDocuments: StaleDocumentType[];
}

export const STATUS_LABELS: Record<ComputedStatus, string> = {
  draft: 'Nháp',
  designing: 'Đang thiết kế',
  quoted: 'Đã báo giá',
  contracted: 'Đã ký hợp đồng',
  deposited: 'Đã tạm ứng',
  in_production: 'Đã vào lệnh SX',
};

export const STATUS_COLORS: Record<ComputedStatus, string> = {
  draft: '#888888',
  designing: '#3b82f6',
  quoted: '#f59e0b',
  contracted: '#22c55e',
  deposited: '#a855f7',
  in_production: '#ef4444',
};

/** Kiểm tra chứng từ có hợp lệ với design hiện tại */
function isDocumentValid(docDesignRevision: number | undefined, currentDesignRevision: number): boolean {
  if (docDesignRevision === undefined) return false;
  return docDesignRevision === currentDesignRevision;
}

/** Kiểm tra có chứng từ cũ (tồn tại nhưng revision không khớp) */
function hasStaleDocument(docId: string | undefined, docDesignRevision: number | undefined, currentDesignRevision: number): boolean {
  if (!docId) return false;
  return !isDocumentValid(docDesignRevision, currentDesignRevision);
}

export function computeProjectStatus(project: ProjectInfo): StatusResult {
  const rev = project.designRevision ?? 0;

  // Phase 8: Collect all stale documents
  const staleDocuments: StaleDocumentType[] = [];
  if (hasStaleDocument(project.quoteId, project.quoteDesignRevision, rev)) staleDocuments.push('quote');
  if (hasStaleDocument(project.contractId, project.quoteDesignRevision, rev)) staleDocuments.push('contract');
  if (hasStaleDocument(project.receiptId, project.quoteDesignRevision, rev)) staleDocuments.push('receipt');
  if (hasStaleDocument(project.productionOrderId, project.quoteDesignRevision, rev)) staleDocuments.push('production_order');

  // 1. Có lệnh SX hợp lệ → in_production
  if (project.productionOrderId && isDocumentValid(project.quoteDesignRevision, rev)) {
    return {
      status: 'in_production',
      statusLabel: STATUS_LABELS.in_production,
      actionLabel: project.productionOrderCode || 'LSX',
      actionCode: project.productionOrderCode || '',
      actionType: 'view_production_order',
      staleDocuments,
    };
  }

  // 2. Có phiếu thu hợp lệ → deposited
  if (project.receiptId && isDocumentValid(project.quoteDesignRevision, rev)) {
    return {
      status: 'deposited',
      statusLabel: STATUS_LABELS.deposited,
      actionLabel: 'Tạo lệnh SX',
      actionCode: project.receiptCode || '',
      actionType: 'create_production_order',
      staleDocuments,
    };
  }

  // 3. Có hợp đồng hợp lệ → contracted
  if (project.contractId && isDocumentValid(project.quoteDesignRevision, rev)) {
    return {
      status: 'contracted',
      statusLabel: STATUS_LABELS.contracted,
      actionLabel: 'Tạo phiếu thu',
      actionCode: project.contractCode || '',
      actionType: 'create_receipt',
      staleDocuments,
    };
  }

  // 4. Có báo giá hợp lệ → quoted
  if (project.quoteId && isDocumentValid(project.quoteDesignRevision, rev)) {
    return {
      status: 'quoted',
      statusLabel: STATUS_LABELS.quoted,
      actionLabel: 'Tạo hợp đồng',
      actionCode: project.quoteCode || '',
      actionType: 'create_contract',
      staleDocuments,
    };
  }

  // 5. soLuongBo > 0 → designing
  const soLuong = project.soLuongBo ?? 0;
  if (soLuong > 0) {
    const bomSynced = (project.bomDesignRevision ?? 0) === rev && (project.bomRevision ?? 0) > 0;
    const hasStaleQuote = hasStaleDocument(project.quoteId, project.quoteDesignRevision, rev);

    if (bomSynced) {
      return {
        status: 'designing',
        statusLabel: STATUS_LABELS.designing,
        actionLabel: hasStaleQuote ? 'Cập nhật báo giá' : 'Tạo báo giá',
        actionCode: '',
        actionType: hasStaleQuote ? 'update_quote' : 'create_quote',
        staleDocuments,
      };
    }

    return {
      status: 'designing',
      statusLabel: STATUS_LABELS.designing,
      actionLabel: '',
      actionCode: '',
      actionType: 'none',
      staleDocuments,
    };
  }

  // 6. Default → draft
  return {
    status: 'draft',
    statusLabel: STATUS_LABELS.draft,
    actionLabel: '',
    actionCode: '',
    actionType: 'none',
    staleDocuments,
  };
}
