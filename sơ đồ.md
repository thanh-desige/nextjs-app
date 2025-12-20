# 📁 SƠ ĐỒ CẤU TRÚC DỰ ÁN NEXTJS-APP

> Cập nhật: 12/12/2025

---

## 📦 THƯ MỤC GỐC

```
nextjs-app - Sao chép/
├─ .gitignore                    # Cấu hình Git ignore
├─ .next/                        # Build output của Next.js (tự động sinh)
├─ .vscode/                      # Cấu hình VS Code
├─ eslint.config.mjs             # Cấu hình ESLint
├─ KEYBOARD_SHORTCUTS.md         # Tài liệu phím tắt CAD
├─ next-env.d.ts                 # Type definitions cho Next.js
├─ next.config.ts                # Cấu hình Next.js
├─ node_modules/                 # Dependencies (npm packages)
├─ package-lock.json             # Lock file dependencies
├─ package.json                  # Cấu hình npm, scripts, dependencies
├─ postcss.config.mjs            # Cấu hình PostCSS (Tailwind)
├─ public/                       # Static files công khai
├─ README.md                     # Tài liệu dự án
├─ tsconfig.json                 # Cấu hình TypeScript
├─ tsconfig.tsbuildinfo          # Cache TypeScript build
├─ sơ đồ.md                      # File này - Sơ đồ cấu trúc dự án
└─ src/                          # Mã nguồn chính
```

---

## 📂 SRC - MÃ NGUỒN CHÍNH

```
src/
├─ app/                          # 🌐 Next.js App Router
│   ├─ cad/
│   │   └─ page.tsx              # Trang CAD chính (/cad)
│   ├─ favicon.ico               # Icon trang web
│   ├─ globals.css               # CSS toàn cục
│   ├─ layout.tsx                # Layout chính của app
│   └─ page.tsx                  # Trang chủ (/)
│
├─ book/
│   └─ App.tsx                   # Component App của Book module
│
└─ TrangChuAlubok/               # 🏠 MODULE TRANG CHỦ ALUBOK
    ├─ TrangChuAlubok.tsx        # Component trang chủ chính
    └─ book/                     # Các module sách/chức năng
```

---

## 📚 TRANGCHUALUBOK/BOOK - CÁC MODULE CHỨC NĂNG

```
TrangChuAlubok/book/
├─ App.tsx                       # Component App chính của Book
├─ Sidebar.tsx                   # Thanh điều hướng bên trái
├─ BookTongQuan.tsx              # 📊 Sổ Tổng Quan - Dashboard
├─ BookBanHang.tsx               # 💰 Sổ Bán Hàng
├─ BookMuaHang.tsx               # 🛒 Sổ Mua Hàng
├─ BookThuChi.tsx                # 💵 Sổ Thu Chi
├─ BookTonKho.tsx                # 📦 Sổ Tồn Kho
├─ BookThietKeBocTach.tsx        # 📐 Sổ Thiết Kế Bóc Tách (wrapper)
└─ BookThietKeBocTach/           # 📐 MODULE CAD THIẾT KẾ BÓC TÁCH (CHI TIẾT)
```

---

## 🎨 BOOKTHIETKEBOCTACH - MODULE CAD CHÍNH

```
BookThietKeBocTach/src/
├─ index.ts                              # Export chính của module
├─ BookThietKeBocTachPage.tsx            # 📐 Trang chính CAD Thiết Kế Bóc Tách
├─ BookThietKeBocTachPage.module.css     # CSS cho trang CAD
├─ COMPLIANCE_CHECKLIST.md               # ✅ Checklist tuân thủ 2 ĐIỀU KIỆN BẮT BUỘC
├─ sơ-đồ-cấu-trúc-giao-diện-cad-tkbt.md  # Sơ đồ giao diện CAD
├─ image.png                             # Hình ảnh minh họa
├─ image-1.png                           # Hình ảnh minh họa
│
├─ core/                   # ⚙️ LÕI HỆ THỐNG CAD
├─ ui/                     # 🖼️ GIAO DIỆN NGƯỜI DÙNG
├─ hooks/                  # 🪝 REACT HOOKS
├─ store/                  # 🗄️ STATE MANAGEMENT (Zustand)
├─ domain/                 # 🏢 LOGIC NGHIỆP VỤ CỬA NHÔM
├─ adapters/               # 🔌 KẾT NỐI BÊN NGOÀI
├─ app/                    # 📱 CẤU HÌNH ỨNG DỤNG
├─ scripting/              # 📜 SCRIPTING ENGINE
├─ scripts/                # 📄 DỮ LIỆU JSON
├─ types/                  # 📝 TYPE DEFINITIONS
├─ tests/                  # 🧪 UNIT TESTS (trống)
├─ assets/                 # 🎨 TÀI NGUYÊN (trống)
└─ docs/                   # 📖 TÀI LIỆU (trống)
```

---

## ⚙️ CORE - LÕI HỆ THỐNG CAD

### 📁 core/engine/ - Engine CAD chính

```
core/engine/
├─ index.ts                # Export module
├─ CadEngine.ts            # 🎮 Engine chính điều khiển toàn bộ CAD
├─ EngineEvents.ts         # 📢 Hệ thống events của engine
└─ EngineState.ts          # 💾 Quản lý state của engine
```

### 📁 core/document/ - Quản lý Document

```
core/document/
├─ index.ts                # Export module
├─ CadDocument.ts          # 📄 Document chứa tất cả entities
├─ History.ts              # ⏪ Lịch sử Undo/Redo
├─ Layer.ts                # 📑 Định nghĩa Layer
└─ Block.ts                # 🧱 Block (nhóm entities tái sử dụng)
```

### 📁 core/history/ - Quản lý lịch sử

```
core/history/
├─ index.ts                # Export module
└─ HistoryManager.ts       # ⏪ Quản lý undo/redo với snapshots
```

### 📁 core/entities/ - Các đối tượng hình học

```
core/entities/
├─ index.ts                # Export module
├─ Entity.types.ts         # 📝 Type definitions cho entities
├─ BaseEntity.ts           # 🔷 Class cơ sở cho tất cả entity
├─ Line.ts                 # ➖ Đối tượng Đường thẳng
├─ Circle.ts               # ⭕ Đối tượng Hình tròn
├─ Arc.ts                  # 🌙 Đối tượng Cung tròn
├─ Rect.ts                 # ▢ Đối tượng Hình chữ nhật
├─ Polyline.ts             # 📈 Đối tượng Đường gấp khúc
├─ Text.ts                 # 🔤 Đối tượng Văn bản
└─ Dimension.ts            # 📏 Đối tượng Kích thước (dim)
```

### 📁 core/geometry/ - Tính toán hình học

```
core/geometry/
├─ index.ts                # Export module
├─ Vec2.ts                 # 📍 Vector 2D (x, y)
├─ Matrix3.ts              # 🔢 Ma trận 3x3 cho biến đổi
├─ Transform2D.ts          # 🔄 Các phép biến đổi 2D
└─ GeometryUtils.ts        # 🧮 Các hàm tiện ích hình học
```

### 📁 core/commands/ - Hệ thống lệnh

```
core/commands/
├─ index.ts                # Export module
├─ Command.types.ts        # 📝 Type definitions cho commands
├─ CommandContext.ts       # 🔧 Context chứa engine, document
└─ CommandManager.ts       # 📋 Quản lý & thực thi commands

├─ canvas/                 # 🖼️ Lệnh Canvas Entities
│   ├─ index.ts            # Export module
│   └─ CanvasEntityCommands.ts  # ⭐ Lệnh thao tác canvas entities

├─ entity/                 # 🔷 Lệnh Entity với PropertySchema
│   ├─ index.ts            # Export module
│   └─ EntityCommands.ts   # ⭐ Lệnh thay đổi properties (tuân thủ Schema)

├─ draw/                   # ✏️ Lệnh vẽ
│   ├─ index.ts            # Export module
│   ├─ LINE.ts             # Vẽ đường thẳng
│   ├─ CIRCLE.ts           # Vẽ hình tròn
│   └─ RECT.ts             # Vẽ hình chữ nhật

├─ modify/                 # ✂️ Lệnh chỉnh sửa
│   ├─ index.ts            # Export module
│   ├─ DELETE.ts           # Xóa entities
│   ├─ MOVE.ts             # Di chuyển entities
│   ├─ copy.ts             # Sao chép entities
│   ├─ rotate.ts           # Xoay entities
│   ├─ SCALE.ts            # Thu phóng entities
│   ├─ mirror.ts           # Đối xứng gương
│   ├─ OFFSET.ts           # Offset đường
│   ├─ trim.ts             # Cắt trim
│   └─ extend.ts           # Kéo dài extend

├─ view/                   # 👁️ Lệnh view
│   ├─ zoom.ts             # Thu phóng màn hình
│   └─ pan.ts              # Di chuyển màn hình

└─ dimension/              # 📏 Lệnh đo kích thước
    ├─ index.ts            # Export module
    ├─ DimensionCommands.ts # Lệnh dimension chính
    ├─ dimlinear.ts        # Dim thẳng đứng/ngang
    ├─ dimaligned.ts       # Dim theo đường nghiêng
    ├─ dimangular.ts       # Dim góc
    ├─ dimradius.ts        # Dim bán kính
    ├─ dimarc.ts           # Dim cung tròn
    ├─ dimcontinue.ts      # Dim liên tục
    └─ qdim.ts             # Quick dimension
```

### 📁 core/properties/ - Quản lý Properties

```
core/properties/
├─ PropertySchema.ts       # ⭐ LUẬT TỐI THƯỢNG - Định nghĩa schema properties
└─ PropertyApplier.ts      # ⭐ Áp dụng properties với validation
```

### 📁 core/layers/ - Quản lý Layers

```
core/layers/
├─ index.ts                # Export module
└─ LayerManager.ts         # 📑 Quản lý các layer (tạo, xóa, ẩn/hiện)
```

### 📁 core/dimensions/ - Quản lý Dimensions

```
core/dimensions/
├─ index.ts                # Export module
└─ DimensionManager.ts     # 📏 Quản lý các dimension trong document
```

### 📁 core/osnap/ - Object Snap

```
core/osnap/
├─ index.ts                # Export module
├─ Osnap.types.ts          # Type definitions cho osnap
└─ OsnapManager.ts         # 🎯 Quản lý bắt điểm (endpoint, midpoint, center...)
```

### 📁 core/constraints/ - Ràng buộc hình học

```
core/constraints/
├─ index.ts                # Export module
├─ Constraint.types.ts     # Type definitions cho constraints
└─ ConstraintSolver.ts     # 🔗 Giải ràng buộc (vuông góc, song song...)
```

### 📁 core/export/ - Xuất file

```
core/export/
├─ index.ts                # Export module
├─ Export.types.ts         # Type definitions cho export
├─ ExportManager.ts        # 📤 Quản lý xuất file
├─ ExportDXF.ts            # Xuất định dạng DXF (AutoCAD)
├─ ExportJSON.ts           # Xuất định dạng JSON
├─ ExportPDF.ts            # Xuất định dạng PDF
└─ ExportPNG.ts            # Xuất định dạng PNG
```

### 📁 core/analysis/ - Phân tích & Bóc tách 🆕

```
core/analysis/
├─ index.ts                # Export module
├─ Quantity.types.ts       # 📝 Type definitions cho bóc tách
├─ ProfileMapping.ts       # 🔧 Mapping profile nhôm ↔ cấu kiện cửa
├─ AluminumCalculator.ts   # 🧮 Tính toán bóc tách nhôm (FFD optimization)
├─ GlassCalculator.ts      # 🪟 Tính toán bóc tách kính (Guillotine cut)
└─ QuantityEngine.ts       # ⚙️ Engine chính bóc tách vật liệu
```

---

## 🖼️ UI - GIAO DIỆN NGƯỜI DÙNG

### 📁 ui/canvas/ - Canvas vẽ

```
ui/canvas/
├─ CadCanvas.tsx           # Canvas CAD (Fabric.js - legacy)
├─ CadDrawingCanvas.tsx    # ⭐ Canvas vẽ chính (HTML5 Canvas)
├─ CadDrawingCanvasWrapper.tsx  # Wrapper cho Canvas
├─ SimpleCanvas.tsx        # Canvas đơn giản (demo)
├─ View.ts                 # (placeholder) Quản lý viewport
└─ overlay.ts              # (placeholder) Overlay grid/selection
```

### 📁 ui/toolbar/ - Thanh công cụ

```
ui/toolbar/
├─ index.ts                # Export module
├─ DrawToolbar.tsx         # ✏️ Thanh công cụ vẽ (Line, Circle, Rect...)
├─ ModifyToolbar.tsx       # ✂️ Thanh công cụ chỉnh sửa (Move, Copy, Delete...)
├─ ViewToolbar.tsx         # 👁️ Thanh công cụ view (Zoom, Pan)
├─ CommandPalette.tsx      # ⌨️ Bảng nhập lệnh (command line)
└─ StatusBar.tsx           # 📊 Thanh trạng thái (tọa độ, zoom, snap)
```

### 📁 ui/panels/ - Các panel bên phải

```
ui/panels/
├─ index.ts                # Export module
├─ PropertiesPanel.tsx     # 📋 Panel properties của entity đang chọn
├─ LayerPanel.tsx          # 📑 Panel quản lý layers
├─ LayerPanel.module.css   # CSS cho LayerPanel
├─ LayersPanel.tsx         # (duplicate) Panel layers
├─ HistoryPanel.tsx        # ⏪ Panel lịch sử undo/redo
├─ HistoryPanel.module.css # CSS cho HistoryPanel
├─ DimensionPanel.tsx      # 📏 Panel quản lý dimensions
├─ DimensionPanel.module.css # CSS cho DimensionPanel
├─ DoorLibraryPanel.tsx    # 🚪 Panel thư viện mẫu cửa
├─ BomPanel.tsx            # 📦 Panel bảng bóc tách vật liệu (BOM)
├─ QuotePanel.tsx          # 💰 Panel báo giá
└─ ProjectPanel.tsx        # 📁 Panel quản lý dự án
```

### 📁 ui/layout2/ - Layout chính

```
ui/layout2/
├─ index.ts                # Export module
├─ CadLayout.tsx           # 🖼️ Layout chính của CAD (3 cột)
├─ Header1.tsx             # Header kiểu 1
├─ Header2.tsx             # Header kiểu 2
├─ Header3.tsx             # Header kiểu 3
├─ SidebarLeft.tsx         # 📋 Sidebar trái (toolbars)
└─ SidebarRight.tsx        # 📋 Sidebar phải (panels)
```

### 📁 ui/components/ - Components dùng chung

```
ui/components/
├─ index.ts                # Export module
├─ Button.tsx              # 🔘 Component Button
├─ Input.tsx               # 📝 Component Input
├─ Dropdown.tsx            # 📋 Component Dropdown
├─ Modal.tsx               # 🪟 Component Modal dialog
├─ ColorPicker.tsx         # 🎨 Component chọn màu
├─ ExportDialog.tsx        # 📤 Dialog xuất file
└─ ExportDialog.module.css # CSS cho ExportDialog
```

---

## 🪝 HOOKS - REACT HOOKS

```
hooks/
├─ index.ts                # Export module
├─ useCadEngine.ts         # ⭐ Hook khởi tạo CadEngine
├─ useCanvasEntities.ts    # ⭐ Hook thao tác canvas entities (tuân thủ ĐIỀU KIỆN 1)
├─ useProperties.ts        # ⭐ Hook thay đổi properties (tuân thủ ĐIỀU KIỆN 2)
├─ useSelection.ts         # 🎯 Hook quản lý selection
├─ usePanZoom.ts           # 🔍 Hook pan/zoom canvas
├─ useKeyboard.ts          # ⌨️ Hook xử lý phím tắt
├─ useLayers.ts            # 📑 Hook quản lý layers
├─ useDimensions.ts        # 📏 Hook quản lý dimensions
├─ useDimensionCommands.ts # 📏 Hook lệnh dimension
├─ useDoorTemplates.ts     # 🚪 Hook template cửa
├─ useExport.ts            # 📤 Hook xuất file
└─ useBomCalculator.ts     # 📦 Hook tính toán BOM
```

---

## 🗄️ STORE - STATE MANAGEMENT (Zustand)

```
store/
├─ index.ts                # Export module
├─ engineStore.ts          # 💾 Store cho CadEngine state
├─ projectStore.ts         # 📁 Store cho Project state
└─ uiStore.ts              # 🖼️ Store cho UI state (panels, theme...)
```

---

## 🏢 DOMAIN - LOGIC NGHIỆP VỤ CỬA NHÔM

### 📁 domain/door/ - Mô hình cửa

```
domain/door/
├─ DoorModel.ts            # 🚪 Model dữ liệu cửa (width, height, type...)
├─ DoorTemplate.ts         # 📋 Template mẫu cửa có sẵn
└─ DoorParametrics.ts      # ⚙️ Tham số hóa cửa (parametric design)
```

### 📁 domain/bom/ - Bóc tách vật liệu

```
domain/bom/
├─ BomItem.ts              # 📦 Item trong bảng BOM
├─ BomCalculator.ts        # 🧮 Tính toán bảng BOM
├─ CutListOptimizer.ts     # ✂️ Tối ưu cắt thanh nhôm
├─ GlassCutCalculator.ts   # 🪟 Tính toán cắt kính
├─ QuoteCalculator.ts      # 💰 Tính toán báo giá
└─ ReportGenerator.ts      # 📄 Sinh báo cáo bóc tách
```

### 📁 domain/materials/ - Danh mục vật liệu

```
domain/materials/
├─ Material.types.ts       # 📝 Type definitions cho vật liệu
├─ ProfileCatalog.ts       # 🔧 Danh mục profile nhôm
├─ GlassCatalog.ts         # 🪟 Danh mục kính
└─ AccessoryCatalog.ts     # 🔩 Danh mục phụ kiện
```

### 📁 domain/projects/ - Quản lý dự án

```
domain/projects/
├─ Project.types.ts        # 📝 Type definitions cho project
├─ ProjectService.ts       # 🔧 Service quản lý project
└─ ProjectRepository.ts    # 💾 Repository lưu trữ project
```

### 📁 domain/rules/ - Quy tắc nghiệp vụ

```
domain/rules/
├─ BuildingRules.ts        # 🏗️ Quy tắc xây dựng (min/max size...)
└─ PricingRules.ts         # 💵 Quy tắc tính giá
```

---

## 🔌 ADAPTERS - KẾT NỐI BÊN NGOÀI

### 📁 adapters/canvas/ - Canvas Adapters

```
adapters/canvas/
├─ CanvasAdapter.ts        # 🖼️ Interface adapter cho canvas
├─ FabricAdapter.ts        # Adapter cho Fabric.js
└─ SvgAdapter.ts           # Adapter cho SVG
```

### 📁 adapters/input/ - Input Adapters

```
adapters/input/
├─ KeyboardAdapter.ts      # ⌨️ Adapter xử lý keyboard
└─ MouseAdapter.ts         # 🖱️ Adapter xử lý mouse
```

### 📁 adapters/persistence/ - Lưu trữ

```
adapters/persistence/
├─ LocalStorageAdapter.ts  # 💾 Adapter localStorage
├─ FileSystemAdapter.ts    # 📁 Adapter file system
└─ RemoteStorageAdapter.ts # ☁️ Adapter cloud storage
```

---

## 📱 APP - CẤU HÌNH ỨNG DỤNG

### 📁 app/config/ - Cấu hình

```
app/config/
├─ osnap.config.ts         # (placeholder) Cấu hình object snap
├─ shortcuts.config.ts     # (placeholder) Cấu hình phím tắt
└─ toolbar.config.ts       # (placeholder) Cấu hình toolbar
```

### 📁 app/events/ - Hệ thống events

```
app/events/
├─ AppEvents.ts            # (placeholder) Định nghĩa app events
└─ EventBus.ts             # (placeholder) Event bus
```

### 📁 app/plugins/ - Hệ thống plugins

```
app/plugins/
├─ Plugin.types.ts         # (placeholder) Type definitions cho plugins
├─ PluginManager.ts        # (placeholder) Quản lý plugins
└─ builtin/                # (trống) Plugins có sẵn
```

### 📁 app/registry/ - Registry

```
app/registry/
├─ CommandRegistry.ts      # (placeholder) Đăng ký commands
└─ ToolRegistry.ts         # (placeholder) Đăng ký tools
```

### 📁 app/services/ - Services

```
app/services/
├─ ExportService.ts        # (placeholder) Service xuất file
├─ LoggingService.ts       # (placeholder) Service logging
└─ StorageService.ts       # (placeholder) Service lưu trữ
```

---

## 📜 SCRIPTING - SCRIPTING ENGINE

```
scripting/
├─ Script.types.ts         # (placeholder) Type definitions cho script
├─ ScriptContext.ts        # (placeholder) Context chạy script
├─ ScriptEngine.ts         # (placeholder) Engine chạy script
└─ languages/
    ├─ dsl/
    │   └─ "DSL CAD riêng" # (placeholder) DSL riêng cho CAD
    └─ js/
        └─ "JS macro"      # (placeholder) JavaScript macro
```

---

## 📄 SCRIPTS - DỮ LIỆU JSON

```
scripts/
├─ defaultScene.json       # 🎬 Scene mặc định khi mở CAD
├─ doorTemplates.json      # 🚪 Template mẫu các loại cửa
└─ priceConfig.json        # 💰 Cấu hình giá vật liệu
```

---

## 📝 TYPES - TYPE DEFINITIONS

```
types/
├─ Index.ts                # (placeholder) Export types
├─ Color.ts                # (placeholder) Type Color
└─ UUID.ts                 # (placeholder) Type UUID
```

---

## 📊 TỔNG HỢP

| Thư mục      | Số file   | Mô tả                |
| ------------ | --------- | -------------------- |
| `core/`      | ~60 files | Lõi hệ thống CAD     |
| `ui/`        | ~25 files | Giao diện người dùng |
| `hooks/`     | 13 files  | React Hooks          |
| `store/`     | 4 files   | State management     |
| `domain/`    | 14 files  | Logic nghiệp vụ      |
| `adapters/`  | 7 files   | Kết nối bên ngoài    |
| `app/`       | 11 files  | Cấu hình ứng dụng    |
| `scripting/` | 5 files   | Scripting engine     |
| `scripts/`   | 3 files   | Dữ liệu JSON         |
| `types/`     | 3 files   | Type definitions     |

---

## ⚠️ 2 ĐIỀU KIỆN BẮT BUỘC

### ĐIỀU KIỆN 1: Luồng xử lý UI → Engine → Document → History

```
UI (hooks) → CadEngine → CadDocument → History
                ↓
         KHÔNG ĐƯỢC sửa entity trực tiếp
```

### ĐIỀU KIỆN 2: PropertySchema là "LUẬT TỐI THƯỢNG"

```
Mọi thay đổi property → PropertySchema (validate) → PropertyApplier (apply)
```

📌 **Xem chi tiết**: [COMPLIANCE_CHECKLIST.md](src/TrangChuAlubok/book/BookThietKeBocTach/src/COMPLIANCE_CHECKLIST.md)

---

## 🔑 FILES QUAN TRỌNG

| File                         | Vai trò                                |
| ---------------------------- | -------------------------------------- |
| `CadEngine.ts`               | Engine chính điều khiển CAD            |
| `CadDocument.ts`             | Document chứa tất cả entities          |
| `HistoryManager.ts`          | Quản lý undo/redo                      |
| `PropertySchema.ts`          | ⭐ LUẬT TỐI THƯỢNG - Schema properties |
| `PropertyApplier.ts`         | Áp dụng properties với validation      |
| `CanvasEntityCommands.ts`    | Lệnh canvas entities (tuân thủ ĐK1)    |
| `EntityCommands.ts`          | Lệnh entity properties (tuân thủ ĐK2)  |
| `useCanvasEntities.ts`       | Hook canvas (tuân thủ ĐK1)             |
| `useProperties.ts`           | Hook properties (tuân thủ ĐK2)         |
| `CadDrawingCanvas.tsx`       | Canvas vẽ chính                        |
| `BookThietKeBocTachPage.tsx` | Trang CAD chính                        |
| `COMPLIANCE_CHECKLIST.md`    | Checklist tuân thủ                     |
