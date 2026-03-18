// ============================================================
// BookTongQuan — Types
// Dashboard KPI, Alert, Flow, Chart types
// ============================================================

// ── KPI Card ─────────────────────────────────────────────────
export interface KpiCard {
  key: string;
  label: string;
  value: number;
  formattedValue: string;
  subtitle?: string;
  color: string;
  icon: string; // emoji
}

// ── Alert ────────────────────────────────────────────────────
export type AlertLevel = 'danger' | 'warning' | 'info' | 'success';

export interface AlertItem {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  module: string;
  icon: string;
}

export const ALERT_LEVEL_COLORS: Record<AlertLevel, string> = {
  danger: '#f38ba8',
  warning: '#f9e2af',
  info: '#89b4fa',
  success: '#a6e3a1',
};

// ── Order Flow ───────────────────────────────────────────────
export interface FlowStep {
  label: string;
  count: number;
  color: string;
}

// ── Chart Bar ────────────────────────────────────────────────
export interface ChartBar {
  label: string;
  value: number;
  color: string;
}

// ── Quick Action ─────────────────────────────────────────────
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  description: string;
  page: number;
  tab?: string;
}
