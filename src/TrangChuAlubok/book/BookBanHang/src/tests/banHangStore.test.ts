// ============================================================
// BanHang Store tests
// Tests for Zustand store: initial state, CRUD, reset
// ============================================================

import { useBanHangStore } from '../store/banHangStore';
import type { Quote, SalesOrder } from '../types';

// Reset store before each test
beforeEach(() => {
  useBanHangStore.getState().resetAll();
});

describe('BanHangStore initial state', () => {
  it('has seed quotes', () => {
    const { quotes } = useBanHangStore.getState();
    expect(quotes.length).toBeGreaterThanOrEqual(3);
  });

  it('has seed orders', () => {
    const { orders } = useBanHangStore.getState();
    expect(orders.length).toBeGreaterThanOrEqual(1);
  });

  it('seed quotes have required fields', () => {
    const { quotes } = useBanHangStore.getState();
    for (const q of quotes) {
      expect(q.quoteId).toBeTruthy();
      expect(q.quoteCode).toMatch(/^BG-\d{4}$/);
      expect(q.customerName).toBeTruthy();
      expect(q.items.length).toBeGreaterThan(0);
      expect(q.totalAmount).toBeGreaterThan(0);
      expect(['draft', 'pending', 'approved', 'rejected', 'closed', 'cancelled']).toContain(q.status);
    }
  });

  it('seed orders have required fields', () => {
    const { orders } = useBanHangStore.getState();
    for (const o of orders) {
      expect(o.orderId).toBeTruthy();
      expect(o.orderCode).toMatch(/^DH-\d{4}$/);
      expect(o.customerName).toBeTruthy();
      expect(o.items.length).toBeGreaterThan(0);
      expect(['new', 'confirmed', 'delivering', 'completed', 'cancelled']).toContain(o.status);
    }
  });
});

describe('Quote CRUD', () => {
  it('addQuote appends a new quote', () => {
    const newQuote: Quote = {
      quoteId: 'test-q', quoteCode: 'BG-9999', customerId: 'c1', customerName: 'Test',
      items: [], subtotal: 0, taxRate: 10, taxAmount: 0, totalDiscount: 0, totalAmount: 0,
      validUntil: '2026-12-31', status: 'draft', createdBy: 'u1',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    useBanHangStore.getState().addQuote(newQuote);
    expect(useBanHangStore.getState().quotes.find(q => q.quoteId === 'test-q')).toBeDefined();
  });

  it('updateQuote patches a quote', () => {
    const { quotes } = useBanHangStore.getState();
    const first = quotes[0];
    useBanHangStore.getState().updateQuote(first.quoteId, { status: 'cancelled', notes: 'test note' });
    const updated = useBanHangStore.getState().quotes.find(q => q.quoteId === first.quoteId);
    expect(updated?.status).toBe('cancelled');
    expect(updated?.notes).toBe('test note');
  });

  it('deleteQuote removes a quote', () => {
    const { quotes } = useBanHangStore.getState();
    const firstId = quotes[0].quoteId;
    const prevLen = quotes.length;
    useBanHangStore.getState().deleteQuote(firstId);
    expect(useBanHangStore.getState().quotes.length).toBe(prevLen - 1);
    expect(useBanHangStore.getState().quotes.find(q => q.quoteId === firstId)).toBeUndefined();
  });

  it('setQuotes replaces all quotes', () => {
    useBanHangStore.getState().setQuotes([]);
    expect(useBanHangStore.getState().quotes.length).toBe(0);
  });
});

describe('SalesOrder CRUD', () => {
  it('addOrder appends a new order', () => {
    const newOrder: SalesOrder = {
      orderId: 'test-so', orderCode: 'DH-9999', customerId: 'c1', customerName: 'Test',
      items: [], subtotal: 0, taxRate: 10, taxAmount: 0, totalDiscount: 0, totalAmount: 0,
      paidAmount: 0, status: 'new', createdBy: 'u1',
      createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    };
    useBanHangStore.getState().addOrder(newOrder);
    expect(useBanHangStore.getState().orders.find(o => o.orderId === 'test-so')).toBeDefined();
  });

  it('updateOrder patches an order', () => {
    const { orders } = useBanHangStore.getState();
    const first = orders[0];
    useBanHangStore.getState().updateOrder(first.orderId, { status: 'completed', paidAmount: 100_000_000 });
    const updated = useBanHangStore.getState().orders.find(o => o.orderId === first.orderId);
    expect(updated?.status).toBe('completed');
    expect(updated?.paidAmount).toBe(100_000_000);
  });

  it('deleteOrder removes an order', () => {
    const { orders } = useBanHangStore.getState();
    const firstId = orders[0].orderId;
    useBanHangStore.getState().deleteOrder(firstId);
    expect(useBanHangStore.getState().orders.find(o => o.orderId === firstId)).toBeUndefined();
  });
});

describe('resetAll', () => {
  it('restores seed data', () => {
    useBanHangStore.getState().setQuotes([]);
    useBanHangStore.getState().setOrders([]);
    expect(useBanHangStore.getState().quotes.length).toBe(0);
    useBanHangStore.getState().resetAll();
    expect(useBanHangStore.getState().quotes.length).toBeGreaterThanOrEqual(3);
    expect(useBanHangStore.getState().orders.length).toBeGreaterThanOrEqual(1);
  });
});
