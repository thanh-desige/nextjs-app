# BookSanXuatThiCong — Lịch sử commit

---

## 18/03/2026 — Phase SX: Sản xuất & Thi công MVP

### Tạo mới module BookSanXuatThiCong hoàn chỉnh

**Types (SX.0)**:
- `sanXuatThiCong.types.ts`: 7 status types (ProjectStatus, ProductionOrderStatus, MaterialPlanStatus, MaterialIssueStatus, InstallationStatus, AcceptanceStatus), priority labels/colors
- Interfaces: Project, ProductionOrder, ProductionOrderItem, MaterialPlanItem, MaterialPlan, MaterialIssueItem, MaterialIssue, InstallationJob, AcceptanceRecord
- Helpers: `countByPOStatus()`, `calcShortage()`, `hasOverdueOrders()`
- SanXuatSection type (7 sections), SXViewMode type

**Store (SX.1)**:
- `sanXuatThiCongStore.ts`: Zustand + persist, key `alubok-san-xuat-thi-cong`
- Seed data: 3 projects, 3 production orders, 2 material plans, 2 material issues, 2 installations, 1 acceptance
- Full CRUD cho 6 entity types + resetAll()

**UI (SX.2-SX.9)**:
- `SubSidebar.tsx`: Sidebar cấp 2 dọc, 210px, 7 sections với emoji icons (pattern mới, không dùng ModuleTabBar)
- `BookSanXuatThiCongPage.tsx`: Layout chính (SubSidebar + content area), view state management
- `ProgressOverview.tsx`: 4 stat cards, alerts (overdue + shortage), projects table, recent PO + installations
- `ProductionOrderList.tsx`: Search, status filter, 7-column table, progress bar
- `ProductionOrderForm.tsx`: Project selector, priority, dates, assignee, dynamic items table
- `ProductionOrderDetail.tsx`: Info grid, items with completed/defect tracking, QC info, workflow buttons
- `MaterialPlanPage.tsx`: Accordion cards per plan, BOM items with shortage tracking
- `MaterialIssuePage.tsx`: Table with approve/issue workflow
- `InstallationList.tsx`: 7-column table with search and status filter
- `InstallationForm.tsx`: Project selector (auto-fill address), team fields, dates
- `InstallationDetail.tsx`: Info grid, issues list, check-in/out/complete/pause/resume workflow
- `AcceptanceList.tsx`: Table với type (từng phần/toàn bộ), status badges
- `AcceptanceForm.tsx`: Project selector, type, inspector, volume description, defects list, warranty
- `AcceptanceDetail.tsx`: Info grid, defects list, warranty info, approve/reject/conditional workflow
- `ProductionReport.tsx`: 6 stat cards, PO status distribution, project progress table, material shortage + waste

**Integration (SX.10)**:
- `index.ts`: Barrel export
- `routeConfig.ts`: Added page 10, slug 'san-xuat' (no tabs — uses SubSidebar internally)
- `App.tsx`: Import + render BookSanXuatThiCongPage (no tab props)
- `Sidebar.tsx`: Added IconSanXuat SVG + menu item id 10

**Tests (SX.11)**:
- `sanXuatThiCongTypes.test.ts`: 27 tests — status labels, colors, priority, countByPOStatus, calcShortage, hasOverdueOrders
- `sanXuatThiCongStore.test.ts`: 27 tests — initial state (seed data), CRUD for all 6 entities, resetAll

**Totals**: 19 source files + 2 test files = 21 files, 54 tests pass
**Project total**: 1243 tests, 40 suites
