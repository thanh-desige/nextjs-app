// ============================================================
// BanHang Store — Zustand + persist
// Manages Quotes (báo giá) and Sales Orders (đơn bán hàng)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Quote, SalesOrder } from '../types';
import { logActivityDirect } from '../../../shared/src/hooks/useLogActivity';

// ── Seed Quotes ──────────────────────────────────────────────

const SEED_QUOTES: Quote[] = [
  {
    quoteId: 'q1',
    quoteCode: 'BG-0001',
    customerId: 'cust-1',
    customerName: 'Công ty TNHH Xây Dựng ABC',
    projectName: 'Dự án chung cư Sunrise',
    items: [
      { itemId: 'qi1', description: 'Cửa sổ nhôm Xingfa hệ 55 - 1200x1400', unit: 'bộ', quantity: 20, unitPrice: 2_500_000, discountPercent: 5, amount: 47_500_000 },
      { itemId: 'qi2', description: 'Cửa đi nhôm Xingfa hệ 55 - 900x2100', unit: 'bộ', quantity: 10, unitPrice: 4_200_000, discountPercent: 3, amount: 40_740_000 },
      { itemId: 'qi3', description: 'Vách kính cường lực 12mm', unit: 'm²', quantity: 50, unitPrice: 850_000, discountPercent: 0, amount: 42_500_000 },
    ],
    subtotal: 135_500_000,
    taxRate: 10,
    taxAmount: 13_074_000,
    totalDiscount: 4_760_000,
    totalAmount: 143_814_000,
    validUntil: '2026-04-15',
    status: 'approved',
    createdBy: 'u1',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-05T10:30:00Z',
    approvedBy: 'u1',
    approvedAt: '2026-03-05T10:30:00Z',
  },
  {
    quoteId: 'q2',
    quoteCode: 'BG-0002',
    customerId: 'cust-2',
    customerName: 'Anh Nguyễn Văn Minh',
    projectName: 'Nhà phố 3 tầng',
    items: [
      { itemId: 'qi4', description: 'Cửa sổ mở quay 4 cánh - 2400x1500', unit: 'bộ', quantity: 6, unitPrice: 5_800_000, discountPercent: 0, amount: 34_800_000 },
      { itemId: 'qi5', description: 'Cửa đi 2 cánh có ô fix - 1800x2200', unit: 'bộ', quantity: 3, unitPrice: 8_500_000, discountPercent: 5, amount: 24_225_000 },
    ],
    subtotal: 59_300_000,
    taxRate: 10,
    taxAmount: 5_602_500,
    totalDiscount: 1_275_000,
    totalAmount: 62_627_500,
    validUntil: '2026-04-20',
    status: 'pending',
    createdBy: 'u4',
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-03-10T09:00:00Z',
  },
  {
    quoteId: 'q3',
    quoteCode: 'BG-0003',
    customerId: 'cust-3',
    customerName: 'Công ty CP Nội Thất Hoàng Gia',
    projectName: 'Showroom tầng 1',
    items: [
      { itemId: 'qi6', description: 'Vách kính khung nhôm - mặt tiền 8m', unit: 'm²', quantity: 32, unitPrice: 1_200_000, discountPercent: 10, amount: 34_560_000 },
    ],
    subtotal: 38_400_000,
    taxRate: 10,
    taxAmount: 3_456_000,
    totalDiscount: 3_840_000,
    totalAmount: 38_016_000,
    validUntil: '2026-03-30',
    status: 'draft',
    createdBy: 'u4',
    createdAt: '2026-03-15T14:00:00Z',
    updatedAt: '2026-03-15T14:00:00Z',
  },
];

// ── Seed Sales Orders ────────────────────────────────────────

const SEED_ORDERS: SalesOrder[] = [
  {
    orderId: 'so1',
    orderCode: 'DH-0001',
    quoteId: 'q1',
    quoteCode: 'BG-0001',
    customerId: 'cust-1',
    customerName: 'Công ty TNHH Xây Dựng ABC',
    items: [
      { itemId: 'soi1', description: 'Cửa sổ nhôm Xingfa hệ 55 - 1200x1400', unit: 'bộ', quantity: 20, unitPrice: 2_500_000, discountPercent: 5, amount: 47_500_000, deliveredQty: 12 },
      { itemId: 'soi2', description: 'Cửa đi nhôm Xingfa hệ 55 - 900x2100', unit: 'bộ', quantity: 10, unitPrice: 4_200_000, discountPercent: 3, amount: 40_740_000, deliveredQty: 10 },
      { itemId: 'soi3', description: 'Vách kính cường lực 12mm', unit: 'm²', quantity: 50, unitPrice: 850_000, discountPercent: 0, amount: 42_500_000, deliveredQty: 30 },
    ],
    subtotal: 135_500_000,
    taxRate: 10,
    taxAmount: 13_074_000,
    totalDiscount: 4_760_000,
    totalAmount: 143_814_000,
    paidAmount: 72_000_000,
    deliveryDate: '2026-04-10',
    deliveryAddress: 'Lô B5, KDC Sunrise, Q.7, TP.HCM',
    status: 'delivering',
    createdBy: 'u1',
    createdAt: '2026-03-06T08:00:00Z',
    updatedAt: '2026-03-12T16:00:00Z',
    confirmedBy: 'u1',
    confirmedAt: '2026-03-07T09:00:00Z',
  },
];

// ── Store Interface ──────────────────────────────────────────

interface BanHangState {
  quotes: Quote[];
  orders: SalesOrder[];
  // Quote setters
  setQuotes: (q: Quote[]) => void;
  addQuote: (q: Quote) => void;
  updateQuote: (quoteId: string, patch: Partial<Quote>) => void;
  deleteQuote: (quoteId: string) => void;
  // Order setters
  setOrders: (o: SalesOrder[]) => void;
  addOrder: (o: SalesOrder) => void;
  updateOrder: (orderId: string, patch: Partial<SalesOrder>) => void;
  deleteOrder: (orderId: string) => void;
  // Utils
  resetAll: () => void;
}

const INITIAL_STATE = {
  quotes: SEED_QUOTES,
  orders: SEED_ORDERS,
};

export const useBanHangStore = create<BanHangState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      setQuotes: (quotes) => set({ quotes }),
      addQuote: (q) => {
        set((s) => ({ quotes: [...s.quotes, q] }));
        logActivityDirect('BanHang', 'create', 'quote', q.quoteId, q.quoteCode, `Tạo báo giá ${q.quoteCode}`);
      },
      updateQuote: (quoteId, patch) => {
        const code = get().quotes.find(q => q.quoteId === quoteId)?.quoteCode ?? quoteId;
        set((s) => ({
          quotes: s.quotes.map(q => q.quoteId === quoteId ? { ...q, ...patch } : q),
        }));
        logActivityDirect('BanHang', 'update', 'quote', quoteId, code, `Cập nhật báo giá ${code}`);
      },
      deleteQuote: (quoteId) => {
        const code = get().quotes.find(q => q.quoteId === quoteId)?.quoteCode ?? quoteId;
        set((s) => ({
          quotes: s.quotes.filter(q => q.quoteId !== quoteId),
        }));
        logActivityDirect('BanHang', 'delete', 'quote', quoteId, code, `Xóa báo giá ${code}`);
      },

      setOrders: (orders) => set({ orders }),
      addOrder: (o) => {
        set((s) => ({ orders: [...s.orders, o] }));
        logActivityDirect('BanHang', 'create', 'salesOrder', o.orderId, o.orderCode, `Tạo đơn hàng ${o.orderCode}`);
      },
      updateOrder: (orderId, patch) => {
        const code = get().orders.find(o => o.orderId === orderId)?.orderCode ?? orderId;
        set((s) => ({
          orders: s.orders.map(o => o.orderId === orderId ? { ...o, ...patch } : o),
        }));
        logActivityDirect('BanHang', 'update', 'salesOrder', orderId, code, `Cập nhật đơn hàng ${code}`);
      },
      deleteOrder: (orderId) => {
        const code = get().orders.find(o => o.orderId === orderId)?.orderCode ?? orderId;
        set((s) => ({
          orders: s.orders.filter(o => o.orderId !== orderId),
        }));
        logActivityDirect('BanHang', 'delete', 'salesOrder', orderId, code, `Xóa đơn hàng ${code}`);
      },

      resetAll: () => set(INITIAL_STATE),
    }),
    { name: 'alubok-ban-hang' },
  ),
);
