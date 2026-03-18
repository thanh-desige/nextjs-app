// ============================================================
// ThuChi Store tests
// Tests for Zustand store: initial state, CRUD, reset
// ============================================================

import { useThuChiStore } from '../store/thuChiStore';
import type { CashReceipt, CashPayment, AccountReceivable, AccountPayable } from '../types';

// Reset store before each test
beforeEach(() => {
  useThuChiStore.getState().resetAll();
});

// ── Initial State ────────────────────────────────────────────

describe('ThuChiStore initial state', () => {
  it('has seed cash receipts', () => {
    const { receipts } = useThuChiStore.getState();
    expect(receipts.length).toBeGreaterThanOrEqual(3);
  });

  it('has seed cash payments', () => {
    const { payments } = useThuChiStore.getState();
    expect(payments.length).toBeGreaterThanOrEqual(2);
  });

  it('has seed AR entries', () => {
    const { receivables } = useThuChiStore.getState();
    expect(receivables.length).toBeGreaterThanOrEqual(3);
  });

  it('has seed AP entries', () => {
    const { payables } = useThuChiStore.getState();
    expect(payables.length).toBeGreaterThanOrEqual(2);
  });

  it('seed receipts have required fields', () => {
    const { receipts } = useThuChiStore.getState();
    for (const r of receipts) {
      expect(r.receiptId).toBeTruthy();
      expect(r.receiptCode).toMatch(/^PT-\d{4}$/);
      expect(r.customerName).toBeTruthy();
      expect(r.amount).toBeGreaterThan(0);
      expect(['draft', 'confirmed', 'cancelled']).toContain(r.status);
      expect(['cash', 'bank_transfer', 'check', 'other']).toContain(r.paymentMethod);
    }
  });

  it('seed payments have required fields', () => {
    const { payments } = useThuChiStore.getState();
    for (const p of payments) {
      expect(p.paymentId).toBeTruthy();
      expect(p.paymentCode).toMatch(/^PC-\d{4}$/);
      expect(p.supplierName).toBeTruthy();
      expect(p.amount).toBeGreaterThan(0);
      expect(['draft', 'confirmed', 'cancelled']).toContain(p.status);
    }
  });

  it('seed AR have required fields', () => {
    const { receivables } = useThuChiStore.getState();
    for (const ar of receivables) {
      expect(ar.arId).toBeTruthy();
      expect(ar.customerName).toBeTruthy();
      expect(ar.soCode).toBeTruthy();
      expect(ar.totalAmount).toBeGreaterThan(0);
      expect(['open', 'partial', 'paid', 'overdue']).toContain(ar.status);
    }
  });

  it('seed AP have required fields', () => {
    const { payables } = useThuChiStore.getState();
    for (const ap of payables) {
      expect(ap.apId).toBeTruthy();
      expect(ap.supplierName).toBeTruthy();
      expect(ap.poCode).toBeTruthy();
      expect(ap.totalAmount).toBeGreaterThan(0);
      expect(['open', 'partial', 'paid', 'overdue']).toContain(ap.status);
    }
  });
});

// ── Receipt CRUD ─────────────────────────────────────────────

describe('Receipt CRUD', () => {
  it('addReceipt appends a new receipt', () => {
    const r: CashReceipt = {
      receiptId: 'test-cr', receiptCode: 'PT-9999',
      customerId: 'c1', customerName: 'Test KH',
      amount: 100_000, paymentMethod: 'cash',
      description: 'Test', status: 'draft', createdBy: 'u1',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    useThuChiStore.getState().addReceipt(r);
    expect(useThuChiStore.getState().receipts.find(x => x.receiptId === 'test-cr')).toBeDefined();
  });

  it('updateReceipt patches a receipt', () => {
    const { receipts } = useThuChiStore.getState();
    const first = receipts[0];
    useThuChiStore.getState().updateReceipt(first.receiptId, { status: 'cancelled', notes: 'test' });
    const updated = useThuChiStore.getState().receipts.find(r => r.receiptId === first.receiptId);
    expect(updated?.status).toBe('cancelled');
    expect(updated?.notes).toBe('test');
  });

  it('deleteReceipt removes a receipt', () => {
    const { receipts } = useThuChiStore.getState();
    const firstId = receipts[0].receiptId;
    const prevLen = receipts.length;
    useThuChiStore.getState().deleteReceipt(firstId);
    expect(useThuChiStore.getState().receipts.length).toBe(prevLen - 1);
    expect(useThuChiStore.getState().receipts.find(r => r.receiptId === firstId)).toBeUndefined();
  });

  it('setReceipts replaces all receipts', () => {
    useThuChiStore.getState().setReceipts([]);
    expect(useThuChiStore.getState().receipts.length).toBe(0);
  });
});

// ── Payment CRUD ─────────────────────────────────────────────

describe('Payment CRUD', () => {
  it('addPayment appends a new payment', () => {
    const p: CashPayment = {
      paymentId: 'test-cp', paymentCode: 'PC-9999',
      supplierId: 's1', supplierName: 'Test NCC',
      amount: 50_000, paymentMethod: 'bank_transfer',
      description: 'Test', status: 'draft', createdBy: 'u1',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    useThuChiStore.getState().addPayment(p);
    expect(useThuChiStore.getState().payments.find(x => x.paymentId === 'test-cp')).toBeDefined();
  });

  it('updatePayment patches a payment', () => {
    const { payments } = useThuChiStore.getState();
    const first = payments[0];
    useThuChiStore.getState().updatePayment(first.paymentId, { status: 'cancelled' });
    expect(useThuChiStore.getState().payments.find(p => p.paymentId === first.paymentId)?.status).toBe('cancelled');
  });

  it('deletePayment removes a payment', () => {
    const { payments } = useThuChiStore.getState();
    const firstId = payments[0].paymentId;
    const prevLen = payments.length;
    useThuChiStore.getState().deletePayment(firstId);
    expect(useThuChiStore.getState().payments.length).toBe(prevLen - 1);
  });

  it('setPayments replaces all payments', () => {
    useThuChiStore.getState().setPayments([]);
    expect(useThuChiStore.getState().payments.length).toBe(0);
  });
});

// ── AR CRUD ──────────────────────────────────────────────────

describe('AR CRUD', () => {
  it('updateReceivable patches an AR entry', () => {
    const { receivables } = useThuChiStore.getState();
    const first = receivables[0];
    useThuChiStore.getState().updateReceivable(first.arId, { paidAmount: first.totalAmount, remainingAmount: 0, status: 'paid' });
    const updated = useThuChiStore.getState().receivables.find(ar => ar.arId === first.arId);
    expect(updated?.status).toBe('paid');
    expect(updated?.remainingAmount).toBe(0);
  });

  it('setReceivables replaces all AR entries', () => {
    useThuChiStore.getState().setReceivables([]);
    expect(useThuChiStore.getState().receivables.length).toBe(0);
  });
});

// ── AP CRUD ──────────────────────────────────────────────────

describe('AP CRUD', () => {
  it('updatePayable patches an AP entry', () => {
    const { payables } = useThuChiStore.getState();
    const first = payables[0];
    useThuChiStore.getState().updatePayable(first.apId, { paidAmount: first.totalAmount, remainingAmount: 0, status: 'paid' });
    const updated = useThuChiStore.getState().payables.find(ap => ap.apId === first.apId);
    expect(updated?.status).toBe('paid');
    expect(updated?.remainingAmount).toBe(0);
  });

  it('setPayables replaces all AP entries', () => {
    useThuChiStore.getState().setPayables([]);
    expect(useThuChiStore.getState().payables.length).toBe(0);
  });
});

// ── resetAll ─────────────────────────────────────────────────

describe('resetAll', () => {
  it('restores initial state after modifications', () => {
    useThuChiStore.getState().setReceipts([]);
    useThuChiStore.getState().setPayments([]);
    useThuChiStore.getState().setReceivables([]);
    useThuChiStore.getState().setPayables([]);
    useThuChiStore.getState().resetAll();
    const s = useThuChiStore.getState();
    expect(s.receipts.length).toBeGreaterThanOrEqual(3);
    expect(s.payments.length).toBeGreaterThanOrEqual(2);
    expect(s.receivables.length).toBeGreaterThanOrEqual(3);
    expect(s.payables.length).toBeGreaterThanOrEqual(2);
  });
});
