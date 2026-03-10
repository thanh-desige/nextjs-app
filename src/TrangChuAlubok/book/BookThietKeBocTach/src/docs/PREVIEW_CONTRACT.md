# PREVIEW_CONTRACT.md

# Door Preview Data Contract (Khế ước kiến trúc)

## Status: LOCKED (Đã khóa - Không thay đổi khi chưa có review)

---

## 1. Định nghĩa Preview

**Preview** là dữ liệu đồ họa đơn giản dùng để **HIỂN THỊ** hình ảnh cửa trên canvas.

### Preview LÀ:

- ✅ Dữ liệu đường nét (line, rect, polyline, arc)
- ✅ Tọa độ normalized (0-1) để scale theo W/H
- ✅ Style visual (stroke, fill, opacity)
- ✅ Marker positions (hinges, handle, connectors)
- ✅ Chỉ dùng cho render UI

### Preview KHÔNG PHẢI:

- ❌ Geometry kỹ thuật (không dùng cắt nhôm/kính)
- ❌ Material data (không có vật liệu)
- ❌ BOM data (không có số lượng, đơn giá)
- ❌ Cost data (không có chi phí)
- ❌ Nguồn sự thật cho door-engine
- ❌ Nguồn sự thật cho analysis

---

## 2. Quy tắc phụ thuộc (Dependency Rules)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ALLOWED IMPORTS                              │
├─────────────────────────────────────────────────────────────────┤
│  types/DoorPreviewData     ← Schema thuần (data definitions)   │
│  adapters/preview/         ← Renderer, Registry stubs          │
│  ui/canvas/                ← Consume preview để render         │
│  ui/components/            ← Consume preview để render         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    FORBIDDEN IMPORTS                            │
├─────────────────────────────────────────────────────────────────┤
│  door-engines/             ✗ KHÔNG được import preview         │
│  analysis/                 ✗ KHÔNG được import preview         │
│  domain/                   ✗ KHÔNG được import preview         │
│  core/commands/            ✗ KHÔNG được import preview logic   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PREVIEW DATA FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Admin vẽ mẫu]                                                │
│        ↓                                                        │
│  PreviewExporter (giai đoạn sau)                               │
│        ↓                                                        │
│  door-previews/*.json (static files)                           │
│        ↓                                                        │
│  previewRegistry.get(templateId)                                │
│        ↓                                                        │
│  PreviewRenderer → Canvas/SVG                                   │
│                                                                 │
│  ⚠️ TÁCH BIỆT HOÀN TOÀN VỚI:                                    │
│     door-engine → geometry → BOM → cost                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Entity Contract

### DoorEntity chứa:

```typescript
interface DoorEntityData {
  // ... existing fields ...

  /**
   * ID của preview template (optional)
   *
   * ⚠️ CHỈ LƯU ID STRING, KHÔNG LOAD JSON
   * ⚠️ KHÔNG dùng cho geometry/BOM/material
   * ⚠️ Chỉ dùng để lookup preview khi render
   *
   * Nếu null/undefined → dùng fallback renderer
   */
  previewTemplateId?: string;
}
```

### KHÔNG được thêm vào Entity:

- ❌ `previewData: DoorPreviewData` (KHÔNG embed JSON)
- ❌ `previewGeometry: ...` (KHÔNG chứa geometry)
- ❌ Bất kỳ computed field nào từ preview

---

## 5. Registry Contract

```typescript
// adapters/preview/previewRegistry.ts
interface PreviewRegistry {
  /**
   * Lấy preview data theo template ID
   * @returns DoorPreviewData | null
   *
   * ⚠️ STUB hiện tại trả về null
   * ⚠️ Implementation sau sẽ load từ static JSON
   */
  get(templateId: string): DoorPreviewData | null;

  /**
   * Kiểm tra có preview không
   */
  has(templateId: string): boolean;

  /**
   * Đăng ký preview (chỉ dùng trong admin mode - giai đoạn sau)
   */
  register(templateId: string, data: DoorPreviewData): void;
}
```

---

## 6. Renderer Contract

```typescript
// adapters/preview/PreviewRenderer.tsx
interface PreviewRendererProps {
  previewData?: DoorPreviewData | null;
  options: PreviewRenderOptions;
  // ...
}

// Behavior:
// - Nếu previewData = null → render fallback (rectangle + X)
// - Nếu previewData có → render layers theo thứ tự
// - KHÔNG gọi door-engine
// - KHÔNG tính geometry
// - KHÔNG ảnh hưởng BOM
```

---

## 7. Các giai đoạn triển khai

| Giai đoạn | Nội dung                      | Trạng thái     |
| --------- | ----------------------------- | -------------- |
| Phase 0   | Schema + Stub (đã hoàn thành) | ✅ DONE        |
| Phase 1   | KHÓA KIẾN TRÚC (hiện tại)     | 🔒 IN PROGRESS |
| Phase 2   | PreviewExporter + Admin UI    | ⏸️ HOÃN        |
| Phase 3   | Load từ static JSON           | ⏸️ HOÃN        |
| Phase 4   | Hot-reload trong development  | ⏸️ HOÃN        |

---

## 8. Cam kết không vi phạm (COMPLIANCE)

Tất cả code preview PHẢI tuân thủ:

| Rule | Yêu cầu                                                     |
| ---- | ----------------------------------------------------------- |
| R2   | BOM KHÔNG đọc preview                                       |
| R4   | Geometry kỹ thuật KHÔNG sinh từ preview                     |
| R6   | Preview CHỈ để nhìn, không dùng cho tính toán               |
| G2   | door-engines/ KHÔNG import preview                          |
| G2   | analysis/ KHÔNG import preview                              |
| E1   | Entity chỉ lưu `previewTemplateId` (string), không lưu JSON |

---

## 9. Kiểm tra tuân thủ (Compliance Check)

Trước khi merge code preview, PHẢI kiểm tra:

- [ ] Preview data không chứa material/cost/quantity
- [ ] door-engines/ không có import từ preview
- [ ] analysis/ không có import từ preview
- [ ] DoorEntity chỉ lưu previewTemplateId (string)
- [ ] PreviewRenderer không gọi engine
- [ ] BOM không đọc từ preview data

---

# End of Contract
