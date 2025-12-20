# 2 ĐIỀU KIỆN BẮT BUỘC - Compliance Checklist

---

## ⚠️ QUY TẮC VÀNG: LUÔN VIẾT ĐÚNG CODE, ĐÚNG FILE, ĐÚNG CẤU TRÚC

**PHẢI LUÔN NHỚ:**

1. **ĐÚNG FILE**: Code phải đặt đúng file theo chức năng

   - Commands → `core/commands/`
   - Entities → `core/entities/`
   - Hooks → `hooks/`
   - UI Components → `ui/`
   - Domain logic → `domain/`

2. **ĐÚNG CẤU TRÚC**: Tuân thủ kiến trúc đã định

   - Xem sơ đồ: `sơ đồ.md` ở thư mục gốc
   - Core không import từ UI
   - Hooks không chứa business logic phức tạp
   - Domain không phụ thuộc vào UI

3. **ĐÚNG CODE**: Code phải tuân thủ patterns đã có
   - Commands kế thừa từ base và implement execute/undo
   - Hooks sử dụng Commands, không thao tác trực tiếp
   - UI components sử dụng hooks, không gọi core trực tiếp

**TRƯỚC KHI VIẾT CODE, HÃY HỎI:**

- [ ] File này thuộc thư mục nào trong cấu trúc?
- [ ] Pattern nào đang được sử dụng cho loại code này?
- [ ] Code mới có phá vỡ kiến trúc hiện tại không?

---

## ĐIỀU KIỆN 1: UI → CadEngine → Document → History

**Quy tắc:** UI không được sửa entity trực tiếp. Mọi thay đổi PHẢI đi qua:

```
UI Component → Hook/Callback → Command → CadDocument → History
```

### ✅ Compliance Status

| Component                          | Status | Notes                                    |
| ---------------------------------- | ------ | ---------------------------------------- |
| CadDrawingCanvas (controlled mode) | ✅     | Gọi callbacks (onAddEntity, etc.)        |
| useCanvasEntities hook             | ✅     | Tạo Commands và gọi executeCommandObject |
| CanvasEntityCommands               | ✅     | Commands dùng context.document           |
| CadEngine.executeCommand           | ✅     | Pass document vào context, push history  |
| History system                     | ✅     | Commands được lưu, undo/redo hoạt động   |

### ❌ Violations to Avoid

```typescript
// ❌ WRONG: Gọi trực tiếp document method từ UI
document.addCanvasEntity(entity);

// ✅ CORRECT: Qua Command
const command = new AddCanvasEntityCommand(entity);
executeCommandObject(command);

// ✅ CORRECT: Qua Hook
const { addEntity } = useCanvasEntities();
addEntity(entity);

// ✅ CORRECT: Qua controlled mode callback
onAddEntity?.(entity);
```

---

## ĐIỀU KIỆN 2: PropertySchema là luật tối cao

**Quy tắc:** Mọi property changes PHẢI được validate bởi PropertySchema trước khi apply.

```
User Input → PropertySchema.validate() → Command.execute() → Document
```

### ✅ Compliance Status - Canvas Commands

| Component                     | Status | Notes                                        |
| ----------------------------- | ------ | -------------------------------------------- |
| AddCanvasEntityCommand        | ✅     | Validate entity via validateCanvasUpdates()  |
| UpdateCanvasEntityCommand     | ✅     | Validate updates via validateCanvasUpdates() |
| BatchAddCanvasEntitiesCommand | ✅     | Validate ALL entities trước khi add          |
| CopyCanvasEntitiesCommand     | ✅     | Validate copied entities                     |
| MoveCanvasEntitiesCommand     | ✅     | (Points không cần schema validation)         |
| DeleteCanvasEntitiesCommand   | ✅     | (Delete không cần validation)                |

### ✅ Compliance Status - Entity Commands (IEntity)

| Component                     | Status | Notes                                          |
| ----------------------------- | ------ | ---------------------------------------------- |
| UpdateEntityPropertyCommand   | ✅     | Validate via propertySchema.validateProperty() |
| UpdateEntityStyleCommand      | ✅     | Validate ALL style props                       |
| UpdateEntityPropertiesCommand | ✅     | Validate ALL properties                        |
| BatchUpdateEntitiesCommand    | ✅     | Validate ALL props cho ALL entities            |

### ✅ Compliance Status - Hooks & Appliers

| Component          | Status | Notes                                          |
| ------------------ | ------ | ---------------------------------------------- |
| useProperties hook | ✅     | Validate via PropertyApplier trước khi command |
| PropertyApplier    | ✅     | Validate via propertySchema.validateProperty() |

### Type Mapping

CanvasEntity uses lowercase types, PropertySchema uses EntityType enum:

```typescript
mapCanvasTypeToEntityType():
  "line"     → EntityType.LINE
  "polyline" → EntityType.POLYLINE
  "rect"     → EntityType.RECT
  "circle"   → EntityType.CIRCLE
```

### Property Key Mapping

```typescript
Canvas Property → PropertySchema Key:
  "color"     → "strokeColor"
  "lineWidth" → "strokeWidth"
```

### ❌ Violations to Avoid

```typescript
// ❌ WRONG: Update property without validation
document.updateCanvasEntity(id, { color: userInput });

// ✅ CORRECT: Qua Command (auto validates)
const command = new UpdateCanvasEntityCommand(id, { color: userInput });
executeCommandObject(command);
// Command sẽ:
// 1. Validate color qua PropertySchema
// 2. Reject nếu invalid
// 3. Apply nếu valid
```

---

## How to Verify Compliance

### Test ĐIỀU KIỆN 1:

1. Draw entity → Check history has AddCanvasEntityCommand
2. Move entity → Check history has MoveCanvasEntitiesCommand
3. Delete entity → Check history has DeleteCanvasEntitiesCommand
4. Undo/Redo → Verify changes are reverted/reapplied

### Test ĐIỀU KIỆN 2:

1. Try setting invalid color (e.g., "not-a-color") → Should be rejected
2. Try setting negative lineWidth → Should be rejected/coerced
3. Check console for validation errors

---

## Files Implementing Compliance

### ĐIỀU KIỆN 1:

- `ui/canvas/CadDrawingCanvas.tsx` - Controlled mode
- `hooks/useCanvasEntities.ts` - Hook for commands
- `core/commands/canvas/CanvasEntityCommands.ts` - All commands
- `core/engine/CadEngine.ts` - executeCommand with history
- `store/engineStore.ts` - executeCommandObject

### ĐIỀU KIỆN 2:

- `core/commands/canvas/CanvasEntityCommands.ts` - Validation functions
- `core/properties/PropertySchema.ts` - Schema definitions
- `core/properties/PropertyApplier.ts` - Apply with validation
- `hooks/useProperties.ts` - UI property changes

---

## When Adding New Features

### ⚠️ QUAN TRỌNG: Plugin, Script, Parametric Constraint

Khi thêm tính năng mới như **plugin**, **script**, hoặc **parametric constraint**, BẮT BUỘC phải:

1. **Tạo Command mới** thay vì gọi document trực tiếp
2. **Validate qua PropertySchema** trước khi apply

```typescript
// ❌ SAI: Plugin/Script gọi trực tiếp document
function myPlugin(document: CadDocument) {
  document.addCanvasEntity(entity); // Vi phạm ĐIỀU KIỆN 1
  document.updateCanvasEntity(id, { color: "red" }); // Vi phạm ĐIỀU KIỆN 2
}

// ✅ ĐÚNG: Plugin/Script tạo Command và execute qua CadEngine
function myPlugin(engine: CadEngine) {
  const addCmd = new AddCanvasEntityCommand(entity);
  engine.executeCommand(addCmd); // → Document → History ✓

  const updateCmd = new UpdateCanvasEntityCommand(id, { color: "red" });
  engine.executeCommand(updateCmd); // → Validate → Document → History ✓
}

// ✅ ĐÚNG: Parametric constraint tạo Command
class MyConstraint {
  apply(engine: CadEngine, entityId: string, newValue: number) {
    const cmd = new UpdateCanvasEntityCommand(entityId, { width: newValue });
    engine.executeCommand(cmd); // Tự động validate qua PropertySchema
  }
}
```

### Tại sao phải tuân thủ?

| Nếu vi phạm                   | Hậu quả                                        |
| ----------------------------- | ---------------------------------------------- |
| Gọi document trực tiếp        | ❌ Undo/Redo hỏng, History không ghi nhận      |
| Không validate PropertySchema | ❌ PropertiesPanel vỡ, dữ liệu không nhất quán |

---

### Always ask:

1. Does this modify entity data? → Must go through Command
2. Does this change properties? → Must validate via PropertySchema
3. Is there a history entry? → Must be undoable

### Checklist for new entity operations:

- [ ] Create Command class in CanvasEntityCommands.ts
- [ ] Command validates via validateCanvasUpdates()
- [ ] Command has undo() implementation
- [ ] Hook exposes method via useCanvasEntities
- [ ] UI calls hook method or controlled callback
