# QUY TRÌNH DỰ ÁN — Module Thiết kế & Bóc tách

> File này mô tả toàn bộ quy trình nghiệp vụ cho tab "Dự án" trong module Thiết kế & Bóc tách.
> Mọi thay đổi về trạng thái, điều kiện, ràng buộc phải tuân thủ tài liệu này.

---

## 1. Tổng quan quy trình

```
Nháp → Đang thiết kế → Đã báo giá → Đã ký hợp đồng → Đã tạm ứng → Đã vào lệnh sản xuất → Đã khóa
```

- **Hiện trạng KHÔNG được chọn tay** — hệ thống tự suy ra từ dữ liệu thật.
- **Cột Khóa** là toggle riêng (isLocked), không phải bước trong workflow.
- **Sidebar "Quy trình"** thay thế "Lọc dự án" cũ, hiển thị 8 mục (Tất cả + 7 bước).

---

## 2. Cấu trúc cột bảng

| # | Cột | Mô tả |
|---|-----|-------|
| 0 | ☑ (checkbox) | Chọn dự án (bulk action) |
| 1 | Ngày tạo | Ngày tạo dự án |
| 2 | Ngày sửa | Ngày sửa cuối |
| 3 | Nhân viên | Nhân viên phụ trách |
| 4 | Mã DA | Mã dự án tự sinh (DA 1, DA 2...) |
| 5 | Tên dự án | Tên dự án (click mở form chi tiết) |
| 6 | Số lượng | Tổng số bộ cửa trên canvas (tự đếm, không nhập tay) |
| 7 | Thiết kế | Link "Mở" → canvas tab Thiết kế |
| 8 | BOM | Link "Mở" → canvas tab BOM |
| 9 | DS cắt | Link "Mở" → canvas tab Danh sách cắt |
| 10 | Hiện trạng | Text/badge chỉ đọc, tự tính từ dữ liệu |
| 11 | Liên kết / Hành động | Thay đổi theo trạng thái (xem bảng rule bên dưới) |
| 12 | Khóa | Icon ổ khóa (chỉ hiện khi đã có LSX) |

---

## 3. Sidebar "Quy trình"

| # | Mục | Điều kiện lọc |
|---|-----|---------------|
| 0 | Tất cả | Không lọc, hiển thị toàn bộ |
| 1 | Nháp | computedStatus === 'draft' |
| 2 | Đang thiết kế | computedStatus === 'designing' |
| 3 | Đã báo giá | computedStatus === 'quoted' |
| 4 | Đã ký hợp đồng | computedStatus === 'contracted' |
| 5 | Đã tạm ứng | computedStatus === 'deposited' |
| 6 | Đã vào lệnh sản xuất | computedStatus === 'in_production' |
| 7 | Đã khóa | isLocked === true (lọc cross-cutting) |

> **Lưu ý**: "Đã khóa" là filter theo `isLocked`, không phải `computedStatus`.
> Một dự án "Đã vào lệnh SX" + `isLocked=true` → hiện ở CẢ hai nhóm.

---

## 4. Rule xác định trạng thái (computedStatus)

Hệ thống tự tính theo **thứ tự ưu tiên từ cao → thấp**.
Dừng ngay khi gặp điều kiện đầu tiên thỏa mãn.

### Bảng ưu tiên

| Ưu tiên | computedStatus | Điều kiện | Hiện trạng (UI) | Cột Liên kết / Hành động | Cột Khóa |
|---------|---------------|-----------|-----------------|---------------------------|----------|
| 1 | `in_production` | Có lệnh SX **hợp lệ** (khớp designRevision hiện tại) | Đã vào lệnh SX | LSX-xxxx (click mở lệnh SX) | Icon khóa/mở khóa |
| 2 | `deposited` | Có phiếu thu **hợp lệ** (có mã KH + đã ghi sổ + khớp revision) | Đã tạm ứng | PT-xxxx (click mở phiếu thu) | *(trống)* |
| 3 | `contracted` | Có hợp đồng **hợp lệ** (đã ký + khớp revision) | Đã ký hợp đồng | HD-xxxx (click mở hợp đồng) | *(trống)* |
| 4 | `quoted` | Có báo giá **hợp lệ** (khớp designRevision hiện tại) | Đã báo giá | BG-xxxx (click mở báo giá) | *(trống)* |
| 5 | `designing` | soLuongBo > 0 (canvas có bộ cửa) | Đang thiết kế | *(xem sub-rule)* | *(trống)* |
| 6 | `draft` | soLuongBo === 0 | Nháp | *(trống)* | *(trống)* |

### Sub-rule cho "Đang thiết kế" (cột Liên kết / Hành động):

| BOM đã sync? | Cột Liên kết / Hành động |
|-------------|---------------------------|
| Chưa sync | *(trống)* |
| Đã sync | **"Tạo báo giá"** → mở tab Báo giá trong module Bán hàng |

---

## 5. Cơ chế Revision — QUAN TRỌNG

### 5.1. designRevision

- Mỗi lần sửa canvas (thêm/bớt/sửa cửa, sửa kích thước) → **designRevision tăng**.
- Đây là cơ sở để xác định chứng từ còn hợp lệ hay không.

### 5.2. bomRevision

- Mỗi lần BOM được sync/cập nhật → **bomRevision tăng** + ghi nhận `bomDesignRevision` (= designRevision tại thời điểm sync).
- BOM "đã sync" = `bomDesignRevision === designRevision hiện tại`.

### 5.3. Rule hợp lệ của chứng từ

Một chứng từ (báo giá / hợp đồng / phiếu thu / lệnh SX) được coi là **hợp lệ** khi:

```
chứng từ.designRevision === project.designRevision (hiện tại)
```

Nếu KHÔNG khớp → chứng từ đó **vẫn tồn tại** trong lịch sử nhưng:
- ❌ KHÔNG dùng để derive trạng thái hiện tại
- ❌ KHÔNG cho sửa (chỉ đọc, lưu lịch sử)
- ✅ Vẫn cho xem (read-only)

### 5.4. Ví dụ

```
Dự án X:
  designRevision: 5
  quotes: [
    { code: "BG-0001", designRevision: 3, ... },  ← CŨ, không hợp lệ (rev 3 ≠ 5)
    { code: "BG-0004", designRevision: 5, ... },  ← HỢP LỆ (rev 5 === 5)
  ]
→ computedStatus = "quoted", cột Liên kết hiện "BG-0004"
```

```
Dự án Y:
  designRevision: 5
  quotes: [
    { code: "BG-0002", designRevision: 3, ... },  ← CŨ, không hợp lệ
  ]
→ Không có báo giá hợp lệ → check tiếp: soLuongBo > 0 → "Đang thiết kế"
→ Cột Liên kết hiện "Cập nhật báo giá" (vì có chứng từ cũ nhưng không khớp revision)
```

### 5.5. Rule cascade khi design thay đổi

Khi `designRevision` tăng:
1. BOM cũ → không còn sync → `bomDesignRevision ≠ designRevision`
2. Báo giá cũ → không hợp lệ → status có thể revert
3. Hợp đồng cũ → không hợp lệ
4. Phiếu thu cũ → không hợp lệ
5. Lệnh SX cũ → không hợp lệ

→ Trạng thái **tự động revert** về bước phù hợp nhất theo rule ưu tiên.

---

## 6. Cột "Liên kết / Hành động" — Tổng hợp

| computedStatus | BOM sync? | Có chứng từ cũ? | Hiển thị |
|---------------|-----------|-----------------|----------|
| draft | — | — | *(trống)* |
| designing | Chưa | Không | *(trống)* |
| designing | Chưa | Có BG cũ | *(trống)* |
| designing | Rồi | Không | **"Tạo báo giá"** |
| designing | Rồi | Có BG cũ (rev ≠) | **"Cập nhật báo giá"** |
| quoted | — | — | **BG-xxxx** (click mở) |
| contracted | — | — | **HD-xxxx** (click mở) |
| deposited | — | — | **PT-xxxx** (click mở) |
| in_production | — | — | **LSX-xxxx** (click mở) |

---

## 7. Cột "Khóa"

| Điều kiện | Hiển thị |
|-----------|----------|
| Chưa có LSX | *(trống)* |
| Có LSX + isLocked = false | 🔓 (icon mở khóa, click để khóa) |
| Có LSX + isLocked = true | 🔒 (icon khóa, click để mở) |

### Khi khóa (`isLocked = true`):
- Canvas chuyển **read-only**
- Không thể: thêm/bớt/sửa cửa, sửa kích thước, sửa số lượng
- Cột Hiện trạng vẫn hiện **status thật** (VD: "Đã vào lệnh SX"), KHÔNG hiện "Đã khóa"

### Khi mở khóa (`isLocked = false`):
- Canvas cho phép chỉnh sửa bình thường
- **designRevision sẽ tăng** nếu user sửa → cascade invalidate chứng từ

---

## 8. Trường dữ liệu bắt buộc trong ProjectInfo

```typescript
interface ProjectInfo {
  // ... existing fields ...

  // ── Revision tracking ──
  designRevision: number;        // Tăng mỗi lần sửa canvas
  bomRevision: number;           // Tăng mỗi lần sync BOM
  bomDesignRevision: number;     // designRevision tại thời điểm BOM sync

  // ── Chứng từ liên kết ──
  quoteId?: string;              // ID báo giá hợp lệ hiện tại
  quoteCode?: string;            // Mã BG-xxxx
  contractId?: string;           // ID hợp đồng
  contractCode?: string;         // Mã HD-xxxx
  receiptId?: string;            // ID phiếu thu
  receiptCode?: string;          // Mã PT-xxxx
  productionOrderId?: string;    // ID lệnh sản xuất
  productionOrderCode?: string;  // Mã LSX-xxxx

  // ── Lock ──
  isLocked: boolean;

  // ── Đếm từ canvas ──
  soLuongBo: number;             // Tổng số bộ cửa trên canvas
}
```

---

## 9. Liên kết cross-module

| Module | Tab cần có | Mã sinh ra | Liên kết ngược |
|--------|-----------|------------|-----------------|
| Bán hàng | Tab Báo giá | BG-xxxx | projectId + designRevision |
| Bán hàng | Tab Hợp đồng (MỚI) | HD-xxxx | projectId + quoteId |
| Thu chi | Phiếu thu | PT-xxxx | customerId + contractId |
| Sản xuất | Lệnh sản xuất | LSX-xxxx | projectId + designRevision |
| Thiết kế | Danh sách cắt | — | Nút "Xuất vào lệnh SX" |

---

## 10. Lịch sử cập nhật

| Ngày | Nội dung |
|------|----------|
| 2026-03-20 | Tạo tài liệu quy trình v1.0 |
