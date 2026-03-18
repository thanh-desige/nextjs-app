// ============================================================
// BookTongQuan — Dashboard Helpers
// Pure functions for formatting and computing dashboard metrics
// ============================================================

/**
 * Format a VND amount to shortened form
 * e.g. 1_500_000_000 → "1.5 tỷ", 52_300_000 → "52 tr"
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(0)} tr`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return amount.toLocaleString('vi-VN');
}

/**
 * Format a VND amount with full detail
 * e.g. 52_300_000 → "52,300,000"
 */
export function formatFullCurrency(amount: number): string {
  return amount.toLocaleString('vi-VN');
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Sum a numeric field from an array of objects
 */
export function sumField<T>(items: T[], field: keyof T): number {
  return items.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
}

/**
 * Count items matching a specific status value
 */
export function countByStatus<T>(items: T[], field: keyof T, status: string): number {
  return items.filter(item => item[field] === status).length;
}

/**
 * Count overdue items (dueDate < today and still has remaining amount)
 */
export function countOverdue(items: Array<{ dueDate: string; remainingAmount: number }>): number {
  const today = new Date().toISOString().slice(0, 10);
  return items.filter(i => i.dueDate < today && i.remainingAmount > 0).length;
}

/**
 * Calculate production progress percentage from PO items
 * completedQty and quantity are on individual items within each PO
 */
export function calcProductionProgress(
  orders: Array<{ items: Array<{ quantity: number; completedQty: number }> }>
): number {
  let totalQty = 0;
  let completedQty = 0;
  for (const po of orders) {
    for (const item of po.items) {
      totalQty += item.quantity;
      completedQty += item.completedQty;
    }
  }
  return totalQty > 0 ? (completedQty / totalQty) * 100 : 0;
}

/**
 * Get the max value from chart bar data for scaling
 */
export function getMaxBarValue(bars: Array<{ value: number }>): number {
  return Math.max(...bars.map(b => b.value), 1);
}
