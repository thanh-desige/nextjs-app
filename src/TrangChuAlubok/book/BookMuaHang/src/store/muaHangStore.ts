// ============================================================
// MuaHang Store — Zustand + persist
// Purchase Requests + Purchase Orders CRUD
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PurchaseRequest, PurchaseOrder } from '../types';

interface MuaHangState {
  requests: PurchaseRequest[];
  orders: PurchaseOrder[];
  setRequests: (requests: PurchaseRequest[]) => void;
  addRequest: (request: PurchaseRequest) => void;
  updateRequest: (requestId: string, data: Partial<PurchaseRequest>) => void;
  deleteRequest: (requestId: string) => void;
  setOrders: (orders: PurchaseOrder[]) => void;
  addOrder: (order: PurchaseOrder) => void;
  updateOrder: (orderId: string, data: Partial<PurchaseOrder>) => void;
  deleteOrder: (orderId: string) => void;
  resetAll: () => void;
}

// ── Seed data ────────────────────────────────────────────────

const SEED_REQUESTS: PurchaseRequest[] = [
  {
    requestId: 'pr-001',
    requestCode: 'YCMH-0001',
    requestedBy: 'Nguyễn Văn An',
    department: 'Sản xuất',
    reason: 'Bổ sung vật tư cho dự án Vinhomes Grand Park',
    items: [
      { itemId: 'pri-001', description: 'Thanh nhôm Xingfa 55 series', unit: 'cây', quantity: 200, estimatedPrice: 350000, estimatedAmount: 70000000 },
      { itemId: 'pri-002', description: 'Kính hộp 2 lớp 5+9A+5 Low-E', unit: 'm²', quantity: 150, estimatedPrice: 480000, estimatedAmount: 72000000 },
      { itemId: 'pri-003', description: 'Phụ kiện bản lề 4D', unit: 'bộ', quantity: 100, estimatedPrice: 120000, estimatedAmount: 12000000 },
    ],
    totalEstimated: 154000000,
    status: 'approved',
    priority: 'high',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-11T14:30:00Z',
    approvedBy: 'Trần Văn Bình',
    approvedAt: '2026-03-11T14:30:00Z',
  },
  {
    requestId: 'pr-002',
    requestCode: 'YCMH-0002',
    requestedBy: 'Lê Thị Hạnh',
    department: 'Sản xuất',
    reason: 'Dự phòng phụ kiện nhôm cho Q2/2026',
    items: [
      { itemId: 'pri-004', description: 'Tay nắm cửa sổ mở quay', unit: 'cái', quantity: 50, estimatedPrice: 85000, estimatedAmount: 4250000 },
      { itemId: 'pri-005', description: 'Gioăng EPDM cao su', unit: 'm', quantity: 500, estimatedPrice: 12000, estimatedAmount: 6000000 },
    ],
    totalEstimated: 10250000,
    status: 'pending',
    priority: 'normal',
    createdAt: '2026-03-14T09:00:00Z',
    updatedAt: '2026-03-14T09:00:00Z',
  },
  {
    requestId: 'pr-003',
    requestCode: 'YCMH-0003',
    requestedBy: 'Phạm Minh Tuấn',
    department: 'Kho',
    reason: 'Bổ sung inox trang trí văn phòng khách',
    items: [
      { itemId: 'pri-006', description: 'Inox 304 tấm 1.2mm', unit: 'tấm', quantity: 20, estimatedPrice: 1500000, estimatedAmount: 30000000 },
    ],
    totalEstimated: 30000000,
    status: 'draft',
    priority: 'low',
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
  },
];

const SEED_ORDERS: PurchaseOrder[] = [
  {
    orderId: 'po-001',
    orderCode: 'DMH-0001',
    requestId: 'pr-001',
    requestCode: 'YCMH-0001',
    supplierId: 'sup-001',
    supplierName: 'Công ty TNHH Nhôm Xingfa Việt Nam',
    items: [
      { itemId: 'poi-001', description: 'Thanh nhôm Xingfa 55 series', unit: 'cây', quantity: 200, unitPrice: 340000, discountPercent: 3, amount: 65960000, receivedQty: 120 },
      { itemId: 'poi-002', description: 'Kính hộp 2 lớp 5+9A+5 Low-E', unit: 'm²', quantity: 150, unitPrice: 470000, discountPercent: 2, amount: 69090000, receivedQty: 80 },
      { itemId: 'poi-003', description: 'Phụ kiện bản lề 4D', unit: 'bộ', quantity: 100, unitPrice: 115000, discountPercent: 0, amount: 11500000, receivedQty: 100 },
    ],
    subtotal: 151500000,
    taxRate: 10,
    taxAmount: 14655000,
    totalDiscount: 4950000,
    totalAmount: 161205000,
    paidAmount: 80000000,
    deliveryDate: '2026-03-25',
    deliveryAddress: 'Kho ALUBOK - KCN Tân Bình, TP.HCM',
    status: 'receiving',
    createdBy: 'Trần Văn Bình',
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-03-16T10:00:00Z',
    confirmedBy: 'Nguyễn Thị Mai',
    confirmedAt: '2026-03-13T09:00:00Z',
  },
];

const initialState = {
  requests: SEED_REQUESTS,
  orders: SEED_ORDERS,
};

export const useMuaHangStore = create<MuaHangState>()(
  persist(
    (set) => ({
      ...initialState,
      setRequests: (requests) => set({ requests }),
      addRequest: (request) => set((s) => ({ requests: [...s.requests, request] })),
      updateRequest: (requestId, data) =>
        set((s) => ({
          requests: s.requests.map((r) => (r.requestId === requestId ? { ...r, ...data } : r)),
        })),
      deleteRequest: (requestId) =>
        set((s) => ({ requests: s.requests.filter((r) => r.requestId !== requestId) })),
      setOrders: (orders) => set({ orders }),
      addOrder: (order) => set((s) => ({ orders: [...s.orders, order] })),
      updateOrder: (orderId, data) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.orderId === orderId ? { ...o, ...data } : o)),
        })),
      deleteOrder: (orderId) =>
        set((s) => ({ orders: s.orders.filter((o) => o.orderId !== orderId) })),
      resetAll: () => set(initialState),
    }),
    { name: 'alubok-mua-hang' },
  ),
);
