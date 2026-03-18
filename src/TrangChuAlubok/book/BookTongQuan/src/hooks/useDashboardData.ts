'use client';
// ============================================================
// useDashboardData — Aggregates data from all module stores
// Returns computed KPIs, chart data, alerts, flow steps
// Supports optional TimeRange filtering via resolvePreset
// ============================================================

import { useMemo } from 'react';
import { useBanHangStore } from '../../../BookBanHang/src/store/banHangStore';
import { useMuaHangStore } from '../../../BookMuaHang/src/store/muaHangStore';
import { useTonKhoStore } from '../../../BookTonKho/src/store/tonKhoStore';
import { useThuChiStore } from '../../../BookThuChi/src/store/thuChiStore';
import { useKeToanStore } from '../../../BookKeToan/src/store/keToanStore';
import { useSanXuatThiCongStore } from '../../../BookSanXuatThiCong/src/store/sanXuatThiCongStore';
import {
  formatCurrency,
  formatPercent,
  sumField,
  countByStatus,
  countOverdue,
  calcProductionProgress,
} from '../helpers/dashboardHelpers';
import type { KpiCard, AlertItem, FlowStep, ChartBar } from '../types';
import type { TimeRange } from '../../../shared/src/types/time.types';
import { filterByTimeRange } from '../../../shared/src/services/timeService';

export interface DashboardData {
  kpis: KpiCard[];
  chartBars: ChartBar[];
  flowSteps: FlowStep[];
  alerts: AlertItem[];
}

export function useDashboardData(timeRange?: TimeRange): DashboardData {
  // ── Pull data from all stores ──────────────────────────────
  const { quotes, orders: salesOrders } = useBanHangStore();
  const { requests: purchaseRequests, orders: purchaseOrders } = useMuaHangStore();
  const { receipts: stockReceipts, issues: stockIssues } = useTonKhoStore();
  const { receipts: cashReceipts, payments: cashPayments, receivables, payables } = useThuChiStore();
  const { vouchers, invoices } = useKeToanStore();
  const { projects, productionOrders, materialPlans, installations, acceptances } = useSanXuatThiCongStore();

  return useMemo(() => {
    // ── Apply time range filter if provided ─────────────────────
    const fQuotes = timeRange ? filterByTimeRange(quotes, 'createdAt', timeRange) : quotes;
    const fSalesOrders = timeRange ? filterByTimeRange(salesOrders, 'createdAt', timeRange) : salesOrders;
    const fPurchaseRequests = timeRange ? filterByTimeRange(purchaseRequests, 'createdAt', timeRange) : purchaseRequests;
    const fPurchaseOrders = timeRange ? filterByTimeRange(purchaseOrders, 'createdAt', timeRange) : purchaseOrders;
    const fStockReceipts = timeRange ? filterByTimeRange(stockReceipts, 'createdAt', timeRange) : stockReceipts;
    const fStockIssues = timeRange ? filterByTimeRange(stockIssues, 'createdAt', timeRange) : stockIssues;
    const fCashReceipts = timeRange ? filterByTimeRange(cashReceipts, 'createdAt', timeRange) : cashReceipts;
    const fCashPayments = timeRange ? filterByTimeRange(cashPayments, 'createdAt', timeRange) : cashPayments;
    const fVouchers = timeRange ? filterByTimeRange(vouchers, 'createdAt', timeRange) : vouchers;
    const fProjects = timeRange ? filterByTimeRange(projects, 'createdAt', timeRange) : projects;
    const fProductionOrders = timeRange ? filterByTimeRange(productionOrders, 'createdAt', timeRange) : productionOrders;

    // ── KPIs ───────────────────────────────────────────────────
    const totalRevenue = sumField(fSalesOrders, 'totalAmount');
    const totalReceivable = sumField(receivables, 'remainingAmount');
    const totalPayable = sumField(payables, 'remainingAmount');

    const stockInValue = sumField(
      fStockReceipts.filter(r => r.status === 'confirmed'),
      'totalAmount',
    );
    const stockOutValue = sumField(
      fStockIssues.filter(i => i.status === 'confirmed'),
      'totalAmount',
    );
    const inventoryValue = stockInValue - stockOutValue;

    const productionPct = calcProductionProgress(fProductionOrders);

    const pendingQuotes = countByStatus(fQuotes, 'status', 'pending');
    const pendingPR = countByStatus(fPurchaseRequests, 'status', 'pending');
    const pendingCount = pendingQuotes + pendingPR;

    const kpis: KpiCard[] = [
      {
        key: 'revenue',
        label: 'Doanh thu',
        value: totalRevenue,
        formattedValue: formatCurrency(totalRevenue),
        subtitle: `${fSalesOrders.length} đơn hàng`,
        color: '#a6e3a1',
        icon: '💰',
      },
      {
        key: 'receivable',
        label: 'Phải thu',
        value: totalReceivable,
        formattedValue: formatCurrency(totalReceivable),
        subtitle: `${receivables.length} khách hàng`,
        color: '#89b4fa',
        icon: '📈',
      },
      {
        key: 'payable',
        label: 'Phải trả',
        value: totalPayable,
        formattedValue: formatCurrency(totalPayable),
        subtitle: `${payables.length} nhà cung cấp`,
        color: '#f9e2af',
        icon: '📉',
      },
      {
        key: 'inventory',
        label: 'Tồn kho',
        value: inventoryValue,
        formattedValue: formatCurrency(inventoryValue),
        subtitle: `${fStockReceipts.length} phiếu nhập`,
        color: '#cba6f7',
        icon: '📦',
      },
      {
        key: 'production',
        label: 'Sản xuất',
        value: productionPct,
        formattedValue: formatPercent(productionPct),
        subtitle: `${fProductionOrders.length} lệnh SX`,
        color: '#fab387',
        icon: '🏭',
      },
      {
        key: 'pending',
        label: 'Chờ duyệt',
        value: pendingCount,
        formattedValue: String(pendingCount),
        subtitle: `${pendingQuotes} báo giá, ${pendingPR} YCMH`,
        color: '#f38ba8',
        icon: '📋',
      },
    ];

    // ── Chart bars (module financial overview) ─────────────────
    const totalCashIn = sumField(
      fCashReceipts.filter(r => r.status === 'confirmed'),
      'amount',
    );
    const totalCashOut = sumField(
      fCashPayments.filter(p => p.status === 'confirmed'),
      'amount',
    );
    const totalPurchase = sumField(fPurchaseOrders, 'totalAmount');
    const totalAccounting = sumField(
      fVouchers.filter(v => v.status === 'approved'),
      'totalDebit',
    );

    const chartBars: ChartBar[] = [
      { label: 'Doanh thu', value: totalRevenue, color: '#a6e3a1' },
      { label: 'Mua hàng', value: totalPurchase, color: '#f9e2af' },
      { label: 'Thu tiền', value: totalCashIn, color: '#89b4fa' },
      { label: 'Chi tiền', value: totalCashOut, color: '#f38ba8' },
      { label: 'Kế toán', value: totalAccounting, color: '#cba6f7' },
      { label: 'Tồn kho', value: inventoryValue, color: '#fab387' },
    ];

    // ── Order flow steps ───────────────────────────────────────
    const flowSteps: FlowStep[] = [
      { label: 'Báo giá', count: fQuotes.length, color: '#89b4fa' },
      { label: 'Đơn hàng', count: fSalesOrders.length, color: '#a6e3a1' },
      { label: 'Sản xuất', count: fProductionOrders.length, color: '#fab387' },
      { label: 'Lắp đặt', count: installations.length, color: '#cba6f7' },
      { label: 'Nghiệm thu', count: acceptances.length, color: '#f9e2af' },
      { label: 'Thu tiền', count: fCashReceipts.length, color: '#a6e3a1' },
    ];

    // ── Alerts ─────────────────────────────────────────────────
    const alerts: AlertItem[] = [];
    let alertId = 0;

    // Overdue receivables
    const overdueCount = countOverdue(receivables);
    if (overdueCount > 0) {
      alerts.push({
        id: String(++alertId),
        level: 'danger',
        title: 'Công nợ quá hạn',
        message: `${overdueCount} khách hàng có công nợ quá hạn thanh toán`,
        module: 'ThuChi',
        icon: '🔴',
      });
    }

    // Material shortages
    const shortages = materialPlans.filter(
      mp => mp.items.some((item: { shortageQty: number }) => item.shortageQty > 0),
    );
    if (shortages.length > 0) {
      alerts.push({
        id: String(++alertId),
        level: 'warning',
        title: 'Thiếu vật tư',
        message: `${shortages.length} kế hoạch vật tư có thiếu hụt`,
        module: 'SanXuatThiCong',
        icon: '🟡',
      });
    }

    // Pending approvals
    if (pendingCount > 0) {
      alerts.push({
        id: String(++alertId),
        level: 'info',
        title: 'Chờ phê duyệt',
        message: `${pendingCount} chứng từ đang chờ phê duyệt`,
        module: 'BanHang / MuaHang',
        icon: '🔵',
      });
    }

    // Draft invoices
    const draftInvoices = countByStatus(invoices, 'status', 'draft');
    if (draftInvoices > 0) {
      alerts.push({
        id: String(++alertId),
        level: 'info',
        title: 'Hóa đơn nháp',
        message: `${draftInvoices} hóa đơn chưa phát hành`,
        module: 'KeToan',
        icon: '📄',
      });
    }

    // Active projects
    const activeProjects = fProjects.filter(
      p => p.status === 'in_production' || p.status === 'installing',
    );
    if (activeProjects.length > 0) {
      alerts.push({
        id: String(++alertId),
        level: 'success',
        title: 'Dự án đang triển khai',
        message: `${activeProjects.length} dự án đang trong giai đoạn sản xuất / lắp đặt`,
        module: 'SanXuatThiCong',
        icon: '🟢',
      });
    }

    return { kpis, chartBars, flowSteps, alerts };
  }, [
    quotes, salesOrders, purchaseRequests, purchaseOrders,
    stockReceipts, stockIssues, cashReceipts, cashPayments,
    receivables, payables, vouchers, invoices,
    projects, productionOrders, materialPlans,
    installations, acceptances, timeRange,
  ]);
}
