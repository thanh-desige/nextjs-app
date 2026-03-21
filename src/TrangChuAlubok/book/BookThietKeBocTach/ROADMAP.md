# 🗺️ BookThietKeBocTach — ROADMAP

> **Module**: Thiết kế & Bóc tách (CAD Engine + BOM + Export)
> **Trạng thái**: 🟢 Đang phát triển — 875 tests, 19 suites
> **Phụ thuộc**: `../shared/` (khi migrate RBAC)
> **Resources**: B1-B5 (`design.project`, `design.canvas`, `design.library`, `bom.report`, `bom.cut_list`)
>
> Cập nhật lần cuối: **08/03/2026**
> Compliance: [COMPLIANCE_CHECKLIST.md](src/COMPLIANCE_CHECKLIST.md)
> Catalog: [PERMISSION_CATALOG.md](../PERMISSION_CATALOG.md)
> **3 mục tiêu luôn giữ**: Extensible → 3D-ready → Integration-ready

## 📌 MỤC TIÊU CHÍNH

Xây dựng ứng dụng CAD hoàn chỉnh với Clean Architecture, tuân thủ 2 điều kiện:

1. **ĐIỀU KIỆN 1**: UI → Command → CadEngine → Document → History
2. **ĐIỀU KIỆN 2**: PropertySchema validation cho mọi property updates

---

## 📊 TỔNG QUAN TIẾN ĐỘ

| Phase                                    | Trạng thái | Tests            | Ghi chú                                   |
| ---------------------------------------- | ---------- | ---------------- | ----------------------------------------- |
| STEP-0: Jest Setup                       | ✅ DONE    | 17               | ts-jest + path aliases                    |
| STEP-1: Selection Unify                  | ✅ DONE    | 36               | 20 golden + 16 command tests              |
| STEP-2: History Bypass Block             | ✅ DONE    | 10               | engineStore.updateEntity blocked          |
| STEP-3: Entity System Unify              | ✅ DONE    | 91               | 15 registry + 76 configs                  |
| STEP-4.1: CadDrawingCanvas Split (types) | ✅ DONE    | —                | CadDrawingCanvasProps + overlays          |
| STEP-5: CadDrawingCanvas Split (hooks)   | ✅ DONE    | —                | 7282→1135 dòng (84.4% reduction)          |
| STEP-5.1: useMouseHandlers Split         | ✅ DONE    | —                | 2367→1243 dòng (+3 helper files)          |
| STEP-5.2: CanvasEntityCommands Split     | ✅ DONE    | —                | 3543→1064 dòng (+5 command files + utils) |
| STEP-5.3: BookThietKeBocTachPage Split   | ✅ DONE    | —                | 3323→2176 dòng (+3 hooks)                 |
| STEP-5.4: useDimensions Split            | ✅ DONE    | —                | 1837→546 dòng (+3 sub-hooks)              |
| STEP-5.5: BookThietKeBocTachPage Phase 2 | ✅ DONE    | —                | 2176→1599 dòng (+3 hooks)                 |
| STEP-5.6: ExportManager Split            | ✅ DONE    | —                | 1780→135 dòng (+4 module files)           |
| STEP-5.7: useCommandDrawing Split        | ✅ DONE    | —                | 1609→649 dòng (+5 extracted files)        |
| STEP-5.8: CadDocument Split              | ✅ DONE    | —                | 1548→488 dòng (+2 extracted files)        |
| STEP-5.9: useCanvasRenderer Split        | ✅ DONE    | —                | 1537→384 dòng (+5 renderer files)         |
| STEP-5.10: DimensionManager Split        | ✅ DONE    | —                | 1307→488 dòng (+4 extracted files)        |
| STEP-5.11: FabricAdapter Split           | ✅ DONE    | —                | 1433→582 dòng (+4 extracted files)        |
| STEP-5.12: DoorRendererDetailed Split    | ✅ DONE    | —                | 1434→433 dòng (+3 extracted files)        |
| STEP-5.13: SvgAdapter Split             | ✅ DONE    | —                | 1243→478 dòng (+4 extracted files)        |
| STEP-5.14: PropertySchema Split         | ✅ DONE    | —                | 1136→333 dòng (+3 extracted files)        |
| STEP-5.15: ProjectService Split         | ✅ DONE    | —                | 1177→643 dòng (+3 extracted files)        |
| STEP-5.16: Header2 Split                | ✅ DONE    | —                | 1138→192 dòng (+2 extracted files)        |
| STEP-5.17: Header1 Split                | ✅ DONE    | —                | 1094→276 dòng (+1 extracted file)         |
| STEP-5.18: Header3 Split                | ✅ DONE    | —                | 1082→681 dòng (+1 extracted file)         |
| STEP-5.19: CadEngine Split              | ✅ DONE    | —                | 1076→772 dòng (+1 extracted file)         |
| STEP-5.20: CanvasEntityCommands Split   | ✅ DONE    | —                | 1062→437 dòng (+1 extracted file)         |
| STEP-5.21: useKeyboardHandler Split     | ✅ DONE    | —                | 962→789 dòng (+2 extracted files)         |
| STEP-5.22: BookThietKeBocTachPage Split | ✅ DONE    | —                | 1600→1098 dòng (+2 extracted files)        |
| STEP-5.23: useMouseHandlers Split       | ✅ DONE    | —                | 1407→768 dòng (+4 extracted files)         |
| STEP-5.24: CadDrawingCanvas Split      | ✅ DONE    | —                | 1234→740 dòng (+1 extracted file)          |
| STEP-5.25: boundary.ts Split           | ✅ DONE    | —                | 1037→345 dòng (+2 extracted files)         |
| STEP-5.26: BookThietKeBocTachPage Split | ✅ DONE    | —                | 1099→882 dòng (+1 extracted hook)           |
| Phase 0: Cleanup empty files             | ✅ DONE    | —                | 28 empty files deleted, 0 broken imports  |
| Phase 3+: BOM Domain tests               | ✅ DONE    | 34               | createBomItem, CutListOptimizer, GlassCut |
| Phase 3+: CadEngine tests                | ✅ DONE    | 61               | Tool, Viewport, Entity, Selection, Draw   |
| Phase 5.1: JSON Export                   | ✅ DONE    | 39               | exportToJSON, importFromJSON, roundtrip   |
| Phase 5.2: DXF Export                    | ⚠️ PARTIAL | 62               | SketchUp OK (dimensions khớp). AutoCAD 2013 CHƯA mở được — cần fix sau |
| UI: Import & Share buttons               | ✅ DONE    | —                | Header2 Tools: Import (placeholder) + Share modal (3 tabs, Zalo) |
| UI: Share Snapshot (lz-string)           | ✅ DONE    | —                | /share page + lz-string compression + document snapshot URL |
| Phase 5.3: SVG Export                    | ✅ DONE    | 63               | exportDocumentToSVG, IEntity-based        |
| Phase 5.4: PNG Export                    | ✅ DONE    | 49               | preparePNGExport, renderIEntityToCtx      |
| Phase 5.5: PDF Export                    | ✅ DONE    | 62               | exportDocumentToPDF, PDF 1.4, no ext deps |
| **PHASE NEXT: DXF Import**               | ✅ DONE    | 48               | Parse DXF → IEntity[], 7 DXF types, layer mapping, RECT auto-detect |
| **Tổng tests**                           |            | **1500/1500 pass** | **52 test suites, ~8s**                   |

### 🔮 Tương lai — Thứ tự ưu tiên

| Phase                                    | Trạng thái | Ưu tiên  | Mô tả                                                |
| ---------------------------------------- | ---------- | -------- | ----------------------------------------------------- |
| PHASE NEXT: DXF Import                   | ✅ DONE    | ⭐ Cao   | Parse DXF → IEntity[], 7 DXF types → 8 entity types, layer mapping  |
| PHASE NEXT: SVG Import                   | ⏸ CHỜ     | Trung bình | Parse SVG → IEntity[], path/rect/circle/text — chờ chỉ đạo |
| PHASE NEXT: SPLINE tool                  | ⏸ CHỜ     | Trung bình | B-spline/NURBS curve, control points — chờ chỉ đạo   |
| PHASE NEXT: HATCH / BLOCK / ARRAY        | ⏸ CHỜ     | Thấp     | Advanced drawing tools — chờ chỉ đạo                  |
| PHASE 4: Geometry Abstraction            | ⏸ CHỜ     | Cao      | IVector, Vec3, ICanvasAdapter — 3D-ready — chờ chỉ đạo |
| PHASE 6: Backend + API                   | ⬜ TODO    | —        | PostgreSQL, NextAuth, API routes, webhooks             |
| PHASE 7: ERP + Performance               | ⬜ TODO    | —        | Dashboard, Sales, Inventory, Door Engines, 60fps       |
| PHASE 9: Collaboration                   | ⬜ TODO    | —        | Real-time, versioning, cloud                          |
| PHASE 8: 3D                              | ⬜ TƯƠNG LAI XA | —   | Chỉ khi dự án đã có nhiều user thực tế               |

> 📍 Chi tiết từng Phase tương lai (code samples, schema, API, specs): xem section **"🔮 FUTURE PHASES"** cuối file

---

## ✅ PHASE 0: JEST SETUP (STEP-0) — DONE

- [x] Cài đặt Jest + ts-jest + ts-node
- [x] Cấu hình path alias `@/*` → `./src/*`
- [x] 17 Vec2 geometry smoke tests pass
- [x] `npx jest --verbose` chạy thành công

## ✅ PHASE 1: SELECTION UNIFY (STEP-1) — DONE

### STEP-1.1: Golden Selection Tests (20 tests)

- [x] G01–G10: Cơ bản (select, additive, clear, sync entity.selected)
- [x] G11–G15: Delete/clear tương tác với selection
- [x] G16–G20: Edge cases (select all, empty array, duplicates)

### STEP-1.2: Selection Command Tests (16 tests)

- [x] SC01–SC10: SelectCanvasEntitiesCommand (execute, undo, redo, additive)
- [x] CC01–CC06: ClearCanvasSelectionCommand (execute, undo, redo, edge cases)

### STEP-1.3: Wire Up & Remove Old Sources

- [x] CadDocument là Single Source of Truth cho selection
- [x] CadEngine delegates to CadDocument
- [x] engineStore syncs from CadEngine events

## ✅ PHASE 2: HISTORY BYPASS BLOCK (STEP-2) — DONE

- [x] H01: `engineStore.updateEntity()` throws DEPRECATED error
- [x] H02–H05: DeleteCanvasEntitiesCommand with undo/redo
- [x] H06–H10: NewDocumentCommand with undo/redo
- [x] Mọi mutation phải đi qua Command → CadEngine → Document → History

## ✅ PHASE 3: ENTITY SYSTEM UNIFY (STEP-3) — DONE

### STEP-3.1: EntityRegistry + lineConfig (15 tests)

- [x] EntityRegistry singleton pattern
- [x] EntityData.types.ts (UnifiedEntity, geometry interfaces)
- [x] lineConfig: create, translate, rotate, scale, mirror, containsPoint, getBounds, getGripPoints, clone, serialize/deserialize
- [x] L01–L15 tests pass

### STEP-3.2–3.8: All 7 Remaining Entity Configs (76 tests)

- [x] STEP-3.2: rectConfig (R01–R11)
- [x] STEP-3.3: circleConfig (C01–C10)
- [x] STEP-3.4: arcConfig (A01–A10)
- [x] STEP-3.5: ellipseConfig (E01–E10)
- [x] STEP-3.6: polylineConfig (P01–P11)
- [x] STEP-3.7: textConfig (T01–T10)
- [x] STEP-3.8: dimensionConfig (D01–D10)
- [x] Integration tests: All 8 types registered, dispatch chính xác

### STEP-3.9: Switch Production Code → EntityRegistry (DONE)

- [x] **EntityBridge.ts** (NEW): Bridge IEntity ↔ UnifiedEntity
  - `translateIEntity()`, `rotateIEntity()`, `scaleIEntity()`, `mirrorIEntity()`
  - `getIEntityBounds()`, `iEntityContainsPoint()`, `getIEntityGripPoints()`
  - `cloneIEntity()`, `serializeIEntity()`, `deserializeIEntity()`
- [x] **EntityBaseUtils.ts** (NEW): Standalone helpers thay thế BaseEntity methods
  - `generateEntityId()`, `initEntityBase()`, `serializeEntityBase()`, `copyEntityBase()`
- [x] **IEntity interface**: Xóa mọi method signatures (chỉ còn data properties)
- [x] **8 entity classes**: Xóa `extends BaseEntity` (Line, Rect, Circle, Arc, Ellipse, Polyline, Text, Dimension)
- [x] **CadEngine.ts**: Xóa mọi `as BaseEntity` casts, thêm `updateEntity()` method
  - Select/deselect/hover → direct `entity.state.selected = true/false`
  - hitTest/getBounds → `getIEntityBounds()`, `iEntityContainsPoint()`
  - hitTestGrips → `getIEntityGripPoints()`
- [x] **5 Modify Commands migrated** (immutable transforms):
  - MOVE.ts → `translateIEntity()` + `updateEntity()`
  - rotate.ts → `rotateIEntity()` + `updateEntity()`
  - SCALE.ts → `scaleIEntity()` + `updateEntity()`
  - copy.ts → `cloneIEntity()` + `translateIEntity()`
  - mirror.ts → `mirrorIEntity()` + `cloneIEntity()` + `updateEntity()`
- [x] `grep "extends BaseEntity"` → 0 matches trong entity files
- [x] `grep "as BaseEntity"` → 0 matches trong CadEngine + commands
- [x] 154/154 tests pass

## ✅ PHASE 4.1: CadDrawingCanvas Split — Types & Overlays (STEP-4.1) — DONE

- [x] **canvas.types.ts** (NEW): Canonical source cho DrawingState, LayerInfo, DimensionGripType, DimensionGrip
- [x] **SelectionHighlight.tsx** (NEW): SVG overlay cho selection box (window + crossing modes)
- [x] **CadDrawingCanvas.tsx**: Inline types → import from canvas.types.ts (7412 → 6710 dòng, **-702 dòng**)
- [x] **utils/types.ts**: Duplicate types → re-export from canvas.types.ts
- [x] **overlay/index.ts**: Added SelectionHighlight export
- [x] 154/154 tests pass

---

## ✅ PHASE 5: CadDrawingCanvas Split — Hooks (STEP-5) — DONE

> Kết quả: CadDrawingCanvas.tsx 7282 → 1135 dòng (84.4% reduction)

### Extracted Hooks (9 hooks)

- [x] **useCanvasRenderer** (1537 lines): Canvas 2D rendering, grid, entities, dimensions, preview
- [x] **useKeyboardHandler** (942 lines): All keyboard shortcuts + text scale
- [x] **useMouseHandlers** (1243 lines, was 2367): Mouse down/move/up, selection box, entity hit testing
  - [x] **mouseHandlers/modifyMouseDown.ts** (708 lines): All modify command mouseDown logic
  - [x] **mouseHandlers/dimensionMouseMove.ts** (248 lines): Dimension moving + grip editing
  - [x] **mouseHandlers/hoverDetection.ts** (279 lines): All hover detection logic
- [x] **useEntityOperations** (305 lines): selectEntities, addEntity, delete, copy, paste, move
- [x] **useDynamicInputHandlers** (170 lines): rect/circle/rotate angle dynamic input handlers
- [x] **useToolChangeEffect** (278 lines): Tool change → drawState + prompt transitions
- [x] **useTriggerEffects** (185 lines): Trigger undo/redo/delete/clear/textScale effects
- [x] **useDoorDragDrop** (175 lines): Door drag & drop state + handlers
- [x] **useCanvasEffects** (270 lines): 10 misc effects (resize, RAF, wheel, step, offset, etc.)

### Extracted Overlay Components (6 components)

- [x] **DoorOverlay** (230 lines): Door SVG overlay + ghost preview
- [x] **RotateAngleInputOverlay** (140 lines): Rotate angle input
- [x] **TextScaleInputOverlay** (165 lines): Text scale input
- [x] **TextInputCommandOverlay** (115 lines): Command-based TEXT input
- [x] **TextInputLegacyOverlay** (210 lines): Legacy TEXT input with entity CRUD
- [x] **DynamicInputSection** (245 lines): DynamicInputOverlay wrapper

### Definition of Done

- [x] CadDrawingCanvas.tsx = 1135 dòng (154/154 tests, 0 TS errors)
- [x] props → canvas.types.ts (~395 lines)
- [x] Full manual test suite pass

---

## ✅ PHASE 5.2: CanvasEntityCommands Split (STEP-5.2) — DONE

> Kết quả: CanvasEntityCommands.ts 3543 → 1064 dòng (70% reduction)

### Extracted Command Files (5 commands + shared utils)

- [x] **canvasCommandUtils.ts** (~140 lines): CanvasCommandContext, generateCanvasId(), validateCanvasUpdates(), mapCanvasTypeToEntityType(), validateCanvasProperty()
- [x] **TrimCanvasEntityCommand.ts** (~940 lines): Line/circle/arc trim with cutting edges
- [x] **FilletCanvasEntityCommand.ts** (~550 lines): Fillet between 2 lines (radius=0, arc, parallel)
- [x] **ExtendCanvasEntityCommand.ts** (~310 lines): Extend line to boundary edges
- [x] **OffsetCanvasEntityCommand.ts** (~240 lines): Offset line/polyline/rect/circle
- [x] **ExplodeCanvasEntitiesCommand.ts** (~185 lines): Explode rect→4 lines, polyline→lines

### What Remains in CanvasEntityCommands.ts (~1064 lines)

- CRUD: Add, Delete, NewDocument, Update, BatchAdd
- Selection: Select, ClearSelection
- Transforms: Move, Rotate, Mirror, Scale, Copy
- Re-exports extracted commands for backward compatibility (zero consumer changes)

### Definition of Done

- [x] CanvasEntityCommands.ts = 1064 dòng (was 3543)
- [x] 154/154 tests pass, 0 TS errors
- [x] Zero consumer import changes needed (barrel re-export pattern)

---

## ✅ PHASE 5.3: BookThietKeBocTachPage Split (STEP-5.3) — DONE

> Kết quả: BookThietKeBocTachPage.tsx 3323 → 2176 dòng (34.5% reduction)

### Extracted Hooks (3 hooks)

- [x] **useModifyCommands.ts** (~696 lines): All 11 modify command completion handlers
  - handleModifyMoveComplete, handleModifyCopyComplete, handleModifyRotateComplete
  - handleModifyMirrorComplete, handleModifyScaleComplete, handleModifyOffsetComplete
  - handleTrimComplete, handleExtendComplete, handleExplodeCommand
  - handleFilletComplete, handleBoundaryComplete
  - Internal useEffect sync for handleExplodeCommandRef
- [x] **usePageCommands.ts** (~392 lines): AutoCAD-style command dispatcher (handleCommand)
  - Maps command strings (L, R, C, CO, M, TR, EX...) to ToolMode actions
  - Handles: tool selection, dimension commands, RULE 5 selection priority
  - ERASE with doors/dimensions, OFFSET distance, grid/ortho/snap toggles
- [x] **useKeyboardShortcuts.ts** (~406 lines): Keyboard event handler
  - Ctrl+C (ClipboardManager), Ctrl+V (paste mode), Ctrl+A (select all), Delete
  - ESC cascade (8 levels), Enter/Space (execute buffer), Backspace
  - Ctrl+K (command palette), RULE 2 command lock, alphanumeric buffer

### Definition of Done

- [x] BookThietKeBocTachPage.tsx = 2176 dòng (was 3323)
- [x] 154/154 tests pass, 0 TS errors
- [x] Barrel re-export via hooks/index.ts

## ✅ PHASE 5.4: useDimensions Split (STEP-5.4) — DONE

> Kết quả: useDimensions.ts 1837 → 546 dòng (70.3% reduction)

### Extracted Sub-Hooks (3 hooks)

- [x] **useDimensionClick.ts** (~780 lines): Click handler for all dimension types
  - handleClick: switch on dimensionType — DLI, DHO, DVE, DAL, DCO, baseline, DAN, DRA, DAR
  - snapToEntityRef: Converts OSNAP result to EntityReference with pointIndex
  - startContinueMode, startBaselineMode, exitChainMode
- [x] **useDimensionPreview.ts** (~410 lines): Mouse move handler for dimension preview
  - handleMove: Preview rendering for all dimension types during mouse movement
  - Owns preview state (previewDimension, previewDimensions)
- [x] **useDimensionQdim.ts** (~170 lines): Quick Dimension (QDIM) sub-feature
  - startQdim, setQdimEntities, setQdimMode, confirmQdim
  - Uses BatchAddDimensionCommand for History (ĐIỀU KIỆN 1)

### What Remains in useDimensions.ts (~546 lines)

- Types/interfaces, state setup (managerRef, getDocument, dimensions, refreshDimensions)
- Legacy dimension detection (isLegacyEntityType, shouldBeLegacyDimension)
- addDimensionInternal helper
- Tool control: startDimensionTool, cancelDimensionTool, setDirection, toggleAutoSelectMode
- CRUD: addDimension, removeDimension, updateDimension, clearDimensions
- setStyle, renderDimensions
- Sub-hook composition and return statement

### Definition of Done

- [x] useDimensions.ts = 546 dòng (was 1837)
- [x] 154/154 tests pass, 0 TS errors
- [x] Barrel re-export via hooks/index.ts

---

## ✅ PHASE 5.5: BookThietKeBocTachPage Phase 2 (STEP-5.5) — DONE

> Kết quả: BookThietKeBocTachPage.tsx 2176 → 1599 dòng (26.5% reduction)

### Extracted Hooks (3 hooks)

- [x] **useDoorHandlers.ts** (~354 lines): Door template overlay, config dialog, drag/drop
  - Template overlay: handleOpenTemplateOverlay, handleCloseTemplateOverlay, handleSelectTemplate, handleTemplateDragStart
  - Config dialog: handleDoorDoubleClick, handleConfigDialogClose, handleConfigDialogConfirm
  - Drag/drop: handleDoorDrop, handleDoorMove
  - State: templateOverlayOpen, templateOverlayCategory, templateOverlaySubCategory, configDialogOpen, configDialogDoor, configDialogDoorId
  - ĐIỀU KIỆN 1 compliant: Uses AddDoorCommand, UpdateDoorCommand, MoveDoorCommand
- [x] **useToolbar.ts** (~315 lines): Tool groups, tool selection, osnap modes
  - toolGroups: Memoized tool categories (Draw, Modify, Measure, Dimension, Zoom, Actions)
  - handleSelectTool, handleToolChange (internal), handleToggleOsnapMode
  - activeToolString: Human-readable name for active ToolMode
  - osnapModes state management
- [x] **useStyleHandlers.ts** (~258 lines): Style editing for selected entities + default style
  - displayStyle: Computed from selected entities or current style
  - hasSelectedEntity: Computed boolean for UI conditional rendering
  - 7 handlers: handleStrokeColorChange, handleFillColorChange, handleOpacityChange, handleStrokeStyleChange, handleStrokeWidthChange, handleExport, handleColorChange

### Definition of Done

- [x] BookThietKeBocTachPage.tsx = 1599 dòng (was 2176)
- [x] 154/154 tests pass, 0 TS errors
- [x] Barrel re-export via hooks/index.ts

---

## ✅ PHASE 5.6: ExportManager Split (STEP-5.6) — DONE

> Kết quả: ExportManager.ts 1780 → 135 dòng (92.4% reduction) — Thin facade pattern

### Extracted Modules (4 files)

- [x] **ExportSVG.ts** (~890 lines): All SVG export logic
  - exportToSVG, entityToSVGSimple, dimensionToSVGWorld, entityToSVGLegacy
  - generateSVGGrid, generateArrowDefs
  - Handles Y-flip, export modes (world/preview), dimension rendering
- [x] **ExportPNG.ts** (~219 lines): All PNG export logic
  - exportToPNG (sync, from canvas), exportToPNGAsync (offscreen)
  - drawGrid, drawEntityToCanvas
- [x] **ExportDXF.ts** (~212 lines): All DXF export logic
  - exportToDXF (full DXF file generation)
  - entityToDXF, rgbToAciColor
- [x] **ExportUtils.ts** (~423 lines): Shared utility functions
  - calculateBounds (with TEXT/DIMENSION awareness)
  - calculateBoundsWithDimSizes (explicit dim sizes variant)
  - downloadFile

### ExportManager.ts — Thin Facade

- [x] Keeps type exports: ExportFormat, ExportOptions, ExportResult
- [x] Static methods delegate to extracted modules
- [x] Zero consumer import changes needed (backward-compatible API)

### Definition of Done

- [x] ExportManager.ts = 135 dòng (was 1780)
- [x] 154/154 tests pass, 0 TS errors
- [x] index.ts updated with direct module exports

---

## ✅ PHASE 5.7: useCommandDrawing Split (STEP-5.7) — DONE

> Kết quả: useCommandDrawing.ts 1609 → 649 dòng (59.7% reduction) — Sub-hook + shared internals pattern

### Extracted Modules (5 files)

- [x] **commandDrawing.types.ts** (~115 lines): Type definitions + CommandDrawingInternals interface
  - CommandDrawingConfig, CommandDrawingState, CommandDrawingActions, UseCommandDrawingReturn
  - CommandDrawingInternals (shared context for sub-hooks)
- [x] **commandDrawingHelpers.ts** (~212 lines): Pure helper functions
  - DRAWING_TOOLS, isDrawingTool, createCommand (factory)
  - mapEntityType, convertToCadEntity, applyOrthoMode
  - restartDrawingCommand (DRY helper replacing 9 duplicate patterns)
- [x] **usePolygonHandlers.ts** (~309 lines): Polygon sub-hook
  - handlePolygonOption, handlePolygonInput, handlePolygonSidesRadius, getPolygonSides
- [x] **useTextHandlers.ts** (~210 lines): Text sub-hook
  - handleTextOption, handleTextInput, isWaitingForTextInput
- [x] **useDimensionInputHandlers.ts** (~305 lines): Dynamic input sub-hook
  - handleLineInput, handleRectInput, handleCircleInput

### useCommandDrawing.ts — Orchestrator

- [x] Builds CommandDrawingInternals shared context object
- [x] Calls sub-hooks: usePolygonHandlers, useTextHandlers, useDimensionInputHandlers
- [x] Keeps core handlers: handleMouseDown, handleMouseMove, handleRightClick, handleEnter, handleEscape
- [x] Composes final {state, actions} return from sub-hook results + core handlers
- [x] Re-exports types for backward compatibility

### Definition of Done

- [x] useCommandDrawing.ts = 649 dòng (was 1609)
- [x] 154/154 tests pass, 0 TS errors
- [x] handlers/index.ts updated with types from commandDrawing.types.ts

---

## ✅ PHASE 5.8: CadDocument Split (STEP-5.8) — DONE

> Kết quả: CadDocument.ts 1548 → 488 dòng (68.5% reduction) — Delegate pattern + DI context

### Extracted Files

1. **CadDocument.types.ts** (91 dòng)
   - All type/interface definitions: CanvasPoint, CanvasEntity, DocumentMetadata, DocumentUnits, DocumentViewport, DocumentData
   - Re-exported from CadDocument.ts for backward compatibility

2. **DimensionDocumentService.ts** (755 dòng)
   - Complete dimension subsystem: validation, CRUD, index, lifecycle
   - `DimensionDocumentContext` interface: `{ getCanvasEntity, markModified }` (dependency injection)
   - Owns: `dimensions` Map + `entityToDimensionIndex` Map
   - Methods: validateDimensionRefs, addDimension/addDimensions, getDimension, restoreDimension/restoreDimensions, updateDimension, removeDimension/removeDimensions, getAllDimensions, getDimensionCount, hasDimension, clearDimensions, rebuildDimensionIndex, getDimensionsForEntity, commitEntityGeometryChange, commitEntitiesGeometryChange, handleEntityDeleted, addLegacyRadialDimension, loadFromData

### CadDocument.ts — Facade (488 dòng)

- Imports + re-exports types from CadDocument.types.ts
- Creates DimensionDocumentService in constructor with injected context
- 18 one-liner delegation methods for backward compatibility
- Keeps: Entity CRUD, Canvas Entity CRUD, Canvas Selection, Door CRUD, Selection Helpers, Serialization, Document State

### Checklist

- [x] CadDocument.types.ts = 91 dòng (was inline in CadDocument.ts)
- [x] DimensionDocumentService.ts = 755 dòng (extracted from CadDocument.ts)
- [x] CadDocument.ts = 488 dòng (was 1548)
- [x] document/index.ts updated with new exports
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed (delegation pattern preserves API)

---

## ✅ PHASE 5.9: useCanvasRenderer Split (STEP-5.9) — DONE

> Kết quả: useCanvasRenderer.ts 1537 → 384 dòng (75% reduction) — Pure function extraction + DRY merge

### Extracted Files (renderers/ subdirectory)

1. **drawEntities.ts** (383 dòng)
   - Main entity rendering loop: style resolution (ByLayer/Custom), all shape types (line, polyline, rect, circle, arc, ellipse, text)
   - Fill support, selection highlights, hover overlay, selection grips per entity type

2. **drawModifyPreview.ts** (258 dòng)
   - Ghost entities for modify commands: transform logic per mode (move/copy, rotate, mirror, scale)
   - Ghost dimension preview for MOVE/COPY (dimension lines, extension lines, text, arrow markers)
   - Mirror line preview (magenta dashed)

3. **drawDynamicDimension.ts** (99 dòng)
   - DRY merge of two near-identical ~110-line blocks (MOVE/COPY + DRAG MOVING)
   - Vector line, base point marker, distance/angle/ΔX/ΔY HUD with dark background boxes

4. **drawCommandPreview.ts** (265 dòng)
   - Command-based drawing preview (ĐIỀU KIỆN 1) with inline dynamic dimensions
   - Line/Polyline + distance/angle, Rect + width/height, Circle + radius, Arc, Ellipse, Text

5. **drawPastePreview.ts** (58 dòng)
   - Paste mode ghost entities following cursor
   - Offset entities + cyan dashed rendering for line, polyline/rect, circle

6. **renderers/index.ts** (9 dòng) — Re-exports all 5 functions

### useCanvasRenderer.ts — Thin Orchestrator (384 dòng)

- Imports renderer functions from `./renderers`
- CanvasRendererParams interface (unchanged API)
- Sequential calls: canvas setup → grid → compute displayEntities → drawModifyPreview → drawDynamicDimension → OFFSET inline → drawEntities → drawCommandPreview → drawPastePreview → selection box → dimensions → crosshair → OSNAP
- OFFSET preview kept inline (~30 lines, too small to extract)

### Checklist

- [x] drawEntities.ts = 383 dòng (entity rendering loop)
- [x] drawModifyPreview.ts = 258 dòng (ghost entities + dims + mirror)
- [x] drawDynamicDimension.ts = 99 dòng (DRY merge of duplicate blocks)
- [x] drawCommandPreview.ts = 265 dòng (command preview + inline dims)
- [x] drawPastePreview.ts = 58 dòng (paste mode ghosts)
- [x] useCanvasRenderer.ts = 384 dòng (was 1537)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed (same `{ draw }` return)

---

## ✅ PHASE 5.10: DimensionManager Split (STEP-5.10) — DONE

> Kết quả: DimensionManager.ts 1307 → 488 dòng (63% reduction) — Types + Geometry + Rendering + QDIM extracted

### Extracted Files (core/dimensions/)

1. **dimension.types.ts** (197 dòng)
   - All type/interface definitions: Point, EntityReference, DimensionType (12 variants), DimensionDirection, QdimMode, DimensionStyle (20 props), DimensionEntity (full interface with isLegacy flag)
   - Parameter types: LinearDimensionParams, AngularDimensionParams, RadiusDimensionParams, ArcDimensionParams
   - DEFAULT_DIMENSION_STYLE constant

2. **dimensionGeometry.ts** (181 dòng)
   - Pure math functions (stateless, `this.scale` → explicit `scale` parameter with default `1`)
   - Functions: calculateDistance, calculateHorizontalDistance, calculateVerticalDistance, calculateLineIntersection, autoDetectLinearDirection, detectDirectionFromOffset, calculateOffsetFromMouse, calculateAngle, formatValue

3. **DimensionRenderer.ts** (508 dòng)
   - Canvas2D rendering for all dimension types (stateless)
   - Main export: `renderDimension(ctx, dimension, viewTransform, dimensionScale)` dispatches to type-specific renderers
   - Private helpers: transformPoint, drawArrow
   - Renderers: renderLinearDimension, renderArcDimension, renderAngularDimension, renderRadiusDimension, renderDiameterDimension
   - `dimensionScale` parameter separates viewport zoom from unit scale

4. **QdimService.ts** (317 dòng)
   - Quick Dimension (QDIM) subsystem with Dependency Injection pattern
   - Exports: QdimEntity interface, CreateLinearDimensionFn type
   - Functions: extractPointsFromEntities, sortPointsByDirection, detectQdimDirection, createQdimContinuous, createQdimBaseline, createQdimStaggered
   - QDIM functions receive `createLinearDimension` callback (DI) instead of depending on DimensionManager class

### DimensionManager.ts — Thin Facade (488 dòng)

- Imports and re-exports all types for backward compatibility (30+ consumers)
- Class keeps: constructor, style management (setStyle/getStyle/setScale), 5 factory create methods, baseline/continue chain, getDimensionValue
- Delegates: geometry methods → dimensionGeometry (passing `this.scale`), renderDimension → DimensionRenderer (passing `this.scale`), QDIM → QdimService (passing `this.createLinearDimension.bind(this)`)
- Singleton export: `dimensionManager`

### index.ts — Updated Barrel (37 dòng)

- Re-exports from all 5 files
- Both `export * from "./DimensionManager"` (backward compat) and direct module exports

### Checklist

- [x] dimension.types.ts = 197 dòng (types + interfaces + constants)
- [x] dimensionGeometry.ts = 181 dòng (pure math functions)
- [x] DimensionRenderer.ts = 508 dòng (Canvas2D rendering)
- [x] QdimService.ts = 317 dòng (QDIM subsystem with DI)
- [x] DimensionManager.ts = 488 dòng (was 1307)
- [x] index.ts = 37 dòng (updated barrel)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed (same exports via re-export)

---

## ✅ PHASE 5.11: FabricAdapter Split (STEP-5.11) — DONE

> Kết quả: FabricAdapter.ts 1433 → 582 dòng (59% reduction) — EntityFactory + PrimitiveDrawer + OverlayManager + GridRenderer extracted

### Extracted Files (adapters/canvas/)

1. **FabricEntityFactory.ts** (331 dòng)
   - Pure factory functions converting CAD entities → Fabric.js objects (stateless)
   - Main export: `createFabricObject(entity, options?)` — dispatcher routing EntityType to 7 specific factories
   - Also exports: `createArrowHead`, `createRenderedObject`, `DEFAULT_STROKE/FILL/TEXT_STYLE`, `Entity` type
   - Private factories: createLineObject, createRectObject, createCircleObject, createArcObject, createPolylineObject, createTextObject, createDimensionObject

2. **FabricPrimitiveDrawer.ts** (249 dòng)
   - Standalone primitive drawing API (shapes not tied to CAD entities)
   - Pattern: Each function takes `canvas: fabric.Canvas` as first param
   - Exports: drawLine, drawRect, drawCircle, drawArc, drawPolyline, drawText, drawPath
   - Private helper: `generateId(prefix)` for unique IDs

3. **FabricOverlayManager.ts** (339 dòng)
   - Transient UI overlay management (ephemeral visual feedback)
   - Exports: `OverlayState` interface, `createOverlayState()` factory
   - 14 functions: showSelectionBox/hide, highlightEntity/unhighlight, showHandles/hide, showCrosshair/hide, showSnapIndicator/hide, drawPreview/clear, drawRubberBand/clear
   - Pattern: All functions take `canvas` + `state: OverlayState` as first params

4. **FabricGridRenderer.ts** (138 dòng)
   - Grid rendering and configuration
   - Exports: `GridConfig` interface, `GridState` interface, `createGridState(config?)`
   - Functions: showGrid, hideGrid, setGridStyle, updateGrid
   - Pattern: `screenToWorld` passed as callback for viewport-aware grid computation

### FabricAdapter.ts — Thin Facade (582 dòng)

- Keeps: lifecycle (initialize/dispose/resize/setupEventListeners), viewport (updateViewport/zoomToFit), entity CRUD (renderEntity/renderEntities/updateEntity/removeEntity/clearEntities), layers, spatial queries, export, utility
- State: `overlayState: OverlayState` (replaces 6 instance variables), `gridState: GridState` (replaces 2 instance variables), `entityMap`, `canvas`, `layerGroups`, `panOffset` kept
- Delegates: entity factories → FabricEntityFactory, primitive drawing → FabricPrimitiveDrawer, overlays → FabricOverlayManager, grid → FabricGridRenderer
- Only 2 consumers (CadCanvas.tsx, adapters/index.ts) — zero consumer changes needed

### Checklist

- [x] FabricEntityFactory.ts = 331 dòng (pure entity factories)
- [x] FabricPrimitiveDrawer.ts = 249 dòng (standalone drawing API)
- [x] FabricOverlayManager.ts = 339 dòng (transient UI overlays)
- [x] FabricGridRenderer.ts = 138 dòng (grid rendering)
- [x] FabricAdapter.ts = 582 dòng (was 1433)
- [x] 154/154 tests pass, 0 TS errors
- [x] Zero consumer changes needed (same exports via class)

---

## ✅ PHASE 5 EXPORT: IEntity-based Export Modules — DONE

> Kết quả: 5 export formats hoàn chỉnh, 260 tests, tất cả IEntity-based (không phụ thuộc canvas/UI)

### Phase 5.1: JSON Export (39 tests) ✅

- [x] `ExportJSON.ts`: `exportToJSON`, `parseCadFileJSON`, `importFromJSON`, `importFromJSONFull`, `validateCadJSON`
- [x] CadDocument `toJSON()` uses `serializeIEntity(e)` with legacy fallback
- [x] `fromJSON()` / `fromJSONString()` — entityFactory parameter optional
- [x] 39 roundtrip tests — all pass

### Phase 5.2: DXF Export (58 tests) ✅

- [x] `ExportDXF.ts`: `exportDocumentToDXF`, `iEntityToDXF`
- [x] All 8 entity types, proper DXF HEADER/TABLES/BLOCKS/ENTITIES/EOF structure
- [x] ACI color mapping, layer support
- [x] 47 DXF tests — all pass

### Phase 5.3: SVG Export (63 tests) ✅

- [x] `ExportSVGCore.ts` (~488 lines): `exportDocumentToSVG`, `iEntityToSVG`, `calculateIEntityBounds`
- [x] Y-flip via viewBox + `scale(1,-1)` root group
- [x] All 8 entity types, stroke styles, fill colors
- [x] 63 SVG tests — all pass

### Phase 5.4: PNG Export (49 tests) ✅

- [x] `ExportPNGCore.ts` (~370 lines): `preparePNGExport`, `renderIEntityToCtx`, `renderDocumentToCtx`
- [x] `ICanvasContext` interface for mock testing (no DOM needed)
- [x] `exportDocumentToPNG` / `exportDocumentToPNGAsync` — browser pipeline
- [x] 49 PNG tests — all pass

### Phase 5.5: PDF Export (62 tests) ✅

- [x] `ExportPDFCore.ts` (~695 lines): `exportDocumentToPDF`, `iEntityToPDFOps`, `getPageDimensions`, `hexToRgb01`
- [x] Pure PDF 1.4 string generation — no external library dependency
- [x] Paper sizes: A4, A3, A2, A1, A0, custom (mm → PDF points)
- [x] All 8 entity types: LINE, RECT, CIRCLE, ARC, ELLIPSE, POLYLINE, TEXT, DIMENSION
- [x] Title block with border, title, author, scale label
- [x] Stroke styles: solid, dashed, dotted, dashdot
- [x] Circle/Arc/Ellipse: Bézier curve approximation (4 cubic segments)
- [x] Options: includeHidden, includeText, includeDimensions, backgroundColor
- [x] ExportManager facade integration + index.ts barrel exports
- [x] 62 PDF tests — all pass

### ExportManager Facade (~222 lines)

- [x] Thin facade delegating to 5 format modules
- [x] Methods: `exportDocumentToSVG`, `exportDocumentToPNG`, `exportDocumentToPDF`, `exportDocumentToDXF`, `exportToJSON`, `importFromJSON`
- [x] All exports re-exported via `core/export/index.ts`

---

## 🔮 FUTURE PHASES — ĐỊNH HƯỚNG PHÁT TRIỂN CHI TIẾT

> **Thứ tự ưu tiên**: Phase NEXT → Phase 4 → Phase 6 → Phase 7 → Phase 9 → Phase 8 (tương lai xa)
> **Nguyên tắc**: Mỗi Phase phải có tests, mỗi file ≤ 800 dòng, IEntity-based
> **3 mục tiêu luôn giữ**: Extensible → 3D-ready → Integration-ready

---

### 🏁 PHASE NEXT (sắp tới) — DXF Import + Advanced Drawing Tools

**Mục tiêu**: Hoàn thiện import/export cycle + thêm các drawing tools nâng cao

| Task | Ưu tiên | Mô tả |
|------|----------|--------|
| DXF Import | ⭐ Cao | Parse DXF → IEntity[], hỗ trợ 8 entity types, layer mapping |
| SVG Import | Trung bình | Parse SVG → IEntity[], path/rect/circle/text |
| SPLINE tool | Trung bình | B-spline/NURBS curve, control points, knot vector |
| HATCH pattern | Thấp | Pattern filling cho closed regions |
| BLOCK system | Thấp | Block definition + insertion + nested blocks |
| ARRAY tool | Thấp | Rectangular & polar array |

---

### 🔬 PHASE 4 — GEOMETRY ABSTRACTION (3D-READY)

> Thời gian: 1-2 tuần
> Mục đích: Chuẩn bị nền tảng cho 3D, KHÔNG viết 3D code
> Tuân thủ: R4 (geometry kỹ thuật chỉ trong door-engines)

#### 4.1 IVector Interface

```typescript
// core/geometry/IVector.ts

/** Abstract vector — works for both 2D and 3D */
export interface IVector {
  x: number;
  y: number;
  z?: number; // Optional → backward compatible
}

/** Type guard */
export function isVector3D(v: IVector): v is IVector & { z: number } {
  return v.z !== undefined;
}
```

#### 4.2 Vec3 Class (song song với Vec2)

```typescript
// core/geometry/Vec3.ts

export class Vec3 implements IVector {
  constructor(
    public x: number,
    public y: number,
    public z: number,
  ) {}
  // ... methods tương tự Vec2 nhưng cho 3D
}
```

#### 4.3 Commands dùng IVector

- Audit tất cả Commands → parameter types dùng `IVector` thay `Vec2` hard type
- Commands xử lý z khi có, bỏ qua khi không → backward compatible

#### 4.4 ICanvasAdapter mở rộng

```typescript
// adapters/canvas/ICanvasAdapter.ts

interface ICanvasAdapter {
  // Existing 2D methods
  render2D(entities: EntityData[], options: RenderOptions): void;

  // Future 3D (optional)
  render3D?(entities: EntityData[], options: Render3DOptions): void;

  // Feature detection
  supports3D: boolean;
}
```

#### ⚠️ RANH GIỚI QUAN TRỌNG — Tuân thủ R4

```
IVector/Vec3 dùng cho:
  ✅ Entity positioning (line endpoints, circle center)
  ✅ Basic drawing geometry
  ✅ Camera/viewport transforms
  ✅ OSNAP point coordinates

IVector/Vec3 KHÔNG dùng cho:
  ❌ Door frame profiles → CHỈ trong door-engines/
  ❌ Sash cut dimensions → CHỈ trong door-engines/
  ❌ Glass dimensions → CHỈ trong door-engines/
  ❌ BOM calculations → CHỈ đọc EngineOutput
```

#### ✅ Checklist Phase 4

- [ ] IVector interface tạo xong
- [ ] Vec3 class tạo xong
- [ ] Commands dùng IVector (z optional)
- [ ] ICanvasAdapter có render3D optional
- [ ] Document lưu z khi có, bỏ qua khi không
- [ ] Tất cả tests từ Phase 3 vẫn pass (backward compatible)
- [ ] **R4 KHÔNG vi phạm**: IVector chỉ cho entity geometry, không cho door technical geometry
- [ ] **COMPLIANCE**: R4 ✅ F3 ✅

---

### 🗄️ PHASE 6 — BACKEND + API FOUNDATION

> ⚠️ **LƯU Ý**: Phase này giờ được quản lý phân tán tại các module riêng:
> - Schema DB & RBAC: `../shared/ROADMAP.md`
> - User/Role/Permission management: `../ThietLap/ROADMAP.md`
> - Master data (Customer, Supplier, Material...): `../DanhMuc/ROADMAP.md`
> Nội dung dưới đây là thiết kế ban đầu, giữ lại để tham khảo.

> Thời gian: 3-4 tuần
> Mục đích: Chuẩn bị cho kết nối app ngoài
> Tuân thủ: G2 (layer isolation — backend = layer mới, không xâm phạm core)

#### 6.1 Database

> ⚠️ Schema đã được cập nhật theo PERMISSION_CATALOG.md (7 bảng RBAC + business tables)

```
PostgreSQL + Prisma ORM

Schema RBAC (7 bảng — theo PERMISSION_CATALOG.md):
  org            (id, name, slug, plan, createdAt)
  user           (id, email, name, avatar, createdAt)
  org_member     (id, userId, orgId, status, joinedAt)
  role           (id, orgId, name, slug, isSystem, createdAt)
  permission     (id, resource, action, group, description)
  role_permission (roleId, permissionId)
  member_role    (memberId, roleId)

Schema Business:
  Project (id, name, orgId, createdByUserId, status, data JSON, createdAt, updatedAt)
  BomReport (id, projectId, data JSON, generatedAt)
  Quote (id, projectId, customerId, items, total, status, validUntil)
  Customer (id, orgId, name, phone, address, tier)
  Material (id, orgId, name, brand, unitPrice, unit, category)
```

#### 6.2 Authentication

> ⚠️ Roles đã được cập nhật theo PERMISSION_CATALOG.md (6 roles)

```
NextAuth.js + Prisma Adapter

Providers:
  - Email/Password (cho pilot đầu tiên)
  - Google (cho convenience)

Roles (theo PERMISSION_CATALOG.md — 6 roles):
  - OWNER: toàn bộ permission
  - ADMIN: gần như toàn bộ, trừ chuyển chủ sở hữu/xóa tenant
  - DESIGNER: thiết kế + bóc tách + BOM + xem báo giá
  - ACCOUNTANT: thu chi + công nợ + kế toán + hóa đơn
  - WAREHOUSE: kho + nhập/xuất/chuyển/kiểm kê
  - SALES: bán hàng + báo giá + khách hàng
```

#### 6.3 API Routes

```
src/app/api/
  auth/[...nextauth]/route.ts
  projects/
    route.ts          → GET (list), POST (create)
    [id]/route.ts     → GET, PUT, DELETE
    [id]/bom/route.ts → GET (calculate BOM)
    [id]/quote/route.ts → GET, POST (generate quote)
  materials/
    route.ts          → GET (catalog)
  customers/
    route.ts          → GET, POST
    [id]/route.ts     → GET, PUT
  export/
    [id]/dxf/route.ts → GET (download DXF)
    [id]/pdf/route.ts → GET (download PDF)
```

#### 6.4 Migrate Persistence

```
ProjectService (643 dòng):
  HIỆN TẠI: IndexedDB via projectStore
  SAU: PostgreSQL via Prisma + API routes

  Adapter pattern đã có → chỉ đổi implementation
  RemoteStorageAdapter → kết nối API routes
```

#### 6.5 Webhook Foundation

```
Khi events xảy ra → notify external systems:
  PROJECT_CREATED → webhook
  BOM_GENERATED → webhook
  QUOTE_APPROVED → webhook
  ORDER_CREATED → webhook
```

#### ✅ Checklist Phase 6

- [ ] Database schema deployed (PostgreSQL)
- [ ] Auth hoạt động (login/logout/roles)
- [ ] API CRUD cho Projects, Customers, Materials
- [ ] ProjectService dùng RemoteStorageAdapter → API
- [ ] Data không mất khi clear browser
- [ ] **G2**: Backend layer KHÔNG import core/entities, core/commands
- [ ] **G2**: Domain logic expose qua API, không duplicate
- [ ] **COMPLIANCE**: G1 ✅ G2 ✅

---

### 🏢 PHASE 7 — CÁC MODULE ERP

> ⚠️ **LƯU Ý**: Phase này giờ được quản lý riêng tại từng module:
> - Tổng quan: `../BookTongQuan/ROADMAP.md`
> - Bán hàng: `../BookBanHang/ROADMAP.md`
> - Mua hàng: `../BookMuaHang/ROADMAP.md`
> - Tồn kho: `../BookTonKho/ROADMAP.md`
> - Thu chi: `../BookThuChi/ROADMAP.md`
> - Kế toán: `../BookKeToan/ROADMAP.md`
> Nội dung dưới đây là thiết kế ban đầu, giữ lại để tham khảo.

> Thời gian: 6-8 tuần
> Mục đích: Hoàn thiện hệ sinh thái ALUBOK theo alubok-motahethong.md

#### 7.1 Tổng Quan (Dashboard) — 2 tuần

```
Hiện tại: 18 dòng
Cần implement:
  - KPIs: Doanh thu, Lợi nhuận, Công nợ, Tồn kho
  - Order flow: Báo giá → Đơn hàng → Giao → Lắp đặt → Thu
  - Biểu đồ: Revenue chart, top products, top customers
  - Thông báo: đơn hàng mới, tồn kho thấp, công nợ quá hạn
  - Truy cập nhanh: tạo báo giá, nhập hàng, kiểm tồn
```

#### 7.2 Bán Hàng (Sales) — 3 tuần

```
Hiện tại: 14 dòng
Cần implement:
  - Báo giá (từ module CAD → BOM → Quote)
  - Đơn hàng (convert quote → order)
  - Lắp đặt / Thi công (tracking)
  - Công nợ phải thu
  - Khách hàng (CRUD + tiers)
```

#### 7.3 Thu Chi (Cash Flow) — 2 tuần

```
Hiện tại: 14 dòng
Cần implement:
  - 2 tab: Tiền mặt / Ngân hàng
  - Danh mục thu chi
  - Đối soát tự động
  - Báo cáo dòng tiền
```

#### 7.4 Tồn Kho (Inventory) — 2 tuần

```
Hiện tại: 14 dòng
Cần implement:
  - 4 tab: Nhập / Xuất / Báo cáo / Sản phẩm
  - SKU management
  - Cảnh báo tồn kho tối thiểu
  - Kiểm kê
```

#### 7.5 Mua Hàng nâng cấp — 1 tuần

```
Hiện tại: MuaHangPage 696 dòng + categories
Cần thêm:
  - PO flow (tạo PO → duyệt → nhập kho)
  - Mua từ ALUBOK shop / Nhà cung cấp khác
```

#### 7.6 Door Engines bổ sung — 2 tuần

```
Hiện tại: Chỉ HingedDoor (403 dòng)
Thêm khi domain cần:
  - SlidingDoor engine
  - FoldingDoor engine
  - CasementDoor engine
  - AwningDoor engine
  - FixedDoor engine
  - PivotDoor engine

⚠️ Tuân thủ E3: engine chỉ chạy khi user yêu cầu BOM/Export
⚠️ Tuân thủ G2: door-engines/ KHÔNG import ui/hooks/store/domain
```

#### 🚀 Performance Optimization (trong Phase 7)

**Mục tiêu**: ≥1000 entities với 60fps, sẵn sàng cho dự án lớn

- [ ] Benchmark: 1000 entities → move all → ≤16ms (60fps)
- [ ] Virtual canvas / viewport culling (chỉ render entities trong viewport)
- [ ] Spatial index (R-tree/quadtree) cho hit testing
- [ ] WebGL renderer option (thay Canvas2D)
- [ ] Immutable clone overhead profiling

#### ✅ Checklist Phase 7

- [ ] Dashboard hiển thị KPIs từ database
- [ ] Sales flow: Quote → Order → Install → Collect
- [ ] Cash flow: Thu/Chi với đối soát
- [ ] Inventory: Import/Export/Report/Products
- [ ] Purchase: PO flow hoạt động
- [ ] ≥ 3 door engines hoạt động
- [ ] **E3**: Door engines chỉ chạy khi BOM/Export
- [ ] **G2**: Door engines không import chéo layer
- [ ] **COMPLIANCE**: G1 ✅ G2 ✅ E1 ✅ E2 ✅ E3 ✅

---

### 🎮 PHASE 8 — 3D IMPLEMENTATION (TƯƠNG LAI XA)

> ⚠️ **KHÔNG nằm trong kế hoạch ngắn/trung hạn.**
> Chỉ bắt đầu khi: dự án đã go-live, có user base thực tế, business flow ổn định.
> Hiện tại chỉ giữ kiến trúc **3D-ready** (không hardcode 2D) — KHÔNG build 3D.
> Nội dung dưới đây giữ lại để tham khảo kiến trúc.
>
> Thời gian: 8+ tuần
> Điều kiện tiên quyết: Phase 1-4 + dự án đã có nhiều người dùng thực tế
> Mục đích: Nâng cấp 3D thực sự

#### 8.1 Three.js Integration

```
npm install three @types/three @react-three/fiber @react-three/drei
```

#### 8.2 ThreeJsAdapter

```typescript
// adapters/canvas/ThreeJsAdapter.ts

class ThreeJsAdapter implements ICanvasAdapter {
  supports3D = true;

  render3D(entities: EntityData[], options: Render3DOptions): void {
    for (const entity of entities) {
      const config = entityRegistry.get(entity.type);
      config.render3D?.(entity, this.scene, options);
    }
  }
}
```

#### 8.3 3D Canvas Component

```
Cad3DCanvas.tsx — song song với CadCanvas.tsx
  - Three.js scene + camera + controls
  - Dùng cùng CadDocument (shared source of truth)
  - Split view: 2D bên trái, 3D bên phải
```

#### 8.4 3D Entity Rendering

```typescript
// EntityRegistry mở rộng:
entityRegistry.register({
  type: 'line',
  render3D: (entity, scene) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setFromPoints([
      new THREE.Vector3(entity.start.x, entity.start.y, entity.start.z ?? 0),
      new THREE.Vector3(entity.end.x, entity.end.y, entity.end.z ?? 0),
    ]);
    // ...
  }
});
```

#### 8.5 3D Features

| Feature                          | Effort | Dependency               |
| -------------------------------- | ------ | ------------------------ |
| Basic 3D view (orbit, pan, zoom) | 1 tuần | Phase 4 (IVector)        |
| Entity extrusion (2D → 3D)       | 2 tuần | Phase 1 (EntityRegistry) |
| 3D door visualization            | 3 tuần | Phase 7 (Door Engines)   |
| 3D OSNAP (raycasting)            | 2 tuần | Phase 2 (tách OSNAP)     |
| 3D dimensions                    | 2 tuần | Phase 4 (Vec3)           |
| Material textures                | 2 tuần | Domain materials         |

#### ✅ Checklist Phase 8

- [ ] Three.js render entities trong 3D scene
- [ ] Split view 2D + 3D share cùng Document
- [ ] Sửa entity trong 2D → 3D cập nhật real-time (và ngược lại)
- [ ] 3D door visualization từ DoorEngine output
- [ ] Orbit/Pan/Zoom mượt
- [ ] **R4**: 3D door geometry CHỈ từ door-engines
- [ ] **COMPLIANCE**: Tất cả rules vẫn đúng trong 3D context

---

### 🌐 PHASE 9 — COLLABORATION & CLOUD

**Mục tiêu**: Multi-user, versioning, cloud storage

- [ ] Real-time collaboration (WebSocket/CRDT)
- [ ] Drawing versioning (git-like history)
- [ ] Comments và annotations
- [ ] Change tracking
- [ ] Cloud save/load (API integration)
- [ ] STL/STEP export

---

### 📅 TIMELINE TỔNG QUAN

```
=== ĐÃ HOÀN THÀNH (04-08/03/2026) ===
  Phase 0    │ ✅ Dọn nền: 28 file rỗng xóa, Jest setup
  Phase 1    │ ✅ Foundation Fix: Selection + History + Entity (137 tests)
  Phase 2    │ ✅ Tách CadDrawingCanvas 7282→699 dòng (STEP-4.1 → STEP-5.26)
  Phase 3    │ ✅ Tests: 600/600 pass (geometry, commands, document, BOM, CadEngine)
  Phase 5    │ ✅ Export: JSON(39) + DXF(73) + SVG(63) + PNG(49) + PDF(62) = 286 tests
  Tổng       │   886/886 tests, 0 TS errors, 19 test suites, ~19s

=== CHƯA HOÀN THÀNH ===
  Phase NEXT │ ❌ DXF Import + SPLINE/HATCH/BLOCK/ARRAY
  Phase 4    │ ❌ Geometry Abstraction (IVector, Vec3) — 3D-ready
  Phase 6    │ ❌ Backend + API + Auth + DB (PostgreSQL + NextAuth)
  Phase 7    │ ❌ ERP Modules + Door Engines + Performance
  Phase 9    │ ❌ Collaboration & Cloud
  Phase 8    │ ❌ 3D Implementation (TƯƠNG LAI XA — khi đã có user base thực tế)
```

### 📊 GIÁ TRỊ ĐẠT ĐƯỢC SAU MỖI PHASE

| Phase | Milestone          | Giá trị                                                | Trạng thái  |
| ----- | ------------------ | ------------------------------------------------------ | ----------- |
| 0     | Nền sạch           | Dev experience tốt hơn                                 | ✅ DONE     |
| 1     | Foundation Fix     | **Code ổn định**, extensible, đúng COMPLIANCE          | ✅ DONE     |
| 2     | Tách God Component | **Maintainable**, team mới đọc hiểu được               | ✅ DONE     |
| 3     | Tests              | **Refactor an toàn**, CI/CD ready                      | ✅ 860/860  |
| 5     | Export             | **Có thể demo cho khách hàng** (5 formats)             | ✅ DONE     |
| NEXT  | Import + Tools     | **Có thể mở file AutoCAD** — giá trị cao               | ❌          |
| 4     | 3D-Ready           | Foundation cho tương lai 3D                            | ❌          |
| 6     | Backend            | **Có thể deploy** cho người dùng thật                  | ❌          |
| 7     | ERP                | **Hệ sinh thái hoàn chỉnh** theo alubok-motahethong.md | ❌          |
| 9     | Collaboration      | **Multi-user** — enterprise ready                      | ❌          |
| 8     | 3D                 | **CAD 3D** — TƯƠNG LAI XA (khi có user base thực tế)  | ❌          |

### 🔒 COMPLIANCE CROSS-REFERENCE

Mỗi Phase phải kiểm tra đối chiếu COMPLIANCE_CHECKLIST.md:

| Rule                     | Phase 0 | Phase 1 | Phase 2 | Phase 3 | Phase 4   | Phase 5 | Phase 6 | Phase 7   | Phase 8 |
| ------------------------ | ------- | ------- | ------- | ------- | --------- | ------- | ------- | --------- | ------- |
| G1 Unidirectional        | —       | ✅ Sửa  | ✅      | ✅      | —         | ✅      | ✅      | ✅        | ✅      |
| G2 Layer Isolation       | —       | ✅      | ✅ Sửa  | ✅      | ✅        | ✅      | ✅      | ✅        | ✅      |
| G3 PropertySchema        | —       | ✅ Sửa  | —       | ✅      | —         | —       | —       | ✅        | ✅      |
| R4 Geometry source       | —       | —       | —       | —       | ✅ Ghi rõ | —       | —       | ✅        | ✅      |
| R5 Entity data-only      | —       | ✅ Sửa  | —       | ✅      | ✅        | —       | —       | ✅        | ✅      |
| R7 Command+History       | —       | ✅      | ✅      | ✅      | ✅        | ✅      | ✅      | ✅        | ✅      |
| E3 Engine boundary       | —       | —       | —       | —       | —         | —       | —       | ✅ Ghi rõ | ✅      |
| F3 Single responsibility | —       | ✅      | ✅ Sửa  | —       | —         | —       | ✅      | —         | ✅      |

### ⚠️ TECHNICAL DEBT TỒN ĐỌNG

```
- FabricAdapter.ts: vẫn import old entity classes
- BaseEntity.ts: deprecated nhưng chưa xóa
- OsnapManager.ts, ConstraintSolver.ts: vẫn cast entities
- trim.ts (852 dòng), extend.ts, OFFSET.ts: vẫn dùng entity classes
- 0 E2E tests (cần Playwright)
- Performance benchmark chưa có
```

---

## 📁 FILES CREATED/MODIFIED (Refactor Progress)

### New Files Created

| File                                                   | Purpose                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `core/entities/EntityBridge.ts`                        | Bridge IEntity ↔ UnifiedEntity for EntityRegistry              |
| `core/entities/EntityBaseUtils.ts`                     | Standalone helpers (generateId, initBase, serialize)           |
| `core/entities/configs/*.ts`                           | 8 entity config files for EntityRegistry                       |
| `core/entities/EntityRegistry.ts`                      | Singleton registry for entity operations                       |
| `core/entities/EntityData.types.ts`                    | UnifiedEntity + geometry type definitions                      |
| `ui/canvas/canvas.types.ts`                            | Canonical DrawingState, LayerInfo, CadDrawingCanvasProps types |
| `ui/canvas/overlay/SelectionHighlight.tsx`             | SVG selection box overlay component                            |
| `ui/canvas/hooks/useCanvasRenderer.ts`                 | Canvas 2D rendering hook (1537 lines)                          |
| `ui/canvas/hooks/useKeyboardHandler.ts`                | Keyboard shortcuts hook (942 lines)                            |
| `ui/canvas/hooks/useMouseHandlers.ts`                  | Mouse handlers hook (712 lines, was 2367→1243→712)             |
| `ui/canvas/hooks/mouseHandlers/modifyMouseDown.ts`     | Modify command mouseDown logic (708 lines)                     |
| `ui/canvas/hooks/mouseHandlers/dimensionMouseMove.ts`  | Dimension moving + grip editing (248 lines)                    |
| `ui/canvas/hooks/mouseHandlers/hoverDetection.ts`      | Hover detection for all tool modes (279 lines)                 |
| `ui/canvas/hooks/useEntityOperations.ts`               | Entity CRUD + clipboard hook (305 lines)                       |
| `ui/canvas/hooks/useDynamicInputHandlers.ts`           | Dynamic input hooks (170 lines)                                |
| `ui/canvas/hooks/useToolChangeEffect.ts`               | Tool change effect hook (278 lines)                            |
| `ui/canvas/hooks/useTriggerEffects.ts`                 | Trigger effects hook (185 lines)                               |
| `ui/canvas/hooks/useDoorDragDrop.ts`                   | Door drag & drop hook (175 lines)                              |
| `ui/canvas/hooks/useCanvasEffects.ts`                  | Misc canvas effects hook (270 lines)                           |
| `ui/canvas/overlay/DoorOverlay.tsx`                    | Door SVG overlay component (230 lines)                         |
| `ui/canvas/overlay/RotateAngleInputOverlay.tsx`        | Rotate angle input overlay (140 lines)                         |
| `ui/canvas/overlay/TextScaleInputOverlay.tsx`          | Text scale input overlay (165 lines)                           |
| `ui/canvas/overlay/TextInputCommandOverlay.tsx`        | Command TEXT input overlay (115 lines)                         |
| `ui/canvas/overlay/TextInputLegacyOverlay.tsx`         | Legacy TEXT input overlay (210 lines)                          |
| `ui/canvas/overlay/DynamicInputSection.tsx`            | DynamicInputOverlay wrapper (245 lines)                        |
| `__tests__/core/geometry/Vec2.test.ts`                 | 17 geometry tests                                              |
| `__tests__/core/selection/selection.test.ts`           | 20 golden selection tests                                      |
| `__tests__/core/selection/selectionCommands.test.ts`   | 16 selection command tests                                     |
| `__tests__/core/history/historyBypass.test.ts`         | 10 history bypass tests                                        |
| `__tests__/core/entities/entityRegistry.test.ts`       | 15 EntityRegistry + LINE tests                                 |
| `__tests__/core/entities/entityConfigs.test.ts`        | 76 entity config tests (8 types)                               |
| `core/commands/canvas/canvasCommandUtils.ts`           | Shared utils: CanvasCommandContext, generateCanvasId, validate |
| `core/commands/canvas/TrimCanvasEntityCommand.ts`      | Trim command (~940 lines)                                      |
| `core/commands/canvas/FilletCanvasEntityCommand.ts`    | Fillet command (~550 lines)                                    |
| `core/commands/canvas/ExtendCanvasEntityCommand.ts`    | Extend command (~310 lines)                                    |
| `core/commands/canvas/OffsetCanvasEntityCommand.ts`    | Offset command (~240 lines)                                    |
| `core/commands/canvas/ExplodeCanvasEntitiesCommand.ts` | Explode command (~185 lines)                                   |
| `hooks/useModifyCommands.ts`                           | 11 modify command handlers (~696 lines)                        |
| `hooks/usePageCommands.ts`                             | Command dispatcher hook (~392 lines)                           |
| `hooks/useKeyboardShortcuts.ts`                        | Keyboard event handler hook (~406 lines)                       |
| `hooks/useDimensionClick.ts`                           | Dimension click handler (~780 lines)                           |
| `hooks/useDimensionPreview.ts`                         | Dimension preview/move handler (~410 lines)                    |
| `hooks/useDimensionQdim.ts`                            | Quick Dimension (QDIM) sub-feature (~170 lines)                |
| `core/export/ExportSVG.ts`                             | SVG export functions (~890 lines)                              |
| `core/export/ExportSVGCore.ts`                         | IEntity-based SVG export (~488 lines)                          |
| `core/export/ExportPNG.ts`                             | PNG export functions (~219 lines)                              |
| `core/export/ExportPNGCore.ts`                         | IEntity-based PNG export (~370 lines)                          |
| `core/export/ExportDXF.ts`                             | DXF export functions (~212 lines)                              |
| `core/export/ExportJSON.ts`                            | JSON export/import functions                                   |
| `core/export/ExportPDFCore.ts`                         | IEntity-based PDF 1.4 export (~695 lines)                      |
| `core/export/ExportUtils.ts`                           | Shared export utilities (~423 lines)                           |
| `__tests__/core/export/exportJSON.test.ts`             | 39 JSON roundtrip tests                                        |
| `__tests__/core/export/exportDXF.test.ts`              | 58 DXF export tests (AutoCAD 2013 compatible)                  |
| `__tests__/core/export/exportSVG.test.ts`              | 63 SVG export tests                                            |
| `__tests__/core/export/exportPNG.test.ts`              | 49 PNG export tests                                            |
| `__tests__/core/export/exportPDF.test.ts`              | 62 PDF export tests                                            |
| `ui/canvas/handlers/commandDrawing.types.ts`           | CommandDrawing types + internals interface (~115 lines)         |
| `ui/canvas/handlers/commandDrawingHelpers.ts`          | Pure helper functions + restartDrawingCommand (~212 lines)      |
| `ui/canvas/handlers/usePolygonHandlers.ts`             | Polygon sub-hook (~309 lines)                                  |
| `ui/canvas/handlers/useTextHandlers.ts`                | Text sub-hook (~210 lines)                                     |
| `ui/canvas/handlers/useDimensionInputHandlers.ts`      | Dynamic input sub-hook (~305 lines)                            |

### Modified Files

| File                                           | Change                                                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `core/entities/Entity.types.ts`                | IEntity: removed all method signatures                                                         |
| `core/entities/Line.ts`                        | Removed `extends BaseEntity`, uses initEntityBase()                                            |
| `core/entities/Rect.ts`                        | Same pattern                                                                                   |
| `core/entities/Circle.ts`                      | Same pattern                                                                                   |
| `core/entities/Arc.ts`                         | Same pattern                                                                                   |
| `core/entities/Ellipse.ts`                     | Same pattern                                                                                   |
| `core/entities/Polyline.ts`                    | Same pattern                                                                                   |
| `core/entities/Text.ts`                        | Same pattern                                                                                   |
| `core/entities/Dimension.ts`                   | Same pattern                                                                                   |
| `core/engine/CadEngine.ts`                     | Removed BaseEntity casts, added updateEntity(), uses EntityBridge                              |
| `core/commands/modify/MOVE.ts`                 | Uses translateIEntity() + updateEntity()                                                       |
| `core/commands/modify/rotate.ts`               | Uses rotateIEntity() + updateEntity()                                                          |
| `core/commands/modify/SCALE.ts`                | Uses scaleIEntity() + updateEntity()                                                           |
| `core/commands/modify/copy.ts`                 | Uses cloneIEntity() + translateIEntity()                                                       |
| `core/commands/modify/mirror.ts`               | Uses mirrorIEntity() + cloneIEntity()                                                          |
| `ui/canvas/CadDrawingCanvas.tsx`               | 7282 → 1135 lines: types, hooks, overlays extracted                                            |
| `ui/canvas/utils/types.ts`                     | Re-exports from canvas.types.ts                                                                |
| `core/commands/canvas/CanvasEntityCommands.ts` | 3543 → 1064 lines: 5 commands extracted to separate files                                      |
| `BookThietKeBocTachPage.tsx`                   | 3323 → 2176 lines: 3 hooks extracted (modify, commands, keyboard)                              |
| `hooks/index.ts`                               | Added useModifyCommands, usePageCommands, useKeyboardShortcuts, useDimensionClick/Preview/Qdim |
| `hooks/useDimensions.ts`                       | 1837 → 546 lines: 3 sub-hooks extracted (click, preview, qdim)                                 |
| `core/export/ExportManager.ts`                 | 1780 → 222 lines: thin facade delegating to 5 export format modules (SVG/PNG/DXF/JSON/PDF)      |
| `core/export/index.ts`                         | Barrel re-exports for all 5 export format modules + ExportUtils                                 |
| `ui/canvas/handlers/useCommandDrawing.ts`      | 1609 → 649 lines: orchestrator delegating to 5 extracted files                                  |
| `ui/canvas/handlers/index.ts`                  | Types re-exported from commandDrawing.types.ts                                                  |
| `core/document/CadDocument.ts`                 | 1548 → 488 lines: facade delegating dimensions to DimensionDocumentService                      |
| `core/document/CadDocument.types.ts`           | Extracted: CanvasPoint, CanvasEntity, DocumentMetadata, DocumentUnits, DocumentViewport, DocumentData |
| `core/document/DimensionDocumentService.ts`    | Extracted: complete dimension subsystem (validation, CRUD, index, lifecycle) — 755 lines         |
| `core/document/index.ts`                       | Added re-exports from CadDocument.types.ts + DimensionDocumentService                           |

---

## 🔍 TECHNICAL DEBT REMAINING

1. ~~**CadDrawingCanvas.tsx** — Vẫn 6710 dòng, cần STEP-5 tách hooks xuống ≤800~~ ✅ **DONE** (699 dòng)
   1b. ~~**useMouseHandlers.ts** — 2367 dòng, cần tách xuống ≤1200~~ ✅ **DONE** (712 dòng + 7 helper files)
   1c. ~~**CanvasEntityCommands.ts** — 3543 dòng, cần tách commands lớn~~ ✅ **DONE** (1064 dòng + 5 command files + utils)
   1d. ~~**BookThietKeBocTachPage.tsx** — 3323 dòng, god page cần tách hooks~~ ✅ **DONE** (2176 dòng + 3 hooks)
   1e. ~~**useDimensions.ts** — 1837 dòng, cần tách sub-hooks~~ ✅ **DONE** (546 dòng + 3 sub-hooks)
   1f. ~~**ExportManager.ts** — 1780 dòng, cần tách format modules~~ ✅ **DONE** (135 dòng + 4 module files)
   1g. ~~**useCommandDrawing.ts** — 1609 dòng, cần tách sub-hooks~~ ✅ **DONE** (649 dòng + 5 extracted files)
   1h. ~~**CadDocument.ts** — 1548 dòng, cần tách dimension subsystem~~ ✅ **DONE** (488 dòng + 2 extracted files)
   1i. ~~**SvgAdapter.ts** — 1243 dòng, parallel SVG adapter~~ ✅ **DONE** (478 dòng + 4 extracted files)
2. **FabricAdapter.ts** — Vẫn import old entity classes trực tiếp
3. **BaseEntity.ts** — Deprecated nhưng chưa xóa (chờ migration hoàn tất)
4. **OsnapManager.ts, ConstraintSolver.ts** — Vẫn cast entities
5. **trim.ts (852 dòng), extend.ts, OFFSET.ts** — Vẫn dùng entity classes trực tiếp
6. **0 E2E tests** — Cần Playwright cho V1–V53
7. **Performance benchmark chưa có** — Cần đo immutable clone overhead

---

## ✅ STEP-5.13: SvgAdapter Split — DONE

> Kết quả: SvgAdapter.ts 1243 → 478 dòng (62% reduction) — Mirrors FabricAdapter STEP-5.11 pattern exactly

### Extracted Files (adapters/canvas/)

1. **SvgEntityFactory.ts** (259 dòng)
   - Pure SVG string generation from CAD entities (stateless functions)
   - Main export: `entityToSvg(entity, options?, defsElement?)` — dispatcher routing EntityType to 7 specific converters
   - Also exports: `SvgElement` interface, `Entity` type union, `DEFAULT_STROKE/TEXT_STYLE`, `ensureArrowheadMarker`, `getTextAnchor`, `escapeXml`
   - Private converters: lineToSvg, rectToSvg, circleToSvg, arcToSvg, polylineToSvg, textToSvg, dimensionToSvg

2. **SvgPrimitiveDrawer.ts** (234 dòng)
   - Standalone SVG primitive drawing API (shapes not tied to CAD entities)
   - Pattern: Each function takes `mainGroup: SVGGElement | null` as first param
   - Exports: drawLine, drawRect, drawCircle, drawArc, drawPolyline, drawText, drawPath, generateSvgId

3. **SvgOverlayManager.ts** (271 dòng)
   - UI overlay management: selection box, highlights, handles, crosshair, snap indicators, preview, rubber band
   - Pattern: Pure functions taking `uiGroup/previewGroup/mainGroup` as first param
   - 14 exported functions: show/hide pairs for selection, highlight, handles, crosshair, snap + drawPreview/clearPreview/drawRubberBand/clearRubberBand

4. **SvgGridRenderer.ts** (106 dòng)
   - Grid rendering with state management
   - Exports: `SvgGridState` interface, `createSvgGridState()` factory, showSvgGrid/hideSvgGrid/updateSvgGrid
   - Functions take `gridGroup`, `state`, `screenToWorld/worldToScreen` callbacks, `width/height`

### SvgAdapter.ts Facade (478 dòng)

- Keeps: lifecycle (initialize/dispose/resize), viewport (updateViewport/zoomToFit), entity CRUD (render/update/remove/clear), layers, spatial queries, export (toDataURL/toSVG/toJSON), getSvgElement
- State: `gridState: SvgGridState` replaces 3 instance variables (gridVisible, gridSpacing, gridMajorEvery)
- Delegates primitives → SvgPrimitiveDrawer, overlays → SvgOverlayManager, grid → SvgGridRenderer, entity conversion → SvgEntityFactory
- Crosshair: facade calls `this.worldToScreen(position)` before delegating to overlay function
- Zero consumer changes (SvgAdapter only re-exported from adapters/index.ts barrel, no direct consumers)

### Checklist

- [x] SvgEntityFactory.ts = 259 dòng (entity → SVG string conversion)
- [x] SvgPrimitiveDrawer.ts = 234 dòng (standalone primitive drawing)
- [x] SvgOverlayManager.ts = 271 dòng (14 overlay functions)
- [x] SvgGridRenderer.ts = 106 dòng (grid state + rendering)
- [x] SvgAdapter.ts = 478 dòng (was 1243)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

---

## ✅ STEP-5.14: PropertySchema Split — DONE

> Kết quả: PropertySchema.ts 1136 → 333 dòng (71% reduction) — Types/config/schemas extracted, Registry stays

### Extracted Files (core/properties/)

1. **propertySchema.types.ts** (107 dòng)
   - All type definitions: `PropertyValueType`, `PropertyDefinition`, `EnumOption`, `ValidationResult`, `PropertyCategory` enum, `EntitySchema` interface
   - Pure types — no runtime code, no dependencies on implementation

2. **propertyBaseDefinitions.ts** (110 dòng)
   - Shared property arrays used by all entity schemas
   - Exports: `BASE_PROPERTIES` (4 props: id, type, name, layerId), `STYLE_PROPERTIES` (5 props: strokeColor, strokeWidth, strokeStyle, fillColor, opacity)
   - Imports: DEFAULT_STYLE from Entity.types, types from propertySchema.types

3. **entitySchemas.ts** (655 dòng)
   - All 8 entity schema constants: LINE_SCHEMA, RECT_SCHEMA, CIRCLE_SCHEMA, ARC_SCHEMA, POLYLINE_SCHEMA, ELLIPSE_SCHEMA, TEXT_SCHEMA, DIMENSION_SCHEMA
   - Each schema: `...BASE_PROPERTIES` + geometry-specific props (with computed functions) + `...STYLE_PROPERTIES`
   - Imports: EntityType, IVec2, types + BASE_PROPERTIES + STYLE_PROPERTIES

### PropertySchema.ts Facade (333 dòng)

- Keeps: `PropertySchemaRegistry` class (constructor, registerSchema, addCustomProperties, getSchema, getProperties, getProperty, getPropertiesByCategory, validateProperty, validateType, validateEntity, getNestedValue)
- Keeps: `propertySchema` singleton instance
- Re-exports everything from all 3 extracted files for backward compatibility
- Zero consumer changes needed (5 consumers: canvasCommandUtils, EntityCommands, useCommandWrapper, useProperties, PropertyApplier)

### Checklist

- [x] propertySchema.types.ts = 107 dòng (types/interfaces/enums)
- [x] propertyBaseDefinitions.ts = 110 dòng (BASE_PROPERTIES + STYLE_PROPERTIES)
- [x] entitySchemas.ts = 655 dòng (8 entity schemas)
- [x] PropertySchema.ts = 333 dòng (was 1136)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

---

## ✅ STEP-5.15: ProjectService Split — DONE

> Kết quả: ProjectService.ts 1177 → 643 dòng (45% reduction) — Door/BOM/Quotation/Collaboration extracted

### Extracted Files (domain/projects/)

1. **projectDoorOps.ts** (152 dòng)
   - Door management: addDoorToProject, updateProjectDoor, removeDoorFromProject
   - Uses ProjectOpContext (repository + userId + userName)

2. **projectQuotationOps.ts** (290 dòng)
   - BOM & quotation: calculateProjectBOM, generateProjectQuotation
   - Helpers: doorDataToModel, generateId, generateQuotationNumber
   - Uses QuotationOpContext (extends base with catalogs + pricingRules)

3. **projectCollaborationOps.ts** (345 dòng)
   - Documents: addProjectDocument, removeProjectDocument
   - Notes: addProjectNote
   - Team: addProjectTeamMember, removeProjectTeamMember
   - Milestones: addProjectMilestone, completeProjectMilestone

---

## 📋 Resources trong PERMISSION_CATALOG

| Catalog | Resource | Actions |
|---------|----------|---------|
| B1 | `design.project` | read, create, update, delete, export, share, archive, restore, manage |
| B2 | `design.canvas` | read, update, export, share |
| B3 | `design.library` | read, create, update, delete, share |
| B4 | `bom.report` | read, create, update, delete, generate, export, approve, reject, archive |
| B5 | `bom.cut_list` | read, generate, export |
| C2 | `report.design` | read, export |
| C3 | `report.bom` | read, export |
   - Uses CollabOpContext (repository + userId + userName)

### ProjectService.ts Facade (643 dòng)

- Keeps: constructor, CRUD (create/get/update/delete/archive), queries (list/search/getByCustomer), status/phase management, history, versioning, checkPermission
- Context getters: baseCtx, quotationCtx → pass to extracted functions
- Thin delegation: door/BOM/quotation/collaboration methods are 1-line delegates
- Zero consumer changes (1 consumer via domain/index.ts barrel)

### Checklist

- [x] projectDoorOps.ts = 152 dòng (3 door operations)
- [x] projectQuotationOps.ts = 290 dòng (BOM + quotation + helpers)
- [x] projectCollaborationOps.ts = 345 dòng (docs + notes + team + milestones)
- [x] ProjectService.ts = 643 dòng (was 1177)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

---

## ✅ STEP-5.16: Header2 Split — DONE

> Kết quả: Header2.tsx 1138 → 192 dòng (83% reduction) — StylePanel + ToolGroupPanel extracted

### Extracted Files (ui/layout2/)

1. **StylePanel.tsx** (~780 dòng)
   - View group rendering: stroke color picker, fill color picker, opacity slider, stroke style/width picker
   - Self-contained state: showStrokePicker, showFillPicker, showStrokeStylePicker, button refs/rects
   - 4 useEffect hooks (3 button position updates + 1 click-outside handler)
   - Contains presetColors array (15 colors)

2. **ToolGroupPanel.tsx** (~160 dòng)
   - Normal tool group rendering with hover/active/mouseDown/mouseUp effects
   - Label parsing regex: `/^(.+?)\s*\(([^)]+)\)$/` (name + shortcut)
   - Osnap checkbox rendering
   - Select tool spanning 2 columns

### Header2.tsx Facade (192 dòng)

- Keeps: Tool, ToolGroup, Header2Props interfaces, containerStyle, collapseButton
- Delegates: View group → `<StylePanel>`, other groups → `<ToolGroupPanel>`
- Zero consumer changes (2 consumers via layout2/index.ts + main index.ts barrels)

### Checklist

- [x] StylePanel.tsx = ~780 dòng (style panel with color/opacity/stroke pickers)
- [x] ToolGroupPanel.tsx = ~160 dòng (tool button grid + osnap checkboxes)
- [x] Header2.tsx = 192 dòng (was 1138)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

---

## ✅ STEP-5.17: Header1 Split — DONE

> Kết quả: Header1.tsx 1094 → 276 dòng (75% reduction) — SettingsMenu extracted

### Extracted Files (ui/layout2/)

1. **SettingsMenu.tsx** (~820 dòng)
   - Full settings dropdown panel with 5 collapsible sections: Hiển thị, Dimension, Text, SVG Export, Snap & Mode
   - Contains: SettingsState interface (exported), CollapsibleSection, SettingsToggle, SettingsRow helpers
   - Contains: selectStyle, colorInputStyle, miniButtonStyle constants
   - Self-contained state: customScales
   - Props: settings, onSettingsChange, onClose

### Header1.tsx Facade (276 dòng)

- Keeps: Header1Props interface, TabType, component function with top bar JSX
- Keeps: Back button, 3 tab buttons, auto save toggle, save status indicator, settings gear button
- Delegates: Settings dropdown → `<SettingsMenu>`
- Re-exports: `SettingsState` type from SettingsMenu
- Zero consumer changes (2 consumers via layout2/index.ts + main index.ts barrels)

### Checklist

- [x] SettingsMenu.tsx = ~820 dòng (full settings panel + helpers)
- [x] Header1.tsx = 276 dòng (was 1094)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

---

**Note**: Lộ trình tuân thủ nguyên tắc **zero-risk refactor** — mỗi step có tests trước, rollback plan sẵn, không break code hiện tại.

---

## ✅ STEP-5.18: Header3 Split — DONE

> Kết quả: Header3.tsx 1082 → 681 dòng (37% reduction) — commandDefinitions extracted

### Extracted Files (ui/layout2/)

1. **commandDefinitions.ts** (368 dòng)
   - Pure data: `COMMANDS` Record (42 CAD commands with shortcut, description, prompts, action)
   - `SHORTCUT_MAP` Record (reverse lookup shortcut → command name)
   - `CommandDefinition` interface exported
   - Categories: Draw (10), Modify (12), Dimension (10), View (6), Utility (6), OSNAP (4)

### Header3.tsx Facade (681 dòng)

- Imports: `COMMANDS`, `SHORTCUT_MAP` from `./commandDefinitions`
- Keeps: Header3Props, component function with all state/effects/handlers
- Keeps: Full JSX — command history sidebar, command input line, suggestions dropdown, command steps guide, shortcuts grid, coordinates display
- Zero consumer changes (2 consumers via layout2/index.ts + main index.ts barrels)

### Checklist

- [x] commandDefinitions.ts = 368 dòng (pure data + types)
- [x] Header3.tsx = 681 dòng (was 1082)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

---

## ✅ STEP-5.19: CadEngine Split — DONE

> Kết quả: CadEngine.ts 1076 → 772 dòng (28% reduction) — entityCanvasConverter extracted

### Extracted Files (core/engine/)

1. **entityCanvasConverter.ts** (141 dòng)
   - Pure function: `convertIEntityToCanvasEntity(entity: IEntity): CanvasEntity | null`
   - Entity type → canvas type mapping (LINE, RECT, CIRCLE, ARC, ELLIPSE, TEXT, POLYLINE, HATCH, DIMENSION, BLOCK_REF, IMAGE, GROUP)
   - Points extraction per entity type (switch statement)
   - Canvas entity builder with type-specific properties (arc angles, ellipse radii, text content)
   - Zero class/state dependency — operates solely on entity argument

### CadEngine.ts Facade (772 dòng)

- Imports: `convertIEntityToCanvasEntity` from `./entityCanvasConverter`
- 3 call sites updated: addEntity, addEntities, updateEntity
- Removed: private `convertToCanvasEntity()` method (~130 lines)
- Removed unused imports: `EntityType`, `CanvasEntity`
- Zero consumer changes (all consumers import CadEngine class + getCadEngine/createCadEngine)

### Checklist

- [x] entityCanvasConverter.ts = 141 dòng (pure function + types)
- [x] CadEngine.ts = 772 dòng (was 1076)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

---

## ✅ STEP-5.20: CanvasEntityCommands Split — DONE

> Kết quả: CanvasEntityCommands.ts 1062 → 437 dòng (59% reduction) — canvasTransformCommands extracted

### Extracted Files (core/commands/canvas/)

1. **canvasTransformCommands.ts** (481 dòng)
   - 5 transform command classes: Move, Rotate, Mirror, Scale, Copy
   - Each with execute/undo + ENTITY GEOMETRY LIFECYCLE commit
   - Special circle/arc handling (center-only transforms, radius preservation)
   - PropertySchema validation on Copy

### CanvasEntityCommands.ts Facade (437 dòng)

- Re-exports: 5 transform commands from `./canvasTransformCommands`
- Keeps: AddCanvasEntityCommand, DeleteCanvasEntitiesCommand, NewDocumentCommand
- Keeps: UpdateCanvasEntityCommand, BatchAddCanvasEntitiesCommand
- Keeps: SelectCanvasEntitiesCommand, ClearCanvasSelectionCommand
- Keeps: Re-exports of Trim/Fillet/Extend/Offset/Explode (from STEP-5.2)
- Zero consumer changes (all imports via CanvasEntityCommands barrel)

### Checklist

- [x] canvasTransformCommands.ts = 481 dòng (5 transform commands)
- [x] CanvasEntityCommands.ts = 437 dòng (was 1062)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

## ✅ STEP-5.21: useKeyboardHandler Split — DONE

> Kết quả: useKeyboardHandler.ts 962 → 789 dòng (18% reduction) — types + displacement parser extracted

### Extracted Files (ui/canvas/hooks/)

1. **keyboardHandler.types.ts** (~120 dòng)
   - KeyboardHandlerParams interface — all inputs for the keyboard handler hook
   - All React types (Dispatch, SetStateAction, RefObject) + domain types

2. **keyboardDisplacementParser.ts** (~65 dòng)
   - parseDisplacementInput() pure function
   - 3 formats: @dx,dy (relative), distance<angle (polar), distance (mouse direction)
   - Used by MOVE/COPY keyboard input handling

### useKeyboardHandler.ts Facade (789 dòng)

- Imports: parseDisplacementInput from ./keyboardDisplacementParser
- Imports: KeyboardHandlerParams from ./keyboardHandler.types
- Re-exports: KeyboardHandlerParams type for backward compatibility
- Keeps: All keyboard event handling logic (F8, Undo/Redo, Escape, Space/Enter, etc.)
- Zero consumer changes (CadDrawingCanvas.tsx unchanged)

### Checklist

- [x] keyboardHandler.types.ts = ~120 dòng (KeyboardHandlerParams interface)
- [x] keyboardDisplacementParser.ts = ~65 dòng (parseDisplacementInput function)
- [x] useKeyboardHandler.ts = 789 dòng (was 962)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

## ✅ STEP-5.22: BookThietKeBocTachPage Split — DONE

> Kết quả: BookThietKeBocTachPage.tsx 1600 → 1098 dòng (31% reduction) — settings hook + export dialog extracted

### Extracted Files

1. **usePageSettings.ts** (hooks/) ~340 dòng
   - 25+ useState declarations (dim/text/canvas/export settings)
   - settings object for Header1
   - onSettingsChange handler (29 setting updates)
   - textSettings object for CadDrawingCanvas
   - canvasLayers + exportLayers useMemo conversions
   - Dimension tool prompt effect

2. **PageExportDialog.tsx** (ui/components/) ~300 dòng
   - Export modal with SVG, PNG, DXF, PDF buttons
   - DimensionEntity → CadEntity conversion for SVG export
   - Transparent background option
   - Selection-aware export labels

### BookThietKeBocTachPage.tsx Facade (1098 dòng)

- Uses usePageSettings hook for all settings state + Header1 props
- Uses PageExportDialog component for export modal
- Keeps: All hook orchestration, CadDrawingCanvas wiring, door/dimension handlers
- Still >800 dòng — further extraction planned in future step

### Checklist

- [x] usePageSettings.ts = ~340 dòng (settings state + layers + prompt effect)
- [x] PageExportDialog.tsx = ~300 dòng (export modal component)
- [x] BookThietKeBocTachPage.tsx = 1098 dòng (was 1600)
- [x] 154/154 tests pass, 0 new TS errors
- [x] Zero consumer changes needed

## ✅ STEP-5.23: useMouseHandlers Split — DONE

> Kết quả: useMouseHandlers.ts 1407 → 768 dòng (45% reduction) — types + 3 handler modules extracted

### Extracted Files

1. **mouseHandler.types.ts** (hooks/) ~190 dòng
   - MouseHandlerParams interface (re-exported from useMouseHandlers.ts for backward compatibility)
   - All shared types for hook and sub-modules

2. **mouseHandlers/selectMouseDown.ts** (~250 dòng)
   - SELECT tool mouseDown logic
   - Dimension grip editing start
   - Dimension selection (click, Ctrl+click, move)
   - Entity selection (double-click text edit, Ctrl+click toggle, move start)
   - Window/crossing selection start

3. **mouseHandlers/dimensionMouseDown.ts** (~230 dòng)
   - DIMENSION tool mouseDown logic
   - QDIM confirm click
   - Circle/arc/line detection for dimension tools
   - OSNAP entity matching for associative dimensions

4. **mouseHandlers/selectionBoxComplete.ts** (~155 dòng)
   - mouseUp selection box completion
   - Window/crossing entity/dimension selection
   - Ctrl+box removal from selection
   - Pending modify mode restoration

### useMouseHandlers.ts Facade (768 dòng)

- Imports and delegates to extracted handler modules
- Keeps: handleMouseMove (OSNAP, ortho, moving, modify previews), handleMouseUp (moving/dimension completion)
- Re-exports MouseHandlerParams type for backward compatibility
- Zero consumer changes

### Checklist

- [x] mouseHandler.types.ts = ~190 dòng (MouseHandlerParams interface)
- [x] selectMouseDown.ts = ~250 dòng (SELECT tool mouseDown)
- [x] dimensionMouseDown.ts = ~230 dòng (DIMENSION tool mouseDown)
- [x] selectionBoxComplete.ts = ~155 dòng (selection box mouseUp)
- [x] useMouseHandlers.ts = 768 dòng (was 1407)
- [x] 154/154 tests pass, 0 new TS errors

## ✅ STEP-5.24: CadDrawingCanvas Split — DONE

> Kết quả: CadDrawingCanvas.tsx 1234 → 740 dòng (40% reduction) — core state/logic hook extracted

### Extracted File

1. **hooks/useCadCanvasCore.ts** (~700 dòng)
   - Door store hooks (useDoorStore, useShallow)
   - Controlled vs uncontrolled mode logic
   - All useState / useRef declarations (~35 state vars, ~10 refs)
   - Store actions (toggleOrtho, setActiveTool, effectiveOrtho)
   - useCommandDrawing setup + derivedDynamicInputMode + useLayoutEffect
   - Coordinate transforms (screenToWorld, worldToScreen)
   - TextHitTestContext useMemo
   - Door drag & drop (useDoorDragDrop)
   - findOsnapPoint (useCallback + findOsnapPointUtil)
   - Undo / Redo (saveToHistory, undo, redo callbacks)
   - useEntityOperations (selectEntities, clearSelection, addEntity, etc.)
   - Command input handler effect (POLYGON)
   - Returns ~65 values (refs, state, computed, entity ops, drag/drop)

### CadDrawingCanvas.tsx Facade (740 dòng)

- Props destructuring with defaults (~100 lines)
- Calls useCadCanvasCore, destructures all returned values
- Wires remaining hooks: useTriggerEffects, useToolChangeEffect, useKeyboardHandler, useMouseHandlers, useDynamicInputHandlers, useWheelHandler, useCanvasRenderer, useCanvasEffects
- JSX return with all overlays (~234 lines)
- Zero consumer changes — re-exports preserved (Point, CadEntity, DrawingState, etc.)

### Checklist

- [x] useCadCanvasCore.ts = ~700 dòng (core state + infrastructure)
- [x] CadDrawingCanvas.tsx = 740 dòng (was 1234)
- [x] 0 new TS errors (only pre-existing React Compiler memoization warnings)
- [x] 154/154 tests pass, 6 suites, ~3.2s

---

## ✅ STEP-5.25: boundary.ts Split — DONE

> Kết quả: boundary.ts 1037 → 345 dòng (67% reduction) — geometry engine + post-processing extracted

### Extracted Files

1. **boundaryGeometry.ts** (549 dòng)
   - All type/interface definitions (Node, HalfEdge, Face, BoundaryResult, SplitSegment)
   - EPSILON constant
   - lineLineIntersection — segment-segment intersection
   - entityToRawSegments — entity → line segments (line, polyline, rect, circle)
   - splitSegmentsAtIntersections — split all segments at intersection points
   - pointsEqual, findOrCreateNode, calculateAngle — graph helpers
   - buildPlanarGraph — build nodes + half-edges, sort CCW
   - findNextEdge — left-hand rule next edge
   - findAllFaces — traverse all faces via half-edge data structure
   - isPointInPolygon — ray casting algorithm
   - polygonArea — absolute area calculation
   - isPointInClosedEntity — point-in-closed-entity test

2. **boundaryPostProcess.ts** (189 dòng)
   - signedPolygonArea — signed area (CCW/CW detection)
   - normalizeWindingOrder — ensure CCW via reversePoints
   - removeDuplicatePoints — remove consecutive duplicates
   - removeShortEdges — remove collinear/short edges
   - isConvexPolygon — convexity check
   - normalizePolyline — combined post-processing pipeline

### boundary.ts Facade (345 dòng)

- Imports from boundaryGeometry + boundaryPostProcess
- Re-exports all types for backward compatibility
- findBoundaryFromEntities — main algorithm orchestrator (~210 lines)
- BoundaryCommand class + createBoundaryCommand factory (~90 lines)
- Zero consumer changes — modify/index.ts re-exports unchanged

### Checklist

- [x] boundaryGeometry.ts = 549 dòng (planar graph engine)
- [x] boundaryPostProcess.ts = 189 dòng (polyline normalization)
- [x] boundary.ts = 345 dòng (was 1037)
- [x] 0 new TS errors
- [x] 154/154 tests pass, 6 suites, ~3.6s
- [x] Zero consumer changes needed

---

## ✅ STEP-5.26: BookThietKeBocTachPage Split — DONE

> Kết quả: BookThietKeBocTachPage.tsx 1099 → 882 dòng (20% reduction) — inline JSX callbacks extracted

### Extracted File

1. **hooks/useCanvasEventHandlers.ts** (425 dòng)
   - pastePreviewEntities (useMemo) + handlePasteClick (useCallback)
   - controlledModeProps — USE_CONTROLLED_MODE spread object (useMemo)
   - handleToggleAutoSelectMode — dimension auto-select toggle
   - handleRepeatLastCommand — Space key repeat
   - handleQdimSelectionConfirm + handleQdimConfirm — QDIM workflow
   - handleCanvasDimensionClick — full dimension click handler (~60 lines)
   - handleDimensionSelectCb/DeleteCb/UpdateCb/CopyCb — dimension management
   - handleCanvasMouseMove — mouse position + dimension preview
   - handlePromptChange — command prompt state update
   - handleCanvasEntityCreated/EntitiesChange/SelectionChanged — canvas events
   - handleCanvasPlaceClick — door template placement
   - handleProjectInfoChange — project info dropdown handler

### BookThietKeBocTachPage.tsx Facade (882 dòng)

- Removed: AddDoorCommand import, ClipboardManager import, inline callbacks
- Added: useCanvasEventHandlers hook call with named callbacks
- All inline JSX callbacks replaced with 1-line references
- Zero consumer changes — component API unchanged

### Checklist

- [x] useCanvasEventHandlers.ts = 425 dòng (all inline callbacks)
- [x] BookThietKeBocTachPage.tsx = 882 dòng (was 1099)
- [x] 0 new TS errors
- [x] 154/154 tests pass, 6 suites, ~3.9s
- [x] **FINAL SPLIT** — refactoring phase complete