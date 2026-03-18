// ============================================================
// TonKho Types tests
// Tests for type constants, labels, calc helpers
// ============================================================

import {
  VOUCHER_STATUS_LABELS,
  VOUCHER_STATUS_COLORS,
  VOUCHER_TYPE_LABELS,
  calcStockItemAmount,
  calcVoucherTotal,
} from '../types';
import type { StockVoucherStatus, VoucherType, StockItem } from '../types';

describe('Voucher status labels & colors', () => {
  const statuses: StockVoucherStatus[] = ['draft', 'confirmed', 'cancelled'];

  it('has label for every status', () => {
    for (const s of statuses) {
      expect(VOUCHER_STATUS_LABELS[s]).toBeDefined();
      expect(typeof VOUCHER_STATUS_LABELS[s]).toBe('string');
    }
  });

  it('has color for every status', () => {
    for (const s of statuses) {
      expect(VOUCHER_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('Voucher type labels', () => {
  const types: VoucherType[] = ['receipt', 'issue', 'transfer'];

  it('has label for every type', () => {
    for (const t of types) {
      expect(VOUCHER_TYPE_LABELS[t]).toBeDefined();
      expect(typeof VOUCHER_TYPE_LABELS[t]).toBe('string');
    }
  });
});

describe('calcStockItemAmount', () => {
  it('calculates quantity * unitPrice', () => {
    expect(calcStockItemAmount(10, 340_000)).toBe(3_400_000);
  });

  it('returns 0 when quantity is 0', () => {
    expect(calcStockItemAmount(0, 500_000)).toBe(0);
  });

  it('returns 0 when unitPrice is 0', () => {
    expect(calcStockItemAmount(100, 0)).toBe(0);
  });

  it('handles decimal quantities', () => {
    expect(calcStockItemAmount(2.5, 100_000)).toBe(250_000);
  });
});

describe('calcVoucherTotal', () => {
  const items: StockItem[] = [
    { itemId: 'i1', description: 'Nhôm Xingfa', unit: 'cây', quantity: 10, unitPrice: 340_000, amount: 3_400_000 },
    { itemId: 'i2', description: 'Kính cường lực', unit: 'm²', quantity: 5, unitPrice: 350_000, amount: 1_750_000 },
  ];

  it('sums quantity * unitPrice for all items', () => {
    expect(calcVoucherTotal(items)).toBe(5_150_000);
  });

  it('returns 0 for empty items', () => {
    expect(calcVoucherTotal([])).toBe(0);
  });

  it('handles single item', () => {
    expect(calcVoucherTotal([items[0]])).toBe(3_400_000);
  });
});
