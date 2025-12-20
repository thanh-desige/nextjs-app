# Keyboard Shortcuts - BookThietKeBocTach (CAD Tool)

## Navigation & Zoom

| Shortcut         | Action       | Description                                                 |
| ---------------- | ------------ | ----------------------------------------------------------- |
| **Scroll Wheel** | Zoom In/Out  | Scroll up to zoom in, scroll down to zoom out (0.1x - 100x) |
| **Z**            | Zoom Fit     | Fit all objects to canvas view                              |
| **1**            | Zoom 100%    | Reset zoom to 100% (1x)                                     |
| **E**            | Zoom Extents | Same as Zoom Fit - display all objects                      |
| **Space + Drag** | Pan          | Hold Space and drag mouse to move canvas view               |

## Drawing Tools

| Shortcut | Action    | Description                            |
| -------- | --------- | -------------------------------------- |
| **L**    | Line      | Draw line segments                     |
| **R**    | Rectangle | Draw rectangular shapes                |
| **C**    | Circle    | Draw circular shapes                   |
| **P**    | Polyline  | Draw multi-point connected lines (TBD) |
| **A**    | Arc       | Draw curved lines (TBD)                |
| **S**    | Spline    | Draw smooth curves (TBD)               |

## Modify Commands

| Shortcut | Action | Description                  |
| -------- | ------ | ---------------------------- |
| **M**    | Move   | Move selected objects        |
| **CO**   | Copy   | Copy selected objects        |
| **RO**   | Rotate | Rotate selected objects      |
| **MI**   | Mirror | Mirror selected objects      |
| **SC**   | Scale  | Scale selected objects       |
| **DE**   | Delete | Delete selected objects      |
| **O**    | Offset | Offset objects (TBD)         |
| **TR**   | Trim   | Trim objects at intersection |
| **EX**   | Extend | Extend objects to boundary   |
| **F**    | Fillet | Round corners (TBD)          |

### Chi tiết các lệnh Modify (AutoCAD Style)

#### M - Move (Di chuyển)

```
Cách dùng:
1. Chọn đối tượng → Gõ M → Enter
2. Hoặc: Gõ M → Enter (nếu đã có đối tượng được chọn)
3. Click chọn điểm gốc (base point)
4. Click chọn điểm đích (destination point)
5. Đối tượng được di chuyển

Đặc điểm:
- Preview hiển thị ghost entities khi di chuột
- Di chuyển cả entities và dimensions
- Hỗ trợ OSNAP cho base/destination point
```

#### CO - Copy (Sao chép)

```
Cách dùng:
1. Chọn đối tượng → Gõ CO → Enter
2. Click chọn điểm gốc (base point)
3. Click chọn điểm đích → Tạo bản sao
4. Tiếp tục click để tạo thêm bản sao
5. ESC để kết thúc

Đặc điểm:
- Có thể tạo nhiều bản sao liên tiếp
- Preview hiển thị ghost entities
- Bản sao là đối tượng mới, độc lập
```

#### RO - Rotate (Xoay)

```
Cách dùng:
1. Chọn đối tượng → Gõ RO → Enter
2. Click chọn tâm xoay (base point)
3. Di chuột để xoay → Click để xác nhận góc

Đặc điểm:
- Preview hiển thị ghost entities xoay theo chuột
- Góc xoay hiển thị trong prompt khi hoàn thành
- Dimensions cũng được xoay cùng
```

#### MI - Mirror (Đối xứng gương)

```
Cách dùng:
1. Chọn đối tượng → Gõ MI → Enter
2. Click điểm 1 của trục gương
3. Click điểm 2 của trục gương
4. Tạo bản sao đối xứng qua trục

Đặc điểm:
- Tạo BẢN SAO đối xứng (không xóa gốc)
- Preview hiển thị trục gương (magenta) + ghost entities
- Trục gương có thể ở bất kỳ góc nào
```

#### SC - Scale (Tỷ lệ)

```
Cách dùng:
1. Chọn đối tượng → Gõ SC → Enter
2. Click chọn tâm scale (base point)
3. Di chuột để scale → Click để xác nhận

Đặc điểm:
- Scale factor = khoảng cách chuột / 100
- Preview hiển thị ghost entities đã scale
- Base point là tâm tỷ lệ
```

### Implementation Notes

```typescript
// DrawingState types cho modify commands:
| { mode: "modifyMove"; step: "selectBase" | "selectDestination";
    basePoint?: Point; entityIds: string[]; dimensionIds: string[]; }
| { mode: "modifyCopy"; step: "selectBase" | "selectDestination"; ... }
| { mode: "modifyRotate"; step: "selectBase" | "selectAngle";
    startAngle?: number; ... }
| { mode: "modifyMirror"; step: "selectFirst" | "selectSecond";
    firstPoint?: Point; ... }
| { mode: "modifyScale"; step: "selectBase" | "selectScale"; ... }

// Preview:
- Sử dụng movingPreviewDelta để lưu delta/angle/scale
- Ghost entities vẽ với ctx.globalAlpha = 0.5, ctx.setLineDash([5,5])
- Mirror line vẽ bằng màu magenta (#ff00ff)
```

## Object Selection

| Shortcut         | Action          | Description                                                  |
| ---------------- | --------------- | ------------------------------------------------------------ |
| **Esc**          | Deselect        | Clear all selections                                         |
| **Ctrl+A**       | Select All      | Select all objects (or all dimensions if dimension selected) |
| **Ctrl+Shift+A** | Select All Both | Select all objects AND dimensions                            |
| **Shift+Click**  | Multi-select    | Add/remove objects from selection                            |
| **Box Select**   | Selection Box   | Drag to select multiple objects/dimensions                   |

## Dimensions

| Shortcut            | Action           | Description                                     |
| ------------------- | ---------------- | ----------------------------------------------- |
| **D**               | Dimension Tool   | Switch to dimension drawing mode                |
| **DLI**             | DimLinear        | Tạo dimension ngang hoặc dọc                    |
| **DAL**             | DimAligned       | Tạo dimension song song với đối tượng           |
| **DRA**             | DimRadius        | Tạo dimension bán kính (click tâm hoặc edge)    |
| **DDI**             | DimDiameter      | Tạo dimension đường kính                        |
| **DAN**             | DimAngular       | Tạo dimension góc                               |
| **DCO**             | DimContinue      | Tạo dimension liên tiếp (cùng offset)           |
| **DBA**             | DimBaseline      | Tạo dimension từ baseline (offset tăng dần)     |
| **QDIM**            | Quick Dimension  | Chọn nhiều đối tượng → tạo dimension nhanh      |
| **Click dimension** | Select           | Select single dimension                         |
| **Shift+Click**     | Multi-select     | Add dimension to selection                      |
| **Ctrl+A**          | Select All Dims  | Select all dimensions (when dimension selected) |
| **Delete**          | Delete Dimension | Delete selected dimension(s)                    |
| **Ctrl+C**          | Copy Dimension   | Copy selected dimensions                        |
| **Ctrl+V**          | Paste Dimension  | Paste copied dimensions                         |

### Chi tiết các lệnh Dimension

#### DLI - DimLinear (Dimension ngang/dọc)

```
Cách dùng:
1. Gõ DLI → Enter
2. Chế độ thường: Click điểm 1 → Click điểm 2 → Di chuột đặt offset
3. Chế độ nhanh (Enter để toggle): Click vào đoạn thẳng → Di chuột đặt offset

Grip points (5 điểm):
- point1, point2: Điểm gốc - kéo để thay đổi vị trí đo
- dimP1, dimP2: Đầu dim line - kéo để thay đổi offset + endpoint
- text: Giữa dim line - kéo để thay đổi offset
```

#### DAL - DimAligned (Dimension song song)

```
Cách dùng: Tương tự DLI, nhưng dim line song song với đoạn thẳng
```

#### DRA - DimRadius (Dimension bán kính)

```
Cách dùng:
1. Gõ DRA → Enter
2. Click vào TÂM hoặc EDGE của đường tròn
3. Di chuột để chọn góc leader → Click để xác nhận

Hiển thị: R[giá trị]mm với leader + mũi tên bám vào đường tròn

Grip points (3 điểm):
- point1 (tâm): Kéo để di chuyển cả dimension
- point2 (mũi tên): Kéo để xoay góc leader (bán kính không đổi)
- text (trên leader): Kéo để xoay góc leader

Lưu ý: Bán kính luôn bám vào đường tròn gốc, không thể kéo để thay đổi
```

#### DDI - DimDiameter (Dimension đường kính)

```
Cách dùng: Tương tự DRA
Hiển thị: ⌀[giá trị]mm với line xuyên tâm
```

#### DCO - DimContinue (Dimension liên tiếp)

```
Yêu cầu: Phải có dimension trước đó (DLI hoặc DAL)

Cách dùng:
1. Tạo dimension đầu tiên (DLI)
2. Gõ DCO → Enter
3. Click các điểm tiếp theo → Tự động tạo dim cùng offset

Đặc điểm:
- Tất cả dim nằm trên cùng 1 đường (cùng offset)
- Điểm gốc của dim mới = điểm cuối của dim trước
```

#### DBA - DimBaseline (Dimension từ baseline)

```
Yêu cầu: Phải có dimension trước đó

Cách dùng:
1. Tạo dimension đầu tiên (DLI)
2. Gõ DBA → Enter
3. Click các điểm tiếp theo → Tự động tạo dim với offset tăng dần

Đặc điểm:
- Giữ nguyên điểm gốc (baseline)
- Mỗi dim có offset lớn hơn dim trước
```

#### QDIM - Quick Dimension

```
Cách dùng:
1. Gõ QDIM → Enter
2. Click chọn các đối tượng (line, rect...) hoặc quét chọn
3. Enter để xác nhận selection
4. Di chuột đặt offset → Click để tạo

Đặc điểm:
- Tự động phát hiện các điểm cần đo
- Tạo nhiều dimension cùng lúc
- Hoạt động hoàn hảo ✅
```

### Dimension Selection & Editing

```
Chọn dimension:
- Click vào dim line, extension line, hoặc text
- Quét chọn (box select)
- Shift+Click để multi-select

Với DRA/DDI: Click vào leader line hoặc horizontal tail

Edit dimension:
- Kéo grip points để resize/move
- Properties panel để edit trực tiếp
```

### Implementation Notes

```typescript
// hitTestDimension - kiểm tra click vào dimension
// Với radius/diameter: dùng radius * 2 cho leader length
// Tolerance * 2 cho dễ click

// getDimensionGrips - lấy grip points
// Với radius/diameter: point1 (tâm), point2 (edge), text (leader)
// Text grip ở vị trí radius * 1.5 từ tâm

// dimensionIntersectsRect - kiểm tra quét chọn
// Check các điểm: circlePoint, farPoint, leaderMid

// renderRadiusDiameterDimension - vẽ dimension
// Dùng dim.point2 để tính radius (không tìm circle entity)
// Vẽ grip points khi isSelected
```

### Dimension Editing (Legacy)

- **Click selected dimension** → Drag to adjust offset
- **Grip at endpoints** → Drag to move dimension endpoints
- **Grip at center (diamond)** → Drag to adjust offset distance
- **Properties Panel** → Edit offset, precision directly

## UI Controls

| Shortcut      | Action            | Description             |
| ------------- | ----------------- | ----------------------- |
| **Tab**       | Toggle Sidebar    | Hide/show left sidebar  |
| **Shift+Tab** | Toggle Properties | Hide/show right sidebar |

## Space/Enter - AutoCAD Style (IMPORTANT)

Space và Enter hoạt động giống nhau, theo chuẩn AutoCAD:

| Context                    | Action              | Description                                     |
| -------------------------- | ------------------- | ----------------------------------------------- |
| **SELECT mode + idle**     | Repeat Last Command | Gõ lệnh → thực hiện → ESC → Space → repeat lệnh |
| **Đang vẽ Line**           | Finish Drawing      | Kết thúc vẽ line, tạo polyline từ các điểm      |
| **Đang vẽ Rect/Circle**    | Prevent Default     | Không làm gì, tiếp tục vẽ                       |
| **Dimension tool step 0**  | Toggle Auto Select  | Chuyển đổi chế độ chọn nhanh/thường             |
| **QDIM step 0**            | Confirm Selection   | Xác nhận các đối tượng đã chọn                  |
| **Command buffer có text** | Execute Command     | Thực thi lệnh trong buffer                      |

### Implementation Pattern (cho các lệnh mới)

```typescript
// 1. Trong handleCommand (BookThietKeBocTachPage.tsx):
const handleCommand = useCallback((command: string) => {
  const cmd = command.toLowerCase().trim();

  // Track last command for Space repeat
  if (cmd) {
    setLastCommand(cmd);
  }

  // ... xử lý lệnh
}, [...]);

// 2. Trong CadDrawingCanvas.tsx keyboard handler:
if (isConfirmKey) {  // Space or Enter
  e.preventDefault();

  // SELECT mode + idle = repeat last command
  if (activeTool === ToolMode.SELECT && drawState.mode === "idle") {
    onRepeatLastCommand?.();
    return;
  }

  // ... các trường hợp khác
}

// 3. Pass callback từ parent:
<CadDrawingCanvas
  onRepeatLastCommand={() => {
    if (lastCommand) handleCommand(lastCommand);
  }}
/>
```

### Áp dụng cho lệnh chỉnh sửa (Move, Copy, Rotate, Offset...)

Khi implement lệnh chỉnh sửa, đảm bảo:

1. Lệnh được xử lý trong `handleCommand` với cmd như "m", "co", "ro", "o"
2. `setLastCommand(cmd)` được gọi khi lệnh bắt đầu
3. Sau khi hoàn thành → ESC → về SELECT mode
4. Space sẽ tự động repeat lệnh vừa thực hiện

## Status Bar Information

- **Zoom Level**: Displayed in console logs with format `[Zoom] Current zoom: X.XXx`
- **Current Tool**: Shown in Header2
- **Selected Objects**: Count displayed when objects selected

## Tips

- **No Modifier Keys Needed**: Zoom works with just scroll wheel (no Ctrl+Scroll required)
- **Precise Zoom**: Hover over specific area before scrolling to zoom into that point
- **Pan While Drawing**: Press Space during any operation to pan temporarily
- **High-DPI Rendering**: Zoom maintains crisp quality up to 100x magnification

## Performance

- Zoom range: **0.1x** (zoomed out) to **100x** (zoomed in)
- Debounce on resize: 120ms
- Canvas refresh rate: Real-time (renderAll on events)
- Object caching: Disabled for vector sharpness
