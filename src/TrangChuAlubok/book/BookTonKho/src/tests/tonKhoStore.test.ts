// ============================================================
// TonKho Store tests
// Tests for Zustand store: initial state, CRUD, reset
// ============================================================

import { useTonKhoStore } from '../store/tonKhoStore';
import type { StockReceipt, StockIssue, StockTransfer } from '../types';

// Reset store before each test
beforeEach(() => {
  useTonKhoStore.getState().resetAll();
});

// ── Initial State ────────────────────────────────────────────

describe('TonKhoStore initial state', () => {
  it('has seed receipts', () => {
    const { receipts } = useTonKhoStore.getState();
    expect(receipts.length).toBeGreaterThanOrEqual(3);
  });

  it('has seed issues', () => {
    const { issues } = useTonKhoStore.getState();
    expect(issues.length).toBeGreaterThanOrEqual(2);
  });

  it('has seed transfers', () => {
    const { transfers } = useTonKhoStore.getState();
    expect(transfers.length).toBeGreaterThanOrEqual(1);
  });

  it('seed receipts have required fields', () => {
    const { receipts } = useTonKhoStore.getState();
    for (const r of receipts) {
      expect(r.receiptId).toBeTruthy();
      expect(r.receiptCode).toMatch(/^PNK-\d{4}$/);
      expect(r.warehouseName).toBeTruthy();
      expect(r.items.length).toBeGreaterThan(0);
      expect(r.totalAmount).toBeGreaterThan(0);
      expect(['draft', 'confirmed', 'cancelled']).toContain(r.status);
    }
  });

  it('seed issues have required fields', () => {
    const { issues } = useTonKhoStore.getState();
    for (const i of issues) {
      expect(i.issueId).toBeTruthy();
      expect(i.issueCode).toMatch(/^PXK-\d{4}$/);
      expect(i.warehouseName).toBeTruthy();
      expect(i.items.length).toBeGreaterThan(0);
      expect(['draft', 'confirmed', 'cancelled']).toContain(i.status);
    }
  });

  it('seed transfers have required fields', () => {
    const { transfers } = useTonKhoStore.getState();
    for (const t of transfers) {
      expect(t.transferId).toBeTruthy();
      expect(t.transferCode).toMatch(/^PCK-\d{4}$/);
      expect(t.fromWarehouseName).toBeTruthy();
      expect(t.toWarehouseName).toBeTruthy();
      expect(t.items.length).toBeGreaterThan(0);
      expect(['draft', 'confirmed', 'cancelled']).toContain(t.status);
    }
  });
});

// ── Receipt CRUD ─────────────────────────────────────────────

describe('Receipt CRUD', () => {
  it('addReceipt appends a new receipt', () => {
    const r: StockReceipt = {
      receiptId: 'test-rc', receiptCode: 'PNK-9999',
      warehouseId: 'wh-01', warehouseName: 'Test Kho',
      items: [{ itemId: 'ti', description: 'Test', unit: 'cái', quantity: 1, unitPrice: 100, amount: 100 }],
      totalAmount: 100, status: 'draft', createdBy: 'u1',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    useTonKhoStore.getState().addReceipt(r);
    expect(useTonKhoStore.getState().receipts.find(x => x.receiptId === 'test-rc')).toBeDefined();
  });

  it('updateReceipt patches a receipt', () => {
    const { receipts } = useTonKhoStore.getState();
    const first = receipts[0];
    useTonKhoStore.getState().updateReceipt(first.receiptId, { status: 'cancelled', notes: 'test' });
    const updated = useTonKhoStore.getState().receipts.find(r => r.receiptId === first.receiptId);
    expect(updated?.status).toBe('cancelled');
    expect(updated?.notes).toBe('test');
  });

  it('deleteReceipt removes a receipt', () => {
    const { receipts } = useTonKhoStore.getState();
    const firstId = receipts[0].receiptId;
    const prevLen = receipts.length;
    useTonKhoStore.getState().deleteReceipt(firstId);
    expect(useTonKhoStore.getState().receipts.length).toBe(prevLen - 1);
    expect(useTonKhoStore.getState().receipts.find(r => r.receiptId === firstId)).toBeUndefined();
  });

  it('setReceipts replaces all receipts', () => {
    useTonKhoStore.getState().setReceipts([]);
    expect(useTonKhoStore.getState().receipts.length).toBe(0);
  });
});

// ── Issue CRUD ───────────────────────────────────────────────

describe('Issue CRUD', () => {
  it('addIssue appends a new issue', () => {
    const i: StockIssue = {
      issueId: 'test-is', issueCode: 'PXK-9999',
      warehouseId: 'wh-01', warehouseName: 'Test Kho',
      items: [{ itemId: 'ti', description: 'Test', unit: 'cái', quantity: 1, unitPrice: 100, amount: 100 }],
      totalAmount: 100, status: 'draft', createdBy: 'u1',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    useTonKhoStore.getState().addIssue(i);
    expect(useTonKhoStore.getState().issues.find(x => x.issueId === 'test-is')).toBeDefined();
  });

  it('updateIssue patches an issue', () => {
    const { issues } = useTonKhoStore.getState();
    const first = issues[0];
    useTonKhoStore.getState().updateIssue(first.issueId, { status: 'cancelled' });
    expect(useTonKhoStore.getState().issues.find(i => i.issueId === first.issueId)?.status).toBe('cancelled');
  });

  it('deleteIssue removes an issue', () => {
    const { issues } = useTonKhoStore.getState();
    const firstId = issues[0].issueId;
    const prevLen = issues.length;
    useTonKhoStore.getState().deleteIssue(firstId);
    expect(useTonKhoStore.getState().issues.length).toBe(prevLen - 1);
  });

  it('setIssues replaces all issues', () => {
    useTonKhoStore.getState().setIssues([]);
    expect(useTonKhoStore.getState().issues.length).toBe(0);
  });
});

// ── Transfer CRUD ────────────────────────────────────────────

describe('Transfer CRUD', () => {
  it('addTransfer appends a new transfer', () => {
    const t: StockTransfer = {
      transferId: 'test-tf', transferCode: 'PCK-9999',
      fromWarehouseId: 'wh-01', fromWarehouseName: 'Kho A',
      toWarehouseId: 'wh-02', toWarehouseName: 'Kho B',
      items: [{ itemId: 'ti', description: 'Test', unit: 'cái', quantity: 1, unitPrice: 100, amount: 100 }],
      totalAmount: 100, status: 'draft', createdBy: 'u1',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    useTonKhoStore.getState().addTransfer(t);
    expect(useTonKhoStore.getState().transfers.find(x => x.transferId === 'test-tf')).toBeDefined();
  });

  it('updateTransfer patches a transfer', () => {
    const { transfers } = useTonKhoStore.getState();
    const first = transfers[0];
    useTonKhoStore.getState().updateTransfer(first.transferId, { status: 'confirmed', confirmedBy: 'user' });
    const updated = useTonKhoStore.getState().transfers.find(t => t.transferId === first.transferId);
    expect(updated?.status).toBe('confirmed');
    expect(updated?.confirmedBy).toBe('user');
  });

  it('deleteTransfer removes a transfer', () => {
    const { transfers } = useTonKhoStore.getState();
    const firstId = transfers[0].transferId;
    const prevLen = transfers.length;
    useTonKhoStore.getState().deleteTransfer(firstId);
    expect(useTonKhoStore.getState().transfers.length).toBe(prevLen - 1);
  });

  it('setTransfers replaces all transfers', () => {
    useTonKhoStore.getState().setTransfers([]);
    expect(useTonKhoStore.getState().transfers.length).toBe(0);
  });
});

// ── Reset ────────────────────────────────────────────────────

describe('resetAll', () => {
  it('restores initial state after modifications', () => {
    const originalLen = useTonKhoStore.getState().receipts.length;
    useTonKhoStore.getState().setReceipts([]);
    useTonKhoStore.getState().setIssues([]);
    useTonKhoStore.getState().setTransfers([]);
    expect(useTonKhoStore.getState().receipts.length).toBe(0);

    useTonKhoStore.getState().resetAll();
    expect(useTonKhoStore.getState().receipts.length).toBe(originalLen);
    expect(useTonKhoStore.getState().issues.length).toBeGreaterThan(0);
    expect(useTonKhoStore.getState().transfers.length).toBeGreaterThan(0);
  });
});
