# 📋 DanhMuc/ — Lịch sử hoàn thành

> Chỉ ghi chức năng **đã hoàn thành**. Mỗi entry = 1 task hoàn chỉnh.
> Module: DanhMuc/ — Master Data (12 resources A1-A12)

---

## Phase F2: DanhMuc Foundation

### F2.1: Entity Types (8 files)
- `base.types.ts`: MasterEntityBase, EntityStatus, ListParams, PaginatedResult, CrudService interface
- `customer.types.ts`: Customer (A1), `supplier.types.ts`: Supplier (A2), `employee.types.ts`: Employee (A3)
- `material.types.ts`: Profile, Glass, Accessory, Material (A4-A7)
- `catalog.types.ts`: Unit, Warehouse, PriceList, TaxRate (A8-A11)
- `doorTemplate.types.ts`: DoorTemplate (A12)
- `index.ts`: barrel export

### F2.2: Zustand Store
- `danhMucStore.ts`: 12 entity arrays + setters + resetAll, Zustand persist middleware

### F2.3: CRUD Service
- `crudService.ts`: generic `createCrudService<T>()` — in-memory CRUD with search, sort, pagination
- Will be swapped with API service when backend is connected

### F2.4: DataTable Component
- Generic `DataTable<T>` with ColumnDef, search, sort (▲▼), pagination, checkbox selection, dark theme

### F2.5: EntityForm + StatusBadge
- `EntityForm`: Generic modal form with FieldDef (8 field types), auto-layout (50% width pairing)
- `StatusBadge`: Reusable active/inactive/working/resigned badge

### F2.6: Category Configs + DanhMucPage
- `categoryConfigs.tsx`: Column + Field definitions for all 12 categories, CATEGORY_CONFIGS registry
- `CategoryPage.tsx`: Generic page wiring DataTable + EntityForm + crudService + danhMucStore
- `DanhMucPage.tsx`: Main page with sidebar (12 categories grouped: Đối tượng, Vật liệu, Danh mục, Mẫu)

### F2.7: App Integration
- Added "Danh mục" item to Sidebar.tsx (id=7, IconDanhMuc)
- DanhMucPage rendered inline in App Shell content area (page=7)
- Global sidebar (level 1) persists; DanhMucPage shows level-2 sidebar inside content

### F2.9: Architecture Refactor — Nested Navigation
- Removed fullscreen route (page=98) → inline render (page=7) in App.tsx content div
- Removed DanhMucPage header (back arrow, breadcrumb) — no longer needed
- Removed `onBackClick` prop — DanhMucPage is now a pure nested component
- Layout: horizontal flex (level-2 sidebar + CategoryPage), no column wrapper
- Pattern: same as BookTongQuan, BookBanHang — Global sidebar always visible

### F2.8: Unit Tests (37 tests, 3 suites)
- `crudService.test.ts`: 14 tests (CRUD, search, pagination, sort, filters)
- `danhMucStore.test.ts`: 6 tests (initial state, setters, resetAll, independence)
- `categoryConfigs.test.ts`: 17 tests (12 categories verified, structure validation)
- Total: 997 tests, 25 suites — all pass
