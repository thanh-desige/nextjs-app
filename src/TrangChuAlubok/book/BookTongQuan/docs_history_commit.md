# 📋 BookTongQuan/ — Lịch sử hoàn thành

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Module: BookTongQuan/ — Dashboard tổng hợp

---

## ✅ Phase D1 — Dashboard tổng hợp (19/03/2026)

### D1.0: Types + Helpers
- `tongQuan.types.ts` — KpiCard, AlertItem (4 levels), FlowStep, ChartBar, QuickAction
- `dashboardHelpers.ts` — formatCurrency (tỷ/tr/K), formatPercent, sumField, countByStatus, countOverdue, calcProductionProgress, getMaxBarValue

### D1.1: useDashboardData hook
- Aggregates data từ 6 module stores: BanHang, MuaHang, TonKho, ThuChi, KeToan, SanXuatThiCong
- Computed: 6 KPIs, 6 chart bars, 6 flow steps, 5 alert types
- useMemo for performance

### D1.2: KPI Cards
- 6 cards (3×2 grid): Doanh thu, Phải thu, Phải trả, Tồn kho, Sản xuất (%), Chờ duyệt
- Color-coded borders, icon backgrounds, subtitle text

### D1.3: Revenue Chart + Order Flow
- RevenueChart: CSS horizontal bar chart, 6 bars (Doanh thu, Mua hàng, Thu tiền, Chi tiền, Kế toán, Tồn kho)
- OrderFlowWidget: Pipeline 6 bước (Báo giá → Đơn hàng → Sản xuất → Lắp đặt → Nghiệm thu → Thu tiền)

### D1.4: Alerts + Quick Access
- AlertsWidget: 5 loại alert (overdue AR, material shortage, pending approvals, draft invoices, active projects)
- QuickAccess: 8 quick action buttons (4×2 grid) navigating to specific module/tab

### D1.5: BookTongQuanPage layout
- Main layout: header + 3 rows (KPIs, Chart+Flow, Alerts+QuickAccess)
- Scrollable, dark theme (#1e1e2e)
- Passes onNavigate to QuickAccess for cross-module navigation

### D1.6: Integration
- Updated App.tsx: import from `BookTongQuan/src/ui/BookTongQuanPage`
- Added page 1 to overflow hidden list
- Passes navigateToPage + navigateToTab as onNavigate prop

### D1.7: Tests — 30/30 pass
- 6 test suites: formatCurrency (6), formatFullCurrency (1), formatPercent (3), sumField (3), countByStatus (1), countOverdue (3), calcProductionProgress (4), getMaxBarValue (3), ALERT_LEVEL_COLORS (6)
- Total: 1273/1273 tests, 41 suites
