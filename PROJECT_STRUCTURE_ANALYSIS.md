# Phân Tích Cấu Trúc Dự Án CAD Drawing App

## 1. Tổng Quan

- **Framework**: Next.js với TypeScript
- **Mục đích**: Ứng dụng CAD drawing cho thiết kế bóc tách (BookThietKeBocTach)
- **Kiến trúc**: Clean Architecture với Command Pattern

## 2. Cấu Trúc Thư Mục Chính

### 2.1 Root Level

```
/
├── src/
│   ├── app/                    # Next.js app router
│   ├── book/                   # Legacy book components
│   └── TrangChuAlubok/         # Main application module
├── public/                     # Static assets
├── package.json               # Dependencies
└── next.config.ts            # Next.js configuration
```

### 2.2 TrangChuAlubok Module

```
src/TrangChuAlubok/
├── TrangChuAlubok.tsx         # Main component
├── MuaHangPage/               # Purchase page module
│   ├── MuaHangPage.tsx
│   └── categories/            # Product categories
└── book/                      # Book modules
    ├── App.tsx
    ├── Sidebar.tsx
    ├── BookBanHang.tsx        # Sales book
    ├── BookMuaHang.tsx        # Purchase book
    ├── BookThietKeBocTach.tsx # CAD Design book (MAIN)
    ├── BookThuChi.tsx         # Income/Expense book
    ├── BookTongQuan.tsx       # Overview book
    └── BookTonKho.tsx         # Inventory book
```

## 3. CAD Module (BookThietKeBocTach) - Cấu Trúc Chi Tiết

### 3.1 Layout Components

```
BookThietKeBocTach/
├── layout1/
│   ├── CadLayout.tsx          # Main layout wrapper
│   ├── Header1.tsx            # Top header
│   ├── Header2.tsx            # Secondary header
│   ├── Header3.tsx            # Command line interface
│   ├── SidebarLeft.tsx        # Tool palette
│   └── SidebarRight.tsx       # Properties panel
└── toolbar/
    └── (legacy toolbar components)
```

### 3.2 Core Architecture (Clean Architecture)

```
src/
├── core/                      # Business logic layer
│   ├── engine/
│   │   ├── CadEngine.ts      # Main CAD engine
│   │   └── EngineState.ts    # Engine state management
│   ├── commands/              # Command pattern implementation
│   │   ├── Command.types.ts  # Command interfaces
│   │   ├── draw/             # Drawing commands
│   │   │   ├── LINE.ts
│   │   │   ├── CIRCLE.ts
│   │   │   ├── RECT.ts
│   │   │   ├── ARC.ts
│   │   │   ├── ELLIPSE.ts
│   │   │   ├── POLYLINE.ts
│   │   │   ├── POLYGON.ts
│   │   │   └── TEXT.ts
│   │   └── dimension/        # Dimension commands
│   │       ├── dimlinear.ts
│   │       ├── dimaligned.ts
│   │       ├── dimangular.ts
│   │       ├── dimradius.ts
│   │       └── dimarc.ts
│   ├── entities/             # Entity definitions
│   │   ├── Entity.ts
│   │   ├── Line.ts
│   │   ├── Circle.ts
│   │   ├── Ellipse.ts
│   │   └── (other entities)
│   └── dimensions/
│       └── DimensionManager.ts
```

### 3.3 UI Layer

```
ui/
├── canvas/                    # Canvas components
│   ├── CadDrawingCanvas.tsx  # Main canvas (4580 lines!)
│   ├── CadDrawingCanvasV2.tsx # Refactored version
│   ├── CadDrawingCanvasWrapper.tsx # Command wrapper
│   ├── View.tsx              # View management
│   ├── handlers/             # Event handlers
│   │   ├── useCommandDrawing.ts # Command-based drawing hook
│   │   ├── useDrawingHandler.ts
│   │   ├── DrawingEventHandler.ts
│   │   ├── DimensionEventHandler.ts
│   │   ├── SelectionEventHandler.ts
│   │   ├── KeyboardBindings.tsx
│   │   ├── PointerBindings.tsx
│   │   └── DndBindings.tsx
│   ├── utils/                # Utility functions
│   │   ├── geometry.ts       # Geometric calculations
│   │   ├── entityUtils.ts    # Entity operations
│   │   ├── dimensionUtils.ts # Dimension helpers
│   │   ├── osnapUtils.ts     # Object snap
│   │   ├── renderHelpers.ts  # Rendering utilities
│   │   ├── screenWorld.ts    # Coordinate transforms
│   │   └── (other utils)
│   ├── overlay/              # Canvas overlays
│   │   ├── HudOverlay.tsx    # HUD display
│   │   ├── GridOverlay.tsx   # Grid overlay
│   │   ├── OsnapOverlay.tsx  # Snap indicators
│   │   ├── DynamicInputOverlay.tsx # Dynamic input
│   │   └── TextInputOverlay.tsx # Text input
│   └── renderers/            # Entity renderers
│       ├── EntityRenderer.ts
│       ├── TextRenderer.ts
│       └── DimensionRenderer.ts
├── toolbar/
│   └── DrawToolbar.tsx       # Drawing toolbar
└── layout2/
    └── Header2.tsx           # Alternative header
```

### 3.4 State Management

```
store/
├── engineStore.ts            # Zustand store for engine
└── canvasStore.ts           # Canvas state store

hooks/
├── useEngineEntities.ts     # Entity management hook
├── useCanvasEntities.ts     # Canvas entities hook
├── useDrawingCommands.ts    # Drawing commands hook
└── useCommandWrapper.ts     # Command wrapper hook
```

### 3.5 Adapters Layer

```
adapters/
└── canvas/
    └── CanvasAdapter.ts     # Canvas adapter for engine
```

## 4. Kiến Trúc Command Pattern

### Luồng Dữ Liệu (ĐIỀU KIỆN 1)

```
UI (Canvas)
    ↓ User Action
Command Creation
    ↓
CadEngine.execute(command)
    ↓
Document.addEntity()
    ↓
History.push(command)
    ↓
State Update → UI Re-render
```

### Validation (ĐIỀU KIỆN 2)

- Tất cả property updates phải qua PropertySchema validation
- Schema định nghĩa trong từng Entity class
- Validation thực hiện trước khi update

## 5. Các Tính Năng Chính

### 5.1 Drawing Tools

- LINE: Vẽ đường thẳng/polyline
- RECT: Vẽ hình chữ nhật
- CIRCLE: Vẽ hình tròn
- ARC: Vẽ cung tròn
- ELLIPSE: Vẽ ellipse
- POLYGON: Vẽ đa giác đều
- TEXT: Thêm văn bản

### 5.2 Modify Tools

- MOVE: Di chuyển entities
- COPY: Sao chép entities
- ROTATE: Xoay entities
- MIRROR: Phản chiếu
- SCALE: Thay đổi kích thước
- OFFSET: Tạo offset

### 5.3 Dimension Tools

- DIMLINEAR: Kích thước tuyến tính
- DIMALIGNED: Kích thước căn chỉnh
- DIMANGULAR: Kích thước góc
- DIMRADIUS: Kích thước bán kính
- DIMARC: Kích thước cung

### 5.4 Features

- OSNAP: Object snap (endpoint, midpoint, center, etc.)
- Grid snap
- Ortho mode (F8)
- Dynamic input
- Undo/Redo với History
- Layer management
- Selection (click, box select, multi-select)
- Text editing (double-click)

## 6. Vấn Đề Cần Refactor

### 6.1 CadDrawingCanvas.tsx

- **Vấn đề**: File quá lớn (4580 dòng)
- **Giải pháp**: Đã tách một phần sang:
  - Utils folder (geometry, entityUtils, etc.)
  - Handlers folder (event handlers)
  - Overlay components
  - Renderers

### 6.2 Command Pattern Implementation

- **Tiến độ**: Đang chuyển đổi từ direct manipulation sang Command pattern
- **Hoàn thành**: LINE, RECT, CIRCLE, POLYGON, TEXT
- **Cần làm**: Các modify commands cần chuyển sang Command pattern

### 6.3 Text Editing

- **Status**: Double-click detection đã có
- **Thiếu**: Logic update entity sau khi edit (cần thông qua Command)

## 7. MuaHangPage Module

```
MuaHangPage/
├── MuaHangPage.tsx          # Main purchase page
└── categories/              # Product categories
    ├── TongHop.tsx         # All products
    ├── NhomThanh.tsx       # Aluminum profiles
    ├── InoxThanh.tsx       # Stainless steel profiles
    ├── InoxTam.tsx         # Stainless steel sheets
    ├── Kinh.tsx            # Glass
    ├── PhuKienNhom.tsx     # Aluminum accessories
    └── PhuKienKinh.tsx     # Glass accessories
```

## 8. Technology Stack

- **Frontend**: React 18, Next.js 14
- **Language**: TypeScript
- **State**: Zustand
- **Canvas**: HTML5 Canvas API
- **Styling**: CSS Modules
- **Build**: Turbopack

## 9. Đề Xuất Cải Tiến

1. **Hoàn thiện Command Pattern**

   - Chuyển tất cả operations sang Command
   - Implement PropertySchema validation

2. **Tối ưu Performance**

   - Virtual canvas cho large drawings
   - WebGL renderer option
   - Worker threads cho calculations

3. **Improve Code Organization**

   - Tách CadDrawingCanvas thành nhiều components nhỏ
   - Implement proper dependency injection
   - Add comprehensive testing

4. **Features Enhancement**
   - Add more drawing tools (spline, hatch, etc.)
   - Implement blocks/symbols
   - Add measurement tools
   - Export/Import DXF files
