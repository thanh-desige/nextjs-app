import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_COLORS,
  PO_STATUS_LABELS,
  PO_STATUS_COLORS,
  MP_STATUS_LABELS,
  MP_STATUS_COLORS,
  INST_STATUS_LABELS,
  INST_STATUS_COLORS,
  ACC_STATUS_LABELS,
  ACC_STATUS_COLORS,
  MI_STATUS_LABELS,
  MI_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  countByPOStatus,
  calcShortage,
  hasOverdueOrders,
  type ProductionOrder,
} from '../types';

describe('sanXuatThiCong.types', () => {
  // ── Project Status ────────────────────────────────────────
  describe('PROJECT_STATUS_LABELS', () => {
    it('has labels for all 7 statuses', () => {
      expect(PROJECT_STATUS_LABELS.planning).toBe('Lập kế hoạch');
      expect(PROJECT_STATUS_LABELS.in_production).toBe('Đang sản xuất');
      expect(PROJECT_STATUS_LABELS.ready_to_install).toBe('Sẵn sàng lắp');
      expect(PROJECT_STATUS_LABELS.installing).toBe('Đang lắp đặt');
      expect(PROJECT_STATUS_LABELS.acceptance).toBe('Nghiệm thu');
      expect(PROJECT_STATUS_LABELS.completed).toBe('Hoàn thành');
      expect(PROJECT_STATUS_LABELS.warranty).toBe('Bảo hành');
    });
  });

  describe('PROJECT_STATUS_COLORS', () => {
    it('has hex colors for all 7 statuses', () => {
      const statuses = ['planning', 'in_production', 'ready_to_install', 'installing', 'acceptance', 'completed', 'warranty'] as const;
      for (const s of statuses) {
        expect(PROJECT_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  // ── PO Status ─────────────────────────────────────────────
  describe('PO_STATUS_LABELS', () => {
    it('has labels for all 7 statuses', () => {
      expect(PO_STATUS_LABELS.new).toBe('Mới');
      expect(PO_STATUS_LABELS.cutting).toBe('Đang cắt');
      expect(PO_STATUS_LABELS.processing).toBe('Đang gia công');
      expect(PO_STATUS_LABELS.qc).toBe('Kiểm tra QC');
      expect(PO_STATUS_LABELS.completed).toBe('Hoàn tất');
      expect(PO_STATUS_LABELS.defect).toBe('Lỗi / Làm lại');
      expect(PO_STATUS_LABELS.cancelled).toBe('Hủy');
    });
  });

  describe('PO_STATUS_COLORS', () => {
    it('has hex colors for all 7 statuses', () => {
      const statuses = ['new', 'cutting', 'processing', 'qc', 'completed', 'defect', 'cancelled'] as const;
      for (const s of statuses) {
        expect(PO_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  // ── Material Plan Status ──────────────────────────────────
  describe('MP_STATUS_LABELS', () => {
    it('has labels for all 4 statuses', () => {
      expect(MP_STATUS_LABELS.pending).toBe('Chờ cấp phát');
      expect(MP_STATUS_LABELS.partial).toBe('Cấp 1 phần');
      expect(MP_STATUS_LABELS.fulfilled).toBe('Đã đủ');
      expect(MP_STATUS_LABELS.cancelled).toBe('Hủy');
    });
  });

  describe('MP_STATUS_COLORS', () => {
    it('has hex colors for all 4 statuses', () => {
      for (const s of ['pending', 'partial', 'fulfilled', 'cancelled'] as const) {
        expect(MP_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  // ── Installation Status ───────────────────────────────────
  describe('INST_STATUS_LABELS', () => {
    it('has labels for all 5 statuses', () => {
      expect(INST_STATUS_LABELS.scheduled).toBe('Đã lên lịch');
      expect(INST_STATUS_LABELS.in_progress).toBe('Đang thi công');
      expect(INST_STATUS_LABELS.paused).toBe('Tạm dừng');
      expect(INST_STATUS_LABELS.completed).toBe('Hoàn tất');
      expect(INST_STATUS_LABELS.cancelled).toBe('Hủy');
    });
  });

  describe('INST_STATUS_COLORS', () => {
    it('has hex colors for all 5 statuses', () => {
      for (const s of ['scheduled', 'in_progress', 'paused', 'completed', 'cancelled'] as const) {
        expect(INST_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  // ── Acceptance Status ─────────────────────────────────────
  describe('ACC_STATUS_LABELS', () => {
    it('has labels for all 4 statuses', () => {
      expect(ACC_STATUS_LABELS.pending).toBe('Chờ nghiệm thu');
      expect(ACC_STATUS_LABELS.approved).toBe('Đạt');
      expect(ACC_STATUS_LABELS.rejected).toBe('Không đạt');
      expect(ACC_STATUS_LABELS.conditional).toBe('Đạt có điều kiện');
    });
  });

  describe('ACC_STATUS_COLORS', () => {
    it('has hex colors for all 4 statuses', () => {
      for (const s of ['pending', 'approved', 'rejected', 'conditional'] as const) {
        expect(ACC_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  // ── Material Issue Status ─────────────────────────────────
  describe('MI_STATUS_LABELS', () => {
    it('has labels for all 4 statuses', () => {
      expect(MI_STATUS_LABELS.pending).toBe('Chờ duyệt');
      expect(MI_STATUS_LABELS.approved).toBe('Đã duyệt');
      expect(MI_STATUS_LABELS.issued).toBe('Đã xuất');
      expect(MI_STATUS_LABELS.cancelled).toBe('Hủy');
    });
  });

  describe('MI_STATUS_COLORS', () => {
    it('has hex colors for all 4 statuses', () => {
      for (const s of ['pending', 'approved', 'issued', 'cancelled'] as const) {
        expect(MI_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  // ── Priority ──────────────────────────────────────────────
  describe('PRIORITY_LABELS', () => {
    it('has labels for all 4 priorities', () => {
      expect(PRIORITY_LABELS.low).toBe('Thấp');
      expect(PRIORITY_LABELS.normal).toBe('Bình thường');
      expect(PRIORITY_LABELS.high).toBe('Cao');
      expect(PRIORITY_LABELS.urgent).toBe('Khẩn cấp');
    });
  });

  describe('PRIORITY_COLORS', () => {
    it('has hex colors for all 4 priorities', () => {
      for (const p of ['low', 'normal', 'high', 'urgent'] as const) {
        expect(PRIORITY_COLORS[p]).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  // ── countByPOStatus ───────────────────────────────────────
  describe('countByPOStatus', () => {
    it('counts orders by status correctly', () => {
      const orders = [
        { status: 'new' },
        { status: 'new' },
        { status: 'cutting' },
        { status: 'completed' },
      ] as ProductionOrder[];
      const counts = countByPOStatus(orders);
      expect(counts.new).toBe(2);
      expect(counts.cutting).toBe(1);
      expect(counts.completed).toBe(1);
      expect(counts.processing).toBe(0);
      expect(counts.qc).toBe(0);
      expect(counts.defect).toBe(0);
      expect(counts.cancelled).toBe(0);
    });

    it('returns all zeros for empty array', () => {
      const counts = countByPOStatus([]);
      expect(counts.new).toBe(0);
      expect(counts.completed).toBe(0);
    });
  });

  // ── calcShortage ──────────────────────────────────────────
  describe('calcShortage', () => {
    it('returns difference when required > issued', () => {
      expect(calcShortage(40, 30)).toBe(10);
    });

    it('returns 0 when issued >= required', () => {
      expect(calcShortage(30, 30)).toBe(0);
      expect(calcShortage(20, 30)).toBe(0);
    });
  });

  // ── hasOverdueOrders ──────────────────────────────────────
  describe('hasOverdueOrders', () => {
    it('returns true when active order is overdue', () => {
      const orders = [
        { status: 'processing', dueDate: '2026-03-10' },
      ] as ProductionOrder[];
      expect(hasOverdueOrders(orders, '2026-03-15')).toBe(true);
    });

    it('returns false when completed order is overdue', () => {
      const orders = [
        { status: 'completed', dueDate: '2026-03-10' },
      ] as ProductionOrder[];
      expect(hasOverdueOrders(orders, '2026-03-15')).toBe(false);
    });

    it('returns false when cancelled order is overdue', () => {
      const orders = [
        { status: 'cancelled', dueDate: '2026-03-10' },
      ] as ProductionOrder[];
      expect(hasOverdueOrders(orders, '2026-03-15')).toBe(false);
    });

    it('returns false when no orders are overdue', () => {
      const orders = [
        { status: 'new', dueDate: '2026-04-10' },
      ] as ProductionOrder[];
      expect(hasOverdueOrders(orders, '2026-03-15')).toBe(false);
    });

    it('returns false for empty array', () => {
      expect(hasOverdueOrders([], '2026-03-15')).toBe(false);
    });
  });
});
