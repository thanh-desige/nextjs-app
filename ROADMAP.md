# 🗺️ LỘ TRÌNH PHÁT TRIỂN DỰ ÁN CAD

## 📌 MỤC TIÊU CHÍNH

Xây dựng ứng dụng CAD hoàn chỉnh với Clean Architecture, tuân thủ 2 điều kiện:

1. **ĐIỀU KIỆN 1**: UI → Command → CadEngine → Document → History
2. **ĐIỀU KIỆN 2**: PropertySchema validation cho mọi property updates

## 🚀 PHASE 1: HOÀN THIỆN COMMAND PATTERN (Ưu tiên cao)

### 1.1 Text Editing Feature ⚠️

- [ ] **Hoàn thiện update entity sau edit** (đang thiếu)
  - Tạo `UpdateTextCommand` trong `/core/commands/modify/`
  - Integrate với double-click editing flow
  - Đảm bảo update qua CadEngine, không direct manipulation

### 1.2 Modify Commands Migration

- [ ] **MOVE Command** → Chuyển sang Command pattern
- [ ] **COPY Command** → Chuyển sang Command pattern
- [ ] **ROTATE Command** → Chuyển sang Command pattern
- [ ] **MIRROR Command** → Chuyển sang Command pattern
- [ ] **SCALE Command** → Chuyển sang Command pattern
- [ ] **OFFSET Command** → Chuyển sang Command pattern

### 1.3 PropertySchema Implementation

- [ ] Định nghĩa schemas cho từng entity type
- [ ] Implement validation layer trong CadEngine
- [ ] Add validation cho tất cả property updates

## 🔧 PHASE 2: REFACTORING (Cần thiết)

### 2.1 Tách CadDrawingCanvas.tsx (4580 dòng!)

- [ ] **Extract Selection Logic** → `SelectionManager.ts`
- [ ] **Extract Drawing Logic** → `DrawingManager.ts`
- [ ] **Extract Dimension Logic** → `DimensionRenderer.ts`
- [ ] **Extract Preview Logic** → `PreviewManager.ts`
- [ ] **Extract Input Handling** → `InputManager.ts`

### 2.2 Optimize Performance

- [ ] Implement virtual canvas cho large drawings
- [ ] Add viewport culling
- [ ] Optimize re-renders với React.memo
- [ ] Consider WebGL renderer option

## 📦 PHASE 3: CORE FEATURES (Mở rộng)

### 3.1 Document Management

- [ ] Implement Document class với proper serialization
- [ ] Add Save/Load functionality
- [ ] Export to DXF format
- [ ] Import from DXF format

### 3.2 Advanced Drawing Tools

- [ ] **SPLINE** tool implementation
- [ ] **HATCH** pattern filling
- [ ] **BLOCK** creation and insertion
- [ ] **ARRAY** (rectangular & polar)

### 3.3 Layer System Enhancement

- [ ] Layer properties panel
- [ ] Layer lock/unlock
- [ ] Layer color management
- [ ] Layer line type settings

## 🎨 PHASE 4: UI/UX IMPROVEMENTS

### 4.1 Command Line Interface

- [ ] Autocomplete for commands
- [ ] Command history
- [ ] Command aliases
- [ ] Dynamic prompts

### 4.2 Properties Panel

- [ ] Real-time property editing
- [ ] Quick properties popup
- [ ] Property presets
- [ ] Batch property editing

### 4.3 Toolbar Enhancement

- [ ] Customizable toolbars
- [ ] Tool tips với shortcuts
- [ ] Recent tools section
- [ ] Tool grouping

## 🧪 PHASE 5: TESTING & QUALITY

### 5.1 Unit Testing

- [ ] Test Commands (100% coverage)
- [ ] Test CadEngine operations
- [ ] Test geometry calculations
- [ ] Test OSNAP functions

### 5.2 Integration Testing

- [ ] Test command flow end-to-end
- [ ] Test undo/redo operations
- [ ] Test file operations
- [ ] Test complex drawing scenarios

### 5.3 Performance Testing

- [ ] Benchmark với 1000+ entities
- [ ] Memory leak detection
- [ ] Render performance optimization
- [ ] Command execution timing

## 📊 PHASE 6: BUSINESS MODULES

### 6.1 MuaHangPage Integration

- [ ] Link CAD designs với products
- [ ] Auto-calculate materials từ drawings
- [ ] Generate purchase orders từ CAD

### 6.2 Reporting

- [ ] Drawing statistics
- [ ] Material usage reports
- [ ] Cost estimation từ drawings
- [ ] Export reports to PDF

## 🔄 PHASE 7: COLLABORATION

### 7.1 Multi-user Support

- [ ] Real-time collaboration
- [ ] Drawing locks
- [ ] Change tracking
- [ ] Comments và annotations

### 7.2 Version Control

- [ ] Drawing versioning
- [ ] Diff visualization
- [ ] Merge conflicts resolution
- [ ] Revision history

## 📱 PHASE 8: RESPONSIVE & MOBILE

### 8.1 Responsive Design

- [ ] Tablet support
- [ ] Touch gestures
- [ ] Responsive toolbars
- [ ] Mobile-friendly UI

### 8.2 PWA Features

- [ ] Offline mode
- [ ] Service workers
- [ ] App manifest
- [ ] Push notifications

## 🎯 IMMEDIATE NEXT STEPS (Tuần này)

### Ngày 1-2: Text Editing Completion

1. Tạo `UpdateTextCommand.ts`
2. Integrate với double-click flow
3. Test text editing end-to-end

### Ngày 3-4: First Modify Command

1. Migrate MOVE command
2. Update tests
3. Verify undo/redo works

### Ngày 5-7: Refactor Canvas

1. Extract SelectionManager
2. Extract DrawingManager
3. Reduce CadDrawingCanvas xuống < 2000 dòng

## 📈 METRICS & GOALS

### Q1 2024

- ✅ Command Pattern: 100% coverage
- ✅ Canvas refactored: < 2000 lines
- ✅ Test coverage: > 80%

### Q2 2024

- ✅ DXF import/export
- ✅ Advanced tools (SPLINE, HATCH)
- ✅ Performance: 60fps với 5000 entities

### Q3 2024

- ✅ Multi-user collaboration
- ✅ Mobile responsive
- ✅ Business module integration

## 🔍 TECHNICAL DEBT TO ADDRESS

1. **CadDrawingCanvas.tsx** - Quá lớn, khó maintain
2. **Direct entity manipulation** - Một số chỗ vẫn bypass Command pattern
3. **Missing PropertySchema** - Chưa có validation layer
4. **No tests** - Cần comprehensive test suite
5. **Performance issues** - Chưa optimize cho large datasets

## 💡 RECOMMENDATIONS

### Immediate Priority (Làm ngay):

1. **Hoàn thiện Text Editing** - Critical bug
2. **Migrate một Modify command** - Prove concept
3. **Extract SelectionManager** - Quick win

### Short Term (1-2 tuần):

1. Complete Command Pattern migration
2. Implement PropertySchema
3. Add basic tests

### Medium Term (1 tháng):

1. Full canvas refactoring
2. DXF support
3. Performance optimization

### Long Term (3 tháng):

1. Advanced features
2. Business integration
3. Collaboration features

---

**Note**: Lộ trình này có thể điều chỉnh dựa trên feedback từ users và business priorities.
