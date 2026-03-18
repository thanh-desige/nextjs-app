# BookMuaHang/ — ROADMAP

> B8-B9: Đơn mua hàng + Yêu cầu mua hàng — dòng tiền ra
> Tham chiếu: `../PERMISSION_CATALOG.md`

---

## Trạng thái: ✅ Phase B2 hoàn chỉnh (13 source + 2 test files, 33 tests)

## Ưu tiên: ⭐ Trung bình

## Phụ thuộc: shared/, DanhMuc/

---

## Code hiện tại

- `BookMuaHang.tsx` — 14 dòng placeholder
- `MuaHangPage/MuaHangPage.tsx` — Giao diện shop mua vật tư
- `MuaHangPage/categories/` — 7 tab: TongHop, NhomThanh, PhuKienNhom, Kinh, PhuKienKinh, InoxThanh, InoxTam

> **Lưu ý**: MuaHangPage hiện tại là **shop mua vật tư từ ALUBOK** (B2C). Catalog định nghĩa **Purchase Order** (B2B). Cần quyết định: gom chung hay tách riêng?

---

## Phạm vi (từ Catalog)

| Catalog | Resource | Mô tả |
|---------|----------|-------|
| B8 | `purchase.order` | Đơn đặt mua: CRUD + duyệt + tracking |
| B9 | `purchase.request` | Yêu cầu mua hàng: CRUD + duyệt |
| C6 | `report.purchase` | Báo cáo mua hàng |

---

## Luồng nghiệp vụ

```
Yêu cầu mua (Purchase Request) → Duyệt → Đơn mua (Purchase Order) → Nhập kho (BookTonKho) → Thanh toán (BookThuChi)
```

---

## Checklist

- [x] Purchase Request CRUD + approval workflow
- [x] Purchase Order CRUD + tracking
- [x] Tích hợp với shop MuaHangPage hiện tại
- [ ] Nhập kho tự động khi PO confirm
- [x] Reports: báo cáo mua hàng
- [ ] Permission: `purchase.order:approve`, `purchase.request:create`...

---

## Cấu trúc thư mục

```
BookMuaHang/
├── ROADMAP.md
├── docs_history_commit.md
└── src/
    ├── index.ts
    ├── types/
    │   ├── muaHang.types.ts
    │   └── index.ts
    ├── store/
    │   └── muaHangStore.ts
    ├── ui/
    │   ├── BookMuaHangPage.tsx
    │   ├── PurchaseRequestList.tsx
    │   ├── PurchaseRequestForm.tsx
    │   ├── PurchaseRequestDetail.tsx
    │   ├── PurchaseOrderList.tsx
    │   ├── PurchaseOrderForm.tsx
    │   ├── PurchaseOrderDetail.tsx
    │   └── PurchaseReport.tsx
    └── tests/
        ├── muaHangTypes.test.ts
        └── muaHangStore.test.ts
```
