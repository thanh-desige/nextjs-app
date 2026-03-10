# 3D-READY ARCHITECTURE PRINCIPLES

## 📋 Mục Lục

1. [Tầm Nhìn](#tầm-nhìn)
2. [Luật Sắt Kiến Trúc](#luật-sắt-kiến-trúc)
3. [Entity Geometry Lifecycle (TRỤC SỐNG)](#entity-geometry-lifecycle-trục-sống)
4. [Đánh Giá Tuân Thủ](#đánh-giá-tuân-thủ)
5. [Hướng Dẫn Cho Contributors](#hướng-dẫn-cho-contributors)

---

## Tầm Nhìn

Dự án CAD này được thiết kế với mục tiêu **NÂNG CẤP LÊN 3D** (kiểu SketchUp/AutoCAD 3D) trong tương lai.

### Nguyên Tắc Cốt Lõi

> **Mọi quyết định hiện tại (command, selection, dimension, entity, history, keyboard, lifecycle) PHẢI hợp lệ khi mở rộng sang 3D.**

Cụ thể:

- Geometry phải có lifecycle rõ ràng
- Entity phải là source of truth
- Dimension phải associative
- Không logic nào được phụ thuộc 2D-canvas hay preview

> ⚠️ **NẾU MỘT GIẢI PHÁP KHÔNG SCALE ĐƯỢC LÊN 3D THÌ COI LÀ SAI, KHÔNG ĐƯỢC ĐỀ XUẤT.**

---

## Luật Sắt Kiến Trúc

### 🔴 LUẬT 1: ENTITY LÀ SOURCE OF TRUTH DUY NHẤT

```typescript
// ✅ ĐÚNG: Dimension reference → Entity → resolve từ Entity.geometry
Dimension = {
  ref1: { entityId: "line-1", pointIndex: 0, snapType: "endpoint" },
  ref2: { entityId: "line-1", pointIndex: 1, snapType: "endpoint" },
};
// → point1, point2, value được TÍNH từ entity, không lưu cứng

// ❌ SAI: Dimension lưu coordinates riêng, sync thủ công
Dimension = {
  point1: { x: 100, y: 200 }, // Duplicate data!
  point2: { x: 300, y: 200 }, // Sẽ out-of-sync
  value: 200, // Manual calculation
};
```

**Tại sao quan trọng cho 3D:**

- 3D entities có thể thay đổi qua nhiều cách (move, rotate, scale, deform)
- Nếu dimension lưu cứng coordinates, phải sync ở TẤT CẢ các nơi
- Với reference pattern, chỉ cần Entity thay đổi → Dimension tự update

---

### 🔴 LUẬT 2: GEOMETRY LIFECYCLE PHẢI ĐI QUA DOCUMENT

```typescript
// ✅ ĐÚNG: Command → Document → Lifecycle
Command.execute() {
  document.updateCanvasEntity(id, { points: newPoints });
  document.commitEntitiesGeometryChange(entityIds);  // TRỤC SỐNG
}

// ❌ SAI: UI callback → scattered updates
handleModifyMoveComplete() {
  moveEntities(ids, delta);
  syncAssociativeDimensions();  // Scattered!
  updateBOM();                   // Scattered!
  refreshPreview();              // Scattered!
}
```

**Tại sao quan trọng cho 3D:**

- 3D có nhiều loại dependent objects hơn (dimensions, constraints, materials, instances)
- Central lifecycle = single point of truth
- Dễ extend: thêm listener mới vào lifecycle, không sửa command

---

### 🔴 LUẬT 3: SELECTION LOGIC KHÔNG PHỤ THUỘC RENDER

```typescript
// ✅ ĐÚNG: Pure function với world coordinates
function hitTestEntity(entity: Entity, worldPoint: Point): boolean {
  // Logic chỉ dựa vào geometry
}

// ❌ SAI: Phụ thuộc canvas/screen
function hitTestEntity(
  entity: Entity,
  screenPoint: Point,
  canvas: HTMLCanvasElement
): boolean {
  const bounds = canvas.getBoundingClientRect(); // View-dependent!
}
```

**Tại sao quan trọng cho 3D:**

- 3D selection dùng raycasting, không phải point-in-polygon
- Logic selection phải independent với rendering engine
- Có thể switch từ 2D canvas sang WebGL mà không sửa selection

---

### 🔴 LUẬT 4: COMMAND KHÔNG BIẾT VỀ VIEW/RENDER

```typescript
// ✅ ĐÚNG: Command nhận world units
class MoveCommand {
  constructor(
    private entityIds: string[],
    private delta: { dx: number; dy: number } // World units
  ) {}
}

// ❌ SAI: Command phụ thuộc view state
class MoveCommand {
  constructor(
    private entityIds: string[],
    private screenDelta: Point,
    private zoom: number,
    private pan: Point
  ) {}
}
```

**Tại sao quan trọng cho 3D:**

- 3D có nhiều views (top, front, perspective)
- Command phải hoạt động giống nhau ở mọi view
- Undo/Redo không phụ thuộc view state

---

### 🔴 LUẬT 5: PREVIEW LÀ EPHEMERAL, KHÔNG LÀ STATE

```typescript
// ✅ ĐÚNG: Preview = computed at render time
function renderGhostPreview(entity: Entity, delta: Vector): void {
  const previewGeometry = entity.points.map((p) => ({
    x: p.x + delta.x,
    y: p.y + delta.y,
  }));
  draw(previewGeometry); // Không lưu
}

// ❌ SAI: Preview entities được add vào document
function startMove() {
  const ghost = cloneEntity(entity);
  ghost.id = "preview-" + entity.id;
  document.addEntity(ghost); // Pollutes document!
}
```

**Tại sao quan trọng cho 3D:**

- 3D preview có thể phức tạp (shadows, reflections)
- Preview trong document = undo/redo bị ảnh hưởng
- Render-time calculation = clean separation

---

### 🔴 LUẬT 6: CONSTRAINT/OSNAP TÁCH BIỆT GEOMETRY

```typescript
// ✅ ĐÚNG: Pure engine functions
const snapResult = OsnapEngine.findSnap(entities, cursorWorld);
const constrainedGeometry = ConstraintSolver.apply(geometry, constraints);

// ❌ SAI: Osnap logic nằm trong render loop
function onMouseMove(e: MouseEvent) {
  // Mix: input handling + osnap + render
  const snap = /* inline osnap logic */;
  ctx.fillStyle = 'yellow';
  ctx.arc(snap.x, snap.y, 5, 0, Math.PI * 2);
}
```

**Tại sao quan trọng cho 3D:**

- 3D osnap phức tạp hơn (snap to face, edge, vertex)
- Constraint solver cần isolated để test
- Render engine có thể thay đổi (Canvas → WebGL)

---

### 🔴 LUẬT 7: HISTORY STACK = COMMAND OBJECTS

```typescript
// ✅ ĐÚNG: Command objects có thể serialize
History = [
  MoveCommand({ ids: ["e1"], delta: { dx: 10, dy: 0 } }),
  RotateCommand({ ids: ["e2"], angle: 45, center: { x: 0, y: 0 } }),
];
// → Undo = command.undo(), Redo = command.execute()

// ❌ SAI: Snapshot-based history
History = [
  {
    entities: [
      /* full clone */
    ],
  }, // Memory heavy!
  {
    entities: [
      /* full clone */
    ],
  }, // O(n) per action
];
```

**Tại sao quan trọng cho 3D:**

- 3D models có nhiều data hơn (vertices, faces, materials)
- Snapshot = memory explosion
- Command = O(1) memory per action

---

### 🔴 LUẬT 8: KEYBOARD/INPUT → COMMAND, KHÔNG → STATE

```typescript
// ✅ ĐÚNG: Input triggers command
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === "z") {
    historyManager.undo(); // Command handles state change
  }
}

// ❌ SAI: Input directly mutates state
function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === "z") {
    setState(previousState); // Direct mutation!
  }
}
```

**Tại sao quan trọng cho 3D:**

- 3D có nhiều input modes (pan, orbit, zoom, select)
- Command pattern = testable, undoable
- Direct mutation = untraceable changes

---

### 🔴 LUẬT 9: ENTITY TYPE SYSTEM EXTENSIBLE

```typescript
// ✅ ĐÚNG: Registry pattern
EntityRegistry.register("line", LineHandler);
EntityRegistry.register("line3d", Line3DHandler); // Future
EntityRegistry.register("mesh", MeshHandler); // Future

// Xử lý entity
const handler = EntityRegistry.get(entity.type);
handler.render(entity);
handler.hitTest(entity, point);

// ❌ SAI: Switch hardcode
switch (entity.type) {
  case "line":
    // 100 lines of code
    break;
  case "circle":
    // 100 lines of code
    break;
  // Phải sửa khi thêm type mới!
}
```

**Tại sao quan trọng cho 3D:**

- 3D có nhiều entity types (mesh, solid, surface, nurbs)
- Switch = phải sửa nhiều files
- Registry = open for extension, closed for modification

---

### 🔴 LUẬT 10: DIMENSION = DERIVED DATA FROM REFS

```typescript
// ✅ ĐÚNG: Value tính từ refs
interface Dimension {
  ref1: EntityReference; // { entityId, pointIndex, snapType }
  ref2: EntityReference;
  style: DimensionStyle;
  // value được TÍNH khi cần, không lưu
}

function getDimensionValue(dim: Dimension, document: Document): number {
  const p1 = resolveRef(dim.ref1, document);
  const p2 = resolveRef(dim.ref2, document);
  return distance(p1, p2);
}

// ❌ SAI: Lưu cứng value
interface Dimension {
  point1: Point; // Duplicate!
  point2: Point; // Duplicate!
  value: number; // Must sync manually!
}
```

**Tại sao quan trọng cho 3D:**

- 3D dimensions có thể measure trong không gian 3D
- Entity có thể transform phức tạp
- Derived = luôn correct

---

## Entity Geometry Lifecycle (TRỤC SỐNG)

### Sơ Đồ Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTION                               │
│                (click, drag, keyboard)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMMAND                                   │
│         MoveCommand / RotateCommand / ScaleCommand          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DOCUMENT.updateCanvasEntity()                   │
│                  (Geometry change)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         DOCUMENT.commitEntitiesGeometryChange()             │
│                     (TRỤC SỐNG)                             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 1. Find dimensions referencing changed entities      │   │
│  │ 2. Resolve new points from entity geometry          │   │
│  │ 3. Recalculate dimension values                     │   │
│  │ 4. Commit updated dimensions to document            │   │
│  │ 5. (Future: update constraints, BOM, etc.)          │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    RENDER                                    │
│            (React re-render with new state)                 │
└─────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// CadDocument.ts - TRỤC SỐNG

/**
 * TRỤC SỐNG: Central point for ALL entity geometry changes
 *
 * Call this method after ANY geometry modification:
 * - MOVE, DRAG, STRETCH, ROTATE, SCALE, COPY
 * - Parametric changes
 * - Any point modification
 */
commitEntityGeometryChange(entityId: string): number {
  const dims = this.getDimensionsForEntity(entityId);  // O(1) lookup
  const entity = this.canvasEntities.get(entityId);

  for (const dim of dims) {
    const updates = this.resolveDimensionFromEntity(dim, entity);
    if (updates) {
      // COMMIT: Write new dimension data to document
      const updated = { ...dim, ...updates };
      this.dimensions.set(dim.id, updated);
    }
  }

  this.markModified();
  return updatedCount;
}
```

### Entity → Dimension Index

```typescript
// O(1) lookup: entityId → Set<dimensionId>
private entityToDimensionIndex: Map<string, Set<string>> = new Map();

// When dimension is added
indexDimensionEntityRefs(dim: Dimension) {
  for (const ref of [dim.ref1, dim.ref2, dim.ref3]) {
    if (ref?.entityId) {
      this.entityToDimensionIndex.get(ref.entityId).add(dim.id);
    }
  }
}

// When entity changes
getDimensionsForEntity(entityId: string): Dimension[] {
  const dimIds = this.entityToDimensionIndex.get(entityId);
  return dimIds.map(id => this.dimensions.get(id));
}
```

---

## Đánh Giá Tuân Thủ

| Luật                  | Trạng thái       | Ghi chú                   |
| --------------------- | ---------------- | ------------------------- |
| 1. Entity = Truth     | ✅ Tuân thủ      | Dimension refs Entity     |
| 2. Lifecycle qua Doc  | ✅ Tuân thủ      | TRỤC SỐNG pattern         |
| 3. Selection pure     | ✅ Tuân thủ      | hitTest dùng world coords |
| 4. Command no view    | ✅ Tuân thủ      | Commands nhận world delta |
| 5. Preview ephemeral  | ✅ Tuân thủ      | Ghost = render-time calc  |
| 6. Osnap tách biệt    | ✅ Tuân thủ      | findOsnapPoint pure       |
| 7. History = Commands | ✅ Tuân thủ      | CommandHistory            |
| 8. Input → Command    | ✅ Tuân thủ      | Keyboard → undo()         |
| 9. Entity extensible  | ⚠️ Cần cải thiện | Có switch hardcode        |
| 10. Dim = derived     | ✅ Tuân thủ      | value từ refs             |

---

## Hướng Dẫn Cho Contributors

### ✅ ĐƯỢC LÀM

1. **Thêm command mới** → Implement ICommand interface, gọi `commitEntitiesGeometryChange()`
2. **Thêm entity type mới** → Register trong EntityRegistry (khi có)
3. **Thêm constraint mới** → Implement trong ConstraintSolver
4. **Thêm osnap mode mới** → Thêm vào OsnapEngine

### ❌ KHÔNG ĐƯỢC LÀM

1. ❌ Lưu coordinates trong dimension (dùng refs)
2. ❌ Sync dimensions trong UI callbacks (dùng lifecycle)
3. ❌ Hardcode entity type trong switch (dùng registry khi có)
4. ❌ Phụ thuộc canvas/screen trong business logic
5. ❌ Direct state mutation từ keyboard handlers

### 🔍 CODE REVIEW CHECKLIST

- [ ] Command có gọi `commitEntitiesGeometryChange()` sau geometry change?
- [ ] Selection logic có dùng world coordinates?
- [ ] Preview có được tính at render time (không lưu)?
- [ ] New entity type có được register (không switch)?
- [ ] Dimension có dùng refs (không lưu cứng coordinates)?

---

## Changelog

| Date       | Change                                       |
| ---------- | -------------------------------------------- |
| 2026-01-07 | Initial document - 10 Iron Rules established |
| 2026-01-07 | TRỤC SỐNG pattern implemented                |
| 2026-01-07 | Entity → Dimension index for O(1) lookup     |

---

_Document maintained by: Development Team_
_Last updated: 2026-01-07_
