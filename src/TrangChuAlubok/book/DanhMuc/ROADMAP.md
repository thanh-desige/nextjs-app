# DanhMuc/ — ROADMAP

> Nhóm A: 12 resources — Master Data dùng chung toàn hệ thống
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ⬜ Chưa bắt đầu

## Ưu tiên: ⭐⭐⭐ Rất cao (build cùng đợt 1 với shared/)

## Phụ thuộc: shared/

---

## Phạm vi

| Catalog | Resource | Mô tả | Dùng bởi |
|---------|----------|-------|----------|
| A1 | `master.customer` | Khách hàng | BookBanHang, BookThuChi |
| A2 | `master.supplier` | Nhà cung cấp | BookMuaHang, BookThuChi |
| A3 | `master.employee` | Nhân viên | ThietLap, BookTongQuan |
| A4 | `master.profile` | Thanh nhôm (profile) | BookThietKeBocTach (BOM) |
| A5 | `master.glass` | Kính | BookThietKeBocTach (BOM) |
| A6 | `master.accessory` | Phụ kiện | BookThietKeBocTach (BOM) |
| A7 | `master.material` | Vật tư chung | BookTonKho, BookMuaHang |
| A8 | `master.unit` | Đơn vị tính | Tất cả |
| A9 | `master.warehouse` | Kho | BookTonKho |
| A10 | `master.price_list` | Bảng giá | BookBanHang, BookMuaHang |
| A11 | `master.tax_rate` | Thuế suất | BookBanHang, BookKeToan |
| A12 | `master.door_template` | Mẫu cửa | BookThietKeBocTach |

> Danh mục được truy cập từ bên trong các Book khác (VD: chọn khách hàng khi tạo báo giá).

---

## Cấu trúc khi build

```
DanhMuc/
└── src/
    ├── types/          ← customer.types.ts, supplier.types.ts, ...
    ├── services/       ← CustomerService.ts, SupplierService.ts, ...
    ├── ui/
    │   ├── tables/     ← CustomerTable, SupplierTable, ...
    │   └── forms/      ← CustomerForm, SupplierForm, ...
    └── hooks/          ← useCustomers(), useSuppliers(), ...
```

---

## Checklist

- [ ] TypeScript interfaces cho 12 master data entities
- [ ] CRUD service cho mỗi entity
- [ ] UI: Data table + Form (thêm/sửa/xóa)
- [ ] Import/Export Excel cho A1-A7, A10, A12
- [ ] Search + filter + pagination
- [ ] Tích hợp permission: `master.customer:create`, `master.customer:delete`...
