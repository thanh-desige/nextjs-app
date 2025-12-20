/**
 * COMMAND ARCHITECTURE - Kiến trúc lệnh vẽ CAD
 *
 * =====================================================
 * FLOW: UI → Hook → Command → Engine → Document
 * =====================================================
 *
 * 1. UI LAYER (CadDrawingCanvas.tsx)
 *    - Thu thập mouse events (click, move, drag)
 *    - Vẽ preview entities
 *    - KHÔNG được tạo/sửa entity trực tiếp
 *
 * 2. HOOK LAYER (useDrawingCommands.ts)
 *    - Quản lý drawing state (đang vẽ gì, có bao nhiêu điểm)
 *    - Tạo Command instance khi tool thay đổi
 *    - Gọi Command.execute() khi hoàn thành
 *
 * 3. COMMAND LAYER (commands/draw/*.ts)
 *    - Chứa logic nghiệp vụ (tính toán geometry)
 *    - Tạo Entity thông qua EntityFactory
 *    - Thêm vào Engine thông qua context.engine.addEntity()
 *
 * 4. ENGINE LAYER (CadEngine.ts)
 *    - Thêm entity vào Document
 *    - Emit events cho UI update
 *
 * 5. DOCUMENT LAYER (CadDocument.ts)
 *    - Source of truth cho entities
 *    - Quản lý History (undo/redo)
 *
 * =====================================================
 * THÊM LỆNH MỚI - Chỉ cần 3 bước
 * =====================================================
 *
 * Ví dụ: Thêm lệnh SPLINE
 *
 * BƯỚC 1: Tạo Entity (nếu chưa có)
 * --------------------------------
 * File: core/entities/Spline.ts
 * - Extend BaseEntity
 * - Implement getPoints(), getBounds(), containsPoint()
 *
 * BƯỚC 2: Tạo Command
 * -------------------
 * File: core/commands/draw/SPLINE.ts
 * - Implement IInteractiveCommand
 * - getPrompt() - Hướng dẫn user
 * - createPreview() - Vẽ preview khi di chuột
 * - execute() - Tạo entity thật
 *
 * BƯỚC 3: Đăng ký vào Factory
 * ---------------------------
 * File: hooks/useDrawingCommands.ts
 * - Thêm case trong createCommandForTool()
 *
 * → XONG! Canvas tự động hỗ trợ lệnh mới
 *
 * =====================================================
 * QUY TẮC BẮT BUỘC (3 ĐIỀU KIỆN)
 * =====================================================
 *
 * ĐIỀU KIỆN 1: KHÔNG TRỘN LOGIC
 * - Canvas KHÔNG được gọi addEntity() trực tiếp
 * - Phải đi qua: Hook → Command → Engine
 *
 * ĐIỀU KIỆN 2: PropertySchema là LUẬT TỐI CAO
 * - Mọi entity property phải đăng ký trong PropertySchema
 * - Không thêm property "tự do" vào entity
 *
 * ĐIỀU KIỆN 3: KHÔNG GỘP FILE
 * - Mỗi Command 1 file riêng
 * - Mỗi Entity 1 file riêng
 * - Dễ tìm, dễ sửa, dễ test
 *
 * =====================================================
 * CẤU TRÚC THƯ MỤC
 * =====================================================
 *
 * src/
 * ├── core/
 * │   ├── commands/
 * │   │   ├── Command.types.ts      # Interface definitions
 * │   │   ├── CommandManager.ts     # Quản lý execution
 * │   │   ├── draw/
 * │   │   │   ├── index.ts
 * │   │   │   ├── LINE.ts           # Mỗi lệnh 1 file
 * │   │   │   ├── RECT.ts
 * │   │   │   ├── CIRCLE.ts
 * │   │   │   ├── ARC.ts
 * │   │   │   ├── ELLIPSE.ts
 * │   │   │   ├── TEXT.ts
 * │   │   │   └── POLYLINE.ts
 * │   │   ├── modify/
 * │   │   │   ├── MOVE.ts
 * │   │   │   ├── COPY.ts
 * │   │   │   ├── ROTATE.ts
 * │   │   │   └── ...
 * │   │   └── dimension/
 * │   │       ├── DIMLINEAR.ts
 * │   │       └── ...
 * │   │
 * │   ├── entities/
 * │   │   ├── Entity.types.ts       # Interface definitions
 * │   │   ├── BaseEntity.ts         # Abstract base class
 * │   │   ├── Line.ts               # Mỗi entity 1 file
 * │   │   ├── Rect.ts
 * │   │   ├── Circle.ts
 * │   │   ├── Arc.ts
 * │   │   ├── Ellipse.ts
 * │   │   ├── Text.ts
 * │   │   └── Polyline.ts
 * │   │
 * │   ├── engine/
 * │   │   ├── CadEngine.ts          # Core engine
 * │   │   ├── EngineState.ts        # State types
 * │   │   └── EngineEvents.ts       # Event system
 * │   │
 * │   ├── document/
 * │   │   ├── CadDocument.ts        # Source of truth
 * │   │   └── History.ts            # Undo/Redo
 * │   │
 * │   └── properties/
 * │       └── PropertySchema.ts     # LUẬT TỐI CAO
 * │
 * ├── hooks/
 * │   ├── useDrawingCommands.ts     # Điều phối drawing
 * │   ├── useCadEngine.ts           # Access engine
 * │   └── ...
 * │
 * └── ui/
 *     └── canvas/
 *         └── CadDrawingCanvas.tsx  # CHỈ vẽ + events
 *
 * =====================================================
 * COMMAND INTERFACE
 * =====================================================
 *
 * interface IInteractiveCommand {
 *   // Metadata
 *   name: string;
 *   toolMode: ToolMode;
 *   requiredPoints: number;
 *
 *   // User interaction
 *   getPrompt(pointCount: number): string;
 *   getOptions(pointCount: number): CommandOption[];
 *
 *   // Preview while drawing
 *   createPreview(context, currentPoint): IEntity | null;
 *
 *   // Execution
 *   canComplete(pointCount: number): boolean;
 *   execute(context): CommandResult;
 *   undo(context): void;
 * }
 *
 */

// This file is documentation only - không có code thực thi
export {};
