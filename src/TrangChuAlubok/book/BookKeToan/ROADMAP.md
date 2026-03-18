# BookKeToan/ — ROADMAP

> B19-B20: Chứng từ kế toán + Hóa đơn
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ✅ Phase C2 hoàn chỉnh — 31 tests, 2 suites

## Ưu tiên: Thấp

## Phụ thuộc: shared/, BookThuChi/ (auto voucher từ phiếu thu/chi)

---

## Phạm vi

| Catalog | Resource | Mô tả | Trạng thái |
|---------|----------|-------|----------|
| B19 | `accounting.voucher` | Chứng từ kế toán (bút toán) | ✅ |
| B20 | `accounting.invoice` | Hóa đơn (VAT, bán hàng...) | ✅ |
| C10 | `report.accounting` | Báo cáo kế toán | ✅ |

---

## Luồng nghiệp vụ

```
Phiếu thu/chi (BookThuChi) → Tự động sinh chứng từ kế toán (voucher)
Bán hàng → Xuất hóa đơn (invoice)
Cuối kỳ: đối chiếu, khóa sổ
```

---

## Checklist

- [x] Chứng từ kế toán CRUD + approve/reject/close
- [x] Hóa đơn CRUD + approve/cancel
- [ ] Tự động sinh voucher từ phiếu thu/chi (deferred to integration phase)
- [x] Sổ cái, sổ nhật ký
- [x] Khóa sổ cuối kỳ (close status on approved vouchers)
- [x] Reports: báo cáo kế toán
- [x] ✅ Thêm "Kế toán" vào Sidebar (page 9, icon + menu item)
- [ ] Permission: `accounting.voucher:approve`, `accounting.invoice:create`... (deferred)
