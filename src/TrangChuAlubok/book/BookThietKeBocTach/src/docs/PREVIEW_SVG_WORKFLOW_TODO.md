# PREVIEW_TEMPLATE_WORKFLOW_TODO.md

# Workflow: Vẽ trên Canvas → Entity Data → Preview Template

## Status: PENDING (Chờ hoàn thiện UI trước)

---

## 📌 NGUYÊN TẮC HIỂN THỊ BOM (CHỐT CUỐI)

### BOM = 1 TAB DUY NHẤT, chia 3 khu vực:

```
[BOM TAB]
├── A. Illustration View (SVG)     ← Hình minh họa + dimension lines
├── B. Dimension Summary (Bảng)    ← Số liệu chính thức (W, H, đố, kính...)
└── C. Material Table (Bảng)       ← Bảng vật tư/định lượng
```

### Nguồn dữ liệu DUY NHẤT:

```
EngineOutput.geometry
        │
        ├──▶ Dimension Summary  → Số liệu chính thức
        │
        └──▶ Illustration SVG   → Vẽ khung, đố, kính, mã thanh + dimension lines
```

### ❌ SVG KHÔNG BAO GIỜ được dùng để:

- Tính BOM
- Suy ra kích thước
- Làm nguồn logic

### ✅ SVG chỉ là:

- "Hình ảnh hóa" của data đã tính xong
- Render trực quan cho người xem

### 🔒 Luật chốt:

> Dimension hiển thị trên SVG chỉ để người nhìn hiểu nhanh;
> Bảng Dimension Summary mới là nơi thể hiện số liệu chính thức.
> **Cả hai đều render từ EngineOutput.**

---

## 📌 NGUYÊN TẮC EXPORT SVG (CHỐT)

### Export Mode:

```
[EXPORT SVG]
├── PRIMARY: Chọn vùng (Window/Selection)
│   ├── Selection → Export entities đang được chọn
│   └── Window → Vẽ hình chữ nhật để chọn vùng export
│
└── SECONDARY: Export All (option phụ)
    └── Xuất tất cả entities trong Document
```

### 🔒 Luật chốt:

1. **SVG sinh từ Entity Data trong Document** - KHÔNG phụ thuộc viewport hay canvas state
2. **Chọn vùng là ưu tiên chính** - User phải chủ động chọn những gì muốn export
3. **Export All chỉ là option phụ** - Dùng khi muốn xuất toàn bộ bản vẽ

### Logic:

```
if (hasSelectedEntities)
  → Export SELECTION (entities đang chọn)
else if (userChooseWindow)
  → Export WINDOW (entities trong vùng chọn)
else
  → Export ALL (tất cả entities - cần confirm)
```

---

## 1. Ý tưởng đã thống nhất

### Mục tiêu:

- Admin vẽ mẫu cửa trực tiếp trên canvas CAD
- Export DoorPreviewData JSON **trực tiếp từ Entity Data**
- (Optional) Export SVG nếu cần file hình để lưu trữ
- Lưu làm preview template cho user sử dụng

### Workflow:

```
Canvas (vẽ) → Entity Data → PreviewExporter → DoorPreviewData JSON → previewRegistry
                    │
                    └──▶ (optional) Export SVG (file hình)
```

### 🔒 Nguyên tắc:

> **Entity Data là nguồn DUY NHẤT** - KHÔNG parse SVG ngược lại thành data!
> SVG chỉ là output để lưu trữ/xem, không bao giờ là input.

### Tuân thủ kiến trúc:

- ✅ Preview = UI-only (PREVIEW_CONTRACT)
- ✅ Không sinh geometry kỹ thuật
- ✅ Không dùng cho BOM/material/cost
- ✅ door-engine chạy riêng khi cần tính BOM

---

## 2. Đã hoàn thành (Phase 0-1)

| Item                               | File                                                   | Status  |
| ---------------------------------- | ------------------------------------------------------ | ------- |
| DoorPreviewData schema             | `types/DoorPreviewData.ts`                             | ✅ Done |
| PreviewRenderer stub               | `adapters/preview/PreviewRenderer.tsx`                 | ✅ Done |
| previewRegistry stub               | `adapters/preview/previewRegistry.ts`                  | ✅ Done |
| PREVIEW_CONTRACT                   | `docs/PREVIEW_CONTRACT.md`                             | ✅ Done |
| previewTemplateId in DoorEntity    | `core/entities/DoorEntity.ts`                          | ✅ Done |
| ParametricPreview (Dialog)         | `ui/components/DoorConfigDialog/ParametricPreview.tsx` | ✅ Done |
| DoorConfigDialog + OpenType filter | `ui/components/DoorConfigDialog.tsx`                   | ✅ Done |

---

## 3. Cần làm (Phase 2 - Chờ)

| Item                  | Mô tả                                     | Status     |
| --------------------- | ----------------------------------------- | ---------- |
| PreviewExporter       | Entity Data → DoorPreviewData (trực tiếp) | ⏸️ Pending |
| Normalize coordinates | Chuyển tọa độ về 0-1 từ entity bounds     | ⏸️ Pending |
| Layer classification  | Phân loại layer từ entity.layer           | ⏸️ Pending |
| Admin mode UI         | Chế độ vẽ template                        | ⏸️ Pending |
| Load từ static JSON   | previewRegistry load files                | ⏸️ Pending |

---

## 4. Vấn đề cần sửa trước khi tiếp tục

> **User sẽ liệt kê các thiếu sót về:**
>
> - Vẽ (Draw tools)
> - Chỉnh sửa (Edit/Modify)
> - Dimension
> - Style panel

### Danh sách issues:

<!-- User sẽ bổ sung -->

1. [ ] ...
2. [ ] ...
3. [ ] ...

---

## 5. Ghi chú kỹ thuật

### Export hiện tại:

- `useExport()` hook có sẵn
- `SvgAdapter.toSVG()` chuyển entities → SVG string
- Menu: Export → SVG/PNG/DXF

### PreviewExporter (cần implement):

```typescript
// Entity Data → DoorPreviewData (TRỰC TIẾP, không qua SVG)
function entitiesToPreviewData(entities: CadEntity[]): DoorPreviewData {
  const bounds = calculateBounds(entities);

  return {
    elements: entities.map((entity) => ({
      type: mapEntityTypeToPreviewType(entity),
      layer: entity.layer, // frame, sash, glass, mullion
      points: normalizePoints(entity.points, bounds), // → 0-1
      // ... other properties from entity
    })),
  };
}
```

### ❌ KHÔNG LÀM:

- Parse SVG paths
- Đọc SVG để suy ra geometry
- Dùng SVG làm nguồn data

### ✅ CHỈ LÀM:

- Đọc trực tiếp từ Entity properties
- Normalize tọa độ về 0-1 từ entity bounds
- Phân loại layer từ entity.layer

---

# End of file
