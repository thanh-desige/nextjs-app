import {
  VOUCHER_STATUS_LABELS,
  VOUCHER_STATUS_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  VOUCHER_TYPE_LABELS,
  isVoucherBalanced,
  calcEntryTotals,
  calcInvoiceTotal,
  type AccountingVoucher,
  type AccountEntry,
  type InvoiceItem,
} from '../types';

describe('keToan.types', () => {
  // ── Voucher Status ────────────────────────────────────────
  describe('VOUCHER_STATUS_LABELS', () => {
    it('has labels for all 4 statuses', () => {
      expect(VOUCHER_STATUS_LABELS.draft).toBe('Nháp');
      expect(VOUCHER_STATUS_LABELS.approved).toBe('Đã duyệt');
      expect(VOUCHER_STATUS_LABELS.rejected).toBe('Từ chối');
      expect(VOUCHER_STATUS_LABELS.closed).toBe('Đã khóa');
    });
  });

  describe('VOUCHER_STATUS_COLORS', () => {
    it('has hex colors for all 4 statuses', () => {
      expect(VOUCHER_STATUS_COLORS.draft).toMatch(/^#[0-9a-f]{6}$/i);
      expect(VOUCHER_STATUS_COLORS.approved).toMatch(/^#[0-9a-f]{6}$/i);
      expect(VOUCHER_STATUS_COLORS.rejected).toMatch(/^#[0-9a-f]{6}$/i);
      expect(VOUCHER_STATUS_COLORS.closed).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  // ── Invoice Status ────────────────────────────────────────
  describe('INVOICE_STATUS_LABELS', () => {
    it('has labels for all 3 statuses', () => {
      expect(INVOICE_STATUS_LABELS.draft).toBe('Nháp');
      expect(INVOICE_STATUS_LABELS.approved).toBe('Đã duyệt');
      expect(INVOICE_STATUS_LABELS.cancelled).toBe('Đã hủy');
    });
  });

  describe('INVOICE_STATUS_COLORS', () => {
    it('has hex colors for all 3 statuses', () => {
      expect(INVOICE_STATUS_COLORS.draft).toMatch(/^#[0-9a-f]{6}$/i);
      expect(INVOICE_STATUS_COLORS.approved).toMatch(/^#[0-9a-f]{6}$/i);
      expect(INVOICE_STATUS_COLORS.cancelled).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  // ── Voucher Type Labels ───────────────────────────────────
  describe('VOUCHER_TYPE_LABELS', () => {
    it('has labels for all 4 types', () => {
      expect(VOUCHER_TYPE_LABELS.receipt).toBe('Thu tiền');
      expect(VOUCHER_TYPE_LABELS.payment).toBe('Chi tiền');
      expect(VOUCHER_TYPE_LABELS.journal).toBe('Bút toán');
      expect(VOUCHER_TYPE_LABELS.adjustment).toBe('Điều chỉnh');
    });
  });

  // ── isVoucherBalanced ─────────────────────────────────────
  describe('isVoucherBalanced', () => {
    it('returns true when debit === credit', () => {
      const v = { totalDebit: 50000000, totalCredit: 50000000 } as AccountingVoucher;
      expect(isVoucherBalanced(v)).toBe(true);
    });

    it('returns true when difference < 0.01', () => {
      const v = { totalDebit: 50000000, totalCredit: 50000000.005 } as AccountingVoucher;
      expect(isVoucherBalanced(v)).toBe(true);
    });

    it('returns false when unbalanced', () => {
      const v = { totalDebit: 50000000, totalCredit: 40000000 } as AccountingVoucher;
      expect(isVoucherBalanced(v)).toBe(false);
    });
  });

  // ── calcEntryTotals ───────────────────────────────────────
  describe('calcEntryTotals', () => {
    it('sums debit and credit amounts', () => {
      const entries: AccountEntry[] = [
        { entryId: '1', accountCode: '111', accountName: 'A', debitAmount: 100, creditAmount: 0, description: '' },
        { entryId: '2', accountCode: '131', accountName: 'B', debitAmount: 0, creditAmount: 100, description: '' },
      ];
      const result = calcEntryTotals(entries);
      expect(result.totalDebit).toBe(100);
      expect(result.totalCredit).toBe(100);
    });

    it('returns 0 for empty array', () => {
      const result = calcEntryTotals([]);
      expect(result.totalDebit).toBe(0);
      expect(result.totalCredit).toBe(0);
    });

    it('handles multiple entries', () => {
      const entries: AccountEntry[] = [
        { entryId: '1', accountCode: '111', accountName: '', debitAmount: 30000, creditAmount: 0, description: '' },
        { entryId: '2', accountCode: '112', accountName: '', debitAmount: 20000, creditAmount: 0, description: '' },
        { entryId: '3', accountCode: '131', accountName: '', debitAmount: 0, creditAmount: 50000, description: '' },
      ];
      const result = calcEntryTotals(entries);
      expect(result.totalDebit).toBe(50000);
      expect(result.totalCredit).toBe(50000);
    });
  });

  // ── calcInvoiceTotal ──────────────────────────────────────
  describe('calcInvoiceTotal', () => {
    it('calculates subtotal, VAT, total correctly', () => {
      const items: InvoiceItem[] = [
        { itemId: '1', description: 'A', quantity: 10, unitPrice: 1000, amount: 10000 },
        { itemId: '2', description: 'B', quantity: 5, unitPrice: 2000, amount: 10000 },
      ];
      const result = calcInvoiceTotal(items, 0.08);
      expect(result.subtotal).toBe(20000);
      expect(result.vatAmount).toBeCloseTo(1600, 2);
      expect(result.total).toBeCloseTo(21600, 2);
    });

    it('returns 0 for empty items', () => {
      const result = calcInvoiceTotal([], 0.1);
      expect(result.subtotal).toBe(0);
      expect(result.vatAmount).toBe(0);
      expect(result.total).toBe(0);
    });

    it('handles 0% VAT', () => {
      const items: InvoiceItem[] = [
        { itemId: '1', description: 'C', quantity: 1, unitPrice: 5000, amount: 5000 },
      ];
      const result = calcInvoiceTotal(items, 0);
      expect(result.subtotal).toBe(5000);
      expect(result.vatAmount).toBe(0);
      expect(result.total).toBe(5000);
    });
  });
});
