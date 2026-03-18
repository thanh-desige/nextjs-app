# BookBanHang/ — ROADMAP

> B6-B7: Báo giá + Đơn bán hàng — dòng tiền vào
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ✅ Phase B1 hoàn chỉnh (26 tests, 2 suites)

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

## Cấu trúc hiện tại

```
BookBanHang/
├── ROADMAP.md
├── docs_history_commit.md
└── src/
    ├── index.ts                      ← barrel export
    ├── types/
    │   ├── banHang.types.ts          ← Quote/SalesOrder types, status labels/colors, calc helpers
    │   └── index.ts
    ├── store/
    │   └── banHangStore.ts           ← Zustand + persist, 3 quotes + 1 order seed
    ├── ui/
    │   ├── BookBanHangPage.tsx        ← Level-2 sidebar (4 tabs, internal list/form/detail nav)
    │   ├── QuoteList.tsx             ← Quote table + search + status filter
    │   ├── QuoteForm.tsx             ← Create/edit quote with line items
    │   ├── QuoteDetail.tsx           ← View + approval workflow + convert to order
    │   ├── SalesOrderList.tsx        ← Order table + search + status filter
    │   ├── SalesOrderForm.tsx        ← Create/edit order with line items
    │   ├── SalesOrderDetail.tsx      ← View + status transitions + tracking
    │   ├── QuoteReport.tsx           ← Quote analytics (cards + bars)
    │   └── SalesReport.tsx           ← Sales analytics (cards + bars + progress)
    └── tests/
        ├── banHangTypes.test.ts      ← 16 tests
        └── banHangStore.test.ts      ← 10 tests
```

---

## Checklist

- [x] Quote CRUD (draft → pending → approved/rejected → closed/cancelled)
- [ ] Generate quote từ BOM data
- [ ] PDF export cho báo giá
- [x] Sales order (convert quote → order)
- [x] Reports: báo cáo báo giá, báo cáo bán hàng
- [ ] Permission: `quote:approve`, `sales.order:create`...

---

## 🔮 FUTURE PHASES

- **B1.next**: Generate quote từ BOM data (tích hợp BookThietKeBocTach)
- **B1.PDF**: PDF export cho báo giá (dùng print template từ ThietLap)
- **B1.RBAC**: Tích hợp permission guards (quote:approve, sales.order:create...)
- **B1.DeliveryTracking**: Tracking giao hàng chi tiết (từng item)
