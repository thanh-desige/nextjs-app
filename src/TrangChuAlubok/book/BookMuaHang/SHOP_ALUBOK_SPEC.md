# Shop ALUBOK — Đặc tả kiến trúc & yêu cầu

> Module: BookMuaHang / MuaHangPage
> Ngày tạo: 18/03/2026
> Trạng thái: **Đặc tả** (chưa implement)

---

## 1. Tổng quan

Shop ALUBOK là **cửa hàng trực tuyến bán vật tư nhôm kính**, phục vụ **2 nhóm người dùng** khác nhau trên cùng nền tảng sản phẩm.

---

## 2. Hai nhóm người dùng

| | Nội bộ B2B (ERP) | Khách lẻ B2C (Public) |
|---|---|---|
| **Ai?** | Nhân viên mua hàng của công ty dùng ALUBOK | Chủ nhà, khách hàng lẻ bên ngoài (không dùng ERP) |
| **Entry point** | Tab "Shop ALUBOK" trong BookMuaHang (`/mua-hang/shop-alubok`) | Trang chủ → "Mua hàng" (fullscreen) |
| **Layout** | Inline trong module BookMuaHang — giữ sidebar + header + tab bar ERP | Fullscreen — không có ERP shell |
| **Auth** | Đã đăng nhập hệ thống ALUBOK | Có thể không có tài khoản, hoặc đăng ký tài khoản khách |
| **Sau khi mua** | → Tạo Yêu cầu mua / Đơn mua hàng (workflow nội bộ PO) | → Đặt hàng trực tiếp, thanh toán, giao hàng |
| **Giỏ hàng** | Giỏ mua nội bộ (procurement) | Giỏ hàng e-commerce |

---

## 3. Pricing — 2 bảng giá

Cùng sản phẩm nhưng giá khác nhau:

| | B2B (ERP) | B2C (Public) |
|---|---|---|
| **Bảng giá** | Giá đại lý / giá sỉ (wholesale) | Giá bán lẻ (retail) |
| **Nguồn** | DanhMuc `master.price_list` | DanhMuc `master.price_list` (price list riêng cho retail) |
| **Chiết khấu** | Theo hợp đồng NCC, theo số lượng | Theo chương trình KM (nếu có) |
| **So sánh** | Giá rẻ hơn B2C | Giá niêm yết đầy đủ |

```typescript
type PricingMode = 'wholesale' | 'retail';
```

---

## 4. VAT — Thuế giá trị gia tăng

### 4.1 Nguyên tắc bắt buộc

- **Cả B2B và B2C đều phải có VAT** — không có ngoại lệ
- Chỉ khác **cách hiển thị**, không khác về bản chất thuế

### 4.2 Các mức thuế suất

| Mức VAT | Áp dụng |
|---------|---------|
| **0%** | Hàng xuất khẩu, gia công xuất khẩu |
| **5%** | Nước sạch, thiết bị y tế, sách giáo khoa, nông sản... |
| **8%** | Mức giảm tạm thời (theo NQ Chính phủ, nếu còn hiệu lực) |
| **10%** | Mức phổ thông — nhôm, kính, phụ kiện, inox (đa số SP ALUBOK) |

- Nguồn thuế suất: DanhMuc `master.tax_rate`
- Mỗi sản phẩm gắn tax rate riêng, **không hardcode**

### 4.3 Cách hiển thị

| | B2B (ERP) | B2C (Public) |
|---|---|---|
| **Hiển thị giá** | Tách riêng: Giá gốc + VAT + Tổng | Giá đã bao gồm VAT (ghi chú "Đã bao gồm VAT X%") |
| **VatDisplay** | `'separated'` | `'included'` |
| **Ví dụ** | 100,000 đ + VAT 10% (10,000 đ) = 110,000 đ | 110,000 đ (Đã bao gồm VAT) |

```typescript
type VatDisplay = 'separated' | 'included';
// B2B → 'separated': hiển thị tách riêng để DN hạch toán, khấu trừ thuế đầu vào
// B2C → 'included': người tiêu dùng chỉ quan tâm tổng tiền phải trả
```

---

## 5. Xuất hóa đơn VAT điện tử

### 5.1 Phương thức

Tích hợp API nhà cung cấp hóa đơn điện tử (Adapter pattern — dễ đổi nhà cung cấp):

```
Hệ thống ALUBOK → API nhà cung cấp → Xuất hóa đơn điện tử → Tổng cục Thuế
                                     → Gửi email cho khách
                                     → Lưu vào BookKeToan
```

### 5.2 Nhà cung cấp hỗ trợ

| Provider | API |
|----------|-----|
| VNPT | e-Invoice API |
| Viettel | S-Invoice API |
| MISA | meInvoice API |

### 5.3 Flow xuất hóa đơn

| Bước | B2B (ERP) | B2C (Public) |
|------|-----------|-------------|
| 1 | Hoàn thành đơn mua/bán | Thanh toán đơn hàng |
| 2 | Tự động tạo hóa đơn GTGT | Hỏi "Bạn có cần xuất hóa đơn?" |
| 3 | Điền MST, tên công ty, địa chỉ | Nếu có: điền thông tin. Nếu không: hóa đơn bán lẻ |
| 4 | Gọi API nhà cung cấp → xuất hóa đơn điện tử | Tương tự |
| 5 | Lưu vào BookKeToan + gửi email | Gửi email cho khách |

### 5.4 Pháp lý

- Hóa đơn điện tử phải có **chữ ký số** (nhà cung cấp đảm nhận)
- Phải gửi lên **Tổng cục Thuế** trong vòng cùng ngày phát hành
- Hóa đơn bán lẻ ≥ 200,000 đ **bắt buộc** nếu khách yêu cầu

---

## 6. Kiến trúc code

### 6.1 Cấu trúc thư mục

```
MuaHangPage/                         ← Thư mục hiện tại
├── components/                      ← Core UI dùng chung (B2B + B2C)
│   ├── ProductCatalog.tsx           ← Danh sách sản phẩm (grid/list)
│   ├── ProductCard.tsx              ← Card sản phẩm (nhận pricingMode + vatDisplay)
│   ├── SearchBar.tsx                ← Thanh tìm kiếm
│   ├── CartPanel.tsx                ← Giỏ hàng (procurement cart / e-commerce cart)
│   └── CategorySidebar.tsx          ← Sidebar phân mục (7 danh mục)
├── categories/                      ← Nội dung từng danh mục (hiện có)
│   ├── TongHop.tsx
│   ├── NhomThanh.tsx
│   ├── PhuKienNhom.tsx
│   ├── Kinh.tsx
│   ├── PhuKienKinh.tsx
│   ├── InoxThanh.tsx
│   └── InoxTam.tsx
├── MuaHangPage.tsx                  ← Public shop (fullscreen, B2C, giá retail, VAT included)
└── InternalShopView.tsx             ← Inline view (trong BookMuaHang, B2B, giá wholesale, VAT separated)
```

### 6.2 Kết nối Head 3 ↔ BookMuaHang

```typescript
interface ShopCallbacks {
  onBackClick: () => void;              // ← quay lại
  onGoToOrders?: () => void;            // "Đơn hàng đang mua" → tab orders
  onGoToOrderHistory?: () => void;      // "Lịch sử đơn hàng" → tab orders (filtered)
  onCreateRequest?: (items: CartItem[]) => void;  // Chọn hàng → tạo Yêu cầu mua
  onCreateOrder?: (items: CartItem[]) => void;    // Chọn hàng → tạo Đơn mua hàng
}
```

### 6.3 Pricing context

```typescript
interface PricingContext {
  mode: PricingMode;        // 'wholesale' | 'retail'
  vatDisplay: VatDisplay;   // 'separated' | 'included'
  priceListId: string;      // ID bảng giá từ master.price_list
}
```

### 6.4 Invoice service (Adapter pattern)

```
shared/services/
└── invoiceService.ts            ← Interface chung

BookKeToan/src/invoice/
├── InvoiceGenerator.ts          ← Tạo data hóa đơn từ đơn hàng
├── InvoiceAdapter.ts            ← Adapter chọn provider
└── providers/
    ├── VNPTProvider.ts          ← VNPT e-Invoice API
    ├── ViettelProvider.ts       ← Viettel S-Invoice API
    └── MISAProvider.ts          ← MISA meInvoice API
```

---

## 7. Flow tổng thể

### 7.1 B2B — Nhân viên mua hàng (trong BookMuaHang)

```
Tab "Shop ALUBOK" → Duyệt danh mục → Chọn sản phẩm (giá sỉ, VAT tách)
    → Thêm giỏ mua nội bộ → Chọn NCC
    → Tạo Yêu cầu mua hoặc Đơn mua hàng
    → Duyệt → Nhập kho → Thanh toán → Xuất hóa đơn GTGT → BookKeToan
```

### 7.2 B2C — Khách lẻ (fullscreen từ trang chủ)

```
Trang chủ → "Mua hàng" → Fullscreen shop (giá lẻ, VAT đã gồm)
    → Duyệt danh mục → Chọn sản phẩm
    → Thêm giỏ hàng → Thanh toán
    → Xuất hóa đơn (nếu yêu cầu) → Giao hàng
```

---

## 8. Quản trị Shop ALUBOK

### 8.1 Phân tầng quản trị

#### Platform Admin — Đội ALUBOK (`/admin`)

Quản lý **toàn bộ vận hành shop**:

| Nhóm | Chức năng | Resource |
|------|-----------|----------|
| **Sản phẩm** | CRUD sản phẩm, hình ảnh, thông số kỹ thuật, phân loại, trạng thái (đang bán / hết hàng / ngừng KD) | `platform.shop_product` |
| **Bảng giá lẻ** | Giá retail áp chung cho B2C | `platform.shop_pricing` |
| **Bảng giá sỉ** | Giá wholesale — cấu hình theo từng tenant/tier (không để tenant tự set) | `platform.shop_pricing` |
| **Thuế suất VAT** | Gắn mức VAT cho từng sản phẩm/nhóm hàng | `platform.shop_pricing` |
| **Chiết khấu** | Chiết khấu số lượng, combo, voucher | `platform.shop_promotion` |
| **Khuyến mãi** | Giảm giá theo thời gian, chương trình KM | `platform.shop_promotion` |
| **Đơn hàng B2C** | Xử lý: Mới → Xác nhận → Xuất kho → Giao hàng → Hoàn thành/Hủy/Hoàn trả | `platform.shop_order` |
| **Đơn hàng B2B** | Đơn từ tenant qua Shop ALUBOK (cũng về Admin xử lý) | `platform.shop_order` |
| **Khách hàng B2C** | Tài khoản khách lẻ, lịch sử mua, phân nhóm (mới/VIP/đại lý nhỏ) | `platform.shop_customer` |
| **Thanh toán** | Phương thức (chuyển khoản, COD, MoMo, ZaloPay, VNPay), đối soát, hoàn tiền | `platform.shop_payment` |
| **Hóa đơn VAT** | Xuất hóa đơn điện tử qua provider (VNPT/Viettel/MISA) | `platform.shop_invoice` |
| **Vận chuyển** | Đối tác giao hàng, phí ship, tracking | `platform.shop_shipping` |
| **Giao diện** | Banner, slider, sản phẩm nổi bật, SEO | `platform.shop_content` |
| **Báo cáo** | Doanh thu B2B/B2C, sản phẩm bán chạy, khách hàng, tồn kho | `platform.shop_report` |

#### Tenant Admin — Chủ doanh nghiệp (ThietLap)

Quản lý **cấu hình mua hàng nội bộ** (không can thiệp giá, sản phẩm):

| Chức năng | Mô tả | Resource |
|-----------|-------|----------|
| Hạn mức mua | Ngân sách mua hàng theo phòng ban/dự án | `setting.purchase_limit` |
| Workflow phê duyệt | Ai duyệt yêu cầu mua, mức duyệt tự động | `setting.purchase_config` |
| Phân quyền mua | Nhân viên nào được mua, được xem giá sỉ | `setting.purchase_config` |

#### Nhân viên — User (BookMuaHang)

| Chức năng | Mô tả | Resource |
|-----------|-------|----------|
| Shop ALUBOK | Duyệt danh mục, xem giá sỉ, đặt hàng | `purchase.shop` (read) |
| Yêu cầu mua | Tạo/sửa/gửi duyệt yêu cầu mua | `purchase.request` (CRUD) |
| Đơn mua hàng | Tạo/theo dõi đơn mua | `purchase.order` (CRUD) |

### 8.2 Sơ đồ phân quyền tổng hợp

```
QuanTriAdmin (/admin) — Platform Admin (đội ALUBOK)
├── platform.shop_product       ← Sản phẩm (CRUD, ảnh, thông số, phân loại)
├── platform.shop_pricing       ← Bảng giá lẻ + giá sỉ theo tenant + VAT
├── platform.shop_order         ← Đơn hàng B2C + B2B (xử lý, xuất kho, giao hàng)
├── platform.shop_customer      ← Khách hàng B2C + quản lý tenant
├── platform.shop_payment       ← Thanh toán, đối soát, hoàn tiền
├── platform.shop_promotion     ← Chiết khấu, khuyến mãi, voucher
├── platform.shop_shipping      ← Vận chuyển, phí ship, tracking
├── platform.shop_invoice       ← Hóa đơn VAT điện tử
├── platform.shop_content       ← Giao diện shop (banner, SEO)
└── platform.shop_report        ← Báo cáo (doanh thu, SP bán chạy, khách hàng)

ThietLap (tenant) — Tenant Admin (chủ doanh nghiệp)
├── setting.purchase_config     ← Workflow phê duyệt, phân quyền mua
└── setting.purchase_limit      ← Hạn mức/ngân sách mua hàng

BookMuaHang (user) — Nhân viên
├── purchase.shop               ← Shop ALUBOK (browse, xem giá sỉ, đặt hàng)
├── purchase.request            ← Yêu cầu mua (CRUD)
└── purchase.order              ← Đơn mua hàng (CRUD)
```

---

## 9. Checklist implement

| # | Task | Trạng thái |
|---|------|-----------|
| 1 | Tách core components từ MuaHangPage | ⬜ |
| 2 | Tạo InternalShopView (B2B inline) | ⬜ |
| 3 | Refactor MuaHangPage (B2C fullscreen) | ⬜ |
| 4 | PricingContext + PricingMode | ⬜ |
| 5 | VatDisplay logic (separated / included) | ⬜ |
| 6 | Kết nối InternalShopView ↔ BookMuaHang callbacks | ⬜ |
| 7 | ProductCard hiển thị giá theo mode | ⬜ |
| 8 | CartPanel (procurement vs e-commerce) | ⬜ |
| 9 | Invoice service interface (Adapter pattern) | ⬜ |
| 10 | Invoice providers (VNPT/Viettel/MISA stub) | ⬜ |
| 11 | Platform Admin shop pages (`/admin`) | ⬜ |
| 12 | Tenant admin purchase config (ThietLap) | ⬜ |
| 13 | Tests | ⬜ |
| 14 | Cập nhật docs (.md files) | ⬜ |
