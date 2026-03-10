# PREVIEW_ARCHITECTURE_TEST_CHECKLIST.md

# Checklist Test Kiến Trúc Preview

## Mục đích

Checklist này dùng để xác nhận code preview tuân thủ PREVIEW_CONTRACT.md và COMPLIANCE_CHECKLIST.md trước khi merge.

---

## 1. Schema Compliance (DoorPreviewData)

### ✅ Phải có:

- [ ] `id: string` - ID duy nhất
- [ ] `name: string` - Tên hiển thị
- [ ] `version: "1.0"` - Version cố định
- [ ] `doorType: string` - Loại cửa
- [ ] `baseSize: { width, height }` - Kích thước gốc (mm)
- [ ] `layers: PreviewLayers` - Các layer path
- [ ] `markers: PreviewMarkers` - Vị trí markers

### ❌ KHÔNG được có:

- [ ] Không có field `material` hoặc `materialId`
- [ ] Không có field `cost` hoặc `price`
- [ ] Không có field `quantity` hoặc `bom`
- [ ] Không có field `geometry` (geometry kỹ thuật)
- [ ] Không có field `cutList` hoặc `partsList`

---

## 2. Entity Compliance (DoorEntity)

### ✅ Phải có:

- [ ] `previewTemplateId?: string` - CHỈ lưu ID string

### ❌ KHÔNG được có:

- [ ] Không có `previewData: DoorPreviewData` (không embed JSON)
- [ ] Không có computed field từ preview
- [ ] Không có methods liên quan preview

---

## 3. Import Rules (grep check)

### door-engines/ KHÔNG được import:

```bash
# Chạy từ thư mục gốc project
grep -r "from.*preview" src/TrangChuAlubok/book/BookThietKeBocTach/src/door-engines/
grep -r "from.*DoorPreviewData" src/TrangChuAlubok/book/BookThietKeBocTach/src/door-engines/
grep -r "from.*previewRegistry" src/TrangChuAlubok/book/BookThietKeBocTach/src/door-engines/
```

- [ ] Kết quả: KHÔNG có match

### analysis/ KHÔNG được import:

```bash
grep -r "from.*preview" src/TrangChuAlubok/book/BookThietKeBocTach/src/analysis/
grep -r "from.*DoorPreviewData" src/TrangChuAlubok/book/BookThietKeBocTach/src/analysis/
grep -r "from.*previewRegistry" src/TrangChuAlubok/book/BookThietKeBocTach/src/analysis/
```

- [ ] Kết quả: KHÔNG có match

### domain/ KHÔNG được import:

```bash
grep -r "from.*preview" src/TrangChuAlubok/book/BookThietKeBocTach/src/domain/
grep -r "from.*DoorPreviewData" src/TrangChuAlubok/book/BookThietKeBocTach/src/domain/
```

- [ ] Kết quả: KHÔNG có match

---

## 4. Renderer Compliance

### PreviewRenderer:

- [ ] Nhận `previewData?: DoorPreviewData | null`
- [ ] Nếu null → render fallback (rectangle + X)
- [ ] Nếu có data → render layers theo thứ tự
- [ ] KHÔNG gọi door-engine
- [ ] KHÔNG tính geometry kỹ thuật
- [ ] KHÔNG import từ door-engines/
- [ ] KHÔNG import từ analysis/

### PreviewRegistry:

- [ ] `get(templateId)` trả về `DoorPreviewData | null`
- [ ] `has(templateId)` trả về `boolean`
- [ ] KHÔNG load geometry/BOM
- [ ] KHÔNG gọi door-engine

---

## 5. Data Flow Test

### Test 1: Kéo cửa vào canvas

1. [ ] User kéo template từ DoorTemplateOverlay
2. [ ] DoorEntity được tạo với `previewTemplateId`
3. [ ] Canvas gọi `previewRegistry.get(previewTemplateId)`
4. [ ] Nếu có data → render preview
5. [ ] Nếu null → render fallback
6. [ ] door-engine KHÔNG được gọi

### Test 2: Tính BOM

1. [ ] User click "Tính BOM"
2. [ ] door-engine được gọi với DoorEntity.doorInfo
3. [ ] BOM đọc từ EngineOutput
4. [ ] BOM KHÔNG đọc từ previewData
5. [ ] Preview render KHÔNG thay đổi

---

## 6. File Structure Check

```
src/TrangChuAlubok/book/BookThietKeBocTach/src/
├── types/
│   └── DoorPreviewData.ts        ✅ Schema thuần
├── adapters/
│   └── preview/
│       ├── index.ts              ✅ Public exports
│       ├── PreviewRenderer.tsx   ✅ Renderer component
│       └── previewRegistry.ts    ✅ Registry stub
├── docs/
│   └── PREVIEW_CONTRACT.md       ✅ Contract document
└── core/
    └── entities/
        └── DoorEntity.ts         ✅ Có previewTemplateId?: string
```

- [ ] Tất cả files đúng vị trí
- [ ] Không có file preview trong door-engines/
- [ ] Không có file preview trong analysis/
- [ ] Không có file preview trong domain/

---

## 7. Automated Tests (giai đoạn sau)

### Unit Tests cần viết:

- [ ] `previewRegistry.get()` trả về null khi không có data
- [ ] `previewRegistry.register()` lưu data đúng
- [ ] `PreviewRenderer` render fallback khi data = null
- [ ] `PreviewRenderer` render layers đúng thứ tự
- [ ] `validatePreviewData()` reject data sai schema

### Integration Tests cần viết:

- [ ] Kéo cửa vào canvas không gọi door-engine
- [ ] Tính BOM không đọc preview data
- [ ] Preview render không ảnh hưởng BOM

---

## 8. Review Checklist (cho PR)

Trước khi approve PR liên quan preview:

- [ ] Đã chạy grep check (mục 3) - không có import sai
- [ ] Đã review DoorEntity - chỉ có `previewTemplateId?: string`
- [ ] Đã review PreviewRenderer - không gọi engine
- [ ] Đã review previewRegistry - chỉ return data/null
- [ ] Đã đọc PREVIEW_CONTRACT.md
- [ ] Không có violation nào

---

## Kết luận

| Tiêu chí            | Pass/Fail |
| ------------------- | --------- |
| Schema compliance   | [ ]       |
| Entity compliance   | [ ]       |
| Import rules        | [ ]       |
| Renderer compliance | [ ]       |
| Data flow           | [ ]       |
| File structure      | [ ]       |

**Chỉ merge khi TẤT CẢ = Pass**

---

# End of Checklist
