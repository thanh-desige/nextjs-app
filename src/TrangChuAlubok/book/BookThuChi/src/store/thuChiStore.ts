// ============================================================
// ThuChi Store — Zustand + persist
// Cash Receipts + Cash Payments + AR + AP CRUD
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CashReceipt, CashPayment, AccountReceivable, AccountPayable } from '../types';
import { logActivityDirect } from '../../../shared/src/hooks/useLogActivity';

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
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-10T14:00:00Z',
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
    createdAt: '2026-03-05T09:00:00Z',
    updatedAt: '2026-03-12T11:00:00Z',
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
    createdAt: '2026-02-15T10:00:00Z',
    updatedAt: '2026-02-15T10:00:00Z',
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
    createdAt: '2026-03-02T08:00:00Z',
    updatedAt: '2026-03-11T15:00:00Z',
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
    createdAt: '2026-03-08T09:00:00Z',
    updatedAt: '2026-03-08T09:00:00Z',
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
    (set, get) => ({
      ...INITIAL_STATE,

      // Receipt
      setReceipts: (receipts) => set({ receipts }),
      addReceipt: (r) => {
        set((s) => ({ receipts: [...s.receipts, r] }));
        logActivityDirect('ThuChi', 'create', 'cashReceipt', r.receiptId, r.receiptCode, `Tạo phiếu thu ${r.receiptCode}`);
      },
      updateReceipt: (receiptId, patch) => {
        const code = get().receipts.find(r => r.receiptId === receiptId)?.receiptCode ?? receiptId;
        set((s) => ({
          receipts: s.receipts.map(r => r.receiptId === receiptId ? { ...r, ...patch } : r),
        }));
        logActivityDirect('ThuChi', 'update', 'cashReceipt', receiptId, code, `Cập nhật phiếu thu ${code}`);
      },
      deleteReceipt: (receiptId) => {
        const code = get().receipts.find(r => r.receiptId === receiptId)?.receiptCode ?? receiptId;
        set((s) => ({
          receipts: s.receipts.filter(r => r.receiptId !== receiptId),
        }));
        logActivityDirect('ThuChi', 'delete', 'cashReceipt', receiptId, code, `Xóa phiếu thu ${code}`);
      },

      // Payment
      setPayments: (payments) => set({ payments }),
      addPayment: (p) => {
        set((s) => ({ payments: [...s.payments, p] }));
        logActivityDirect('ThuChi', 'create', 'cashPayment', p.paymentId, p.paymentCode, `Tạo phiếu chi ${p.paymentCode}`);
      },
      updatePayment: (paymentId, patch) => {
        const code = get().payments.find(p => p.paymentId === paymentId)?.paymentCode ?? paymentId;
        set((s) => ({
          payments: s.payments.map(p => p.paymentId === paymentId ? { ...p, ...patch } : p),
        }));
        logActivityDirect('ThuChi', 'update', 'cashPayment', paymentId, code, `Cập nhật phiếu chi ${code}`);
      },
      deletePayment: (paymentId) => {
        const code = get().payments.find(p => p.paymentId === paymentId)?.paymentCode ?? paymentId;
        set((s) => ({
          payments: s.payments.filter(p => p.paymentId !== paymentId),
        }));
        logActivityDirect('ThuChi', 'delete', 'cashPayment', paymentId, code, `Xóa phiếu chi ${code}`);
      },

      // AR
      setReceivables: (receivables) => set({ receivables }),
      updateReceivable: (arId, patch) => {
        const ar = get().receivables.find(a => a.arId === arId);
        set((s) => ({
          receivables: s.receivables.map(ar => ar.arId === arId ? { ...ar, ...patch } : ar),
        }));
        logActivityDirect('ThuChi', 'update', 'accountReceivable', arId, ar?.customerName ?? arId, `Cập nhật công nợ phải thu ${ar?.customerName ?? arId}`);
      },

      // AP
      setPayables: (payables) => set({ payables }),
      updatePayable: (apId, patch) => {
        const ap = get().payables.find(a => a.apId === apId);
        set((s) => ({
          payables: s.payables.map(ap => ap.apId === apId ? { ...ap, ...patch } : ap),
        }));
        logActivityDirect('ThuChi', 'update', 'accountPayable', apId, ap?.supplierName ?? apId, `Cập nhật công nợ phải trả ${ap?.supplierName ?? apId}`);
      },

      resetAll: () => set(INITIAL_STATE),
    }),
    { name: 'alubok-thu-chi' },
  ),
);
