# 📁 CẤU TRÚC DỰ ÁN NEXTJS-APP (ALUBOK)

> Cập nhật: **20/03/2026** — Scan trực tiếp từ cây thư mục thực tế
> Tổng: **~535 files** (490 .ts/.tsx, 37 .md, còn lại config/assets)
> Tests: **1500 pass (48 mới DXF Import), 52 suites**

---

## 1. ROOT

```
nextjs-app/
├── .github/
│   └── copilot-instructions.md     # Quy tắc cho AI sessions (đọc đầu session, cập nhật .md cuối task)
├── public/
│   └── door-templates/
│       └── cua-so/
│           └── cua-so-hat.svg      # SVG template cửa sổ hất
├── src/                            # Mã nguồn chính
│   ├── setupTests.ts               # Jest setup file
│   └── ...                         # (chi tiết bên dưới)
├── .gitignore                      # Git ignore rules
├── alubok-motahethong.md           # Mô tả hệ thống Alubok tổng thể (6 module ERP)
├── eslint.config.mjs               # ESLint configuration
├── jest.config.ts                  # Jest + ts-jest config, path alias @/* → ./src/*
├── next.config.ts                  # Next.js configuration
├── next-env.d.ts                   # Next.js TypeScript declarations
├── package.json                    # Dependencies + scripts (dev, build, test)
├── postcss.config.mjs              # PostCSS config cho Tailwind CSS
├── PROJECT_STRUCTURE_ANALYSIS.md   # File này — sơ đồ cấu trúc dự án
├── README.md                       # Default Next.js readme
└── tsconfig.json                   # TypeScript config
```

---

## 2. SRC/APP — Next.js App Router

```
src/app/
├── globals.css                     # CSS toàn cục (Tailwind imports)
├── layout.tsx                      # Root layout (html + body wrapper)
├── page.tsx                        # Trang chủ (/) — landing page
├── favicon.ico                     # Icon trang web
├── [...slug]/
│   └── page.tsx                    # Catch-all route (/ban-hang/bao-gia, /danh-muc/khach-hang...)
└── cad/
    └── page.tsx                    # Route /cad — trang CAD chính
```

---

## 3. SRC/BOOK

```
src/book/
└── App.tsx                         # Legacy book app component (không dùng)
```

---

## 4. SRC/TRANGCHUALUBOK — MODULE CHÍNH

```
src/TrangChuAlubok/
├── TrangChuAlubok.tsx              # Component trang chủ — render Sidebar + active Book
├── MuaHangPage/                    # Module Mua Hàng
│   ├── MuaHangPage.tsx             # Trang mua hàng chính
│   └── categories/                 # Danh mục sản phẩm
│       ├── InoxTam.tsx             # Inox tấm
│       ├── InoxThanh.tsx           # Inox thanh
│       ├── Kinh.tsx                # Kính
│       ├── NhomThanh.tsx           # Nhôm thanh
│       ├── PhuKienKinh.tsx         # Phụ kiện kính
│       ├── PhuKienNhom.tsx         # Phụ kiện nhôm
│       └── TongHop.tsx             # Tổng hợp tất cả
└── book/                           # Các module sổ sách

src/PlatformAdmin/                  # ⚡ QuanTriAdmin — Platform Admin ALUBOK (TÁCH BIỆT khỏi Book)
├── PlatformAdminPage.tsx           # Entry page + sidebar 16 items (4 sections) + routing
├── tenants/
│   └── TenantsPage.tsx             # E1: Quản lý tất cả org/tenant
├── users/
│   └── UsersPage.tsx               # E2: Quản lý tất cả user global
├── subscriptions/
│   └── SubscriptionsPage.tsx       # E3: Quản lý gói, billing
├── entitlements/
│   └── EntitlementsPage.tsx        # E4: Feature flags, module entitlements
├── internal-roles/
│   └── InternalRolesPage.tsx       # E5: Vai trò nội bộ ALUBOK
├── security/
│   └── SecurityLogPage.tsx         # E6: Security log toàn nền tảng
├── support/
│   └── SupportConsolePage.tsx      # E7: Hỗ trợ KH, impersonation, tickets
├── monitoring/
│   └── MonitoringPage.tsx          # E8: System health, metrics
├── jobs/
│   └── JobsQueuePage.tsx           # E9: Background jobs, queue
├── storage/
│   └── StoragePage.tsx             # E10: Storage usage, data governance
├── backup/
│   └── BackupRestorePage.tsx       # E11: Backup/restore toàn platform
├── integrations/
│   └── IntegrationsPage.tsx        # E12: SSO, email, payment, webhook
├── notifications/
│   └── NotificationsPage.tsx       # E13: Notification templates
├── analytics/
│   └── PlatformAnalyticsPage.tsx   # E14: Platform-wide analytics (MAU, MRR, churn)
├── release/
│   └── ReleaseControlPage.tsx      # E15: Release management, remote config
└── config/
    └── PlatformConfigPage.tsx      # E16: Platform settings, maintenance mode
    ├── App.tsx                     # Book app root component (useRouteSync URL routing)
    ├── Sidebar.tsx                 # Global sidebar L1 (8 mục: 6 sổ + Danh mục + Thiết lập)
    ├── navigation/                 # ⭐ URL routing + tab bar system
    │   ├── routeConfig.ts          # Route mapping: page ↔ slug ↔ tab keys
    │   ├── useRouteSync.ts         # URL sync hook (pushState + popstate)
    │   ├── ModuleTabBar.tsx        # Horizontal contextual tab bar component
    │   └── index.ts                # Barrel export
    ├── BOOK_STRUCTURE.md          # 📋 Tổng quan 10 module, trạng thái, cấu trúc
    ├── PROJECT_ROADMAP.md         # 🗺️ Thứ tự ưu tiên build (Đợt 1→4 + Song song)
    ├── MODULE_TAB_PAGE_MAP.md     # 🗂️ Bảng tổng hợp: 10 module → ~48 tabs → ~113 pages
    ├── MODULE_TAB_PAGE_DETAIL.md  # 📑 Chi tiết từng module: tabs, pages, permissions, mô tả
    ├── PERMISSION_CATALOG.md      # 🔒 Phân quyền Lớp 2 (43 resources, ~250 permissions, 6 roles)
    ├── AUTHORIZATION_ARCHITECTURE.md # 🏛️ Kiến trúc phân quyền Hybrid 2 lớp (Platform + App + DataScope + Approval)
    │
    ├── BookBanHang.tsx             # 💰 Sổ Bán Hàng (placeholder)
    ├── BookMuaHang.tsx             # 🛒 Sổ Mua Hàng (placeholder)
    ├── BookThietKeBocTach.tsx      # 📐 Sổ Thiết Kế Bóc Tách — wrapper cho CAD module (legacy)
    ├── BookThietKeBocTachModule.tsx # 📐 Module wrapper mới: 3 tab (Dự án/BOM/Danh sách cắt) + Canvas sub-route
    ├── BookThuChi.tsx              # 💵 Sổ Thu Chi (placeholder)
    ├── BookTongQuan.tsx            # 📊 Sổ Tổng Quan / Dashboard (placeholder)
    ├── BookTonKho.tsx              # 📦 Sổ Tồn Kho (placeholder)
    │
    ├── shared/                     # [INTERNAL] Types + RBAC + Time System dùng chung ✅ Phase F1 + T1
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts            # Main barrel export
    │       ├── types/              # 9 files: permission, org, user, member, role, session, audit, time + index
    │       ├── constants/          # permissionCatalog (67 resources), defaultRoles (12 roles)
    │       ├── utils/              # permissionUtils (has, match, expand, validate)
    │       ├── services/           # timeService.ts (11 functions), activityLogStore.ts (event log)
    │       ├── guards/             # requirePermission, requireModuleAccess, checkBusinessPolicy
    │       ├── hooks/              # usePermission, useCurrentUser, useCurrentOrg, useLogActivity
    │       ├── ui/                 # DateRangeFilter, DateTimeDisplay, DueBadge, ActivityTimeline
    │       └── tests/             # 148 tests, 5 suites
    ├── DanhMuc/                    # [INTERNAL] Nhóm A — Master Data (12 resources)
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts            # barrel export
    │       ├── types/              # 8 files: base, customer, supplier, employee, material, catalog, doorTemplate
    │       ├── services/           # crudService.ts (generic in-memory CRUD)
    │       ├── store/              # danhMucStore.ts (Zustand + persist, 12 arrays)
    │       ├── ui/                 # DataTable, EntityForm, StatusBadge, CategoryPage, DanhMucPage, categoryConfigs
    │       └── tests/             # 37 tests, 3 suites
    ├── BookTongQuan/               # [SIDEBAR] Dashboard tổng hợp ✅ Phase D1
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts
    │       ├── types/             # tongQuan.types.ts (KpiCard, AlertItem, FlowStep, ChartBar, QuickAction)
    │       ├── helpers/           # dashboardHelpers.ts (formatCurrency, sumField, countOverdue, calcProductionProgress)
    │       ├── hooks/             # useDashboardData.ts (aggregates 6 module stores)
    │       ├── ui/                # 6 components (Page, KpiCards, RevenueChart, OrderFlowWidget, AlertsWidget, QuickAccess)
    │       └── tests/             # 30 tests, 1 suite
    ├── BookBanHang/                # [SIDEBAR] Báo giá + Đơn bán hàng ✅ Phase B1
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts
    │       ├── types/             # banHang.types.ts (Quote, SalesOrder, calc helpers)
    │       ├── store/             # banHangStore.ts (Zustand + persist)
    │       ├── ui/                # 9 components (Page, List, Form, Detail, Reports)
    │       └── tests/             # 26 tests, 2 suites
    ├── BookMuaHang/                # [SIDEBAR] Đơn mua hàng + Yêu cầu mua ✅ Phase B2
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts            # barrel export
    │       ├── types/              # muaHang.types.ts (PR/PO types, status labels, calc helpers)
    │       ├── store/              # muaHangStore.ts (Zustand + persist, 3 requests + 1 order seed)
    │       ├── ui/                 # 8 components (Page, List, Form, Detail × 2, Report)
    │       └── tests/             # 33 tests, 2 suites
    ├── BookTonKho/                 # [SIDEBAR] Nhập/xuất/chuyển kho, kiểm kê ✅ Phase B3
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts            # barrel export
    │       ├── types/              # tonKho.types.ts (Receipt/Issue/Transfer, status, calc helpers)
    │       ├── store/              # tonKhoStore.ts (Zustand + persist, 3 receipts + 2 issues + 1 transfer seed)
    │       ├── ui/                 # 11 components (Page, List×3, Form×3, Detail×3, Balance, Report)
    │       └── tests/             # 29 tests, 2 suites
    ├── BookThuChi/                 # [SIDEBAR] Phiếu thu/chi, công nợ ✅ Phase B4
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts            # barrel export
    │       ├── types/              # thuChi.types.ts (Receipt/Payment/AR/AP, status, calc helpers)
    │       ├── store/              # thuChiStore.ts (Zustand + persist, 3 receipts + 2 payments + 3 AR + 2 AP seed)
    │       ├── ui/                 # 14 components (Page, List×2, Form×2, Detail×2, AR, AP, DebtReport, CashFlowReport)
    │       └── tests/             # 34 tests, 2 suites
    ├── BookKeToan/                 # [SIDEBAR] Chứng từ kế toán, hóa đơn ✅ Phase C2
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts            # barrel export
    │       ├── types/              # keToan.types.ts (Voucher/Invoice, status, entry, helpers)
    │       ├── store/              # keToanStore.ts (Zustand + persist, 4 vouchers + 3 invoices seed)
    │       ├── ui/                 # 9 components (Page, VoucherList/Form/Detail, InvoiceList/Form/Detail, LedgerPage, Report)
    │       └── tests/             # 31 tests, 2 suites
    ├── BookSanXuatThiCong/         # [SIDEBAR] Sản xuất & Thi công ✅ Phase SX
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts            # barrel export
    │       ├── types/              # sanXuatThiCong.types.ts (Project/PO/MaterialPlan/Installation/Acceptance, 7 status types, helpers)
    │       ├── store/              # sanXuatThiCongStore.ts (Zustand + persist, 3 projects + 3 PO + 2 plans + 2 issues + 2 installs + 1 acceptance)
    │       ├── ui/                 # 14 components (Page, SubSidebar, ProgressOverview, PO List/Form/Detail, MaterialPlan, MaterialIssue, Install List/Form/Detail, Acceptance List/Form/Detail, Report)
    │       └── tests/             # 54 tests, 2 suites
    ├── ThietLap/                   # [SETTINGS] Quản trị user, role, permission ✅ Phase F3
    │   ├── ROADMAP.md
    │   ├── docs_history_commit.md
    │   └── src/
    │       ├── index.ts            # barrel export
    │       ├── types/              # setting.types.ts (ManagedUser, ManagedRole, labels, SystemSettings)
    │       ├── store/              # thietLapStore.ts (Zustand + persist, seed data)
    │       ├── ui/                 # ThietLapPage, UserManagement, RoleManagement, PermissionMatrix, OrgSettings, SystemSettings, AuditLog, PlaceholderPage
    │       └── tests/             # 36 tests, 3 suites
    │
    └── BookThietKeBocTach/         # ===== MODULE CAD CHÍNH =====
        ├── ARCHITECTURE.md         # Kiến trúc CAD module (cập nhật mỗi task)
        ├── KEYBOARD_SHORTCUTS.md   # Bảng phím tắt CAD (L=Line, R=Rect, C=Circle...)
        ├── ROADMAP.md              # 🔴 Tiến độ CAD (875 tests, Phase 0-9, lịch sử đầy đủ)
        ├── constants/
        │   └── colors.ts           # Bảng màu ứng dụng
        ├── store/
        │   └── canvasStore.ts      # Zustand canvas store (zoom, pan, grid)
        ├── toolbar/
        │   └── ToolbarContainer.tsx # Legacy toolbar container
        └── src/                    # ===== SOURCE CODE CAD =====
            └── ...                 # (chi tiết section 5-15 bên dưới)
```

---

## 5. CORE — Lõi CAD (logic thuần, không UI)

### 5.1 core/engine/ — Điều phối trung tâm

```
core/engine/
├── CadEngine.ts                    # Engine chính — execute commands, manage entities, hit testing
├── EngineEvents.ts                 # Event types (ENTITY_ADDED, SELECTION_CHANGED...)
├── EngineState.ts                  # ToolMode enum (SELECT, LINE, RECT, CIRCLE, MOVE...)
├── entityCanvasConverter.ts        # Pure function: IEntity → CanvasEntity conversion
└── index.ts                        # Barrel exports
```

### 5.2 core/entities/ — Hệ thống Entity (data-only, không methods)

```
core/entities/
├── Entity.types.ts                 # IEntity interface, EntityType enum, IVec2, DEFAULT_STYLE
├── EntityData.types.ts             # UnifiedEntity, geometry type definitions
├── EntityRegistry.ts               # Singleton registry — dispatch theo entity type
├── EntityBridge.ts                 # Bridge IEntity ↔ UnifiedEntity (translate, rotate, scale, mirror...)
├── EntityBaseUtils.ts              # Standalone helpers (generateId, initBase, serialize, copy)
├── EntityAdapter.ts                # Legacy adapter utils
├── EntityUtils.ts                  # Entity utility functions
├── UnifiedEntity.ts                # UnifiedEntity factory/helpers
├── BaseEntity.ts                   # ⚠️ DEPRECATED — legacy class, chờ xóa
├── Line.ts                         # LineEntity — { start, end }
├── Rect.ts                         # RectEntity — { x, y, width, height, rotation }
├── Circle.ts                       # CircleEntity — { center, radius }
├── Arc.ts                          # ArcEntity — { center, radius, startAngle, endAngle }
├── Ellipse.ts                      # EllipseEntity — { center, rx, ry, rotation }
├── Polyline.ts                     # PolylineEntity — { points[], closed }
├── Text.ts                         # TextEntity — { position, content, fontSize }
├── Dimension.ts                    # DimensionEntity — { type, start, end, offset }
├── DoorEntity.ts                   # DoorEntityData interface (đã đúng R5)
├── configs/                        # EntityRegistry configs (1 file/type)
│   ├── lineConfig.ts               # create, translate, rotate, scale, mirror, containsPoint, getBounds...
│   ├── rectConfig.ts
│   ├── circleConfig.ts
│   ├── arcConfig.ts
│   ├── ellipseConfig.ts
│   ├── polylineConfig.ts
│   ├── textConfig.ts
│   ├── dimensionConfig.ts
│   └── index.ts                    # Register tất cả configs
└── index.ts                        # Barrel exports
```

### 5.3 core/commands/ — Command Pattern (AutoCAD-style)

```
core/commands/
├── Command.types.ts                # ICommand interface (execute, undo)
├── CommandContext.ts                # Command context (engine, document references)
├── CommandManager.ts               # Command queue, execute, undo, redo
├── index.ts                        # Barrel exports
├── draw/                           # Lệnh vẽ
│   ├── LINE.ts                     # DrawLineCommand
│   ├── RECT.ts                     # DrawRectCommand
│   ├── CIRCLE.ts                   # DrawCircleCommand
│   ├── ARC.ts                      # DrawArcCommand
│   ├── ELLIPSE.ts                  # DrawEllipseCommand
│   ├── POLYGON.ts                  # DrawPolygonCommand (đa giác đều)
│   ├── TEXT.ts                     # DrawTextCommand
│   └── index.ts
├── modify/                         # Lệnh chỉnh sửa
│   ├── MOVE.ts                     # MoveCommand — translateIEntity
│   ├── copy.ts                     # CopyCommand — cloneIEntity + translate
│   ├── rotate.ts                   # RotateCommand — rotateIEntity
│   ├── mirror.ts                   # MirrorCommand — mirrorIEntity
│   ├── SCALE.ts                    # ScaleCommand — scaleIEntity
│   ├── DELETE.ts                   # DeleteCommand
│   ├── SCALETEXT.ts                # ScaleTextCommand
│   ├── OFFSET.ts                   # OffsetCommand
│   ├── trim.ts                     # TrimCommand (cắt entity tại giao điểm)
│   ├── extend.ts                   # ExtendCommand (nối dài entity)
│   ├── boundary.ts                 # BoundaryCommand (BO) — tạo polyline từ vùng khép kín
│   ├── boundaryGeometry.ts         # Planar graph engine (549 dòng) — thuật toán boundary
│   ├── boundaryPostProcess.ts      # Polyline normalization sau boundary
│   └── index.ts
├── canvas/                         # Canvas-level commands (CRUD + transforms)
│   ├── CanvasEntityCommands.ts     # Add, Delete, NewDocument, Update, BatchAdd, Select, ClearSelection
│   ├── canvasTransformCommands.ts  # Move, Rotate, Mirror, Scale, Copy (canvas-level)
│   ├── canvasCommandUtils.ts       # CanvasCommandContext, generateCanvasId, validate
│   ├── TrimCanvasEntityCommand.ts  # Trim with cutting edges (~940 dòng)
│   ├── FilletCanvasEntityCommand.ts # Fillet giữa 2 lines (~550 dòng)
│   ├── ExtendCanvasEntityCommand.ts # Extend line đến boundary (~310 dòng)
│   ├── OffsetCanvasEntityCommand.ts # Offset line/polyline/rect/circle (~240 dòng)
│   ├── ExplodeCanvasEntitiesCommand.ts # Rect→4 lines, polyline→lines (~185 dòng)
│   └── index.ts
├── dimension/                      # Lệnh dimension
│   ├── DimensionCommands.ts        # Add/Update/Remove/BatchAdd dimension commands
│   ├── dimlinear.ts                # DIM LINEAR
│   ├── dimaligned.ts               # DIM ALIGNED
│   ├── dimangular.ts               # DIM ANGULAR
│   ├── dimradius.ts                # DIM RADIUS
│   ├── dimarc.ts                   # DIM ARC
│   ├── dimcontinue.ts              # DIM CONTINUE (chuỗi)
│   ├── qdim.ts                     # Quick Dimension
│   └── index.ts
├── door/                           # Lệnh cửa
│   ├── DoorCommands.ts             # Add/Update/Move/Delete door commands
│   └── index.ts
└── entity/                         # Entity-level commands
    ├── EntityCommands.ts           # Entity property update commands
    └── index.ts
```

### 5.4 core/document/ — Source of Truth

```
core/document/
├── CadDocument.ts                  # Facade (488 dòng) — entity CRUD, selection, doors, serialization
├── CadDocument.types.ts            # CanvasPoint, CanvasEntity, DocumentMetadata, DocumentData...
├── DimensionDocumentService.ts     # Dimension subsystem — validation, CRUD, index (755 dòng)
├── Block.ts                        # Block definition
├── Layer.ts                        # Layer data structure
├── History.ts                      # History manager (undo/redo stack)
└── index.ts
```

### 5.5 core/geometry/ — Toán hình học

```
core/geometry/
├── Vec2.ts                         # Vector 2D — add, sub, dot, cross, normalize, rotate, distance...
├── Matrix3.ts                      # Ma trận 3x3 — transform, multiply, inverse
├── Transform2D.ts                  # Transform 2D — compose translate/rotate/scale
├── GeometryUtils.ts                # Utils: lineIntersection, pointOnSegment, distToSegment, angleBetween...
└── index.ts
```

### 5.6 core/dimensions/ — Hệ thống Dimension

```
core/dimensions/
├── dimension.types.ts              # DimensionType (12 variants), DimensionStyle (20 props), DimensionEntity
├── dimensionGeometry.ts            # Pure math: calculateDistance, autoDetectDirection, calculateAngle...
├── DimensionManager.ts             # Facade — create/style/render/QDIM delegation (488 dòng)
├── DimensionRenderer.ts            # Canvas2D rendering cho tất cả dimension types (508 dòng)
├── QdimService.ts                  # Quick Dimension subsystem with DI (317 dòng)
└── index.ts
```

### 5.7 core/export/ — Xuất/Nhập file (5 export + 1 import, 308 tests)

```
core/export/
├── ExportManager.ts                # Thin facade (~222 dòng) — delegate cho 5 format modules
├── ExportJSON.ts                   # JSON export/import — roundtrip, validateCadJSON
├── ExportDXF.ts                    # DXF export — HEADER/TABLES/ENTITIES/EOF, ACI colors
├── ImportDXF.ts                    # DXF import — tokenize/parse/convert, 7 DXF types → IEntity[] (~740 dòng)
├── ExportSVGCore.ts                # SVG export — IEntity-based, Y-flip viewBox (~488 dòng)
├── ExportPNGCore.ts                # PNG export — ICanvasContext mock, renderIEntityToCtx (~370 dòng)
├── ExportPDFCore.ts                # PDF 1.4 export — pure string generation, no ext libs (~695 dòng)
├── ExportPNG.ts                    # PNG legacy (canvas-based)
├── ExportSVG.ts                    # SVG legacy (canvas-based)
├── ExportUtils.ts                  # calculateBounds, downloadFile (~423 dòng)
└── index.ts                        # Barrel re-exports tất cả 5 formats + DXF import
```

### 5.8 core/ — Các module còn lại

```
core/history/
├── HistoryManager.ts               # Undo/redo stack management
└── index.ts

core/layers/
├── LayerManager.ts                 # Layer CRUD, visibility, lock
└── index.ts

core/osnap/
├── Osnap.types.ts                  # OsnapMode enum (END, MID, CENTER, NEAREST...)
├── OsnapManager.ts                 # Snap point detection
└── index.ts

core/properties/
├── propertySchema.types.ts         # PropertyDefinition, PropertyCategory, ValidationResult
├── propertyBaseDefinitions.ts      # BASE_PROPERTIES (4) + STYLE_PROPERTIES (5)
├── entitySchemas.ts                # 8 entity schemas (LINE_SCHEMA, RECT_SCHEMA...) — 655 dòng
├── PropertySchema.ts               # PropertySchemaRegistry — validate, getSchema (333 dòng)
└── PropertyApplier.ts              # Apply property changes to entities

core/constraints/
├── Constraint.types.ts             # Constraint type definitions
├── ConstraintSolver.ts             # Geometric constraint solving
└── index.ts

core/clipboard/
├── ClipboardManager.ts             # Copy/paste entity management
└── index.ts

core/analysis/
├── AluminumCalculator.ts           # Tính toán nhôm
├── GlassCalculator.ts              # Tính toán kính
├── ProfileMapping.ts               # Mapping profile → material
├── Quantity.types.ts               # Quantity type definitions
├── QuantityEngine.ts               # Engine tính khối lượng
└── index.ts
```

---

## 6. DOMAIN — Nghiệp vụ ALUBOK

```
domain/
├── index.ts                        # Barrel exports
├── bom/                            # Bill of Materials
│   ├── BomCalculator.ts            # Tính BOM từ EngineOutput
│   ├── BomItem.ts                  # BomItem data structure
│   ├── CutListOptimizer.ts         # Tối ưu cắt thanh nhôm
│   ├── GlassCutCalculator.ts       # Tính cắt kính
│   ├── QuoteCalculator.ts          # Tính báo giá từ BOM
│   └── ReportGenerator.ts          # Sinh báo cáo BOM
├── door/                           # Cửa (mô hình nghiệp vụ)
│   ├── DoorFactory.ts              # Factory tạo cửa
│   ├── DoorModel.ts                # Door data model
│   ├── DoorParametrics.ts          # Parametric constraints
│   └── DoorTemplate.ts             # Template cửa
├── materials/                      # Vật tư
│   ├── Material.types.ts           # Material type definitions
│   ├── AccessoryCatalog.ts         # Catalog phụ kiện
│   ├── GlassCatalog.ts             # Catalog kính
│   └── ProfileCatalog.ts           # Catalog thanh nhôm
├── computeProjectStatus.ts         # ⭐ Auto-compute trạng thái dự án (revision-based, priority chain)
├── createQuoteFromProject.ts       # ⭐ BOM→Quote conversion, auto BG-xxxx, liên kết 2 chiều (Phase 3)
├── createContractFromQuote.ts      # ⭐ Quote→Contract conversion, auto HD-xxxx, liên kết 2 chiều (Phase 4)
├── createReceiptFromContract.ts   # ⭐ Contract→CashReceipt conversion, auto PT-xxxx, liên kết 2 chiều (Phase 5)
├── createProductionOrderFromReceipt.ts # ⭐ Receipt→ProductionOrder, auto LSX-xxxx, BOM→items (Phase 6)
├── projects/                       # Quản lý dự án
│   ├── Project.types.ts            # Project data types
│   ├── ProjectRepository.ts        # Repository interface
│   ├── ProjectService.ts           # Facade: CRUD, permissions, versioning (643 dòng)
│   ├── projectDoorOps.ts           # Door operations (add/update/remove)
│   ├── projectQuotationOps.ts      # BOM + quotation generation (290 dòng)
│   └── projectCollaborationOps.ts  # Docs, notes, team, milestones (345 dòng)
└── rules/                          # Quy tắc nghiệp vụ
    ├── BuildingRules.ts            # Quy tắc xây dựng
    └── PricingRules.ts             # Quy tắc định giá
```

---

## 7. DOOR-ENGINES — Engine sinh kỹ thuật cửa

```
door-engines/
├── engineRegistry.ts               # Registry đăng ký engine types
├── index.ts
├── base/                           # Base engine (abstract)
│   ├── BaseDoorEngine.ts           # Abstract base class
│   ├── Engine.types.ts             # EngineInput, EngineOutput, EngineConfig
│   └── engine.utils.ts             # Engine utility functions
└── hingedDoor/                     # Engine cửa mở (duy nhất hiện tại)
    ├── hingedDoor.engine.ts        # HingedDoorEngine — geometry + materials (403 dòng)
    ├── hingedDoor.rules.ts         # Quy tắc cửa mở (min/max size, constraints)
    ├── hingedDoor.types.ts         # HingedDoor-specific types
    └── index.ts
```

---

## 8. SYSTEMS — Dữ liệu hệ cửa (JSON read-only)

```
systems/
├── system.types.ts                 # System data types
├── systemLoader.ts                 # Load + validate JSON systems
├── index.ts
├── _schema/
│   └── system.schema.json          # JSON schema cho system files
├── pma/
│   └── pma55.json                  # Hệ PMA 55 data
└── xingfa/
    ├── xf55.json                   # Hệ Xingfa 55 data
    └── xf93.json                   # Hệ Xingfa 93 data
```

---

## 9. ADAPTERS — Kết nối core ↔ thế giới ngoài

```
adapters/
├── index.ts                        # Barrel exports
├── canvas/                         # Canvas adapters (Fabric.js + SVG)
│   ├── CanvasAdapter.ts            # ICanvasAdapter interface
│   ├── FabricAdapter.ts            # Fabric.js adapter facade (582 dòng)
│   ├── FabricEntityFactory.ts      # IEntity → Fabric.js object conversion (331 dòng)
│   ├── FabricPrimitiveDrawer.ts    # Standalone primitive drawing API (249 dòng)
│   ├── FabricOverlayManager.ts     # Selection/highlight/handles overlays (339 dòng)
│   ├── FabricGridRenderer.ts       # Grid rendering (138 dòng)
│   ├── SvgAdapter.ts               # SVG adapter facade (478 dòng)
│   ├── SvgEntityFactory.ts         # IEntity → SVG string conversion (259 dòng)
│   ├── SvgPrimitiveDrawer.ts       # Standalone SVG drawing API (234 dòng)
│   ├── SvgOverlayManager.ts        # SVG overlay management (271 dòng)
│   └── SvgGridRenderer.ts          # SVG grid rendering (106 dòng)
├── input/                          # Input adapters
│   ├── KeyboardAdapter.ts          # Keyboard event adapter
│   └── MouseAdapter.ts             # Mouse event adapter
├── persistence/                    # Storage adapters
│   ├── FileSystemAdapter.ts        # File system adapter
│   ├── LocalStorageAdapter.ts      # LocalStorage/IndexedDB adapter
│   └── RemoteStorageAdapter.ts     # Remote API adapter (future)
└── preview/                        # Preview adapters
    ├── previewRegistry.ts          # Door preview template registry
    ├── PreviewRenderer.tsx         # Preview rendering component
    └── index.ts
```

---

## 10. ANALYSIS — Module phân tích bóc tách

```
analysis/
├── analysis.types.ts               # Analysis data types
├── QuantityEngine.ts               # Engine tính khối lượng (top-level)
└── index.ts
```

---

## 11. UI — Giao diện người dùng

### 11.1 ui/canvas/ — Canvas components

```
ui/canvas/
├── CadDrawingCanvas.tsx            # Canvas chính (699 dòng, was 6851) — hooks composition
├── CadCanvas.tsx                   # Canvas wrapper component
├── CadDrawingCanvasV2.tsx          # V2 variant
├── CadDrawingCanvasWrapper.tsx     # Command wrapper
├── SimpleCanvas.tsx                # Simplified canvas
├── View.tsx                        # View/viewport management
├── canvas.types.ts                 # DrawingState, LayerInfo, CadDrawingCanvasProps
├── DoorRenderer.tsx                # Door rendering component
├── DoorRendererDetailed.tsx        # Detailed door renderer
├── doorRendererPrimitives.tsx      # Door renderer primitive functions
├── doorVariantRenderers.tsx        # Door variant renderers (hinged, sliding...)
├── renderAwning.tsx                # Awning window renderer
├── index.ts
│
├── handlers/                       # Event handlers
│   ├── useCommandDrawing.ts        # Command-based drawing orchestrator (649 dòng)
│   ├── commandDrawing.types.ts     # CommandDrawingConfig, State, Actions types
│   ├── commandDrawingHelpers.ts    # createCommand factory, applyOrthoMode (212 dòng)
│   ├── usePolygonHandlers.ts       # Polygon sub-hook (309 dòng)
│   ├── useTextHandlers.ts          # Text sub-hook (210 dòng)
│   ├── useDimensionInputHandlers.ts # Dynamic input sub-hook (305 dòng)
│   ├── useDrawingHandler.ts        # Drawing handler hook
│   ├── useCanvasDrawing.ts         # Canvas drawing hook
│   ├── useDynamicInputHandler.ts   # Dynamic input handler
│   ├── useModifyCommands.ts        # Modify commands handler
│   ├── useWheelHandler.ts          # Mouse wheel zoom/pan
│   ├── mouseHandlerHelpers.ts      # Mouse handler utility functions
│   ├── DrawingEventHandler.ts      # Drawing event dispatcher
│   ├── DimensionEventHandler.ts    # Dimension event dispatcher
│   ├── SelectionEventHandler.ts    # Selection event dispatcher
│   ├── KeyboardBindings.tsx        # Keyboard binding component
│   ├── PointerBindings.tsx         # Pointer binding component
│   ├── DndBindings.tsx             # Drag & drop binding component
│   └── index.ts
│
├── hooks/                          # Canvas hooks (extracted from CadDrawingCanvas)
│   ├── useCadCanvasCore.ts         # Core state + refs + transforms (~700 dòng)
│   ├── useCanvasRenderer.ts        # Rendering orchestrator (384 dòng)
│   ├── useMouseHandlers.ts         # Mouse down/move/up + selection (768 dòng)
│   ├── useKeyboardHandler.ts       # Keyboard shortcuts (789 dòng)
│   ├── useEntityOperations.ts      # Entity CRUD + clipboard (305 dòng)
│   ├── useToolChangeEffect.ts      # Tool change → state transitions (278 dòng)
│   ├── useCanvasEffects.ts         # Misc effects: resize, RAF, wheel (270 dòng)
│   ├── useTriggerEffects.ts        # Trigger undo/redo/delete effects (185 dòng)
│   ├── useDoorDragDrop.ts          # Door drag & drop (175 dòng)
│   ├── useDynamicInputHandlers.ts  # Dynamic input hook (170 dòng)
│   ├── useCommandWrapper.ts        # Command wrapper hook
│   ├── keyboardHandler.types.ts    # KeyboardHandlerParams interface
│   ├── keyboardDisplacementParser.ts # Parse @dx,dy / distance<angle input
│   ├── mouseHandler.types.ts       # MouseHandlerParams interface
│   ├── mouseHandlers/              # Mouse handler sub-modules
│   │   ├── selectMouseDown.ts      # SELECT tool mouseDown (250 dòng)
│   │   ├── dimensionMouseDown.ts   # DIMENSION tool mouseDown (230 dòng)
│   │   ├── modifyMouseDown.ts      # MODIFY commands mouseDown (708 dòng)
│   │   ├── dimensionMouseMove.ts   # Dimension moving + grip editing (248 dòng)
│   │   ├── hoverDetection.ts       # Hover detection all modes (279 dòng)
│   │   └── selectionBoxComplete.ts # Selection box mouseUp (155 dòng)
│   └── renderers/                  # Canvas render functions
│       ├── drawEntities.ts         # Entity rendering loop (383 dòng)
│       ├── drawModifyPreview.ts    # Ghost entities for modify (258 dòng)
│       ├── drawCommandPreview.ts   # Drawing preview (265 dòng)
│       ├── drawDynamicDimension.ts # Dynamic dimension HUD (99 dòng)
│       ├── drawPastePreview.ts     # Paste mode preview (58 dòng)
│       └── index.ts
│
├── overlay/                        # Canvas overlay components
│   ├── OsnapOverlay.tsx            # OSNAP indicator overlay
│   ├── HudOverlay.tsx              # HUD info display
│   ├── GridOverlay.tsx             # Grid rendering overlay
│   ├── DynamicInputOverlay.tsx     # Dynamic input overlay
│   ├── DynamicInputSection.tsx     # Dynamic input section wrapper (245 dòng)
│   ├── DoorOverlay.tsx             # Door SVG overlay + ghost preview (230 dòng)
│   ├── SelectionHighlight.tsx      # SVG selection box (window/crossing)
│   ├── RotateAngleInputOverlay.tsx # Rotate angle input (140 dòng)
│   ├── TextScaleInputOverlay.tsx   # Text scale input (165 dòng)
│   ├── TextInputOverlay.tsx        # Text input overlay
│   ├── TextInputCommandOverlay.tsx # Command-based TEXT input (115 dòng)
│   ├── TextInputLegacyOverlay.tsx  # Legacy TEXT input (210 dòng)
│   ├── OverlayRoot.tsx             # Overlay container
│   ├── PreviewOverlay.tsx          # Preview overlay
│   └── index.ts
│
├── renderers/                      # Entity renderers
│   ├── EntityRenderer.ts           # Main entity renderer
│   ├── TextRenderer.ts             # Text rendering
│   ├── DimensionRenderer.ts        # Dimension rendering
│   └── index.ts
│
├── types/                          # Canvas types
│   ├── CadEntity.ts                # CadEntity type definition
│   └── index.ts
│
└── utils/                          # Canvas utilities
    ├── geometry.ts                 # Geometric calculations
    ├── entityUtils.ts              # Entity operations
    ├── dimensionUtils.ts           # Dimension helpers
    ├── dimensionRenderer.ts        # Dimension render utils
    ├── osnapUtils.ts               # Object snap utils
    ├── renderHelpers.ts            # Rendering utilities
    ├── renderEntity.ts             # Single entity render
    ├── screenWorld.ts              # Screen ↔ World coordinate transforms
    ├── toolHelpers.ts              # Tool mode helpers
    ├── cursor.ts                   # Cursor styles per tool
    ├── viewportMath.ts             # Viewport math calculations
    ├── offsetCalculations.ts       # Offset calculation utils
    ├── types.ts                    # Shared types (re-exports from canvas.types)
    └── index.ts
```

### 11.2 ui/layout2/ — Layout components

```
ui/layout2/
├── CadLayout.tsx                   # Main CAD layout wrapper
├── Header1.tsx                     # Top bar — tabs, settings, save (276 dòng)
├── Header2.tsx                     # Tool palette — draw/modify/measure groups (192 dòng)
├── Header3.tsx                     # Command line + history (681 dòng)
├── SettingsMenu.tsx                # Settings dropdown panel — 5 sections (~820 dòng)
├── StylePanel.tsx                  # Color/opacity/stroke pickers (~780 dòng)
├── ToolGroupPanel.tsx              # Tool button grid + OSNAP checkboxes (~160 dòng)
├── commandDefinitions.ts          # 42 CAD command definitions + shortcuts (368 dòng)
├── SidebarLeft.tsx                 # Left sidebar panel
├── SidebarRight.tsx                # Right sidebar panel
└── index.ts
```

### 11.3 ui/components/ — Shared UI components

```
ui/components/
├── Button.tsx                      # Button component
├── ColorPicker.tsx                 # Color picker component
├── Dropdown.tsx                    # Dropdown component
├── Input.tsx                       # Input component
├── Modal.tsx                       # Modal dialog component
├── NotificationToast.tsx           # Toast notification
├── DoorConfigDialog.tsx            # Door configuration dialog
├── DoorDragPreview.tsx             # Door drag preview
├── DoorTemplateOverlay.tsx         # Door template overlay
├── ExportDialog.tsx                # Export dialog (legacy)
├── ExportDialog.module.css         # Export dialog styles
├── PageExportDialog.tsx            # Page export dialog (IEntity-based, ~300 dòng)
├── ImportDXFDialog.tsx             # DXF import dialog — file picker, preview stats, import (~230 dòng)
├── ProjectInfoDropdown.tsx         # Project info dropdown
├── DoorConfigDialog/               # Door config sub-components
│   ├── ParametricPreview.tsx       # Parametric preview component
│   ├── types.ts                    # Dialog types
│   └── index.ts
└── index.ts
```

### 11.4 ui/panels/ — Side panels

```
ui/panels/
├── BomPanel.tsx                    # BOM panel
├── DimensionPanel.tsx              # Dimension manager panel
├── DimensionPanel.module.css       # Dimension panel styles
├── DoorLibraryPanel.tsx            # Door library panel
├── HistoryPanel.tsx                # Undo/redo history panel
├── HistoryPanel.module.css         # History panel styles
├── LayerPanel.tsx                  # Layer manager panel
├── LayerPanel.module.css           # Layer panel styles
├── LayerPanelConnected.tsx         # Connected layer panel (with store)
├── LayersPanel.tsx                 # Layers panel (alternative)
├── ProjectPanel.tsx                # Project info panel
├── PropertiesPanel.tsx             # Entity properties panel
├── QuotePanel.tsx                  # Quote/báo giá panel
├── TextPanel.tsx                   # Text properties panel
├── TextPanel.module.css            # Text panel styles
└── index.ts
```

### 11.5 ui/toolbar/ — Toolbar components

```
ui/toolbar/
├── DrawToolbar.tsx                 # Drawing tool bar
├── ModifyToolbar.tsx               # Modify tool bar
├── ViewToolbar.tsx                 # View tool bar
├── CommandPalette.tsx              # Command palette (Ctrl+K)
├── StatusBar.tsx                   # Status bar
└── index.ts
```

---

## 12. HOOKS — Business hooks

```
hooks/
├── index.ts                        # Barrel exports
├── useBomCalculator.ts             # BOM calculation hook
├── useCadEngine.ts                 # CadEngine access hook
├── useCanvasEntities.ts            # Canvas entities from Document (source of truth)
├── useCanvasEventHandlers.ts       # Canvas event handlers (~425 dòng)
├── useDrawingCommands.ts           # Drawing commands hook
├── useDimensions.ts                # Dimension management (546 dòng)
├── useDimensionClick.ts            # Dimension click handler (~780 dòng)
├── useDimensionPreview.ts          # Dimension preview/move (~410 dòng)
├── useDimensionQdim.ts             # Quick Dimension (~170 dòng)
├── useDimensionCommands.ts         # Dimension command handlers
├── useDoorEntities.ts              # Door entities hook
├── useDoorTemplates.ts             # Door template loading
├── useDoorHandlers.ts              # Door handlers (~354 dòng)
├── useDragDrop.ts                  # Drag & drop hook
├── useEngineEntities.ts            # Engine entities hook
├── useExport.ts                    # Export hook
├── useKeyboard.ts                  # Keyboard hook
├── useKeyboardShortcuts.ts         # Keyboard shortcuts (~406 dòng)
├── useLayers.ts                    # Layer management hook
├── useModifyCommands.ts            # Modify commands (~696 dòng)
├── usePageCommands.ts              # Command dispatcher (~392 dòng)
├── usePageSettings.ts              # Page settings + layers (~340 dòng)
├── usePanZoom.ts                   # Pan/zoom hook
├── useProperties.ts                # Properties panel hook
├── useSelection.ts                 # Selection hook
├── useStyleHandlers.ts             # Style handlers (~258 dòng)
├── useTextSettings.ts              # Text settings hook
└── useToolbar.ts                   # Toolbar hook (~315 dòng)
```

---

## 13. STORE — Zustand state management

```
store/
├── index.ts                        # Barrel exports
├── engineStore.ts                  # Engine store — selectedIds, documentVersion, activeTool
├── doorStore.ts                    # Door store — door entities, templates
├── projectStore.ts                 # Project store — IndexedDB persistence
└── uiStore.ts                      # UI store — panels, modals, UI state
```

---

## 14. TESTS

```
__tests__/
├── core/
│   ├── geometry/
│   │   ├── Vec2.test.ts            # 17 tests — Vec2 operations
│   │   ├── Matrix3.test.ts         # 37 tests — matrix transforms
│   │   ├── Transform2D.test.ts     # 46 tests — 2D transforms
│   │   └── GeometryUtils.test.ts   # 85 tests — geometry utils
│   ├── commands/
│   │   ├── drawCommands.test.ts    # 82 tests — LINE/RECT/CIRCLE/ARC/ELLIPSE/POLYLINE/POLYGON/TEXT
│   │   └── modifyCommands.test.ts  # 52 tests — MOVE/COPY/ROTATE/MIRROR/SCALE/DELETE
│   ├── document/
│   │   └── cadDocument.test.ts     # 49 tests — CRUD, selection, doors, state
│   ├── engine/
│   │   └── cadEngine.test.ts       # 61 tests — tool, viewport, entity, selection, draw
│   ├── entities/
│   │   ├── entityRegistry.test.ts  # 15 tests — registry pattern
│   │   └── entityConfigs.test.ts   # 76 tests — 8 entity type configs
│   ├── export/
│   │   ├── exportJSON.test.ts      # 39 tests — JSON roundtrip
│   │   ├── exportDXF.test.ts       # 47 tests — DXF export
│   │   ├── exportSVG.test.ts       # 63 tests — SVG export
│   │   ├── exportPNG.test.ts       # 49 tests — PNG export
│   │   ├── exportPDF.test.ts       # 62 tests — PDF 1.4 export
│   │   └── importDXF.test.ts       # 48 tests — DXF import
│   ├── history/
│   │   └── historyBypass.test.ts   # 10 tests — history bypass block
│   └── selection/
│       ├── selection.test.ts       # 20 tests — golden selection
│       └── selectionCommands.test.ts # 16 tests — select/clear commands
└── domain/
    └── bom/
        └── bom.test.ts             # 34 tests — BOM, CutListOptimizer, GlassCut

tests/                               # ⭐ Quy trình dự án tests (Phase 1-7)
├── computeProjectStatus.test.ts     # 15 tests — 7 trạng thái + revision + isLocked
├── projectSyncPhase2.test.ts        # 15 tests — BOM sync, cascade, soLuongBo
├── createQuoteFromProject.test.ts   # 13 tests — BOM→Quote, auto BG-xxxx
├── createContractFromQuote.test.ts  # 13 tests — Quote→Contract, auto HD-xxxx
├── createReceiptFromContract.test.ts # 12 tests — Contract→Receipt, auto PT-xxxx
├── createProductionOrderFromReceipt.test.ts # 10 tests — Receipt→LSX, auto LSX-xxxx
├── canvasLockPhase7.test.ts         # 23 tests — Lock guard, VIEW_SAFE_TOOLS, keyboard lock
├── revisionCascadePhase8.test.ts    # 15 tests — staleDocuments, cascade, re-create flow
└── PREVIEW_ARCHITECTURE_TEST_CHECKLIST.md  # Checklist test kiến trúc preview
```

---

## 15. CÁC FILE KHÁC

```
src/TrangChuAlubok/book/BookThietKeBocTach/src/
├── BookThietKeBocTachPage.tsx       # Trang chính CAD (882 dòng) — hooks composition
├── BookThietKeBocTachPage.module.css # CSS cho trang CAD
├── index.ts                         # Barrel export
├── COMPLIANCE_CHECKLIST.md          # ✅ Checklist kiến trúc NON-NEGOTIABLE
├── image-1.png                      # Hình minh họa
│
├── assets/door-templates/cua-so/    # Door template assets
│   └── cua-so-hat.svg              # SVG template cửa sổ hất
│
├── ui/views/                        # Tab views (mới — tab restructuring)
│   ├── ProjectListView.tsx          # Tab Dự án — project cards, CRUD, filter
│   ├── BomView.tsx                  # Tab BOM — wrap BomPanel, nút tạo báo giá
│   └── CutListView.tsx             # Tab Danh sách cắt — tối ưu cắt nhôm/kính
│
├── types/
│   └── DoorPreviewData.ts          # DoorPreviewData type
│
└── docs/                            # Tài liệu
    ├── docs_history_commit.md       # 🔴 Session history (cập nhật mỗi task)
    ├── QUY_TRINH_DU_AN.md           # ⭐ Quy trình dự án: 8 bước, revision, cascade
    ├── ROADMAP_QUY_TRINH.md         # ⭐ Roadmap 8 phases triển khai quy trình
    ├── AUTOCAD_BEHAVIOR_RULES.md    # 14 nguyên tắc UX theo chuẩn AutoCAD
    ├── 3D_READY_ARCHITECTURE.md     # Kiến trúc sẵn sàng 3D
    ├── PREVIEW_CONTRACT.md          # Contract dữ liệu Preview
    └── PREVIEW_SVG_WORKFLOW_TODO.md  # TODO SVG preview (archive)
```

---

## 16. TỔNG KẾT

| Metric | Giá trị |
|--------|---------|
| Tổng files | ~535 |
| Files .ts/.tsx | ~490 |
| Files .md | 37 |
| Tests | **1366 pass (30 mới)** |
| Test suites | **45** |
| Test time | **~16s** |
| Module folders (book/) | 11 (shared, DanhMuc, BookTongQuan, BookThietKeBocTach, BookBanHang, BookMuaHang, BookTonKho, BookThuChi, BookKeToan, BookSanXuatThiCong, ThietLap) |
| Thư mục cấp 1 (trong BookThietKeBocTach/src/) | 15 (core, domain, door-engines, systems, adapters, analysis, hooks, store, ui, docs, tests, types, assets, __tests__) |
| Entity types | 8 (line, rect, circle, arc, ellipse, polyline, text, dimension) |
| Export formats | 5 (JSON, DXF, SVG, PNG, PDF) |
| Door engines | 1 (hingedDoor) — thêm 6+ trong Phase 7 |
