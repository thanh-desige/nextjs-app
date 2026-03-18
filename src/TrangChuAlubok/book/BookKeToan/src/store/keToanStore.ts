import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AccountingVoucher,
  AccountingInvoice,
  VoucherStatus,
  InvoiceStatus,
} from '../types';

// ── Seed Data ───────────────────────────────────────────────

const SEED_VOUCHERS: AccountingVoucher[] = [
  {
    voucherId: 'v-001',
    voucherCode: 'CT-0001',
    voucherType: 'receipt',
    date: '2026-03-10',
    description: 'Thu tiền bán hàng — KH ABC Construction',
    entries: [
      { entryId: 'e-001a', accountCode: '111', accountName: 'Tiền mặt', debitAmount: 50000000, creditAmount: 0, description: 'Thu tiền mặt' },
      { entryId: 'e-001b', accountCode: '131', accountName: 'Phải thu khách hàng', debitAmount: 0, creditAmount: 50000000, description: 'Giảm công nợ KH' },
    ],
    totalDebit: 50000000,
    totalCredit: 50000000,
    status: 'approved',
    sourceModule: 'BookThuChi',
    sourceCode: 'PT-0001',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-10T09:00:00Z',
    approvedBy: 'Trần Thị B',
    approvedAt: '2026-03-10T09:00:00Z',
  },
  {
    voucherId: 'v-002',
    voucherCode: 'CT-0002',
    voucherType: 'payment',
    date: '2026-03-11',
    description: 'Chi trả NCC Xingfa — Đơn mua PO-0001',
    entries: [
      { entryId: 'e-002a', accountCode: '331', accountName: 'Phải trả NCC', debitAmount: 40000000, creditAmount: 0, description: 'Giảm công nợ NCC' },
      { entryId: 'e-002b', accountCode: '112', accountName: 'Tiền gửi ngân hàng', debitAmount: 0, creditAmount: 40000000, description: 'CK ngân hàng' },
    ],
    totalDebit: 40000000,
    totalCredit: 40000000,
    status: 'approved',
    sourceModule: 'BookThuChi',
    sourceCode: 'PC-0001',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-11T10:00:00Z',
    updatedAt: '2026-03-11T11:00:00Z',
    approvedBy: 'Trần Thị B',
    approvedAt: '2026-03-11T11:00:00Z',
  },
  {
    voucherId: 'v-003',
    voucherCode: 'CT-0003',
    voucherType: 'journal',
    date: '2026-03-15',
    description: 'Bút toán điều chỉnh tỷ giá cuối kỳ',
    entries: [
      { entryId: 'e-003a', accountCode: '515', accountName: 'Doanh thu tài chính', debitAmount: 0, creditAmount: 2500000, description: 'Lãi tỷ giá' },
      { entryId: 'e-003b', accountCode: '112', accountName: 'Tiền gửi ngân hàng', debitAmount: 2500000, creditAmount: 0, description: 'Tăng TK ngân hàng' },
    ],
    totalDebit: 2500000,
    totalCredit: 2500000,
    status: 'draft',
    createdBy: 'Lê Thị C',
    createdAt: '2026-03-15T14:00:00Z',
    updatedAt: '2026-03-15T14:00:00Z',
  },
  {
    voucherId: 'v-004',
    voucherCode: 'CT-0004',
    voucherType: 'adjustment',
    date: '2026-03-16',
    description: 'Điều chỉnh khấu hao TSCĐ tháng 3',
    entries: [
      { entryId: 'e-004a', accountCode: '642', accountName: 'Chi phí quản lý DN', debitAmount: 5000000, creditAmount: 0, description: 'Chi phí khấu hao' },
      { entryId: 'e-004b', accountCode: '214', accountName: 'Hao mòn TSCĐ', debitAmount: 0, creditAmount: 5000000, description: 'Trích khấu hao' },
    ],
    totalDebit: 5000000,
    totalCredit: 5000000,
    status: 'draft',
    createdBy: 'Lê Thị C',
    createdAt: '2026-03-16T09:00:00Z',
    updatedAt: '2026-03-16T09:00:00Z',
  },
];

const SEED_INVOICES: AccountingInvoice[] = [
  {
    invoiceId: 'inv-001',
    invoiceCode: 'HD-0001',
    customerId: 'kh-001',
    customerName: 'Công ty ABC Construction',
    customerAddress: '123 Nguyễn Huệ, Q.1, TP.HCM',
    customerTaxCode: '0301234567',
    soCode: 'SO-0001',
    date: '2026-03-10',
    items: [
      { itemId: 'ii-001a', description: 'Cửa nhôm Xingfa 55 series — 1200×2100', quantity: 10, unitPrice: 8500000, amount: 85000000 },
      { itemId: 'ii-001b', description: 'Cửa sổ mở hất — 600×800', quantity: 20, unitPrice: 3200000, amount: 64000000 },
    ],
    subtotal: 149000000,
    vatRate: 0.08,
    vatAmount: 11920000,
    total: 160920000,
    status: 'approved',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-10T11:00:00Z',
    approvedBy: 'Trần Thị B',
    approvedAt: '2026-03-10T11:00:00Z',
  },
  {
    invoiceId: 'inv-002',
    invoiceCode: 'HD-0002',
    customerId: 'kh-002',
    customerName: 'Công ty Hoàng Gia Windows',
    customerAddress: '456 Lê Lợi, Q.3, TP.HCM',
    customerTaxCode: '0309876543',
    soCode: 'SO-0003',
    date: '2026-03-12',
    items: [
      { itemId: 'ii-002a', description: 'Vách kính cường lực 12mm — 3000×2400', quantity: 5, unitPrice: 12000000, amount: 60000000 },
    ],
    subtotal: 60000000,
    vatRate: 0.08,
    vatAmount: 4800000,
    total: 64800000,
    status: 'draft',
    createdBy: 'Nguyễn Văn A',
    createdAt: '2026-03-12T08:00:00Z',
    updatedAt: '2026-03-12T08:00:00Z',
  },
  {
    invoiceId: 'inv-003',
    invoiceCode: 'HD-0003',
    customerId: 'kh-003',
    customerName: 'Anh Hùng (căn hộ SaigonPearl)',
    customerAddress: '92 Nguyễn Hữu Cảnh, Bình Thạnh',
    date: '2026-03-14',
    items: [
      { itemId: 'ii-003a', description: 'Cửa nhôm kính ban công — 2400×2100', quantity: 2, unitPrice: 15000000, amount: 30000000 },
      { itemId: 'ii-003b', description: 'Lắp đặt + vận chuyển', quantity: 1, unitPrice: 2000000, amount: 2000000 },
    ],
    subtotal: 32000000,
    vatRate: 0.08,
    vatAmount: 2560000,
    total: 34560000,
    status: 'cancelled',
    notes: 'Khách hủy đơn hàng',
    createdBy: 'Lê Thị C',
    createdAt: '2026-03-14T09:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    cancelledBy: 'Trần Thị B',
    cancelledAt: '2026-03-15T10:00:00Z',
  },
];

// ── Store Interface ─────────────────────────────────────────

interface KeToanState {
  // Data
  vouchers: AccountingVoucher[];
  invoices: AccountingInvoice[];

  // Voucher CRUD
  setVouchers: (vouchers: AccountingVoucher[]) => void;
  addVoucher: (voucher: AccountingVoucher) => void;
  updateVoucher: (id: string, patch: Partial<AccountingVoucher>) => void;
  deleteVoucher: (id: string) => void;

  // Invoice CRUD
  setInvoices: (invoices: AccountingInvoice[]) => void;
  addInvoice: (invoice: AccountingInvoice) => void;
  updateInvoice: (id: string, patch: Partial<AccountingInvoice>) => void;
  deleteInvoice: (id: string) => void;

  // Reset
  resetAll: () => void;
}

// ── Store ───────────────────────────────────────────────────

export const useKeToanStore = create<KeToanState>()(
  persist(
    (set) => ({
      vouchers: SEED_VOUCHERS,
      invoices: SEED_INVOICES,

      // Voucher CRUD
      setVouchers: (vouchers) => set({ vouchers }),
      addVoucher: (voucher) => set((s) => ({ vouchers: [...s.vouchers, voucher] })),
      updateVoucher: (id, patch) =>
        set((s) => ({
          vouchers: s.vouchers.map((v) => (v.voucherId === id ? { ...v, ...patch } : v)),
        })),
      deleteVoucher: (id) =>
        set((s) => ({ vouchers: s.vouchers.filter((v) => v.voucherId !== id) })),

      // Invoice CRUD
      setInvoices: (invoices) => set({ invoices }),
      addInvoice: (invoice) => set((s) => ({ invoices: [...s.invoices, invoice] })),
      updateInvoice: (id, patch) =>
        set((s) => ({
          invoices: s.invoices.map((inv) => (inv.invoiceId === id ? { ...inv, ...patch } : inv)),
        })),
      deleteInvoice: (id) =>
        set((s) => ({ invoices: s.invoices.filter((inv) => inv.invoiceId !== id) })),

      // Reset
      resetAll: () => set({ vouchers: SEED_VOUCHERS, invoices: SEED_INVOICES }),
    }),
    { name: 'alubok-ke-toan' }
  )
);
