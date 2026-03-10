# BookBanHang/ — ROADMAP

> B6-B7: Báo giá + Đơn bán hàng — dòng tiền vào
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ⬜ Chưa bắt đầu (chỉ có placeholder "3")

## Ưu tiên: ⭐⭐ Cao

## Phụ thuộc: shared/, DanhMuc/, BookThietKeBocTach/ (BOM data)

---

## Phạm vi

| Catalog | Resource | Mô tả |
|---------|----------|-------|
| B6 | `quote` | Báo giá: CRUD + generate từ BOM + duyệt + PDF + chia sẻ |
| B7 | `sales.order` | Đơn bán hàng: convert từ quote → order, tracking trạng thái |
| C4 | `report.quote` | Báo cáo báo giá |
| C5 | `report.sales` | Báo cáo bán hàng |

---

## Luồng nghiệp vụ

```
BookThietKeBocTach (BOM) → Quote (draft) → Approve → Sales Order → Delivery → Payment (BookThuChi)
```

---

## Cấu trúc khi build

```
BookBanHang/
└── src/
    ├── domain/
    │   ├── quote/           ← Quote entity, QuoteService, trạng thái
    │   └── salesOrder/      ← SalesOrder entity, SalesOrderService
    ├── ui/
    │   ├── QuoteList.tsx
    │   ├── QuoteDetail.tsx
    │   ├── QuoteForm.tsx
    │   ├── SalesOrderList.tsx
    │   └── SalesOrderDetail.tsx
    ├── reports/
    │   ├── QuoteReport.tsx
    │   └── SalesReport.tsx
    └── hooks/
```

---

## Checklist

- [ ] Quote CRUD (draft → sent → approved/rejected → closed/cancelled)
- [ ] Generate quote từ BOM data
- [ ] PDF export cho báo giá
- [ ] Sales order (convert quote → order)
- [ ] Reports: báo cáo báo giá, báo cáo bán hàng
- [ ] Permission: `quote:approve`, `sales.order:create`...
