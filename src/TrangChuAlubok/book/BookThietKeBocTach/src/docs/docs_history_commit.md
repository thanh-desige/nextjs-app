# 📋 CONVERSATION LOG — BookThietKeBocTach (CAD Module)

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Tests hiện tại: **1500 pass (48 mới DXF Import), 52 suites**

---

## Session — PHASE NEXT: DXF Import

### DXF Import — Full Implementation

- **ImportDXF.ts** (~740 dòng): DXF parser hoàn chỉnh
  - `tokenizeDXF()`: DXF text → DXFPair[] (code/value pairs)
  - `splitSections()`: pairs → DXFSection[] (HEADER, TABLES, ENTITIES)
  - `parseLayers()`: TABLES section → DXFLayerInfo[] (name, color, frozen, locked, visible)
  - `aciToHex()`: ACI color index → hex string (reverse of rgbToAciColor)
  - `dxfLinetypeToStrokeStyle()`: DASHED→dashed, DOT→dotted, DASHDOT→dashdot
  - Entity converters: LINE, CIRCLE, ARC, ELLIPSE, LWPOLYLINE (auto-detect RECT), TEXT, MTEXT
  - `importFromDXF(content, options?)`: Main entry → DXFImportResult
  - `scaleEntity()`: Scale geometry cho tất cả entity types
- **ImportDXFDialog.tsx** (~230 dòng): File picker UI + preview stats + import action
  - Drag & drop zone, file stats grid (entity count, by-type, layers, skipped)
  - `doc.addEntities()` + `doc.layers.createLayer()` + `setDocumentVersion()` cho re-render
- **importDXF.test.ts** (~450 dòng): 48 tests, 15 describe blocks
  - tokenizeDXF(4), splitSections(2), parseLayers(4), aciToHex(2), LINE(4), CIRCLE(2), ARC(2), ELLIPSE(2), LWPOLYLINE(4), TEXT(3), MTEXT(2), Layer mapping(3), Scale(3), Stats(6), Linetype(4), Roundtrip(1)
- **Wired into BookThietKeBocTachPage.tsx**: Thay placeholder dialog → ImportDXFDialog component
- **Full suite**: 52 suites, 1500 tests — tất cả pass

---

## Session — 20/03/2026

### Quy trình Dự án — Phase 1 (UI + Data)

- **Tài liệu quy trình**: Tạo `QUY_TRINH_DU_AN.md` — 10 mục quy trình nghiệp vụ, rule ưu tiên, revision tracking, cascade invalidation
- **Roadmap**: Tạo `ROADMAP_QUY_TRINH.md` — 8 phases triển khai chi tiết
- **ProjectInfo mở rộng**: Thêm fields `designRevision`, `bomRevision`, `bomDesignRevision`, `quoteId/Code`, `contractId/Code`, `receiptId/Code`, `productionOrderId/Code`, `isLocked`, `soLuongBo`, `quoteDesignRevision`
- **projectStatus type**: Đổi từ `draft|designing|quoted|done|locked` → `draft|designing|quoted|contracted|deposited|in_production`
- **computeProjectStatus()**: Hàm tự tính trạng thái từ dữ liệu thật, 7 bước ưu tiên, revision validation, sub-rule BOM sync
- **Sidebar "Quy trình"**: Đổi "Lọc dự án" → "Quy trình" với 8 mục (Tất cả + 7 bước + Đã khóa)
- **Bỏ StatusDropdown**: Cột Hiện trạng = badge chỉ đọc (pill có màu theo trạng thái)
- **Cột "Số lượng" (SL)**: Hiển thị `soLuongBo` — tổng bộ cửa trên canvas
- **Cột "Liên kết"**: Thay cột "..." — hiển thị mã chứng từ (BG/HD/PT/LSX) hoặc "Tạo báo giá" / "Cập nhật báo giá"
- **Cột "🔒" (Khóa)**: Icon ổ khóa toggle, chỉ hiện khi đã có LSX
- **15 unit tests**: Cover tất cả 7 trạng thái + revision mismatch + cascade invalidation + isLocked tách biệt

### Quy trình Dự án — Phase 2 (Auto-compute)

- **calculateBom() revision sync**: Sau mỗi lần tính BOM → `bomRevision++`, `bomDesignRevision = designRevision`, `soLuongBo = doors.length`
- **useProjectSync hook**: Tự sync `doorCount → soLuongBo` (từ doorStore) + `documentVersion → designRevision++` (từ engineStore)
- **Hook mount**: `useProjectSync()` gọi trong `BookThietKeBocTachPage.tsx` sau `useSelection()`
- **Barrel export**: Thêm `useProjectSync` vào `hooks/index.ts`
- **15 unit tests Phase 2**: BOM sync detection, cascade invalidation, bomRevision tracking, soLuongBo transitions
- **Full suite**: 45 suites, 1366 tests — tất cả pass

### Quy trình Dự án — Phase 3 (Liên kết Bán hàng — Báo giá)

- **Quote type mở rộng**: Thêm `projectId?: string`, `designRevision?: number` vào Quote interface (`banHang.types.ts`)
- **createQuoteFromProject service**: Tạo `domain/createQuoteFromProject.ts` — BOM→QuoteItem[] conversion, auto BG-xxxx code generation, calcTotals
- **createQuoteFromProject()**: Đọc BOM → tạo Quote → banHangStore.addQuote + link ngược ProjectInfo (quoteId, quoteCode, quoteDesignRevision)
- **updateQuoteFromProject()**: Re-import BOM → update Quote → reset draft + update revision
- **ActionCell onClick**: 3 handlers: onCreateQuote, onUpdateQuote, onViewQuote — separate click per actionType
- **Navigation wiring**: `onNavigateToBanHang` prop chain: BookThietKeBocTachModule → ProjectListView, navigate to BanHang module with quoteId
- **13 unit tests Phase 3**: nextQuoteCode, bomToQuoteItems, full create/update flow, totals calculation, error cases
- **Full suite**: 46 suites, 1379 tests — tất cả pass

### Quy trình Dự án — Phase 4 (Liên kết Hợp đồng)

- **Contract types**: Thêm Contract interface + ContractStatus (draft|signed|completed|cancelled) vào `banHang.types.ts`
- **BanHangTab mở rộng**: Thêm 'contracts' tab, routeConfig cập nhật
- **banHangStore contract CRUD**: contracts[], addContract, updateContract, deleteContract
- **createContractFromQuote service**: Tạo `domain/createContractFromQuote.ts` — Quote→Contract conversion, auto HD-xxxx, 30% deposit, liên kết 2 chiều
- **ContractList.tsx**: UI danh sách hợp đồng với search, filter, status badge, summary
- **computeProjectStatus update**: 'quoted' actionType đổi từ view_quote → create_contract ("Tạo hợp đồng")
- **ActionCell wiring**: Thêm onCreateContract, onViewContract handlers, xử lý create_contract + view_contract
- **13 unit tests Phase 4**: nextContractCode, items copy, totals, deposit, linking, status transition, error cases
- **Full suite**: 47 suites, 1392 tests — tất cả pass

### Quy trình Dự án — Phase 5 (Liên kết Thu chi — Phiếu thu)

- **CashReceipt type mở rộng**: Thêm `projectId`, `contractId`, `contractCode` vào CashReceipt interface (`thuChi.types.ts`)
- **createReceiptFromContract service**: Tạo `domain/createReceiptFromContract.ts` — Contract→CashReceipt, auto PT-xxxx, amount = depositAmount (30%), status = confirmed
- **Liên kết 2 chiều**: Receipt có projectId/contractId/contractCode, ProjectInfo nhận receiptId/receiptCode
- **computeProjectStatus update**: Thêm 'create_receipt' vào actionType, 'contracted' → actionType = 'create_receipt' ("Tạo phiếu thu")
- **ActionCell wiring**: Thêm onCreateReceipt, onViewReceipt handlers, split view_receipt riêng với onClick callback
- **ProjectListView**: Props mới `onNavigateToThuChi`, handleCreateReceipt + handleViewReceipt callbacks
- **12 unit tests Phase 5**: nextReceiptCode, amount = deposit, linking, customer info, status confirmed, description, error cases, computeProjectStatus integration
- **Full suite**: 48 suites, 1404 tests — tất cả pass

### Quy trình Dự án — Phase 6 (Liên kết Sản xuất — Lệnh SX)

- **createProductionOrderFromReceipt service**: Tạo `domain/createProductionOrderFromReceipt.ts` — BOM→ProductionOrderItem[], auto LSX-xxxx, status=new, liên kết 2 chiều
- **computeProjectStatus update**: Thêm 'create_production_order' vào actionType, 'deposited' → actionType = 'create_production_order' ("Tạo lệnh SX")
- **ActionCell wiring**: Thêm onCreateProductionOrder, onViewProductionOrder handlers, view_production_order có onClick callback
- **ProjectListView**: Props mới `onNavigateToSanXuat`, handleCreateProductionOrder + handleViewProductionOrder callbacks
- **10 unit tests Phase 6**: LSX-xxxx code, BOM→items, completedQty=0, linking, status transition, error case
- **Full suite**: 49 suites, 1414 tests — tất cả pass

### Quy trình Dự án — Phase 7 (Khóa/Mở khóa Canvas)

- **engineStore lock guard**: `executeCommandObject()` kiểm tra `isLocked` trước khi execute — nuclear safety net chặn MỌI mutation
- **undo/redo lock guard**: `undo()` và `redo()` cũng kiểm tra `isLocked` — không cho phép undo/redo khi khóa
- **Lock banner overlay**: Khi `projectInfo.isLocked=true`, hiển thị banner "🔒 Dự án đã khóa — Chế độ xem" trên canvas (absolute, z-16, pointerEvents: none)
- **useToolbar lock gate**: Thêm `isLocked` param, `VIEW_SAFE_TOOLS` whitelist (select, pan, zoom, export, share, osnap). Mutating tools bị chặn khi locked
- **useKeyboardShortcuts lock gate**: Thêm `isLocked` param. Cho phép Ctrl+C (copy), Ctrl+A (select all), ESC. Chặn Ctrl+V, Delete, command buffer khi locked
- **BookThietKeBocTachPage wiring**: Truyền `isLocked: projectInfo?.isLocked` xuống useToolbar + useKeyboardShortcuts
- **23 unit tests Phase 7**: computeProjectStatus in_production, ProjectStore isLocked toggle, VIEW_SAFE_TOOLS whitelist (12 tools), handleSelectTool lock gate, keyboard lock gate (7 shortcuts), full lock/unlock cycle
- **Full suite**: 50 suites, 1437 tests — tất cả pass

### Quy trình Dự án — Phase 8 (Revision tracking + Invalidation cascade)

- **staleDocuments field**: Thêm `staleDocuments: StaleDocumentType[]` vào `StatusResult` — liệt kê chứng từ mất hiệu lực (quote, contract, receipt, production_order)
- **computeProjectStatus update**: Thu thập tất cả stale docs dùng `hasStaleDocument()` → trả về trong mọi StatusResult
- **StaleBadge component**: Hiển "⚠ Phiên bản cũ" badge màu amber với tooltip chi tiết (tên chứng từ Việt hóa)
- **ProjectRow update**: Hiển StaleBadge bên cạnh ActionCell khi có stale documents
- **Auto-increment designRevision**: Đã có từ Phase 2 (useProjectSync hook)
- **Cascade invalidation logic**: Đã có từ Phase 1-2 (computeProjectStatus priority chain + isDocumentValid)
- **15 unit tests Phase 8**: staleDocuments population, full cascade (in_production→designing), re-create flow, partial invalidation, edge cases, label mapping
- **Full suite**: 51 suites, 1452 tests — tất cả pass

---

## Session 1 — 3-4/01/2026

### MOVE/COPY Input + Drag & Drop

- **DynamicInputOverlay cho MOVE/COPY**: Mode `"move-copy"` — 1 unified input, parse 3 format: `300` (distance), `@300,50` (cartesian), `@300<45` (polar)
- **MOVE/COPY Direction fix**: Tính angle từ `mousePos` trực tiếp tại thời điểm parse (giống LINE command), không dùng `moveCopyAngleRef`
- **Drag & Drop cửa**: Delay `setIsDragging(true)` 50ms, chỉ đóng overlay khi click backdrop (không khi drag ends)
- **Wheel handler**: Non-passive listener cho `preventDefault()` trên Chrome/Edge
- **Hydration fix**: `suppressHydrationWarning` trên `<html>` và `<body>`

---

## Session 2 — 07/03/2026

### Phase 5 Export — 5 formats (260 tests)

| Format | File | Tests | Chi tiết |
|--------|------|-------|----------|
| JSON | ExportJSON.ts | 39 | roundtrip, import/export |
| DXF | ExportDXF.ts | 62 | R2000 (AC1015), padding, LAYOUT objects, 9 tables |
| SVG | ExportSVGCore.ts | 63 | IEntity-based, Y-flip viewBox |
| PNG | ExportPNGCore.ts | 49 | ICanvasContext mock, no DOM |
| PDF | ExportPDFCore.ts | 62 | PDF 1.4, pure string, no ext libs |

ExportManager.ts (~222 lines) = thin facade cho 5 formats.

**DXF note**: SketchUp mở OK (dimensions khớp nhờ $MEASUREMENT=1 + $INSUNITS=4). AutoCAD 2013 chưa mở được sau 5 lần rewrite (R2000 handles → R12 → R2000 full compliance + padding) — tạm dừng, chờ debug binary-level hoặc dùng thư viện verified.

### Dọn dẹp .md (22 → 13 files)

- Gộp ALUBOK_ROADMAP.md vào ROADMAP.md (Phase 4/6/7/8 tương lai)
- Viết lại PROJECT_STRUCTURE_ANALYSIS.md từ cây thư mục thực tế
- Viết lại README.md với thông tin dự án Alubok
- Xóa 9 file dư: 4 file cấu trúc cũ + ALUBOK_ROADMAP + ALUBOK_ZERO_RISK_REFACTOR + 3 SESSION_LOGs

---

## Session 3 — 08/03/2026

### Import & Share buttons

- **Import button**: Placeholder dialog trong Header2 Tools
- **Share button**: ShareModal (phạm vi, quyền, loại link) + lz-string compression
- **Share Snapshot URL**: `CadDocument.toJSON()` → lz-string → URL hash → `/share#compressedData`
- **Share page**: Next.js route `/share`, đọc hash → decompress → render 3 tab (Design/BOM/Quote)
- **Fix share bugs**: entity type `unknown` → `getEntityType()` + `normalizeEntityType()`, link thiếu query params → `buildShareUrl()` thêm `?tab=&perm=&type=`

### Tổ chức 10-module architecture (13 → 25 .md files)

- Thiết kế 10 module: shared, DanhMuc, BookTongQuan, BookThietKeBocTach, BookBanHang, BookMuaHang, BookTonKho, BookThuChi, BookKeToan, ThietLap
- Tạo 8 folder mới + ROADMAP.md riêng cho mỗi module
- Tạo BOOK_STRUCTURE.md (tổng quan + mapping catalog A/B/C/D)
- Di chuyển root ROADMAP.md → BookThietKeBocTach/ROADMAP.md
- Di chuyển KEYBOARD_SHORTCUTS.md → BookThietKeBocTach/
- Rà soát xung đột với PERMISSION_CATALOG.md → tạo fix roadmap F1-F6 trong shared/ROADMAP.md
- Cập nhật README.md (10 modules, 6 roles, 875 tests)
- Cập nhật PROJECT_STRUCTURE_ANALYSIS.md
- Cập nhật copilot-instructions.md
- Sửa 3 chỗ sai: ROADMAP Phase 6.1 schema (7 bảng RBAC), Phase 6.2 roles (6 roles), alubok-motahethong (superseded note)
- Bổ sung 3 chỗ thiếu: PROJECT_STRUCTURE sidebar "8 mục", alubok-motahethong thêm Kế Toán + Thiết Lập

## Session 4 — Tab restructuring

### Cấu trúc tab mới cho BookThietKeBocTach

- **routeConfig.ts**: Page 4 thêm 3 tabs: `projects` (Dự án), `bom` (BOM), `cutlist` (Danh sách cắt)
- **ProjectListView.tsx**: Tab Dự án — danh sách project cards, CRUD, search, filter theo status, click vào project → mở Canvas CAD
- **BomView.tsx**: Tab BOM — wrap BomPanel, hiện BOM từ projectStore, nút "Tạo báo giá →" chuyển sang BookBanHang
- **CutListView.tsx**: Tab Danh sách cắt — tối ưu cắt nhôm (FFD bin packing), visualization bar, bảng chi tiết cắt
- **BookThietKeBocTachModule.tsx**: Wrapper quản lý 3 tab + Canvas sub-route (mở từ Dự án, có nút "← Quay lại dự án")
- **App.tsx**: Thay `<BookThietKeBocTach>` bằng `<BookThietKeBocTachModule>` với `activeTab`/`onTabChange`
- Canvas CAD = sub-route (không phải tab), Thư viện = sidebar panel trong Canvas
- Loại bỏ tab "Báo giá" khỏi ThietKeBocTach (thuộc BookBanHang)
- **Tests**: 1336/1336 pass, 43 suites — không ảnh hưởng

### Chuyển thông tin dự án từ Canvas ra tab Dự án

- **ProjectListView.tsx**: Mở rộng form tạo/chỉnh sửa dự án đầy đủ (tên, loại công trình, chủ đầu tư, SĐT, email, địa chỉ chi tiết, thời gian, ghi chú)
- Click project card → mở chi tiết + chỉnh sửa (không vào thẳng Canvas). Có nút "Mở thiết kế →"
- **Diện tích**: Read-only, tự động tính từ bản vẽ CAD (không cho user tự nhập)
- **ProjectInfoDropdown.tsx**: Trường diện tích chuyển thành read-only, hiển thị giá trị từ store
- **projectStore.ts**: Thêm action `calculateArea()` — placeholder, sẽ tích hợp CadDocument entities
- **Tests**: 1336/1336 pass, 43 suites

### Real BOM + Area calculation from doorStore

- **projectStore.ts — `calculateBom`**: Thay placeholder bằng logic thực:
  - Đọc doors từ `useDoorStore.getState().getAllDoors()`
  - Mỗi cửa sinh 4 BomItem: thanh ngang (2×width), thanh dọc (2×height), kính (panel count × area), phụ kiện
  - Aluminum items: `length` field cho cut optimization (mm)
  - Glass items: `length` + `height` cho mỗi tấm
  - Tự gọi `calculateArea()` sau khi tính BOM
- **projectStore.ts — `calculateArea`**: Tính tổng diện tích cửa = Σ(width × height) / 1.000.000 → m²
- **BomItem interface**: Thêm `length?: number` (mm) và `height?: number` (mm) cho cut optimization
- **CutListView.tsx**: Đọc `item.length` và `item.height` từ BomItem thay vì hardcoded `0`
- **BomView.tsx**: Hoạt động — nhấn "Tính lại BOM" → hiện entries từ projectStore
- **Flow**: Đặt cửa → BOM tab → "Tính lại BOM" → BomView + CutListView hiện data thực
- **Tests**: 1336/1336 pass, 43 suites

### Redesign tab Dự án — Sidebar + Table layout

- **routeConfig.ts**: Xóa tab BOM + Danh sách cắt khỏi page 4 (sẽ ở trong Canvas sau)
- **BookThietKeBocTachModule.tsx**: Không còn ModuleTabBar, chỉ render ProjectListView trực tiếp. Bỏ import BomView, CutListView
- **ProjectInfo** thêm 3 field: `projectCode` (DA 1, DA 2...), `employee`, `projectStatus` (designing|quoted|done|locked)
- **createProject**: Auto-generate `projectCode` theo thứ tự (đếm max từ recentProjects)
- **ProjectListView.tsx** rewrite hoàn toàn:
  - **Sidebar trái** (180px): 6 filter: Tất cả / Nháp / Đang thiết kế / Đã xuất báo giá / Đã hoàn thành / Đã khóa — có counter
  - **Bảng dạng table** 10 cột: Ngày tạo / Ngày sửa / Nhân viên / Mã DA / Tên dự án / Thiết kế (link) / BOM (link) / DS cắt (link) / Chức năng (dropdown) / Xóa
  - Click tên → mở form chi tiết. Click link Thiết kế/BOM/DS cắt → mở Canvas
  - **StatusDropdown**: Select inline thay đổi `projectStatus`, styled theo màu trạng thái
  - Sticky header, search bar, counter, nút "+ Tạo dự án mới"
  - Bỏ hoàn toàn card grid cũ
- **Tests**: 1336/1336 pass, 43 suites

### Wire up Canvas tab switching + BOM integration

- **BookThietKeBocTachPage.tsx**: Thêm `activeCanvasTab` state (thietke|filebom|filebaogia), wire `onTabChange` trong Header1
  - Tab "Thiết kế": hiển thị Toolbar + Canvas + Sidebars + Header3
  - Tab "Bóc tách (BOM)": render BomView thay canvas
  - Tab "Báo giá": placeholder
  - Import BomView, `calculateBom` từ projectStore
  - Thêm `initialTab` prop nhận từ Module
  - **Nút "📊 Xuất BOM →"**: floating button ở design view, click → calculateBom() + switch to filebom tab
- **BookThietKeBocTachModule.tsx**: Thêm `canvasInitialTab` state, forward qua prop `initialTab` đến BookThietKeBocTachPage
- **ProjectListView.tsx**: 3 link "Mở" phân biệt tab: Thiết kế → 'thietke', BOM → 'filebom', DS cắt → 'filebom'
  - `onOpenCanvas(projectId, initialTab)` nhận thêm param tab
  - ProjectRow: tách `onOpenDesign`, `onOpenBom`, `onOpenCutList` thay vì chung `onOpenCanvas`
- **Tests**: 1336/1336 pass, 43 suites

### Hoàn thiện tab Danh sách cắt trong Canvas

- **Header1.tsx**: Đổi label tab thứ 3 từ "Báo giá" → "Danh sách cắt"
- **BookThietKeBocTachPage.tsx**: Import CutListView, render thay placeholder khi `activeCanvasTab === 'filebaogia'`
- 3 tab Canvas đã hoàn thiện: Thiết kế (CAD) | Bóc tách BOM (BomView) | Danh sách cắt (CutListView)
- **Tests**: 1336/1336 pass, 43 suites
