// ============================================================
// ALUBOK Time System — Types (Cross-cutting, nằm trong shared/)
//
// KHÔNG tạo module Time riêng. Đây là shared infrastructure.
// Backend là nguồn sự thật — frontend chỉ chọn range + hiển thị.
//
// === A. ĐÁNH GIÁ HIỆN TRẠNG ===
//
// 1. Thiếu field:
//    - BanHang: Quote thiếu sentAt, SalesOrder thiếu paidAt/completedAt
//    - MuaHang: PO thiếu receivedAt, PR thiếu approvalDeadline
//    - TonKho: Receipt/Issue thiếu voucherDate (≠ createdAt)
//    - ThuChi: AR/AP thiếu invoiceDate
//    - KeToan: Invoice thiếu dueDate, Voucher thiếu postedAt
//    - SanXuatThiCong: MaterialPlan thiếu requiredByDate
//    - DanhMuc: Material thiếu priceEffectiveDate
//    - ThietLap: User thiếu passwordChangedAt, suspendedAt
//
// 2. Thiếu filter: KHÔNG module nào có date range filter trên list
//
// 3. Thiếu semantic time: Không có "2 giờ trước", "quá hạn 3 ngày",
//    "còn 5 ngày", "tuần này", "tháng trước"
//
// 4. Type inconsistency: CAD module dùng Date object,
//    tất cả module khác dùng ISO string
//
// === B. CHUẨN THỜI GIAN TOÀN HỆ ===
//
// Timezone rule: UTC storage, display theo org.timezone (from ThietLap)
// Default: 'Asia/Ho_Chi_Minh' (UTC+7)
// Format hiển thị: theo SystemSettings.dateFormat (DD/MM/YYYY default)
// Relative time: "vừa xong", "X phút/giờ/ngày trước", "quá hạn X ngày"
//
// ============================================================

// ── ISO Timestamp Type ───────────────────────────────────────
/** ISO 8601 string: "2026-03-18T10:30:00Z" (always UTC in storage) */
export type ISOTimestamp = string;

/** ISO date-only: "2026-03-18" */
export type ISODate = string;

// ── Time Range / Preset ──────────────────────────────────────
export type TimePreset =
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'thisWeek'
  | 'lastWeek'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'thisYear'
  | 'custom';

export const TIME_PRESET_LABELS: Record<TimePreset, string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  last7days: '7 ngày qua',
  thisWeek: 'Tuần này',
  lastWeek: 'Tuần trước',
  last30days: '30 ngày qua',
  thisMonth: 'Tháng này',
  lastMonth: 'Tháng trước',
  thisQuarter: 'Quý này',
  thisYear: 'Năm nay',
  custom: 'Tùy chỉnh',
};

export interface TimeRange {
  /** ISO start (inclusive), server-computed from preset */
  start: ISOTimestamp;
  /** ISO end (inclusive), server-computed from preset */
  end: ISOTimestamp;
}

export interface TimeRangeQuery {
  preset: TimePreset;
  /** Required when preset === 'custom' */
  customStart?: ISODate;
  customEnd?: ISODate;
}

// ── Semantic Time ────────────────────────────────────────────
export type SemanticTimeKind =
  | 'just_now'      // < 1 phút
  | 'minutes_ago'   // 1-59 phút
  | 'hours_ago'     // 1-23 giờ
  | 'days_ago'      // 1-6 ngày
  | 'weeks_ago'     // 1-3 tuần
  | 'date'          // > 3 tuần → hiển thị ngày cụ thể
  | 'overdue'       // quá hạn
  | 'due_soon'      // còn ≤ 3 ngày
  | 'remaining';    // còn > 3 ngày

export interface SemanticTime {
  kind: SemanticTimeKind;
  label: string;    // "2 giờ trước", "quá hạn 3 ngày", "còn 5 ngày"
  value: number;    // số phút/giờ/ngày (for sorting)
  color: string;    // hex color for badge
}

// ── Due Date / Overdue ───────────────────────────────────────
export type DueStatus = 'not_due' | 'due_soon' | 'due_today' | 'overdue';

export interface DueInfo {
  status: DueStatus;
  label: string;    // "Còn 5 ngày", "Hôm nay", "Quá hạn 3 ngày"
  daysRemaining: number; // negative = overdue
  color: string;
}

export const DUE_STATUS_COLORS: Record<DueStatus, string> = {
  not_due: '#a6adc8',    // neutral
  due_soon: '#f9e2af',   // yellow warning
  due_today: '#fab387',  // orange
  overdue: '#f38ba8',    // red danger
};

// ── Aging Buckets (Công nợ) ──────────────────────────────────
export interface AgingBucket {
  label: string;     // "0-30 ngày", "31-60 ngày"...
  min: number;
  max: number;       // Infinity for last bucket
  amount: number;
  count: number;
  color: string;
}

export const AGING_BUCKET_DEFS: Array<{ label: string; min: number; max: number; color: string }> = [
  { label: 'Chưa đến hạn', min: -Infinity, max: 0, color: '#a6e3a1' },
  { label: '0–30 ngày', min: 0, max: 30, color: '#f9e2af' },
  { label: '31–60 ngày', min: 31, max: 60, color: '#fab387' },
  { label: '61–90 ngày', min: 61, max: 90, color: '#f38ba8' },
  { label: '>90 ngày', min: 91, max: Infinity, color: '#ed8796' },
];

// ── Fiscal Period (Kỳ kế toán) ───────────────────────────────
export interface FiscalPeriod {
  year: number;
  month: number;        // 1-12
  label: string;        // "T03/2026"
  startDate: ISODate;   // "2026-03-01"
  endDate: ISODate;     // "2026-03-31"
  locked: boolean;
  lockedAt?: ISOTimestamp;
  lockedBy?: string;
}

export interface FiscalYear {
  year: number;
  startMonth: number;   // from SystemSettings.fiscalYearStart (default 1)
  periods: FiscalPeriod[];
  label: string;        // "FY 2026"
}

// ── Activity Event (Trục thời gian hoạt động) ────────────────
export type ActivityAction =
  | 'create' | 'update' | 'delete'
  | 'approve' | 'reject' | 'cancel' | 'close'
  | 'confirm' | 'complete' | 'reopen'
  | 'send' | 'receive' | 'pay' | 'issue' | 'transfer';

export type ModuleKey =
  | 'BanHang' | 'MuaHang' | 'TonKho' | 'ThuChi'
  | 'KeToan' | 'SanXuatThiCong' | 'ThietKeBocTach'
  | 'ThietLap' | 'DanhMuc' | 'TongQuan';

export interface ActivityEvent {
  eventId: string;
  module: ModuleKey;
  action: ActivityAction;
  entityType: string;        // 'quote', 'salesOrder', 'stockReceipt'...
  entityId: string;
  entityCode: string;        // 'BG-0001', 'DMH-0002'...
  description: string;       // "Tạo báo giá BG-0003"
  userId: string;
  userName: string;
  timestamp: ISOTimestamp;
  metadata?: Record<string, unknown>;
}

// ── C. CHUẨN FIELD BACKEND CHO TỪNG NHÓM NGHIỆP VỤ ──────
//
// AUDIT FIELDS (mọi entity):
//   createdAt, updatedAt, createdBy, updatedBy
//
// APPROVAL WORKFLOW:
//   approvedAt?, approvedBy?, rejectedAt?, rejectedBy?, rejectedReason?
//
// === Module-specific fields cần thêm ===
//
// BookBanHang:
//   Quote: + sentAt?, closedAt?
//   SalesOrder: + paidAt?, completedAt?, deliveredAt?
//
// BookMuaHang:
//   PurchaseRequest: + approvalDeadline?
//   PurchaseOrder: + receivedAt?, invoiceDate?
//
// BookTonKho:
//   StockReceipt: + voucherDate (ngày chứng từ ≠ ngày tạo)
//   StockIssue: + voucherDate
//   StockTransfer: + voucherDate
//
// BookThuChi:
//   CashReceipt/Payment: + voucherDate, reconciledAt?
//   AccountReceivable/Payable: + invoiceDate
//
// BookKeToan:
//   AccountingVoucher: + postedAt? (ngày hạch toán ≠ ngày chứng từ)
//   AccountingInvoice: + dueDate?, paidAt?
//
// BookSanXuatThiCong:
//   MaterialPlan: + requiredByDate
//   ProductionOrder: + actualStartAt?, actualEndAt?
//
// DanhMuc:
//   Material/Profile: + priceEffectiveDate?, discontinuedAt?
//   Employee: + resignationDate?
//
// ThietLap:
//   ManagedUser: + passwordChangedAt?, suspendedAt?
//
// ── D. API QUERY STANDARD ────────────────────────────────────
//
// Tất cả API list/report PHẢI hỗ trợ query params:
//   ?timeField=createdAt       (field nào dùng filter)
//   &preset=thisMonth          (hoặc custom + start/end)
//   &start=2026-03-01T00:00:00Z
//   &end=2026-03-31T23:59:59Z
//   &timezone=Asia/Ho_Chi_Minh
//
// Backend resolve preset → absolute range dựa trên timezone.
// Frontend KHÔNG tự tính. Frontend gửi preset, backend trả range.
//
// ============================================================
