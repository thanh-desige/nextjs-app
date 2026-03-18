# 📋 CONVERSATION LOG — BookThietKeBocTach (CAD Module)

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Tests hiện tại: **1336/1336 pass, 43 suites**

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
