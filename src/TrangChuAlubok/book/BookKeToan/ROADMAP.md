# BookKeToan/ — ROADMAP

> B19-B20: Chứng từ kế toán + Hóa đơn
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ⬜ Chưa bắt đầu (chưa có trên sidebar)

## Ưu tiên: Thấp

## Phụ thuộc: shared/, BookThuChi/ (auto voucher từ phiếu thu/chi)

---

## Phạm vi

| Catalog | Resource | Mô tả |
|---------|----------|-------|
| B19 | `accounting.voucher` | Chứng từ kế toán (bút toán) |
| B20 | `accounting.invoice` | Hóa đơn (VAT, bán hàng...) |
| C10 | `report.accounting` | Báo cáo kế toán |

---

## Luồng nghiệp vụ

```
Phiếu thu/chi (BookThuChi) → Tự động sinh chứng từ kế toán (voucher)
Bán hàng → Xuất hóa đơn (invoice)
Cuối kỳ: đối chiếu, khóa sổ
```

---

## Checklist

- [ ] Chứng từ kế toán CRUD + approve/reject/close
- [ ] Hóa đơn CRUD + approve/cancel
- [ ] Tự động sinh voucher từ phiếu thu/chi
- [ ] Sổ cái, sổ nhật ký
- [ ] Khóa sổ cuối kỳ
- [ ] Reports: báo cáo kế toán
- [ ] ⚠️ Thêm "Kế toán" vào Sidebar
- [ ] Permission: `accounting.voucher:approve`, `accounting.invoice:create`...
