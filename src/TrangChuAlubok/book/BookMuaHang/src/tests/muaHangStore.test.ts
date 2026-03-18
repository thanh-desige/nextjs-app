// ============================================================
// Tests: muaHangStore — Zustand CRUD + seed data
// ============================================================

import { useMuaHangStore } from '../store/muaHangStore';
import type { PurchaseRequest, PurchaseOrder } from '../types';

// Reset store before each test
beforeEach(() => {
  useMuaHangStore.getState().resetAll();
});

describe('muaHangStore', () => {
  // ── Seed data ────────────────────────────────────────────
  describe('seed data', () => {
    it('has 3 initial requests', () => {
      expect(useMuaHangStore.getState().requests).toHaveLength(3);
    });

    it('has 1 initial order', () => {
      expect(useMuaHangStore.getState().orders).toHaveLength(1);
    });

    it('request YCMH-0001 is approved with high priority', () => {
      const r = useMuaHangStore.getState().requests.find(r => r.requestCode === 'YCMH-0001');
      expect(r).toBeDefined();
      expect(r!.status).toBe('approved');
      expect(r!.priority).toBe('high');
    });

    it('order DMH-0001 is receiving status', () => {
      const o = useMuaHangStore.getState().orders.find(o => o.orderCode === 'DMH-0001');
      expect(o).toBeDefined();
      expect(o!.status).toBe('receiving');
    });

    it('order DMH-0001 links to YCMH-0001', () => {
      const o = useMuaHangStore.getState().orders[0];
      expect(o.requestCode).toBe('YCMH-0001');
    });
  });

  // ── Request CRUD ──────────────────────────────────────────
  describe('request CRUD', () => {
    it('addRequest increases count', () => {
      const newReq: PurchaseRequest = {
        requestId: 'pr-new',
        requestCode: 'YCMH-0004',
        requestedBy: 'Test User',
        reason: 'Test request',
        items: [],
        totalEstimated: 0,
        status: 'draft',
        priority: 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useMuaHangStore.getState().addRequest(newReq);
      expect(useMuaHangStore.getState().requests).toHaveLength(4);
    });

    it('updateRequest updates fields', () => {
      useMuaHangStore.getState().updateRequest('pr-002', { status: 'approved', approvedBy: 'Admin' });
      const r = useMuaHangStore.getState().requests.find(r => r.requestId === 'pr-002');
      expect(r!.status).toBe('approved');
      expect(r!.approvedBy).toBe('Admin');
    });

    it('deleteRequest removes the request', () => {
      useMuaHangStore.getState().deleteRequest('pr-003');
      expect(useMuaHangStore.getState().requests).toHaveLength(2);
      expect(useMuaHangStore.getState().requests.find(r => r.requestId === 'pr-003')).toBeUndefined();
    });

    it('setRequests replaces all', () => {
      useMuaHangStore.getState().setRequests([]);
      expect(useMuaHangStore.getState().requests).toHaveLength(0);
    });
  });

  // ── Order CRUD ────────────────────────────────────────────
  describe('order CRUD', () => {
    it('addOrder increases count', () => {
      const newOrder: PurchaseOrder = {
        orderId: 'po-new',
        orderCode: 'DMH-0002',
        supplierId: 'sup-002',
        supplierName: 'Test Supplier',
        items: [],
        subtotal: 0,
        taxRate: 10,
        taxAmount: 0,
        totalDiscount: 0,
        totalAmount: 0,
        paidAmount: 0,
        status: 'new',
        createdBy: 'Admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      useMuaHangStore.getState().addOrder(newOrder);
      expect(useMuaHangStore.getState().orders).toHaveLength(2);
    });

    it('updateOrder updates fields', () => {
      useMuaHangStore.getState().updateOrder('po-001', { status: 'completed', paidAmount: 161205000 });
      const o = useMuaHangStore.getState().orders.find(o => o.orderId === 'po-001');
      expect(o!.status).toBe('completed');
      expect(o!.paidAmount).toBe(161205000);
    });

    it('deleteOrder removes the order', () => {
      useMuaHangStore.getState().deleteOrder('po-001');
      expect(useMuaHangStore.getState().orders).toHaveLength(0);
    });

    it('setOrders replaces all', () => {
      useMuaHangStore.getState().setOrders([]);
      expect(useMuaHangStore.getState().orders).toHaveLength(0);
    });
  });

  // ── resetAll ──────────────────────────────────────────────
  describe('resetAll', () => {
    it('restores seed data after modifications', () => {
      useMuaHangStore.getState().setRequests([]);
      useMuaHangStore.getState().setOrders([]);
      expect(useMuaHangStore.getState().requests).toHaveLength(0);
      expect(useMuaHangStore.getState().orders).toHaveLength(0);

      useMuaHangStore.getState().resetAll();
      expect(useMuaHangStore.getState().requests).toHaveLength(3);
      expect(useMuaHangStore.getState().orders).toHaveLength(1);
    });
  });
});
