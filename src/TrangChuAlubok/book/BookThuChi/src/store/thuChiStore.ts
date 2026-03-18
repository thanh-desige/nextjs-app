// ============================================================
// ThuChi Store — Zustand + persist
// Cash Receipts + Cash Payments + AR + AP CRUD
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CashReceipt, CashPayment, AccountReceivable, AccountPayable } from '../types';

// ── Seed Cash Receipts ───────────────────────────────────────

const SEED_RECEIPTS: CashReceipt[] = [
  {
    receiptId: 'cr-001',
    receiptCode: 'PT-0001',
    customerId: 'cust-1',
    customerName: 'Công ty TNHH Xây Dựng ABC',
    soCode: 'DH-0001',
    amount: 50_000_000,
    paymentMethod: 'bank_transfer',
    bankAccount: 'Vietcombank - 0071001234567',
    description: 'Thu tiền đơn hàng DH-0001 - đợt 1',
    status: 'confirmed',
    createdBy: 'Nguyễn Văn An',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-10T09:00:00Z',
    confirmedBy: 'Trần Văn Bình',
    confirmedAt: '2026-03-10T09:00:00Z',
  },
  {
    receiptId: 'cr-002',
    receiptCode: 'PT-0002',
    customerId: 'cust-2',
    customerName: 'Công ty CP Nội Thất Hoàng Gia',
    soCode: 'DH-0003',
    amount: 30_000_000,
    paymentMethod: 'cash',
    description: 'Thu tiền mặt đơn hàng DH-0003',
    status: 'confirmed',
    createdBy: 'Nguyễn Văn An',
    createdAt: '2026-03-12T10:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
    confirmedBy: 'Trần Văn Bình',
    confirmedAt: '2026-03-12T11:00:00Z',
  },
  {
    receiptId: 'cr-003',
    receiptCode: 'PT-0003',
    customerId: 'cust-1',
    customerName: 'Công ty TNHH Xây Dựng ABC',
    soCode: 'DH-0001',
    amount: 25_000_000,
    paymentMethod: 'bank_transfer',
    bankAccount: 'Vietcombank - 0071001234567',
    description: 'Thu tiền đơn hàng DH-0001 - đợt 2',
    status: 'draft',
    createdBy: 'Nguyễn Văn An',
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: '2026-03-15T08:00:00Z',
  },
];

// ── Seed Cash Payments ───────────────────────────────────────

const SEED_PAYMENTS: CashPayment[] = [
  {
    paymentId: 'cp-001',
    paymentCode: 'PC-0001',
    supplierId: 'sup-001',
    supplierName: 'Công ty TNHH Nhôm Xingfa Việt Nam',
    poCode: 'DMH-0001',
    amount: 40_000_000,
    paymentMethod: 'bank_transfer',
    bankAccount: 'BIDV - 3101001234567',
    description: 'Thanh toán đơn mua DMH-0001 - đợt 1',
    status: 'confirmed',
    createdBy: 'Phạm Minh Tuấn',
    createdAt: '2026-03-11T08:00:00Z',
    updatedAt: '2026-03-11T10:00:00Z',
    confirmedBy: 'Trần Văn Bình',
    confirmedAt: '2026-03-11T10:00:00Z',
  },
  {
    paymentId: 'cp-002',
    paymentCode: 'PC-0002',
    supplierId: 'sup-002',
    supplierName: 'Kính Hải Long',
    poCode: 'DMH-0002',
    amount: 20_000_000,
    paymentMethod: 'cash',
    description: 'Thanh toán tiền mặt đơn mua kính DMH-0002',
    status: 'draft',
    createdBy: 'Phạm Minh Tuấn',
    createdAt: '2026-03-14T08:00:00Z',
    updatedAt: '2026-03-14T08:00:00Z',
  },
];

// ── Seed AR ──────────────────────────────────────────────────

const SEED_AR: AccountReceivable[] = [
  {
    arId: 'ar-001',
    customerId: 'cust-1',
    customerName: 'Công ty TNHH Xây Dựng ABC',
    soCode: 'DH-0001',
    totalAmount: 120_000_000,
    paidAmount: 50_000_000,
    remainingAmount: 70_000_000,
    dueDate: '2026-04-10',
    status: 'partial',
    lastPaymentDate: '2026-03-10',
  },
  {
    arId: 'ar-002',
    customerId: 'cust-2',
    customerName: 'Công ty CP Nội Thất Hoàng Gia',
    soCode: 'DH-0003',
    totalAmount: 85_000_000,
    paidAmount: 30_000_000,
    remainingAmount: 55_000_000,
    dueDate: '2026-03-30',
    status: 'partial',
    lastPaymentDate: '2026-03-12',
  },
  {
    arId: 'ar-003',
    customerId: 'cust-3',
    customerName: 'Anh Nguyễn Văn Hùng',
    soCode: 'DH-0005',
    totalAmount: 45_000_000,
    paidAmount: 0,
    remainingAmount: 45_000_000,
    dueDate: '2026-03-01',
    status: 'overdue',
  },
];

// ── Seed AP ──────────────────────────────────────────────────

const SEED_AP: AccountPayable[] = [
  {
    apId: 'ap-001',
    supplierId: 'sup-001',
    supplierName: 'Công ty TNHH Nhôm Xingfa Việt Nam',
    poCode: 'DMH-0001',
    totalAmount: 80_000_000,
    paidAmount: 40_000_000,
    remainingAmount: 40_000_000,
    dueDate: '2026-04-15',
    status: 'partial',
    lastPaymentDate: '2026-03-11',
  },
  {
    apId: 'ap-002',
    supplierId: 'sup-002',
    supplierName: 'Kính Hải Long',
    poCode: 'DMH-0002',
    totalAmount: 35_000_000,
    paidAmount: 0,
    remainingAmount: 35_000_000,
    dueDate: '2026-04-01',
    status: 'open',
  },
];

// ── Store Interface ──────────────────────────────────────────

interface ThuChiState {
  receipts: CashReceipt[];
  payments: CashPayment[];
  receivables: AccountReceivable[];
  payables: AccountPayable[];
  // Receipt CRUD
  setReceipts: (r: CashReceipt[]) => void;
  addReceipt: (r: CashReceipt) => void;
  updateReceipt: (receiptId: string, patch: Partial<CashReceipt>) => void;
  deleteReceipt: (receiptId: string) => void;
  // Payment CRUD
  setPayments: (p: CashPayment[]) => void;
  addPayment: (p: CashPayment) => void;
  updatePayment: (paymentId: string, patch: Partial<CashPayment>) => void;
  deletePayment: (paymentId: string) => void;
  // AR CRUD
  setReceivables: (ar: AccountReceivable[]) => void;
  updateReceivable: (arId: string, patch: Partial<AccountReceivable>) => void;
  // AP CRUD
  setPayables: (ap: AccountPayable[]) => void;
  updatePayable: (apId: string, patch: Partial<AccountPayable>) => void;
  // Utils
  resetAll: () => void;
}

const INITIAL_STATE = {
  receipts: SEED_RECEIPTS,
  payments: SEED_PAYMENTS,
  receivables: SEED_AR,
  payables: SEED_AP,
};

export const useThuChiStore = create<ThuChiState>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,

      // Receipt
      setReceipts: (receipts) => set({ receipts }),
      addReceipt: (r) => set((s) => ({ receipts: [...s.receipts, r] })),
      updateReceipt: (receiptId, patch) => set((s) => ({
        receipts: s.receipts.map(r => r.receiptId === receiptId ? { ...r, ...patch } : r),
      })),
      deleteReceipt: (receiptId) => set((s) => ({
        receipts: s.receipts.filter(r => r.receiptId !== receiptId),
      })),

      // Payment
      setPayments: (payments) => set({ payments }),
      addPayment: (p) => set((s) => ({ payments: [...s.payments, p] })),
      updatePayment: (paymentId, patch) => set((s) => ({
        payments: s.payments.map(p => p.paymentId === paymentId ? { ...p, ...patch } : p),
      })),
      deletePayment: (paymentId) => set((s) => ({
        payments: s.payments.filter(p => p.paymentId !== paymentId),
      })),

      // AR
      setReceivables: (receivables) => set({ receivables }),
      updateReceivable: (arId, patch) => set((s) => ({
        receivables: s.receivables.map(ar => ar.arId === arId ? { ...ar, ...patch } : ar),
      })),

      // AP
      setPayables: (payables) => set({ payables }),
      updatePayable: (apId, patch) => set((s) => ({
        payables: s.payables.map(ap => ap.apId === apId ? { ...ap, ...patch } : ap),
      })),

      resetAll: () => set(INITIAL_STATE),
    }),
    { name: 'alubok-thu-chi' },
  ),
);
