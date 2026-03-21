# 🏗️ ARCHITECTURE RULES - CAD Application

> **⚠️ ĐỌC FILE NÀY ĐẦU TIÊN MỖI CHAT MỚI**
>
> File này chứa 3 ĐIỀU KIỆN BẮT BUỘC phải tuân thủ khi phát triển ứng dụng CAD.
> Mọi thay đổi code PHẢI tuân theo các quy tắc này.

---

## ✅ ĐIỀU KIỆN 1 — KHÔNG TRỘN LOGIC

### Luồng dữ liệu bắt buộc:

```
UI → CadEngine → Document → History
```

| Layer         | Trách nhiệm                                | Ví dụ                              |
| ------------- | ------------------------------------------ | ---------------------------------- |
| **UI/Canvas** | Chỉ thu thập input (click, drag, keyboard) | `onClick`, `onMouseMove`           |
| **CadEngine** | Xử lý logic, thực thi Commands             | `engine.executeCommand()`          |
| **Document**  | Source of truth cho entities               | `document.addEntity()`             |
| **History**   | Quản lý undo/redo                          | `history.push()`, `history.undo()` |

### ❌ KHÔNG BAO GIỜ:

- Canvas tạo/sửa/xóa entity trực tiếp
- UI gọi Document mà không qua CadEngine
- Bỏ qua History khi thay đổi state

### ✅ ĐÚNG CÁCH:

```typescript
// UI chỉ gọi command
engine.executeCommand(new LineCommand(start, end));

// Command thực thi qua Document
document.addEntity(lineEntity);

// History tự động tracking
history.push(action);
```

---

## ✅ ĐIỀU KIỆN 2 — PropertySchema là "LUẬT TỐI CAO"

### Mọi thuộc tính của entity phải đăng ký qua:

```
core/properties/PropertySchema.ts
```

### Áp dụng cho:

- ✅ Plugin thêm thuộc tính mới
- ✅ Script tự tạo entity
- ✅ Parametric constraint
- ✅ Bất kỳ thay đổi property nào

### ❌ KHÔNG BAO GIỜ:

- Thêm property mà không qua PropertySchema
- Hardcode property trong entity class
- Bypass validation của PropertySchema

### ✅ ĐÚNG CÁCH:

```typescript
// Đăng ký schema trước
PropertySchema.register("myEntity", {
  width: { type: "number", default: 100 },
  height: { type: "number", default: 50 },
});

// Entity sử dụng schema
class MyEntity extends BaseEntity {
  get schema() {
    return PropertySchema.get("myEntity");
  }
}
```

---

## ✅ ĐIỀU KIỆN 3 — KHÔNG ĐƯỢC TRỘN LẪN (GỘP) VÀO 1 FILE

### 🔒 Rule 1 – Style KHÔNG bao giờ sinh Material

```
style.fillColor !== material
```

| ❌ SAI                                  | ✅ ĐÚNG                       |
| --------------------------------------- | ----------------------------- |
| Auto map fillColor → material           | Chỉ hỗ trợ "gợi ý" (optional) |
| `if (color === red) material = 'steel'` | User chọn material riêng      |

---

### 🔒 Rule 2 – BOM đọc từ Material, không đọc từ Canvas

```
Canvas chỉ là preview
BOM → entities → materialId → geometry
```

| ❌ TUYỆT ĐỐI KHÔNG                | ✅ ĐÚNG CÁCH                       |
| --------------------------------- | ---------------------------------- |
| BOM → fillColor → suy ra vật liệu | BOM → entity.materialId → material |
| Đọc style từ canvas để tính giá   | Đọc geometry + material từ entity  |

---

### 🔒 Rule 3 – Cost trong Properties = read-only

Cost chỉ thay đổi khi:

- ✅ Đổi geometry (kích thước)
- ✅ Đổi material (vật liệu)

👉 **Cost tự động update**, user không edit trực tiếp.

---

## 🧠 TÁCH 3 LỚP — "LUẬT SẮT"

```
┌─────────────────────────────────────────────────────────┐
│  Canvas (render)   ❌ KHÔNG DÙNG CHO BOM               │
│  - Chỉ để hiển thị, preview                            │
│  - Không phải nguồn dữ liệu                            │
├─────────────────────────────────────────────────────────┤
│  Geometry (data)   ✅ NGUỒN KÍCH THƯỚC                 │
│  - width, height, length, area                         │
│  - Tính toán từ entity properties                      │
├─────────────────────────────────────────────────────────┤
│  Material (logic)  ✅ NGUỒN ĐƠN GIÁ                    │
│  - unitPrice, materialType                             │
│  - Liên kết qua materialId                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 CẤU TRÚC THƯ MỤC CHÍNH

```
BookThietKeBocTach/src/
├── adapters/          # Adapters cho canvas, input, persistence
├── app/               # Config, events, plugins, services
├── core/              # ⭐ CORE - Commands, Entities, Document
│   ├── commands/      # Command pattern (draw, edit, entity)
│   ├── document/      # CadDocument, Layer, History
│   ├── entities/      # Entity classes (Line, Rect, Circle...)
│   ├── export/        # Export modules (JSON, DXF, SVG, PNG, PDF)
│   ├── properties/    # PropertySchema (LUẬT TỐI CAO)
│   └── engine/        # CadEngine
├── domain/            # BOM, Materials, Door templates, computeProjectStatus
├── hooks/             # React hooks (useProjectSync, useCadEngine, ...)
├── hooks/             # React hooks
├── store/             # Zustand stores
├── types/             # Type definitions
└── ui/                # UI components
    ├── canvas/        # Canvas + utils
    ├── panels/        # Property panels, Layer panel
    └── toolbar/       # Toolbar components
```

---

## 🔑 FILES QUAN TRỌNG

| File                                | Mục đích                       |
| ----------------------------------- | ------------------------------ |
| `core/properties/PropertySchema.ts` | LUẬT TỐI CAO cho properties    |
| `core/document/CadDocument.ts`      | Source of truth cho entities   |
| `core/engine/CadEngine.ts`          | Xử lý logic, thực thi commands |
| `core/export/ExportManager.ts`      | Export facade (JSON/DXF/SVG/PNG/PDF) |
| `core/export/ExportPDFCore.ts`      | PDF 1.4 export (IEntity-based)       |
| `core/export/ExportSVGCore.ts`      | SVG export (IEntity-based)           |
| `core/share/shareSerializer.ts`     | lz-string encode/decode share snapshots |
| `domain/computeProjectStatus.ts`    | Auto-compute trạng thái dự án từ dữ liệu thật (revision-based) |
| `store/engineStore.ts`              | Global state (Zustand)         |
| `store/projectStore.ts`             | Project + BOM state (15+ workflow fields) |
| `ui/canvas/CadDrawingCanvas.tsx`    | Main canvas component          |
| `ui/views/ProjectListView.tsx`      | Danh sách dự án + sidebar "Quy trình" + status badge |
| `ui/components/ShareModal.tsx`      | Share modal (tabs, permissions, lz-string) |

---

## ⚡ QUICK CHECKLIST

Trước khi commit code, kiểm tra:

- [ ] UI có gọi trực tiếp Document không? → ❌ Phải qua CadEngine
- [ ] Property mới có đăng ký PropertySchema không? → ✅ Bắt buộc
- [ ] BOM có đọc từ Canvas không? → ❌ Phải đọc từ Entity + Material
- [ ] Cost có cho user edit không? → ❌ Phải read-only

---

> **Cập nhật lần cuối**: March 20, 2026
