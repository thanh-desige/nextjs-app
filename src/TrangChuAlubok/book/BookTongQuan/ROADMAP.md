# BookTongQuan/ — ROADMAP

> C1: Dashboard tổng hợp — đọc data từ tất cả module khác
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ✅ Phase D1 hoàn chỉnh

## Ưu tiên: ⭐⭐ Cao

## Phụ thuộc: shared/, tất cả Book modules (đọc data tổng hợp)

---

## Files (10 source + 1 test)

| File | Vai trò |
|------|---------|
| `src/index.ts` | Barrel export |
| `src/types/tongQuan.types.ts` | KpiCard, AlertItem, FlowStep, ChartBar, QuickAction |
| `src/types/index.ts` | Types barrel |
| `src/helpers/dashboardHelpers.ts` | formatCurrency, sumField, countOverdue, calcProductionProgress |
| `src/hooks/useDashboardData.ts` | Aggregates 6 module stores → KPIs, chart, flow, alerts |
| `src/ui/BookTongQuanPage.tsx` | Main layout: header + 3 rows grid |
| `src/ui/KpiCards.tsx` | 6 KPI cards (3×2 grid) |
| `src/ui/RevenueChart.tsx` | CSS horizontal bar chart (financial overview) |
| `src/ui/OrderFlowWidget.tsx` | Pipeline: Báo giá → Đơn hàng → SX → Lắp đặt → Nghiệm thu → Thu tiền |
| `src/ui/AlertsWidget.tsx` | Notifications: overdue, shortage, pending, draft invoices |
| `src/ui/QuickAccess.tsx` | 8 quick action buttons (4×2 grid) |
| `src/tests/dashboardHelpers.test.ts` | 30 tests: helpers + types |

---

## Checklist

- [x] Layout dashboard responsive (scrollable grid)
- [x] KPI widgets (doanh thu, phải thu, phải trả, tồn kho, sản xuất, chờ duyệt)
- [x] Biểu đồ tài chính (CSS bar chart — 6 bars)
- [x] Quy trình đơn hàng (pipeline 6 bước)
- [x] Thông báo / cảnh báo (5 loại alert)
- [x] Truy cập nhanh (8 quick actions)
- [x] Integration: App.tsx import + render
- [x] Tests: 30/30 pass
- [ ] Permission: `report.dashboard_executive:read` (future)
- [ ] Build progressive: thêm widget khi có thêm data

---

## Resources trong Catalog

| Catalog | Resource | Actions |
|---------|----------|---------|
| C1 | `report.dashboard_executive` | read, export |
| C11 | `report.performance` | read, export |

---

## 🔮 FUTURE PHASES

| Phase | Nội dung | Ưu tiên |
|-------|---------|---------|
| D1.1 | Biểu đồ doanh thu theo tháng (cần thời gian tích lũy data) | Trung bình |
| D1.2 | Top sản phẩm / khách hàng (cần BOM data từ CAD) | Trung bình |
| D1.3 | Real-time notifications (WebSocket) | Thấp |
| D1.4 | Export dashboard PDF | Thấp |
| D1.5 | Customizable widget layout (drag & drop) | Thấp |
