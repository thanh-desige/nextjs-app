# BookTongQuan/ — ROADMAP

> C1: Dashboard tổng hợp — đọc data từ tất cả module khác
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ⬜ Chưa bắt đầu (chỉ có placeholder "1")

## Ưu tiên: ⭐⭐ Cao (nhưng build sau vì cần data từ các module khác)

## Phụ thuộc: shared/, tất cả Book modules (đọc data tổng hợp)

---

## Phạm vi

| Mục | Nội dung |
|-----|---------|
| KPIs | Doanh thu, Lợi nhuận, Công nợ, Tồn kho |
| Order flow | Báo giá → Đơn hàng → Giao → Lắp đặt → Thu tiền |
| Biểu đồ | Revenue chart, top products, top customers |
| Thông báo | Đơn hàng mới, tồn kho thấp, công nợ quá hạn |
| Truy cập nhanh | Tạo báo giá, nhập hàng, kiểm tồn |

---

## Resources trong Catalog

| Catalog | Resource | Actions |
|---------|----------|---------|
| C1 | `report.dashboard_executive` | read, export |
| C11 | `report.performance` | read, export |

---

## Checklist

- [ ] Layout dashboard responsive
- [ ] KPI widgets (doanh thu, công nợ, tồn kho)
- [ ] Biểu đồ doanh thu theo tháng
- [ ] Thông báo / cảnh báo
- [ ] Permission: `report.dashboard_executive:read`
- [ ] Build progressive: thêm widget khi module mới hoàn thành
