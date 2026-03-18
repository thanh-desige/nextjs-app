// ============================================================
// Permission Catalog — Source of truth (from PERMISSION_CATALOG.md)
// 67 resources across 5 groups (A-E), 17 standard actions
// ============================================================

import type { PermissionCatalogEntry } from '../types';

// ────────────────────────────────────────────────────────────
// Group A: DANH MỤC — Master Data (12 resources)
// ────────────────────────────────────────────────────────────
const GROUP_A: readonly PermissionCatalogEntry[] = [
  { resource: 'master.customer',      group: 'A', actions: ['read', 'create', 'update', 'delete', 'import', 'export'] },
  { resource: 'master.supplier',      group: 'A', actions: ['read', 'create', 'update', 'delete', 'import', 'export'] },
  { resource: 'master.employee',      group: 'A', actions: ['read', 'create', 'update', 'delete', 'import', 'export'] },
  { resource: 'master.profile',       group: 'A', actions: ['read', 'create', 'update', 'delete', 'import', 'export'] },
  { resource: 'master.glass',         group: 'A', actions: ['read', 'create', 'update', 'delete', 'import', 'export'] },
  { resource: 'master.accessory',     group: 'A', actions: ['read', 'create', 'update', 'delete', 'import', 'export'] },
  { resource: 'master.material',      group: 'A', actions: ['read', 'create', 'update', 'delete', 'import', 'export'] },
  { resource: 'master.unit',          group: 'A', actions: ['read', 'create', 'update', 'delete'] },
  { resource: 'master.warehouse',     group: 'A', actions: ['read', 'create', 'update', 'delete'] },
  { resource: 'master.price_list',    group: 'A', actions: ['read', 'create', 'update', 'delete', 'import', 'export'] },
  { resource: 'master.tax_rate',      group: 'A', actions: ['read', 'create', 'update', 'delete'] },
  { resource: 'master.door_template', group: 'A', actions: ['read', 'create', 'update', 'delete', 'import', 'export', 'share'] },
] as const;

// ────────────────────────────────────────────────────────────
// Group B: NGHIỆP VỤ — Business Operations (20 resources)
// ────────────────────────────────────────────────────────────
const GROUP_B: readonly PermissionCatalogEntry[] = [
  { resource: 'design.project',          group: 'B', actions: ['read', 'create', 'update', 'delete', 'export', 'share', 'archive', 'restore', 'manage'] },
  { resource: 'design.canvas',           group: 'B', actions: ['read', 'update', 'export', 'share'] },
  { resource: 'design.library',          group: 'B', actions: ['read', 'create', 'update', 'delete', 'share'] },
  { resource: 'bom.report',              group: 'B', actions: ['read', 'create', 'update', 'delete', 'generate', 'export', 'approve', 'reject', 'archive'] },
  { resource: 'bom.cut_list',            group: 'B', actions: ['read', 'generate', 'export'] },
  { resource: 'quote',                   group: 'B', actions: ['read', 'create', 'update', 'delete', 'generate', 'export', 'share', 'approve', 'reject', 'close', 'cancel'] },
  { resource: 'sales.order',             group: 'B', actions: ['read', 'create', 'update', 'delete', 'approve', 'reject', 'close', 'cancel', 'export'] },
  { resource: 'purchase.order',          group: 'B', actions: ['read', 'create', 'update', 'delete', 'approve', 'reject', 'close', 'cancel', 'export'] },
  { resource: 'purchase.request',        group: 'B', actions: ['read', 'create', 'update', 'delete', 'approve', 'reject', 'close'] },
  { resource: 'inventory.stock_receipt', group: 'B', actions: ['read', 'create', 'update', 'delete', 'confirm', 'cancel', 'export'] },
  { resource: 'inventory.stock_issue',   group: 'B', actions: ['read', 'create', 'update', 'delete', 'confirm', 'cancel', 'export'] },
  { resource: 'inventory.stock_transfer',group: 'B', actions: ['read', 'create', 'update', 'delete', 'confirm', 'cancel', 'export'] },
  { resource: 'inventory.stock_audit',   group: 'B', actions: ['read', 'create', 'update', 'confirm', 'export'] },
  { resource: 'inventory.balance',       group: 'B', actions: ['read', 'export'] },
  { resource: 'finance.receipt',         group: 'B', actions: ['read', 'create', 'update', 'delete', 'confirm', 'cancel', 'export'] },
  { resource: 'finance.payment',         group: 'B', actions: ['read', 'create', 'update', 'delete', 'confirm', 'cancel', 'export'] },
  { resource: 'finance.ar',              group: 'B', actions: ['read', 'update', 'export', 'confirm'] },
  { resource: 'finance.ap',              group: 'B', actions: ['read', 'update', 'export', 'confirm'] },
  { resource: 'accounting.voucher',      group: 'B', actions: ['read', 'create', 'update', 'delete', 'approve', 'reject', 'close', 'export'] },
  { resource: 'accounting.invoice',      group: 'B', actions: ['read', 'create', 'update', 'delete', 'approve', 'cancel', 'export'] },
] as const;

// ────────────────────────────────────────────────────────────
// Group C: BÁO CÁO — Reports (11 resources)
// ────────────────────────────────────────────────────────────
const GROUP_C: readonly PermissionCatalogEntry[] = [
  { resource: 'report.dashboard_executive', group: 'C', actions: ['read', 'export'] },
  { resource: 'report.design',              group: 'C', actions: ['read', 'export'] },
  { resource: 'report.bom',                 group: 'C', actions: ['read', 'export'] },
  { resource: 'report.quote',               group: 'C', actions: ['read', 'export'] },
  { resource: 'report.sales',               group: 'C', actions: ['read', 'export'] },
  { resource: 'report.purchase',            group: 'C', actions: ['read', 'export'] },
  { resource: 'report.inventory',           group: 'C', actions: ['read', 'export'] },
  { resource: 'report.debt',                group: 'C', actions: ['read', 'export'] },
  { resource: 'report.cashflow',            group: 'C', actions: ['read', 'export'] },
  { resource: 'report.accounting',          group: 'C', actions: ['read', 'export'] },
  { resource: 'report.performance',         group: 'C', actions: ['read', 'export'] },
] as const;

// ────────────────────────────────────────────────────────────
// Group D: THIẾT LẬP — Org-level Settings (8 resources)
// ────────────────────────────────────────────────────────────
const GROUP_D: readonly PermissionCatalogEntry[] = [
  { resource: 'setting.user',           group: 'D', actions: ['read', 'create', 'update', 'delete', 'assign', 'manage'] },
  { resource: 'setting.role',           group: 'D', actions: ['read', 'create', 'update', 'delete', 'assign', 'manage'] },
  { resource: 'setting.permission',     group: 'D', actions: ['read', 'update', 'manage'] },
  { resource: 'setting.org',            group: 'D', actions: ['read', 'update', 'manage'] },
  { resource: 'setting.branch',         group: 'D', actions: ['read', 'create', 'update', 'delete', 'manage'] },
  { resource: 'setting.system',         group: 'D', actions: ['read', 'update', 'manage'] },
  { resource: 'setting.print_template', group: 'D', actions: ['read', 'create', 'update', 'delete', 'manage'] },
  { resource: 'setting.audit_log',      group: 'D', actions: ['read', 'export'] },
] as const;

// ────────────────────────────────────────────────────────────
// Group E: PLATFORM — Internal Administration (16 resources)
// Route: /admin — ALUBOK internal only
// ────────────────────────────────────────────────────────────
const GROUP_E: readonly PermissionCatalogEntry[] = [
  { resource: 'platform.tenant',        group: 'E', actions: ['read', 'create', 'update', 'delete', 'manage'] },
  { resource: 'platform.user',          group: 'E', actions: ['read', 'update', 'delete', 'manage'] },
  { resource: 'platform.subscription',  group: 'E', actions: ['read', 'create', 'update', 'manage'] },
  { resource: 'platform.entitlement',   group: 'E', actions: ['read', 'create', 'update', 'delete', 'manage'] },
  { resource: 'platform.internal_role', group: 'E', actions: ['read', 'create', 'update', 'delete', 'assign', 'manage'] },
  { resource: 'platform.security',      group: 'E', actions: ['read', 'export', 'manage'] },
  { resource: 'platform.support',       group: 'E', actions: ['read', 'update', 'manage'] },
  { resource: 'platform.health',        group: 'E', actions: ['read', 'manage'] },
  { resource: 'platform.job',           group: 'E', actions: ['read', 'create', 'update', 'delete', 'manage'] },
  { resource: 'platform.storage',       group: 'E', actions: ['read', 'update', 'manage'] },
  { resource: 'platform.backup',        group: 'E', actions: ['read', 'create', 'restore', 'manage'] },
  { resource: 'platform.integration',   group: 'E', actions: ['read', 'create', 'update', 'delete', 'manage'] },
  { resource: 'platform.notification',  group: 'E', actions: ['read', 'create', 'update', 'delete', 'manage'] },
  { resource: 'platform.analytics',     group: 'E', actions: ['read', 'export'] },
  { resource: 'platform.release',       group: 'E', actions: ['read', 'create', 'update', 'manage'] },
  { resource: 'platform.config',        group: 'E', actions: ['read', 'update', 'manage'] },
] as const;

// ────────────────────────────────────────────────────────────
// Full Catalog
// ────────────────────────────────────────────────────────────

/** Complete permission catalog: 67 resources across 5 groups */
export const PERMISSION_CATALOG: readonly PermissionCatalogEntry[] = [
  ...GROUP_A,
  ...GROUP_B,
  ...GROUP_C,
  ...GROUP_D,
  ...GROUP_E,
] as const;

/** Group constants for filtering */
export const PERMISSION_GROUPS = {
  A: GROUP_A,
  B: GROUP_B,
  C: GROUP_C,
  D: GROUP_D,
  E: GROUP_E,
} as const;

/** Total resource count per group */
export const GROUP_COUNTS = {
  A: GROUP_A.length,   // 12
  B: GROUP_B.length,   // 20
  C: GROUP_C.length,   // 11
  D: GROUP_D.length,   // 8
  E: GROUP_E.length,   // 16
  total: GROUP_A.length + GROUP_B.length + GROUP_C.length + GROUP_D.length + GROUP_E.length, // 67
} as const;
