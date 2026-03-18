// ============================================================
// ThietLap types — Settings management UI types
// Compose shared/ types for the ThietLap module screens
// ============================================================

import type { User } from '../../../shared/src/types/user.types';
import type { OrgMember, MemberRole } from '../../../shared/src/types/member.types';
import type { AppRole } from '../../../shared/src/types/role.types';
import type { Org, OrgBranch } from '../../../shared/src/types/org.types';

// ────────────────────────────────────────────────────────────
// D1: User Management
// ────────────────────────────────────────────────────────────

/** User with their org membership and assigned roles — for user management table */
export interface ManagedUser {
  user: User;
  membership: OrgMember;
  assignedRoles: MemberRole[];
  /** Display helper — comma-separated role names */
  roleNames: string[];
  lastLoginAt: string | null;
}

/** Invite a new user to the org */
export interface InviteUserPayload {
  email: string;
  displayName: string;
  platformRole: 'admin' | 'member';
  roleIds: string[];
}

// ────────────────────────────────────────────────────────────
// D2: Role Management
// ────────────────────────────────────────────────────────────

/** Role with its permission list and member count — for role management table */
export interface ManagedRole {
  role: AppRole;
  permissions: string[];
  memberCount: number;
}

/** Create or update a role */
export interface RolePayload {
  roleName: string;
  description: string;
  permissions: string[];
}

// ────────────────────────────────────────────────────────────
// D3: Permission Matrix
// ────────────────────────────────────────────────────────────

/** A row in the permission matrix grid */
export interface PermissionMatrixRow {
  resource: string;
  group: string;
  groupLabel: string;
  actions: string[];
  granted: string[];
}

/** Group header labels */
export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  A: 'Danh mục (Master Data)',
  B: 'Nghiệp vụ (Business)',
  C: 'Báo cáo (Reports)',
  D: 'Thiết lập (Settings)',
};

/** Human-readable resource names */
export const RESOURCE_LABELS: Record<string, string> = {
  'master.customer': 'Khách hàng',
  'master.supplier': 'Nhà cung cấp',
  'master.employee': 'Nhân viên',
  'master.profile': 'Thanh nhôm',
  'master.glass': 'Kính',
  'master.accessory': 'Phụ kiện',
  'master.material': 'Vật tư',
  'master.unit': 'Đơn vị tính',
  'master.warehouse': 'Kho',
  'master.price_list': 'Bảng giá',
  'master.tax_rate': 'Thuế suất',
  'master.door_template': 'Mẫu cửa',
  'design.project': 'Dự án thiết kế',
  'design.canvas': 'Bản vẽ',
  'design.library': 'Thư viện',
  'bom.report': 'BOM',
  'bom.cut_list': 'Danh sách cắt',
  'quote': 'Báo giá',
  'sales.order': 'Đơn bán hàng',
  'purchase.order': 'Đơn mua hàng',
  'purchase.request': 'Yêu cầu mua hàng',
  'inventory.stock_receipt': 'Phiếu nhập kho',
  'inventory.stock_issue': 'Phiếu xuất kho',
  'inventory.stock_transfer': 'Phiếu chuyển kho',
  'inventory.stock_audit': 'Kiểm kê',
  'inventory.balance': 'Tồn kho',
  'finance.receipt': 'Phiếu thu',
  'finance.payment': 'Phiếu chi',
  'finance.ar': 'Công nợ phải thu',
  'finance.ap': 'Công nợ phải trả',
  'accounting.voucher': 'Chứng từ kế toán',
  'accounting.invoice': 'Hóa đơn',
  'report.dashboard_executive': 'Dashboard',
  'report.design': 'BC Thiết kế',
  'report.bom': 'BC BOM',
  'report.quote': 'BC Báo giá',
  'report.sales': 'BC Bán hàng',
  'report.purchase': 'BC Mua hàng',
  'report.inventory': 'BC Kho',
  'report.debt': 'BC Công nợ',
  'report.cashflow': 'BC Dòng tiền',
  'report.accounting': 'BC Kế toán',
  'report.performance': 'BC Hiệu suất',
  'setting.user': 'Người dùng',
  'setting.role': 'Vai trò',
  'setting.permission': 'Quyền hạn',
  'setting.org': 'Tổ chức',
  'setting.branch': 'Chi nhánh',
  'setting.system': 'Cấu hình hệ thống',
  'setting.print_template': 'Mẫu in',
  'setting.audit_log': 'Nhật ký',
};

/** Human-readable action names */
export const ACTION_LABELS: Record<string, string> = {
  read: 'Xem',
  create: 'Tạo',
  update: 'Sửa',
  delete: 'Xóa',
  import: 'Import',
  export: 'Export',
  share: 'Chia sẻ',
  generate: 'Tạo tự động',
  approve: 'Duyệt',
  reject: 'Từ chối',
  confirm: 'Xác nhận',
  close: 'Đóng',
  cancel: 'Hủy',
  manage: 'Quản lý',
  assign: 'Gán',
  restore: 'Khôi phục',
  archive: 'Lưu trữ',
};

// ────────────────────────────────────────────────────────────
// D6: System Settings
// ────────────────────────────────────────────────────────────

export interface SystemSettings {
  numberFormat: 'vi-VN' | 'en-US';
  currency: 'VND' | 'USD';
  language: 'vi' | 'en';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  fiscalYearStart: number;
  timezone: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  numberFormat: 'vi-VN',
  currency: 'VND',
  language: 'vi',
  dateFormat: 'DD/MM/YYYY',
  fiscalYearStart: 1,
  timezone: 'Asia/Ho_Chi_Minh',
};

// ────────────────────────────────────────────────────────────
// D8: Audit Log
// ────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

// ────────────────────────────────────────────────────────────
// Sidebar tab keys
// ────────────────────────────────────────────────────────────

export type ThietLapTab =
  | 'users'
  | 'roles'
  | 'permissions'
  | 'org'
  | 'branches'
  | 'system'
  | 'print'
  | 'audit';
