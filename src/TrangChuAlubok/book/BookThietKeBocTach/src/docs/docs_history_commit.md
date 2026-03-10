# 📋 CONVERSATION LOG — BookThietKeBocTach (CAD Module)

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Tests hiện tại: **875/875 pass, 19 suites, ~7s**

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
