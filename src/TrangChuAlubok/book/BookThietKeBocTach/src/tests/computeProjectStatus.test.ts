/**
 * Tests for computeProjectStatus
 * Covers all 7 trạng thái + revision mismatch + sub-rules
 */
import { computeProjectStatus } from '../domain/computeProjectStatus';
import type { ProjectInfo } from '../store/projectStore';

// Helper: create a minimal ProjectInfo
function makeProject(overrides: Partial<ProjectInfo> = {}): ProjectInfo {
  return {
    id: 'test-1',
    name: 'Test Project',
    created: '2026-01-01T00:00:00Z',
    modified: '2026-01-01T00:00:00Z',
    status: 'draft',
    designRevision: 0,
    bomRevision: 0,
    bomDesignRevision: 0,
    isLocked: false,
    soLuongBo: 0,
    ...overrides,
  };
}

describe('computeProjectStatus', () => {
  // ── 1. Draft ──
  describe('Nháp (draft)', () => {
    it('returns draft when soLuongBo = 0', () => {
      const result = computeProjectStatus(makeProject({ soLuongBo: 0 }));
      expect(result.status).toBe('draft');
      expect(result.statusLabel).toBe('Nháp');
      expect(result.actionLabel).toBe('');
      expect(result.actionType).toBe('none');
    });

    it('returns draft when soLuongBo is undefined', () => {
      const p = makeProject();
      delete (p as Record<string, unknown>).soLuongBo;
      const result = computeProjectStatus(p);
      expect(result.status).toBe('draft');
    });
  });

  // ── 2. Designing ──
  describe('Đang thiết kế (designing)', () => {
    it('returns designing when soLuongBo > 0 and BOM not synced', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 5,
        designRevision: 1,
        bomRevision: 0,
        bomDesignRevision: 0,
      }));
      expect(result.status).toBe('designing');
      expect(result.statusLabel).toBe('Đang thiết kế');
      expect(result.actionLabel).toBe('');
      expect(result.actionType).toBe('none');
    });

    it('returns designing with "Tạo báo giá" when BOM synced, no quote', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 3,
        designRevision: 2,
        bomRevision: 1,
        bomDesignRevision: 2,
      }));
      expect(result.status).toBe('designing');
      expect(result.actionLabel).toBe('Tạo báo giá');
      expect(result.actionType).toBe('create_quote');
    });

    it('returns designing with "Cập nhật báo giá" when BOM synced + stale quote', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 3,
        designRevision: 5,
        bomRevision: 2,
        bomDesignRevision: 5,
        quoteId: 'q-old',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 3, // mismatched
      }));
      expect(result.status).toBe('designing');
      expect(result.actionLabel).toBe('Cập nhật báo giá');
      expect(result.actionType).toBe('update_quote');
    });
  });

  // ── 3. Quoted ──
  describe('Đã báo giá (quoted)', () => {
    it('returns quoted when quoteId exists and designRevision matches', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 5,
        designRevision: 3,
        bomRevision: 1,
        bomDesignRevision: 3,
        quoteId: 'q-1',
        quoteCode: 'BG-0004',
        quoteDesignRevision: 3,
      }));
      expect(result.status).toBe('quoted');
      expect(result.statusLabel).toBe('Đã báo giá');
      expect(result.actionLabel).toBe('Tạo hợp đồng');
      expect(result.actionCode).toBe('BG-0004');
      expect(result.actionType).toBe('create_contract');
    });

    it('reverts to designing when quote revision mismatches', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 5,
        designRevision: 5,
        quoteId: 'q-1',
        quoteCode: 'BG-0001',
        quoteDesignRevision: 3, // old revision
      }));
      expect(result.status).toBe('designing');
    });
  });

  // ── 4. Contracted ──
  describe('Đã ký hợp đồng (contracted)', () => {
    it('returns contracted when contractId exists and revision matches', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 5,
        designRevision: 3,
        quoteId: 'q-1',
        quoteCode: 'BG-0004',
        quoteDesignRevision: 3,
        contractId: 'c-1',
        contractCode: 'HD-0001',
      }));
      expect(result.status).toBe('contracted');
      expect(result.statusLabel).toBe('Đã ký hợp đồng');
      expect(result.actionCode).toBe('HD-0001');
      expect(result.actionType).toBe('create_receipt');
    });
  });

  // ── 5. Deposited ──
  describe('Đã tạm ứng (deposited)', () => {
    it('returns deposited when receiptId exists and revision matches', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 5,
        designRevision: 3,
        quoteId: 'q-1',
        quoteDesignRevision: 3,
        contractId: 'c-1',
        contractCode: 'HD-0001',
        receiptId: 'r-1',
        receiptCode: 'PT-0001',
      }));
      expect(result.status).toBe('deposited');
      expect(result.statusLabel).toBe('Đã tạm ứng');
      expect(result.actionCode).toBe('PT-0001');
      expect(result.actionType).toBe('create_production_order');
    });
  });

  // ── 6. In Production ──
  describe('Đã vào lệnh SX (in_production)', () => {
    it('returns in_production when productionOrderId exists and revision matches', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 5,
        designRevision: 3,
        quoteId: 'q-1',
        quoteDesignRevision: 3,
        contractId: 'c-1',
        receiptId: 'r-1',
        productionOrderId: 'po-1',
        productionOrderCode: 'LSX-0001',
      }));
      expect(result.status).toBe('in_production');
      expect(result.statusLabel).toBe('Đã vào lệnh SX');
      expect(result.actionCode).toBe('LSX-0001');
      expect(result.actionType).toBe('view_production_order');
    });

    it('reverts when design revision changed after production order', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 5,
        designRevision: 10,
        quoteId: 'q-1',
        quoteDesignRevision: 3,
        productionOrderId: 'po-1',
        productionOrderCode: 'LSX-0001',
      }));
      // designRevision 10 != quoteDesignRevision 3 → revert
      expect(result.status).not.toBe('in_production');
    });
  });

  // ── 7. Cascade invalidation ──
  describe('Revision cascade invalidation', () => {
    it('full pipeline valid at revision 3', () => {
      const project = makeProject({
        soLuongBo: 10,
        designRevision: 3,
        bomRevision: 2,
        bomDesignRevision: 3,
        quoteId: 'q-1',
        quoteCode: 'BG-0004',
        quoteDesignRevision: 3,
        contractId: 'c-1',
        contractCode: 'HD-0001',
        receiptId: 'r-1',
        receiptCode: 'PT-0001',
        productionOrderId: 'po-1',
        productionOrderCode: 'LSX-0001',
      });
      const result = computeProjectStatus(project);
      expect(result.status).toBe('in_production');
    });

    it('reverts entire pipeline when designRevision bumps', () => {
      const project = makeProject({
        soLuongBo: 10,
        designRevision: 5, // bumped from 3 to 5
        bomRevision: 2,
        bomDesignRevision: 3, // stale
        quoteId: 'q-1',
        quoteCode: 'BG-0004',
        quoteDesignRevision: 3, // stale
        contractId: 'c-1',
        contractCode: 'HD-0001',
        receiptId: 'r-1',
        receiptCode: 'PT-0001',
        productionOrderId: 'po-1',
        productionOrderCode: 'LSX-0001',
      });
      const result = computeProjectStatus(project);
      // All documents stale → soLuongBo > 0 → designing
      expect(result.status).toBe('designing');
      // BOM not synced (bomDesignRevision 3 ≠ designRevision 5)
      expect(result.actionType).toBe('none');
    });

    it('shows "Cập nhật báo giá" when BOM synced but quote stale', () => {
      const project = makeProject({
        soLuongBo: 10,
        designRevision: 5,
        bomRevision: 3,
        bomDesignRevision: 5, // BOM synced
        quoteId: 'q-1',
        quoteCode: 'BG-0004',
        quoteDesignRevision: 3, // stale
      });
      const result = computeProjectStatus(project);
      expect(result.status).toBe('designing');
      expect(result.actionLabel).toBe('Cập nhật báo giá');
      expect(result.actionType).toBe('update_quote');
    });
  });

  // ── 8. isLocked does not affect computedStatus ──
  describe('isLocked is separate from status', () => {
    it('isLocked=true does not change computedStatus', () => {
      const result = computeProjectStatus(makeProject({
        soLuongBo: 5,
        designRevision: 3,
        quoteId: 'q-1',
        quoteDesignRevision: 3,
        productionOrderId: 'po-1',
        productionOrderCode: 'LSX-0001',
        isLocked: true,
      }));
      expect(result.status).toBe('in_production');
    });
  });
});
