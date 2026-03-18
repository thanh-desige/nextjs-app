// ============================================================
// BookSanXuatThiCong — Domain Types
// B21: production.project, B22: production.order,
// B23: production.material_plan, B24: construction.installation,
// B25: construction.acceptance, C12: report.production
// ============================================================

// ── Project Status (Công trình) ─────────────────────────────

export type ProjectStatus =
  | 'planning'
  | 'in_production'
  | 'ready_to_install'
  | 'installing'
  | 'acceptance'
  | 'completed'
  | 'warranty';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: 'Lập kế hoạch',
  in_production: 'Đang sản xuất',
  ready_to_install: 'Sẵn sàng lắp',
  installing: 'Đang lắp đặt',
  acceptance: 'Nghiệm thu',
  completed: 'Hoàn thành',
  warranty: 'Bảo hành',
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: '#89b4fa',       // blue
  in_production: '#f9e2af',  // yellow
  ready_to_install: '#94e2d5', // teal
  installing: '#fab387',     // orange
  acceptance: '#cba6f7',     // mauve
  completed: '#a6e3a1',      // green
  warranty: '#6c7086',       // overlay0
};

// ── Production Order Status (Lệnh sản xuất) ─────────────────

export type ProductionOrderStatus =
  | 'new'
  | 'cutting'
  | 'processing'
  | 'qc'
  | 'completed'
  | 'defect'
  | 'cancelled';

export const PO_STATUS_LABELS: Record<ProductionOrderStatus, string> = {
  new: 'Mới',
  cutting: 'Đang cắt',
  processing: 'Đang gia công',
  qc: 'Kiểm tra QC',
  completed: 'Hoàn tất',
  defect: 'Lỗi / Làm lại',
  cancelled: 'Hủy',
};

export const PO_STATUS_COLORS: Record<ProductionOrderStatus, string> = {
  new: '#89b4fa',        // blue
  cutting: '#f9e2af',    // yellow
  processing: '#fab387', // orange
  qc: '#cba6f7',         // mauve
  completed: '#a6e3a1',  // green
  defect: '#f38ba8',     // red
  cancelled: '#585b70',  // dark gray
};

// ── Material Plan Status ────────────────────────────────────

export type MaterialPlanStatus = 'pending' | 'partial' | 'fulfilled' | 'cancelled';

export const MP_STATUS_LABELS: Record<MaterialPlanStatus, string> = {
  pending: 'Chờ cấp phát',
  partial: 'Cấp 1 phần',
  fulfilled: 'Đã đủ',
  cancelled: 'Hủy',
};

export const MP_STATUS_COLORS: Record<MaterialPlanStatus, string> = {
  pending: '#f9e2af',    // yellow
  partial: '#fab387',    // orange
  fulfilled: '#a6e3a1',  // green
  cancelled: '#585b70',  // dark gray
};

// ── Installation Status (Lắp đặt) ──────────────────────────

export type InstallationStatus =
  | 'scheduled'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'cancelled';

export const INST_STATUS_LABELS: Record<InstallationStatus, string> = {
  scheduled: 'Đã lên lịch',
  in_progress: 'Đang thi công',
  paused: 'Tạm dừng',
  completed: 'Hoàn tất',
  cancelled: 'Hủy',
};

export const INST_STATUS_COLORS: Record<InstallationStatus, string> = {
  scheduled: '#89b4fa',    // blue
  in_progress: '#fab387',  // orange
  paused: '#f9e2af',       // yellow
  completed: '#a6e3a1',    // green
  cancelled: '#585b70',    // dark gray
};

// ── Acceptance Status (Nghiệm thu) ─────────────────────────

export type AcceptanceStatus = 'pending' | 'approved' | 'rejected' | 'conditional';

export const ACC_STATUS_LABELS: Record<AcceptanceStatus, string> = {
  pending: 'Chờ nghiệm thu',
  approved: 'Đạt',
  rejected: 'Không đạt',
  conditional: 'Đạt có điều kiện',
};

export const ACC_STATUS_COLORS: Record<AcceptanceStatus, string> = {
  pending: '#f9e2af',     // yellow
  approved: '#a6e3a1',    // green
  rejected: '#f38ba8',    // red
  conditional: '#fab387', // orange
};

// ── Project (Công trình — entity cha) ───────────────────────

export interface Project {
  projectId: string;
  projectCode: string;         // CT-XXXX
  projectName: string;
  customerId: string;
  customerName: string;
  salesOrderId?: string;
  salesOrderCode?: string;     // DH-XXXX ref
  designProjectId?: string;    // Ref BookThietKeBocTach
  address: string;
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  warrantyEndDate?: string;
  cancelledAt?: string;
}

// ── Production Order Item (hạng mục trong lệnh SX) ─────────

export interface ProductionOrderItem {
  itemId: string;
  description: string;       // e.g. "Cửa nhôm Xingfa 55 — 1200×2100"
  quantity: number;
  unit: string;              // bộ, cái, tấm...
  bomRef?: string;           // BOM reference
  completedQty: number;
  defectQty: number;
}

// ── Production Order (Lệnh sản xuất) ────────────────────────

export interface ProductionOrder {
  orderId: string;
  orderCode: string;          // LSX-XXXX
  projectId: string;
  projectCode: string;
  items: ProductionOrderItem[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: ProductionOrderStatus;
  assignedTo?: string;        // Quản đốc / tổ trưởng
  startDate: string;
  dueDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  qcPassedAt?: string;
  qcNote?: string;
}

export const PRIORITY_LABELS: Record<ProductionOrder['priority'], string> = {
  low: 'Thấp',
  normal: 'Bình thường',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export const PRIORITY_COLORS: Record<ProductionOrder['priority'], string> = {
  low: '#6c7086',
  normal: '#89b4fa',
  high: '#fab387',
  urgent: '#f38ba8',
};

// ── Material Plan Item (vật tư cần cho lệnh SX) ─────────────

export interface MaterialPlanItem {
  itemId: string;
  materialName: string;       // Nhôm Xingfa 55, Kính 8mm...
  materialCode?: string;      // SKU
  unit: string;
  requiredQty: number;        // BOM cần
  stockQty: number;           // tồn kho hiện tại
  issuedQty: number;          // đã cấp phát
  shortageQty: number;        // thiếu = required - issued
}

// ── Material Plan (Kế hoạch vật tư) ─────────────────────────

export interface MaterialPlan {
  planId: string;
  planCode: string;            // KHVT-XXXX
  productionOrderId: string;
  productionOrderCode: string;
  items: MaterialPlanItem[];
  status: MaterialPlanStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ── Material Issue (Xuất dùng sản xuất) ─────────────────────

export interface MaterialIssueItem {
  itemId: string;
  materialName: string;
  materialCode?: string;
  unit: string;
  requestedQty: number;
  issuedQty: number;
  wasteQty: number;           // hao hụt
}

export type MaterialIssueStatus = 'pending' | 'approved' | 'issued' | 'cancelled';

export const MI_STATUS_LABELS: Record<MaterialIssueStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  issued: 'Đã xuất',
  cancelled: 'Hủy',
};

export const MI_STATUS_COLORS: Record<MaterialIssueStatus, string> = {
  pending: '#f9e2af',
  approved: '#89b4fa',
  issued: '#a6e3a1',
  cancelled: '#585b70',
};

export interface MaterialIssue {
  issueId: string;
  issueCode: string;           // XD-XXXX (Xuất dùng)
  productionOrderId: string;
  productionOrderCode: string;
  items: MaterialIssueItem[];
  status: MaterialIssueStatus;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// ── Installation Job (Lắp đặt) ─────────────────────────────

export interface InstallationJob {
  jobId: string;
  jobCode: string;             // LD-XXXX
  projectId: string;
  projectCode: string;
  teamName: string;            // Đội thi công A, B...
  teamLeader: string;
  scheduledDate: string;
  scheduledEndDate?: string;
  address: string;
  status: InstallationStatus;
  checkInAt?: string;
  checkOutAt?: string;
  issues?: string[];           // Phát sinh hiện trường
  photos?: string[];           // URLs ảnh
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ── Acceptance Record (Nghiệm thu / Bàn giao) ──────────────

export interface AcceptanceRecord {
  recordId: string;
  recordCode: string;          // NT-XXXX
  projectId: string;
  projectCode: string;
  type: 'partial' | 'final';  // Nghiệm thu từng phần / toàn bộ
  acceptanceDate: string;
  inspectedBy: string;
  status: AcceptanceStatus;
  volumeDescription: string;   // Mô tả khối lượng
  defects?: string[];          // Danh sách lỗi/sai sót
  notes?: string;
  warrantyStartDate?: string;
  warrantyMonths?: number;     // 12, 24...
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// ── Sub-sidebar Section ─────────────────────────────────────

export type SanXuatSection =
  | 'overview'
  | 'production-orders'
  | 'material-plans'
  | 'material-issues'
  | 'installations'
  | 'acceptances'
  | 'reports';

export type SXViewMode = 'list' | 'form' | 'detail';

// ── Helper functions ────────────────────────────────────────

/** Count items by status in production orders */
export function countByPOStatus(
  orders: ProductionOrder[]
): Record<ProductionOrderStatus, number> {
  const counts = { new: 0, cutting: 0, processing: 0, qc: 0, completed: 0, defect: 0, cancelled: 0 };
  for (const o of orders) counts[o.status]++;
  return counts;
}

/** Calculate material shortage */
export function calcShortage(required: number, issued: number): number {
  return Math.max(0, required - issued);
}

/** Check if project has overdue production orders */
export function hasOverdueOrders(orders: ProductionOrder[], now: string): boolean {
  return orders.some(
    (o) => o.status !== 'completed' && o.status !== 'cancelled' && o.dueDate < now
  );
}
