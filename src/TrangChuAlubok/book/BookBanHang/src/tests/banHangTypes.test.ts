// ============================================================
// BanHang Types tests
// Tests for type constants, labels, calc helpers
// ============================================================

import {
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_COLORS,
  SO_STATUS_LABELS,
  SO_STATUS_COLORS,
  calcLineAmount,
  calcTotals,
} from '../types';
import type { QuoteItem, QuoteStatus, SalesOrderStatus } from '../types';

describe('Quote status labels & colors', () => {
  const statuses: QuoteStatus[] = ['draft', 'pending', 'approved', 'rejected', 'closed', 'cancelled'];

  it('has label for every status', () => {
    for (const s of statuses) {
      expect(QUOTE_STATUS_LABELS[s]).toBeDefined();
      expect(typeof QUOTE_STATUS_LABELS[s]).toBe('string');
    }
  });

  it('has color for every status', () => {
    for (const s of statuses) {
      expect(QUOTE_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('SalesOrder status labels & colors', () => {
  const statuses: SalesOrderStatus[] = ['new', 'confirmed', 'delivering', 'completed', 'cancelled'];

  it('has label for every status', () => {
    for (const s of statuses) {
      expect(SO_STATUS_LABELS[s]).toBeDefined();
    }
  });

  it('has color for every status', () => {
    for (const s of statuses) {
      expect(SO_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('calcLineAmount', () => {
  it('calculates correctly with no discount', () => {
    expect(calcLineAmount(10, 100_000, 0)).toBe(1_000_000);
  });

  it('calculates correctly with discount', () => {
    expect(calcLineAmount(5, 200_000, 10)).toBe(900_000); // 5 * 200k * 0.9
  });

  it('returns 0 when quantity is 0', () => {
    expect(calcLineAmount(0, 500_000, 0)).toBe(0);
  });

  it('returns 0 when 100% discount', () => {
    expect(calcLineAmount(10, 100_000, 100)).toBe(0);
  });
});

describe('calcTotals', () => {
  const items: QuoteItem[] = [
    { itemId: 'i1', description: 'Item A', unit: 'bộ', quantity: 10, unitPrice: 100_000, discountPercent: 0, amount: 1_000_000 },
    { itemId: 'i2', description: 'Item B', unit: 'bộ', quantity: 5, unitPrice: 200_000, discountPercent: 10, amount: 900_000 },
  ];

  it('calculates subtotal as sum of gross amounts', () => {
    const result = calcTotals(items, 10);
    // subtotal = (10*100k) + (5*200k) = 1_000_000 + 1_000_000 = 2_000_000
    expect(result.subtotal).toBe(2_000_000);
  });

  it('calculates total discount', () => {
    const result = calcTotals(items, 10);
    // discount = 0 + (5*200k*10/100) = 100_000
    expect(result.totalDiscount).toBe(100_000);
  });

  it('calculates tax on after-discount amount', () => {
    const result = calcTotals(items, 10);
    // afterDiscount = 2_000_000 - 100_000 = 1_900_000
    // tax = 1_900_000 * 10% = 190_000
    expect(result.taxAmount).toBe(190_000);
  });

  it('calculates total correctly', () => {
    const result = calcTotals(items, 10);
    expect(result.totalAmount).toBe(2_090_000); // 1_900_000 + 190_000
  });

  it('handles empty items', () => {
    const result = calcTotals([], 10);
    expect(result.subtotal).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  it('handles 0% tax', () => {
    const result = calcTotals(items, 0);
    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(1_900_000);
  });
});
