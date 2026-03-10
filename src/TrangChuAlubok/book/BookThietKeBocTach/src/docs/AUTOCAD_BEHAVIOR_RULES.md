# AutoCAD Behavior Rules - 14 Nguyên tắc cốt lõi

🔑 **Đây là 14 rule bản chất của AutoCAD - Foundation cho CAD system design**

---

## 🔒 Rule 1. Command State Rule

**Tại mọi thời điểm, hệ thống chỉ có 1 command state đang active:**

- `IDLE` (không có lệnh nào)
- HOẶC một command cụ thể: `LINE`, `ERASE`, `MOVE`, `DIM`...

**Ý nghĩa:**

- Không được tồn tại 2 commands cùng lúc
- State machine phải deterministic
- Mỗi thời điểm chỉ có 1 context xử lý input

---

## 🔒 Rule 2. Command Lock Rule

**Khi một modal command đang active (LINE, ARC, DIM...):**

- ❌ Không cho phép chuyển command bằng phím chữ
- ✅ Chỉ chấp nhận:
  - Input điểm (click, coordinate)
  - Modifier keys (Shift, Ctrl)
  - ESC (cancel)
  - Override commands (theo Rule 3)

**Ví dụ:**

```
User đang vẽ LINE:
- Nhấn C → KHÔNG khởi tạo CIRCLE
- Nhấn ESC → Cancel LINE
- Nhấn số/tọa độ → Input điểm tiếp
```

**Exception:** Global overrides (Rule 3)

---

## 🔒 Rule 3. Global Override Rule

**Các input luôn được phép, KHÔNG phụ thuộc command đang active:**

| Key                   | Action       | Behavior                 |
| --------------------- | ------------ | ------------------------ |
| ESC                   | Cancel/Clear | Cascade cancel (Rule 11) |
| DELETE                | Erase        | Xóa selection            |
| BACKSPACE             | Input delete | Xóa ký tự cuối           |
| Ctrl+Z                | Undo         | Hoàn tác                 |
| Ctrl+Y / Ctrl+Shift+Z | Redo         | Làm lại                  |
| Middle Mouse / Pan    | Pan          | Di chuyển view           |
| Scroll / Zoom         | Zoom         | Zoom in/out              |

**Ý nghĩa:**

- User luôn có quyền điều khiển cơ bản
- Không bao giờ "lock" hoàn toàn UI

---

## 🔒 Rule 4. Modeless vs Modal Rule

### Modal Commands (Khóa input):

- `LINE`, `ARC`, `CIRCLE`, `DIM`, `TEXT`...
- Yêu cầu hoàn thành sequence (điểm 1 → điểm 2 → Enter)
- Block keyboard commands khác

### Modeless Commands (Không khóa):

- `ERASE`, `MOVE`, `COPY`, `ROTATE`, `MIRROR`...
- Thực thi ngay lập tức
- Không yêu cầu sequence dài

**⚠️ QUAN TRỌNG:**

- **ERASE bắt buộc là modeless**
- ERASE không được require tool selection trước

---

## 🔒 Rule 5. Selection Priority Rule

**Nếu tồn tại selection:**

- ✅ Input ưu tiên hành vi Modify
- ❌ Không tự động khởi tạo command vẽ mới

**Ví dụ:**

```
User đã chọn 1 LINE:
- Nhấn M → MOVE (modify)
- Nhấn L → KHÔNG vẽ LINE mới
- Click canvas → Deselect (nếu mode cho phép)
```

**Exception:** Explicit command (gõ LINE + Enter)

---

## 🔒 Rule 6. Empty Selection Rule

**Nếu KHÔNG có selection:**

- ✅ Phím chữ được hiểu là command
- ✅ Click canvas = bắt đầu vẽ / chọn

**Ví dụ:**

```
Không có selection:
- Nhấn L → Khởi tạo LINE
- Nhấn C → Khởi tạo CIRCLE
- Click canvas → Bắt đầu vẽ entity mới
```

---

## 🔒 Rule 7. Implicit Command Rule

**Hệ thống phải hỗ trợ command ngầm định:**

| Action       | Implicit Command | No Tool Required |
| ------------ | ---------------- | ---------------- |
| Click object | SELECT           | ✅               |
| Drag grip    | MOVE             | ✅               |
| Press DELETE | ERASE            | ✅               |
| Drag box     | WINDOW SELECT    | ✅               |

**Ý nghĩa:**

- User không cần active tool trước
- Direct manipulation > tool selection

---

## 🔒 Rule 8. Keyboard Context Rule

**Keyboard KHÔNG phụ thuộc DOM focus**

Keyboard CHỈ phụ thuộc:

1. **Command state** (IDLE, LINE, MOVE...)
2. **Selection state** (có/không selection)
3. **Input mode** (numeric, text, point...)

**❌ SAI:**

```typescript
if (inputElement.focused) {
  handleKeyboard();
}
```

**✅ ĐÚNG:**

```typescript
if (commandState === "TEXT_INPUT") {
  handleTextInput();
} else if (commandState === "IDLE") {
  handleCommand();
}
```

---

## 🔒 Rule 9. Text vs Command Disambiguation Rule

**Phím chữ có 2 ý nghĩa:**

| Trường hợp          | Ý nghĩa    | Ví dụ             |
| ------------------- | ---------- | ----------------- |
| Command Line active | Text input | "LINE" → gõ chữ   |
| Canvas active       | Command    | L → khởi tạo LINE |

**Cơ chế phân biệt:**

```typescript
if (isCommandLineActive || isTextInputActive) {
  // Phím chữ = text
  addCharToBuffer(key);
} else {
  // Phím chữ = command
  executeCommand(key);
}
```

**Không được nhập nhầm lẫn giữa hai chế độ!**

---

## 🔒 Rule 10. Selection Persistence Rule

**Selection KHÔNG tự động clear khi:**

- ❌ Đổi tool
- ❌ Di chuột
- ❌ Hover entities

**Selection CHỈ clear khi:**

- ✅ ESC (theo cascade - Rule 11)
- ✅ Click vùng trống (tùy mode: single/window)
- ✅ Explicit clear command

**Ý nghĩa:**

- Selection là state quan trọng
- Không được "vô tình" mất selection

---

## 🔒 Rule 11. ESC Cascade Rule

**ESC xử lý theo thứ tự ưu tiên:**

1. **Level 1:** Hủy preview / sub-state

   - Ghost preview
   - Dimension continue mode
   - Offset preview

2. **Level 2:** Hủy command đang active

   - LINE → IDLE
   - MOVE → IDLE

3. **Level 3:** Clear selection

   - Door selection
   - Entity selection

4. **Level 4:** Trở về IDLE
   - Reset tool

**Ví dụ:**

```
User đang MOVE với preview:
ESC 1: Hủy preview
ESC 2: Hủy MOVE
ESC 3: Clear selection
ESC 4: IDLE
```

---

## 🔒 Rule 12. Command Transparency Rule

**Trong khi command đang chạy, các hành vi sau vẫn được phép:**

| Action            | Behavior       | Interrupt Command? |
| ----------------- | -------------- | ------------------ |
| PAN               | Di chuyển view | ❌ No              |
| ZOOM              | Zoom in/out    | ❌ No              |
| Toggle OSNAP      | Bật/tắt snap   | ❌ No              |
| Toggle GRID       | Bật/tắt grid   | ❌ No              |
| Toggle ORTHO (F8) | Bật/tắt ortho  | ❌ No              |

**Ý nghĩa:**

- Transparent commands = không làm gián đoạn
- User có thể điều chỉnh view giữa chừng

---

## 🔒 Rule 13. Input Ownership Rule

**Tại mọi thời điểm, chỉ 1 owner được quyền xử lý input:**

| Owner     | Priority    | Example                 |
| --------- | ----------- | ----------------------- |
| UI Modal  | 1 (highest) | Command Palette, Dialog |
| Command   | 2           | LINE, MOVE, DIM         |
| Selection | 3           | Click to select         |
| IDLE      | 4 (lowest)  | Default state           |

**Không được tồn tại song song nhiều owner!**

**Ví dụ:**

```typescript
if (isModalOpen) {
  modalHandleInput();
} else if (activeCommand !== "IDLE") {
  commandHandleInput();
} else if (hasSelection) {
  selectionHandleInput();
} else {
  idleHandleInput();
}
```

---

## 🔒 Rule 14. Mouse–Keyboard Independence Rule

**Mouse state và Keyboard state:**

- ✅ **Độc lập**
- ✅ **Không reset lẫn nhau**
- ❌ **Không dùng mouse event để quyết định command routing**

**❌ SAI:**

```typescript
onMouseMove(() => {
  if (key === "L") startLine(); // SAI!
});
```

**✅ ĐÚNG:**

```typescript
onKeyDown("L", () => {
  if (commandState === "IDLE") {
    startLine();
  }
});

onMouseMove(() => {
  updatePreview(); // Chỉ update UI
});
```

---

## Tổng kết Implementation

### Priority Order (cao → thấp):

1. **Global Overrides** (Rule 3)
2. **UI Modal** (Rule 13)
3. **Command Lock** (Rule 2)
4. **Selection Priority** (Rule 5)
5. **Implicit Commands** (Rule 7)

### State Machine:

```
IDLE
  ↓ (command key)
COMMAND_ACTIVE
  ↓ (ESC cascade)
IDLE
```

### Checklist khi implement feature:

- [ ] Có vi phạm Command State Rule không? (Rule 1)
- [ ] Modal command có lock đúng không? (Rule 2)
- [ ] Global overrides vẫn hoạt động? (Rule 3)
- [ ] ERASE có phải modeless không? (Rule 4)
- [ ] Selection priority đúng chưa? (Rule 5)
- [ ] ESC cascade đủ level chưa? (Rule 11)
- [ ] Keyboard context đúng chưa? (Rule 8)
- [ ] Input ownership rõ ràng chưa? (Rule 13)

---

**Last updated:** 05/01/2026
