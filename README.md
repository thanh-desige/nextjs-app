# ALUBOK — Phần mềm Quản lý & Thiết kế Nhôm Kính

Hệ thống ERP chuyên ngành nhôm kính, tích hợp CAD 2D trên nền web.

## Tổng quan

Alubok gồm **10 module** phục vụ quy trình sản xuất cửa nhôm kính:

| Module | Folder | Chức năng | Trạng thái |
|--------|--------|-----------|----------|
| Thiết Kế Bóc Tách | `BookThietKeBocTach/` | CAD 2D — vẽ, dim, xuất bản vẽ, BOM, báo giá | 🟢 875 tests |
| Mua Hàng | `BookMuaHang/` | Quản lý đơn mua nhôm thanh, kính, inox, phụ kiện | ⚪ Placeholder |
| Bán Hàng | `BookBanHang/` | Báo giá, đơn bán hàng | ⚪ Placeholder |
| Tồn Kho | `BookTonKho/` | Nhập/xuất kho, kiểm kê, tồn | ⚪ Placeholder |
| Thu Chi | `BookThuChi/` | Phiếu thu/chi, công nợ | ⚪ Placeholder |
| Kế Toán | `BookKeToan/` | Chứng từ kế toán, hóa đơn | ⚪ Chưa có |
| Tổng Quan | `BookTongQuan/` | Dashboard tổng hợp | ⚪ Chưa có |
| Danh Mục | `DanhMuc/` | Master data (khách hàng, NCC, vật tư, mẫu cửa...) | ⚪ Chưa có |
| Thiết Lập | `ThietLap/` | Quản trị user, role, permission | ⚪ Chưa có |
| Shared | `shared/` | Types + RBAC guards dùng chung | ⚪ Chưa có |

**Module hoàn thiện nhất**: Thiết Kế Bóc Tách (CAD) — core engine, 8 entity types, 5 export formats, BOM calculator, 875 tests.

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| UI | React 19 + TypeScript 5 + Tailwind CSS 4 |
| State | Zustand 5 |
| Canvas | Fabric.js 6.9 (adapter pattern — sẵn sàng thay thế) |
| Testing | Jest + ts-jest |
| Font | Geist (next/font) |

## Cài đặt & Chạy

```bash
# Cài dependencies
npm install

# Chạy dev server
npm run dev

# Chạy tests
npx jest --no-cache

# Build production
npm run build
```

Mở [http://localhost:3000](http://localhost:3000) → Trang chủ Alubok.
Mở [http://localhost:3000/cad](http://localhost:3000/cad) → CAD Editor.

## Cấu trúc module

```
src/TrangChuAlubok/book/
├── BOOK_STRUCTURE.md         ← Tổng quan 10 module
├── PERMISSION_CATALOG.md     ← Phân quyền (43 resources, ~250 permissions)
│
├── shared/                   ← Types + RBAC guards dùng chung
├── DanhMuc/                  ← Master Data (12 resources)
├── ThietLap/                 ← Quản trị user, role, permission
│
├── BookThietKeBocTach/       ← CAD Engine + BOM + Export (module chính)
├── BookBanHang/              ← Báo giá + Đơn bán hàng
├── BookMuaHang/              ← Đơn mua hàng
├── BookTonKho/               ← Nhập/xuất/chuyển kho
├── BookThuChi/               ← Phiếu thu/chi, công nợ
├── BookKeToan/               ← Chứng từ kế toán
└── BookTongQuan/             ← Dashboard tổng hợp
```

Mỗi module có `ROADMAP.md` riêng bên trong folder.

## Kiến trúc CAD Module

```
BookThietKeBocTach/src/
├── core/          # Logic thuần — engine, entities, commands, geometry, export
├── domain/        # Nghiệp vụ — BOM, door, materials, projects, rules
├── door-engines/  # Engine sinh kỹ thuật cửa (hingedDoor, ...)
├── systems/       # Dữ liệu hệ cửa JSON (PMA, Xingfa)
├── adapters/      # Kết nối core ↔ UI (canvas, input, persistence, preview)
├── hooks/         # React hooks (30 hooks)
├── store/         # Zustand stores (engine, door, project, ui)
├── ui/            # Components — canvas, layout, panels, toolbar, overlay
└── __tests__/     # 875 tests, 19 suites, ~7s
```

**3 nguyên tắc NON-NEGOTIABLE**: Extensible — 3D-ready — Integration-ready.

## Tests

```
875/875 pass | 19 suites | ~7s
```

| Suite | Tests | Mô tả |
|-------|-------|---------|
| Geometry (Vec2, Matrix3, Transform2D, Utils) | 185 | Toán hình học |
| Commands (Draw + Modify) | 134 | 8 draw + 6 modify commands |
| Document | 49 | CRUD, selection, doors, state |
| Engine | 61 | Tool, viewport, entity, draw |
| Entities (Registry + Configs) | 91 | 8 entity configs |
| Export (JSON, DXF, SVG, PNG, PDF) | 275 | 5 formats |
| History | 10 | Undo/redo bypass |
| Selection | 36 | Golden selection + commands |
| BOM Domain | 34 | BOM, CutList, GlassCut |

## Phân quyền

RBAC + Permission Matrix theo org. Xem chi tiết: [PERMISSION_CATALOG.md](src/TrangChuAlubok/book/PERMISSION_CATALOG.md)

- **6 roles**: OWNER, ADMIN, DESIGNER, ACCOUNTANT, WAREHOUSE, SALES
- **43 resources** × 17 actions = **~250 permissions**
- Format: `resource:action` (VD: `design.project:read`, `quote:approve`)

## Cấu trúc dự án

Xem chi tiết: [PROJECT_STRUCTURE_ANALYSIS.md](PROJECT_STRUCTURE_ANALYSIS.md)

## Tài liệu

| File | Nội dung |
|------|----------|
| [BOOK_STRUCTURE.md](src/TrangChuAlubok/book/BOOK_STRUCTURE.md) | Tổng quan 10 module + trạng thái |
| [BookThietKeBocTach/ROADMAP.md](src/TrangChuAlubok/book/BookThietKeBocTach/ROADMAP.md) | Tiến độ CAD module (875 tests, Phase 0-9) |
| [PERMISSION_CATALOG.md](src/TrangChuAlubok/book/PERMISSION_CATALOG.md) | Phân quyền (43 resources, ~250 permissions) |
| [ARCHITECTURE.md](src/TrangChuAlubok/book/BookThietKeBocTach/ARCHITECTURE.md) | Kiến trúc CAD module |
| [PROJECT_STRUCTURE_ANALYSIS.md](PROJECT_STRUCTURE_ANALYSIS.md) | Cây thư mục đầy đủ |

## License

Private — Alubok.
