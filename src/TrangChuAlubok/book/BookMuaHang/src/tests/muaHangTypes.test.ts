// ============================================================
// Tests: muaHang.types — helper functions
// ============================================================

import {
  calcLineAmount,
  calcTotals,
  calcRequestTotal,
  PR_STATUS_LABELS,
  PR_STATUS_COLORS,
  PO_STATUS_LABELS,
  PO_STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '../types';
import type {
  PurchaseRequestItem,
  PurchaseOrderItem,
  PurchaseRequestStatus,
  PurchaseOrderStatus,
  PriorityLevel,
} from '../types';

describe('muaHang.types', () => {
  // ── calcLineAmount ──────────────────────────────────────
  describe('calcLineAmount', () => {
    it('returns qty * price when no discount', () => {
      expect(calcLineAmount(10, 100000, 0)).toBe(1000000);
    });

    it('applies discount correctly', () => {
      // 10 * 100000 * (1 - 5/100) = 950000
      expect(calcLineAmount(10, 100000, 5)).toBe(950000);
    });

    it('returns 0 when qty is 0', () => {
      expect(calcLineAmount(0, 500000, 10)).toBe(0);
    });

    it('returns 0 when price is 0', () => {
      expect(calcLineAmount(5, 0, 0)).toBe(0);
    });

    it('handles 100% discount', () => {
      expect(calcLineAmount(10, 100000, 100)).toBe(0);
    });
  });

  // ── calcTotals ──────────────────────────────────────────
  describe('calcTotals', () => {
    const items: PurchaseOrderItem[] = [
      { itemId: 'a', description: 'A', unit: 'cái', quantity: 10, unitPrice: 100000, discountPercent: 0, amount: 1000000, receivedQty: 0 },
      { itemId: 'b', description: 'B', unit: 'cái', quantity: 5, unitPrice: 200000, discountPercent: 10, amount: 900000, receivedQty: 0 },
    ];

    it('calculates subtotal as sum of gross amounts (qty * price)', () => {
      const result = calcTotals(items, 10);
      // (10*100000) + (5*200000) = 1000000 + 1000000 = 2000000
      expect(result.subtotal).toBe(2000000);
    });

    it('calculates totalDiscount', () => {
      const result = calcTotals(items, 10);
      // item a: 0%, item b: 10% of 1000000 = 100000
      expect(result.totalDiscount).toBe(100000);
    });

    it('calculates tax on after-discount amount', () => {
      const result = calcTotals(items, 10);
      // afterDiscount = 2000000 - 100000 = 1900000
      // tax = 1900000 * 10/100 = 190000
      expect(result.taxAmount).toBe(190000);
    });

    it('calculates totalAmount = afterDiscount + tax', () => {
      const result = calcTotals(items, 10);
      expect(result.totalAmount).toBe(1900000 + 190000);
    });

    it('returns zeros for empty items', () => {
      const result = calcTotals([], 10);
      expect(result.subtotal).toBe(0);
      expect(result.totalDiscount).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(0);
    });

    it('handles 0% tax rate', () => {
      const result = calcTotals(items, 0);
      expect(result.taxAmount).toBe(0);
      expect(result.totalAmount).toBe(1900000);
    });
  });

  // ── calcRequestTotal ────────────────────────────────────
  describe('calcRequestTotal', () => {
    it('sums qty * estimatedPrice for all items', () => {
      const items: PurchaseRequestItem[] = [
        { itemId: '1', description: 'X', unit: 'cái', quantity: 10, estimatedPrice: 50000, estimatedAmount: 500000 },
        { itemId: '2', description: 'Y', unit: 'm', quantity: 20, estimatedPrice: 30000, estimatedAmount: 600000 },
      ];
      expect(calcRequestTotal(items)).toBe(1100000);
    });

    it('returns 0 for empty items', () => {
      expect(calcRequestTotal([])).toBe(0);
    });
  });

  // ── Status labels and colors completeness ───────────────
  describe('status labels and colors', () => {
    const prStatuses: PurchaseRequestStatus[] = ['draft', 'pending', 'approved', 'rejected', 'closed', 'cancelled'];
    const poStatuses: PurchaseOrderStatus[] = ['new', 'confirmed', 'receiving', 'completed', 'cancelled'];
    const priorities: PriorityLevel[] = ['low', 'normal', 'high', 'urgent'];

    it('PR_STATUS_LABELS covers all statuses', () => {
      for (const s of prStatuses) {
        expect(PR_STATUS_LABELS[s]).toBeDefined();
      }
    });

    it('PR_STATUS_COLORS covers all statuses', () => {
      for (const s of prStatuses) {
        expect(PR_STATUS_COLORS[s]).toMatch(/^#/);
      }
    });

    it('PO_STATUS_LABELS covers all statuses', () => {
      for (const s of poStatuses) {
        expect(PO_STATUS_LABELS[s]).toBeDefined();
      }
    });

    it('PO_STATUS_COLORS covers all statuses', () => {
      for (const s of poStatuses) {
        expect(PO_STATUS_COLORS[s]).toMatch(/^#/);
      }
    });

    it('PRIORITY_LABELS covers all levels', () => {
      for (const p of priorities) {
        expect(PRIORITY_LABELS[p]).toBeDefined();
      }
    });

    it('PRIORITY_COLORS covers all levels', () => {
      for (const p of priorities) {
        expect(PRIORITY_COLORS[p]).toMatch(/^#/);
      }
    });
  });
});
