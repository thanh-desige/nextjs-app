// ============================================================
// ThuChi Types tests
// Tests for type constants, labels, calc helpers
// ============================================================

import {
  FINANCE_STATUS_LABELS,
  FINANCE_STATUS_COLORS,
  PAYMENT_METHOD_LABELS,
  DEBT_STATUS_LABELS,
  DEBT_STATUS_COLORS,
  calcDebtStatus,
  calcRemainingAmount,
} from '../types';
import type { FinanceVoucherStatus, PaymentMethod, DebtStatus } from '../types';

describe('Finance voucher status labels & colors', () => {
  const statuses: FinanceVoucherStatus[] = ['draft', 'confirmed', 'cancelled'];

  it('has label for every status', () => {
    for (const s of statuses) {
      expect(FINANCE_STATUS_LABELS[s]).toBeDefined();
      expect(typeof FINANCE_STATUS_LABELS[s]).toBe('string');
    }
  });

  it('has color for every status', () => {
    for (const s of statuses) {
      expect(FINANCE_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('Payment method labels', () => {
  const methods: PaymentMethod[] = ['cash', 'bank_transfer', 'check', 'other'];

  it('has label for every payment method', () => {
    for (const m of methods) {
      expect(PAYMENT_METHOD_LABELS[m]).toBeDefined();
      expect(typeof PAYMENT_METHOD_LABELS[m]).toBe('string');
    }
  });
});

describe('Debt status labels & colors', () => {
  const statuses: DebtStatus[] = ['open', 'partial', 'paid', 'overdue'];

  it('has label for every debt status', () => {
    for (const s of statuses) {
      expect(DEBT_STATUS_LABELS[s]).toBeDefined();
      expect(typeof DEBT_STATUS_LABELS[s]).toBe('string');
    }
  });

  it('has color for every debt status', () => {
    for (const s of statuses) {
      expect(DEBT_STATUS_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('calcDebtStatus', () => {
  it('returns paid when paidAmount >= totalAmount', () => {
    expect(calcDebtStatus(100_000, 100_000, '2099-12-31')).toBe('paid');
  });

  it('returns paid when overpaid', () => {
    expect(calcDebtStatus(100_000, 120_000, '2099-12-31')).toBe('paid');
  });

  it('returns overdue when past due and not fully paid', () => {
    expect(calcDebtStatus(100_000, 50_000, '2020-01-01')).toBe('overdue');
  });

  it('returns partial when some payment made but not past due', () => {
    expect(calcDebtStatus(100_000, 50_000, '2099-12-31')).toBe('partial');
  });

  it('returns open when no payment and not past due', () => {
    expect(calcDebtStatus(100_000, 0, '2099-12-31')).toBe('open');
  });
});

describe('calcRemainingAmount', () => {
  it('calculates totalAmount - paidAmount', () => {
    expect(calcRemainingAmount(100_000, 30_000)).toBe(70_000);
  });

  it('returns 0 when fully paid', () => {
    expect(calcRemainingAmount(100_000, 100_000)).toBe(0);
  });

  it('returns negative when overpaid', () => {
    expect(calcRemainingAmount(100_000, 120_000)).toBe(-20_000);
  });
});
