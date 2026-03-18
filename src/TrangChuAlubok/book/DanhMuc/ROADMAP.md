# DanhMuc/ — ROADMAP

> Nhóm A: 12 resources — Master Data dùng chung toàn hệ thống
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ✅ Phase F2 hoàn thành (Foundation)

## Ưu tiên: ⭐⭐⭐ Rất cao (build cùng đợt 1 với shared/)

## Phụ thuộc: shared/

## Thống kê: 19 files, 37 tests, 3 suites (tổng: 997 tests, 25 suites)

---

## Phạm vi

| Catalog | Resource | Mô tả | Dùng bởi | Status |
|---------|----------|-------|----------|--------|
| A1 | `master.customer` | Khách hàng | BookBanHang, BookThuChi | ✅ |
| A2 | `master.supplier` | Nhà cung cấp | BookMuaHang, BookThuChi | ✅ |
| A3 | `master.employee` | Nhân viên | ThietLap, BookTongQuan | ✅ |
| A4 | `master.profile` | Thanh nhôm (profile) | BookThietKeBocTach (BOM) | ✅ |
| A5 | `master.glass` | Kính | BookThietKeBocTach (BOM) | ✅ |
| A6 | `master.accessory` | Phụ kiện | BookThietKeBocTach (BOM) | ✅ |
| A7 | `master.material` | Vật tư chung | BookTonKho, BookMuaHang | ✅ |
| A8 | `master.unit` | Đơn vị tính | Tất cả | ✅ |
| A9 | `master.warehouse` | Kho | BookTonKho | ✅ |
| A10 | `master.price_list` | Bảng giá | BookBanHang, BookMuaHang | ✅ |
| A11 | `master.tax_rate` | Thuế suất | BookBanHang, BookKeToan | ✅ |
| A12 | `master.door_template` | Mẫu cửa | BookThietKeBocTach | ✅ |

> Danh mục được truy cập từ bên trong các Book khác (VD: chọn khách hàng khi tạo báo giá).

---

## Cấu trúc hiện tại

```
DanhMuc/
├── ROADMAP.md
├── docs_history_commit.md
└── src/
    ├── index.ts                  ← barrel export
    ├── types/                    ← 8 files: base, customer, supplier, employee, material, catalog, doorTemplate, index
    ├── services/                 ← crudService.ts (generic in-memory CRUD), index.ts
    ├── store/                    ← danhMucStore.ts (Zustand + persist, 12 entity arrays)
    ├── ui/
    │   ├── DataTable.tsx         ← Generic table (sort, search, pagination, selection)
    │   ├── EntityForm.tsx        ← Generic form modal (FieldDef, auto-layout)
    │   ├── StatusBadge.tsx       ← Reusable status badge
    │   ├── categoryConfigs.tsx   ← Column + Field defs for all 12 categories
    │   ├── CategoryPage.tsx      ← Generic page wiring DataTable + EntityForm + CRUD
    │   └── DanhMucPage.tsx       ← Main page with sidebar (12 categories, grouped)
    └── tests/
        ├── crudService.test.ts   ← 14 tests
        ├── danhMucStore.test.ts  ← 6 tests
        └── categoryConfigs.test.ts ← 17 tests
```

---

## Checklist

- [x] TypeScript interfaces cho 12 master data entities
- [x] CRUD service cho mỗi entity (generic createCrudService)
- [x] Zustand store (danhMucStore with persist)
- [x] UI: DataTable + EntityForm (generic, dark theme)
- [x] Category configs (12 column/field definitions)
- [x] DanhMucPage with sidebar navigation (grouped: Đối tượng, Vật liệu, Danh mục, Mẫu)
- [x] Wired into App.tsx + Sidebar.tsx (page=7, nested in App Shell content area)
- [x] Search + filter + pagination
- [x] Unit tests: 37 tests, 3 suites — all pass
- [ ] Import/Export Excel cho A1-A7, A10, A12
- [ ] Tích hợp permission: `master.customer:create`, `master.customer:delete`...
- [ ] Seed data / demo data

---

## 🔮 FUTURE PHASES

### Phase F2b: Enhancement
- Import/Export Excel cho A1-A7, A10, A12
- Tích hợp RBAC permission (khi ThietLap hoàn thành)
- Seed data / demo data cho testing
- Inline editing cho DataTable
