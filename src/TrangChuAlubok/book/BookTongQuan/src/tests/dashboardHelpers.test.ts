// ============================================================
// BookTongQuan — Tests
// dashboardHelpers + types validation
// ============================================================

import {
  formatCurrency,
  formatFullCurrency,
  formatPercent,
  sumField,
  countByStatus,
  countOverdue,
  calcProductionProgress,
  getMaxBarValue,
} from '../helpers/dashboardHelpers';

import {
  ALERT_LEVEL_COLORS,
} from '../types';

// ── formatCurrency ───────────────────────────────────────────
describe('formatCurrency', () => {
  it('formats billions with 1 decimal', () => {
    expect(formatCurrency(1_500_000_000)).toBe('1.5 tỷ');
  });

  it('formats exact billion', () => {
    expect(formatCurrency(1_000_000_000)).toBe('1.0 tỷ');
  });

  it('formats millions without decimals', () => {
    expect(formatCurrency(52_300_000)).toBe('52 tr');
  });

  it('formats thousands with K', () => {
    expect(formatCurrency(5_000)).toBe('5K');
  });

  it('formats small numbers as-is', () => {
    expect(formatCurrency(999)).toBe('999');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('0');
  });
});

// ── formatFullCurrency ───────────────────────────────────────
describe('formatFullCurrency', () => {
  it('formats with locale separators', () => {
    const result = formatFullCurrency(52_300_000);
    // vi-VN locale may use . as thousands separator
    expect(result).toContain('52');
    expect(result).toContain('300');
    expect(result).toContain('000');
  });
});

// ── formatPercent ────────────────────────────────────────────
describe('formatPercent', () => {
  it('formats with 1 decimal', () => {
    expect(formatPercent(83.333)).toBe('83.3%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formats 100', () => {
    expect(formatPercent(100)).toBe('100.0%');
  });
});

// ── sumField ─────────────────────────────────────────────────
describe('sumField', () => {
  it('sums numeric field from array', () => {
    const items = [
      { amount: 100, name: 'a' },
      { amount: 200, name: 'b' },
      { amount: 50, name: 'c' },
    ];
    expect(sumField(items, 'amount')).toBe(350);
  });

  it('returns 0 for empty array', () => {
    expect(sumField([], 'amount' as never)).toBe(0);
  });

  it('handles non-numeric fields gracefully', () => {
    const items = [{ val: 'abc' }, { val: 'def' }];
    expect(sumField(items, 'val')).toBe(0); // NaN → 0
  });
});

// ── countByStatus ────────────────────────────────────────────
describe('countByStatus', () => {
  it('counts items with matching status', () => {
    const items = [
      { status: 'draft' },
      { status: 'pending' },
      { status: 'draft' },
      { status: 'approved' },
    ];
    expect(countByStatus(items, 'status', 'draft')).toBe(2);
    expect(countByStatus(items, 'status', 'pending')).toBe(1);
    expect(countByStatus(items, 'status', 'approved')).toBe(1);
    expect(countByStatus(items, 'status', 'cancelled')).toBe(0);
  });
});

// ── countOverdue ─────────────────────────────────────────────
describe('countOverdue', () => {
  it('counts items past due date with remaining amount', () => {
    const items = [
      { dueDate: '2020-01-01', remainingAmount: 100 }, // overdue
      { dueDate: '2099-12-31', remainingAmount: 100 }, // future
      { dueDate: '2020-06-15', remainingAmount: 0 },   // paid off
    ];
    expect(countOverdue(items)).toBe(1);
  });

  it('returns 0 when no overdue items', () => {
    const items = [
      { dueDate: '2099-12-31', remainingAmount: 100 },
    ];
    expect(countOverdue(items)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(countOverdue([])).toBe(0);
  });
});

// ── calcProductionProgress ───────────────────────────────────
describe('calcProductionProgress', () => {
  it('calculates correct percentage', () => {
    const orders = [
      { items: [
        { quantity: 10, completedQty: 6 },
        { quantity: 20, completedQty: 20 },
      ] },
      { items: [
        { quantity: 5, completedQty: 5 },
      ] },
    ];
    // total: 35, completed: 31 → 88.57%
    const result = calcProductionProgress(orders);
    expect(result).toBeCloseTo(88.57, 1);
  });

  it('returns 0 for empty orders', () => {
    expect(calcProductionProgress([])).toBe(0);
  });

  it('returns 0 when all quantities are 0', () => {
    const orders = [{ items: [{ quantity: 0, completedQty: 0 }] }];
    expect(calcProductionProgress(orders)).toBe(0);
  });

  it('returns 100 when all completed', () => {
    const orders = [
      { items: [{ quantity: 10, completedQty: 10 }] },
      { items: [{ quantity: 5, completedQty: 5 }] },
    ];
    expect(calcProductionProgress(orders)).toBe(100);
  });
});

// ── getMaxBarValue ───────────────────────────────────────────
describe('getMaxBarValue', () => {
  it('returns max value from bars', () => {
    const bars = [{ value: 30 }, { value: 100 }, { value: 50 }];
    expect(getMaxBarValue(bars)).toBe(100);
  });

  it('returns 1 for empty array (minimum)', () => {
    expect(getMaxBarValue([])).toBe(1);
  });

  it('handles single bar', () => {
    expect(getMaxBarValue([{ value: 42 }])).toBe(42);
  });
});

// ── ALERT_LEVEL_COLORS ──────────────────────────────────────
describe('ALERT_LEVEL_COLORS', () => {
  it('has all 4 levels', () => {
    expect(Object.keys(ALERT_LEVEL_COLORS)).toHaveLength(4);
  });

  it('has danger color', () => {
    expect(ALERT_LEVEL_COLORS.danger).toBe('#f38ba8');
  });

  it('has warning color', () => {
    expect(ALERT_LEVEL_COLORS.warning).toBe('#f9e2af');
  });

  it('has info color', () => {
    expect(ALERT_LEVEL_COLORS.info).toBe('#89b4fa');
  });

  it('has success color', () => {
    expect(ALERT_LEVEL_COLORS.success).toBe('#a6e3a1');
  });

  it('all values are valid hex colors', () => {
    Object.values(ALERT_LEVEL_COLORS).forEach(color => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
