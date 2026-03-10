# BookTonKho/ — ROADMAP

> B10-B14: 5 resources quản lý kho — nhập/xuất/chuyển/kiểm kê/tồn
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ⬜ Chưa bắt đầu (chỉ có placeholder "6")

## Ưu tiên: ⭐ Trung bình

## Phụ thuộc: shared/, DanhMuc/

---

## Phạm vi

| Catalog | Resource | Mô tả |
|---------|----------|-------|
| B10 | `inventory.stock_receipt` | Phiếu nhập kho |
| B11 | `inventory.stock_issue` | Phiếu xuất kho |
| B12 | `inventory.stock_transfer` | Phiếu chuyển kho |
| B13 | `inventory.stock_audit` | Kiểm kê |
| B14 | `inventory.balance` | Tồn kho hiện tại (read-only) |
| C7 | `report.inventory` | Báo cáo tồn kho |

---

## Luồng nghiệp vụ

```
Mua hàng (PO confirm) → Nhập kho (stock_receipt) → Tồn kho (balance)
Bán hàng (SO confirm) → Xuất kho (stock_issue) → Tồn kho giảm
Chuyển kho (transfer): Kho A → Kho B
Kiểm kê (audit): so sánh tồn thực tế vs hệ thống
```

---

## Checklist

- [ ] Phiếu nhập/xuất/chuyển kho CRUD + confirm/cancel
- [ ] Tồn kho real-time (tự động từ phiếu)
- [ ] Kiểm kê (so sánh + điều chỉnh)
- [ ] Cảnh báo tồn kho tối thiểu
- [ ] SKU management
- [ ] Reports: báo cáo tồn kho (xuất nhập tồn)
- [ ] Permission: `inventory.stock_receipt:confirm`, `inventory.stock_audit:confirm`...
