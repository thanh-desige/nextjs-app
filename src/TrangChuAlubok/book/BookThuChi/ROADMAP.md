# BookThuChi/ — ROADMAP

> B15-B18: Phiếu thu, phiếu chi, công nợ phải thu, công nợ phải trả
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ⬜ Chưa bắt đầu (chỉ có placeholder "5")

## Ưu tiên: ⭐ Trung bình

## Phụ thuộc: shared/, DanhMuc/

---

## Phạm vi

| Catalog | Resource | Mô tả |
|---------|----------|-------|
| B15 | `finance.receipt` | Phiếu thu |
| B16 | `finance.payment` | Phiếu chi |
| B17 | `finance.ar` | Công nợ phải thu (Accounts Receivable) |
| B18 | `finance.ap` | Công nợ phải trả (Accounts Payable) |
| C8 | `report.debt` | Báo cáo công nợ |
| C9 | `report.cashflow` | Báo cáo dòng tiền |

---

## Luồng nghiệp vụ

```
Bán hàng (Sales Order) → Công nợ phải thu (AR) → Phiếu thu (Receipt) → Xong
Mua hàng (Purchase Order) → Công nợ phải trả (AP) → Phiếu chi (Payment) → Xong
```

---

## Checklist

- [ ] Phiếu thu/chi CRUD + confirm/cancel
- [ ] Công nợ phải thu: tracking theo khách hàng + đơn hàng
- [ ] Công nợ phải trả: tracking theo NCC + đơn mua
- [ ] Đối soát (tiền mặt vs ngân hàng)
- [ ] Reports: báo cáo công nợ, báo cáo dòng tiền
- [ ] Permission: `finance.receipt:confirm`, `finance.ar:update`...
