# 📋 BookMuaHang/ — Lịch sử hoàn thành

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Module: BookMuaHang/ — Đơn mua hàng + Yêu cầu mua (B8-B9)

---

## Phase B2: BookMuaHang/ — Đơn mua hàng + Yêu cầu mua

### B2.0 — Types (muaHang.types.ts)
- PurchaseRequestStatus (6 statuses), PurchaseOrderStatus (5 statuses)
- PurchaseRequest, PurchaseOrder, PurchaseRequestItem, PurchaseOrderItem interfaces
- Status labels/colors, Priority labels/colors
- Helper functions: calcLineAmount, calcTotals, calcRequestTotal

### B2.1 — Store (muaHangStore.ts)
- Zustand + persist (key: alubok-mua-hang)
- Seed: 3 requests (YCMH-0001 approved, YCMH-0002 pending, YCMH-0003 draft) + 1 order (DMH-0001 receiving)
- CRUD: add/update/delete Request + Order + resetAll

### B2.2 — BookMuaHangPage.tsx
- Horizontal ModuleTabBar (4 tabs: Đơn mua hàng, Yêu cầu mua, BC Mua hàng, Shop ALUBOK)
- Internal navigation: orderView/requestView (list/form/detail)
- Shop tab → onOpenShop callback (opens MuaHangPage fullscreen)

### B2.3 — PurchaseRequest UI
- PurchaseRequestList.tsx: Table + search + status filter + tạo yêu cầu
- PurchaseRequestForm.tsx: Create/edit form with line items, priority, recalc
- PurchaseRequestDetail.tsx: View + workflow (Gửi duyệt, Duyệt, Từ chối, Tạo đơn mua)

### B2.4 — PurchaseOrder UI
- PurchaseOrderList.tsx: Table + search + paid/total display
- PurchaseOrderForm.tsx: Create/edit with supplier, items, tax calc, discount
- PurchaseOrderDetail.tsx: View + transitions (new→confirmed→receiving→completed) + receivedQty tracking

### B2.5 — PurchaseReport.tsx
- Summary cards (orders, value, paid%, received%)
- Progress bars (payment, delivery)
- Status breakdowns (order + request) with bar charts
- Supplier breakdown table

### B2.6 — Integration
- Barrel index.ts
- routeConfig.ts: added tabs for page 2 (don-mua-hang, yeu-cau-mua, bc-mua-hang, shop-alubok)
- App.tsx: BookMuaHangPage with activeTab + onTabChange + onOpenShop

### B2.7 — Tests
- muaHangTypes.test.ts: 15 tests (calcLineAmount, calcTotals, calcRequestTotal, label/color completeness)
- muaHangStore.test.ts: 18 tests (seed data, CRUD requests, CRUD orders, resetAll)
- **Total: 33 tests, all pass**
