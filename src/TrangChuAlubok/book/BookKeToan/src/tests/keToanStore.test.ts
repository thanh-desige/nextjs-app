import { useKeToanStore } from '../store/keToanStore';
import type { AccountingVoucher, AccountingInvoice } from '../types';

// Reset store before each test
beforeEach(() => {
  useKeToanStore.getState().resetAll();
});

describe('keToanStore', () => {
  // ── Initial state ─────────────────────────────────────────
  describe('initial state', () => {
    it('has 4 seed vouchers', () => {
      expect(useKeToanStore.getState().vouchers).toHaveLength(4);
    });

    it('has 3 seed invoices', () => {
      expect(useKeToanStore.getState().invoices).toHaveLength(3);
    });

    it('voucher CT-0001 is approved receipt type', () => {
      const v = useKeToanStore.getState().vouchers.find((v) => v.voucherCode === 'CT-0001');
      expect(v).toBeDefined();
      expect(v!.status).toBe('approved');
      expect(v!.voucherType).toBe('receipt');
      expect(v!.totalDebit).toBe(50000000);
    });

    it('voucher CT-0003 is draft journal type', () => {
      const v = useKeToanStore.getState().vouchers.find((v) => v.voucherCode === 'CT-0003');
      expect(v).toBeDefined();
      expect(v!.status).toBe('draft');
      expect(v!.voucherType).toBe('journal');
    });

    it('invoice HD-0001 is approved with VAT', () => {
      const inv = useKeToanStore.getState().invoices.find((i) => i.invoiceCode === 'HD-0001');
      expect(inv).toBeDefined();
      expect(inv!.status).toBe('approved');
      expect(inv!.vatRate).toBe(0.08);
      expect(inv!.total).toBe(160920000);
    });

    it('invoice HD-0003 is cancelled', () => {
      const inv = useKeToanStore.getState().invoices.find((i) => i.invoiceCode === 'HD-0003');
      expect(inv).toBeDefined();
      expect(inv!.status).toBe('cancelled');
    });

    it('all vouchers have balanced entries', () => {
      for (const v of useKeToanStore.getState().vouchers) {
        expect(Math.abs(v.totalDebit - v.totalCredit)).toBeLessThan(0.01);
      }
    });

    it('all vouchers have at least 2 entries', () => {
      for (const v of useKeToanStore.getState().vouchers) {
        expect(v.entries.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // ── Voucher CRUD ──────────────────────────────────────────
  describe('voucher CRUD', () => {
    it('addVoucher adds a new voucher', () => {
      const newV: AccountingVoucher = {
        voucherId: 'v-new',
        voucherCode: 'CT-0005',
        voucherType: 'journal',
        date: '2026-03-18',
        description: 'Test voucher',
        entries: [
          { entryId: 'e-n1', accountCode: '111', accountName: 'Cash', debitAmount: 1000, creditAmount: 0, description: '' },
          { entryId: 'e-n2', accountCode: '131', accountName: 'AR', debitAmount: 0, creditAmount: 1000, description: '' },
        ],
        totalDebit: 1000,
        totalCredit: 1000,
        status: 'draft',
        createdBy: 'Test',
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      };
      useKeToanStore.getState().addVoucher(newV);
      expect(useKeToanStore.getState().vouchers).toHaveLength(5);
      expect(useKeToanStore.getState().vouchers.find((v) => v.voucherCode === 'CT-0005')).toBeDefined();
    });

    it('updateVoucher patches fields', () => {
      useKeToanStore.getState().updateVoucher('v-003', { status: 'approved', approvedBy: 'Tester' });
      const v = useKeToanStore.getState().vouchers.find((v) => v.voucherId === 'v-003');
      expect(v!.status).toBe('approved');
      expect(v!.approvedBy).toBe('Tester');
    });

    it('deleteVoucher removes by id', () => {
      useKeToanStore.getState().deleteVoucher('v-004');
      expect(useKeToanStore.getState().vouchers).toHaveLength(3);
      expect(useKeToanStore.getState().vouchers.find((v) => v.voucherId === 'v-004')).toBeUndefined();
    });

    it('setVouchers replaces entire array', () => {
      useKeToanStore.getState().setVouchers([]);
      expect(useKeToanStore.getState().vouchers).toHaveLength(0);
    });
  });

  // ── Invoice CRUD ──────────────────────────────────────────
  describe('invoice CRUD', () => {
    it('addInvoice adds a new invoice', () => {
      const newInv: AccountingInvoice = {
        invoiceId: 'inv-new',
        invoiceCode: 'HD-0004',
        customerId: 'kh-new',
        customerName: 'Test Customer',
        date: '2026-03-18',
        items: [{ itemId: 'ii-new', description: 'Test', quantity: 1, unitPrice: 100000, amount: 100000 }],
        subtotal: 100000,
        vatRate: 0.08,
        vatAmount: 8000,
        total: 108000,
        status: 'draft',
        createdBy: 'Test',
        createdAt: '2026-03-18T00:00:00Z',
        updatedAt: '2026-03-18T00:00:00Z',
      };
      useKeToanStore.getState().addInvoice(newInv);
      expect(useKeToanStore.getState().invoices).toHaveLength(4);
    });

    it('updateInvoice patches fields', () => {
      useKeToanStore.getState().updateInvoice('inv-002', { status: 'approved', approvedBy: 'Tester' });
      const inv = useKeToanStore.getState().invoices.find((i) => i.invoiceId === 'inv-002');
      expect(inv!.status).toBe('approved');
      expect(inv!.approvedBy).toBe('Tester');
    });

    it('deleteInvoice removes by id', () => {
      useKeToanStore.getState().deleteInvoice('inv-003');
      expect(useKeToanStore.getState().invoices).toHaveLength(2);
    });

    it('setInvoices replaces entire array', () => {
      useKeToanStore.getState().setInvoices([]);
      expect(useKeToanStore.getState().invoices).toHaveLength(0);
    });
  });

  // ── resetAll ──────────────────────────────────────────────
  describe('resetAll', () => {
    it('resets to seed data', () => {
      useKeToanStore.getState().setVouchers([]);
      useKeToanStore.getState().setInvoices([]);
      expect(useKeToanStore.getState().vouchers).toHaveLength(0);
      expect(useKeToanStore.getState().invoices).toHaveLength(0);

      useKeToanStore.getState().resetAll();
      expect(useKeToanStore.getState().vouchers).toHaveLength(4);
      expect(useKeToanStore.getState().invoices).toHaveLength(3);
    });
  });
});
