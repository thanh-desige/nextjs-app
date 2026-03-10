# COMPLIANCE_CHECKLIST.md

# Architecture & Logic Compliance (Web CAD + Door Engine + BOM + ERP)

# Status: NON-NEGOTIABLE (Bất khả xâm phạm)

#

# Quy tắc sử dụng:

# - Áp dụng cho mọi code mới/sửa, đặc biệt code do AI sinh.

# - Chỉ cần 1 mục FAIL => REJECT PR / REJECT OUTPUT.

# - Không "fix tạm", không "để sau".

# - Khi FAIL: phải refactor về đúng kiến trúc trước khi viết feature mới.

#

# 📌 Tài liệu liên quan:

# - [AUTOCAD_BEHAVIOR_RULES.md](./docs/AUTOCAD_BEHAVIOR_RULES.md) - 14 nguyên tắc UX/Interaction chuẩn AutoCAD

---

## 0) Định nghĩa nhanh (để tránh hiểu sai)

- **UI/Canvas**: React components, renderer, overlay/modal, drag-drop, handlers UI.
- **CadEngine**: nơi điều phối lệnh (Command), xử lý tương tác ở mức logic, không render.
- **Document**: nguồn sự thật (source-of-truth) cho entities (state mô hình).
- **History**: undo/redo; mọi thay đổi entity phải ghi lịch sử.
- **Entity**: dữ liệu thuần biểu diễn đối tượng trong Document (KHÔNG behavior).
- **Door-engine**: logic sinh kỹ thuật (geometry + materials) đọc systems JSON.
- **Analysis**: hậu engine (BOM/Quantity) đọc EngineOutput (KHÔNG đọc canvas).
- **Systems**: dữ liệu hãng/hệ (JSON) read-only, không logic.
- **Preview**: mọi thứ để hiển thị (outline, dim overlay, handles…) KHÔNG dùng tính toán.

---

## 1) Gating rules (Cổng chặn – bắt buộc đạt trước khi review sâu)

### G1 — Unidirectional Flow

- [ ] Luồng xử lý tuân thủ: **UI → CadEngine → Document → History**
- [ ] UI/Hook không được mutate entity/store trực tiếp
- [ ] Mọi create/update/delete entity đều đi qua Command và ghi History

**FAIL nếu phát hiện:**

- UI/hook gọi update trực tiếp vào store/document (bypass Command)
- Có update "silent" (không ghi History)

### G2 — Layer Isolation

- [ ] systems/ chỉ chứa data
- [ ] door-engines/ không import UI/hook/store/domain/analysis
- [ ] analysis/ không import UI/canvas/systems trực tiếp
- [ ] domain/ không import door-engines/
- [ ] UI/hook không import door-engines/

**FAIL nếu phát hiện import ngược chiều hoặc import chéo layer.**

### G3 — PropertySchema Supremacy

- [ ] Mọi property Entity phải đăng ký trong `core/properties/PropertySchema.ts`
- [ ] Không có property "lạ" được gắn trực tiếp vào Entity mà không qua schema

**FAIL nếu có field mới không nằm trong schema.**

---

## 2) Điều kiện bắt buộc (Foundations)

### F1 — Không trộn logic (Separation of Concerns)

- [ ] UI/Canvas: chỉ input + render; không business logic; không mutate entity trực tiếp
- [ ] CadEngine/Commands: nơi duy nhất thực thi thay đổi entity
- [ ] Document: source of truth; không render; không gọi UI
- [ ] History: ghi lại mọi thay đổi (undo/redo)

**FAIL nếu:**

- Canvas sửa entity trực tiếp
- Hook/Component chứa logic cập nhật entity (ngoài Command)

### F2 — PropertySchema là luật tối cao

- [ ] Tạo/sửa property phải thông qua schema (đăng ký, validate, defaults)
- [ ] Plugin/script/constraint tuân thủ schema

**FAIL nếu:**

- Thêm field vào entity mà không đăng ký schema
- Có "temporary field" gắn vào entity để tiện render

### F3 — 1 file = 1 trách nhiệm (Single Responsibility per File)

Mỗi file chỉ thuộc một nhóm:

- [ ] Data (types, schema, config)
- [ ] Entity (data thuần)
- [ ] Command/Engine/Service (logic)
- [ ] UI/Renderer (render)
- [ ] Store/State container (state)

**Luật khóa tay (bắt buộc kiểm tra):**

- [ ] Nếu 1 file import từ **≥ 2 layer khác nhau** ⇒ **THIẾT KẾ SAI**
- [ ] Mọi create/update/delete entity **bắt buộc** Command + History

**Bảng phân vai theo thư mục (định vị nhanh):**

| Loại code     | Thư mục đúng     | Không được                       |
| ------------- | ---------------- | -------------------------------- |
| Commands      | `core/commands/` | Không viết trong hooks/UI        |
| Entities      | `core/entities/` | Không chứa logic/behavior        |
| Hooks         | `hooks/`         | Không chứa business logic/mutate |
| UI Components | `ui/`            | Không mutate core trực tiếp      |
| Domain        | `domain/`        | Không phụ thuộc UI/door-engine   |
| Door Engine   | `door-engines/`  | Không import UI/store/domain     |
| Systems data  | `systems/`       | Chỉ data, không logic            |

---

## 3) 7 RULES bắt buộc (Luật sắt)

### R1 — Style KHÔNG sinh Material

- [ ] Không map `style.fillColor`/style visual → material
- [ ] Style chỉ là hiển thị/gợi ý, không dùng cho BOM

**FAIL nếu BOM/logic suy vật liệu từ màu.**

### R2 — BOM đọc từ Material/EngineOutput, KHÔNG đọc Canvas

- [ ] BOM chỉ tính từ **EngineOutput → materialId → geometry**
- [ ] BOM không đọc preview/canvas/entities-render

**FAIL nếu:**

- BOM đọc từ fillColor/previewBounds/canvas layer

### R3 — Cost là read-only

- [ ] User không nhập cost trực tiếp
- [ ] Cost chỉ thay đổi khi đổi geometry hoặc material/system

**FAIL nếu có field cost editable trong properties.**

### R4 — Geometry có 1 nguồn duy nhất: door-engine

- [ ] Geometry kỹ thuật chỉ sinh trong `door-engines/`
- [ ] Không tính geometry kỹ thuật trong Entity/CadEngine/UI

**FAIL nếu có "tạm tính" geometry để dùng cho BOM/cắt kính/cắt nhôm.**

### R5 — Entity chỉ chứa data, không chứa logic

- [ ] Entity không có methods hành vi (setPosition, setSize, clone, needsEngineRun…)
- [ ] Entity không gọi engine, không tự mutate logic

**FAIL nếu Entity có behavior ngoài serialize/constructor thuần.**

### R6 — Preview chỉ để nhìn (không dùng cho tính toán)

- [ ] previewBounds/outline/dim/handles chỉ dùng render & thao tác UI
- [ ] Không dùng preview cho BOM/pricing/inventory/logic kỹ thuật

**FAIL nếu preview trở thành nguồn dữ liệu nghiệp vụ.**

### R7 — Mọi thay đổi phải để lại dấu vết (Command + History)

- [ ] Tạo/sửa/xóa entity luôn qua Command
- [ ] History luôn ghi lại (undo/redo hoạt động)

**FAIL nếu update silent hoặc bypass Command/History.**

---

## 4) Kiểm tra phụ thuộc (Dependency checks – bắt buộc)

### D0 — Quy tắc import chéo layer

- [ ] door-engines/ không import: `ui/`, `hooks/`, `store/`, `domain/`, `analysis/`
- [ ] analysis/ không import: `ui/`, `hooks/`, `canvas/`, `systems/` (đọc output qua interface/adapter)
- [ ] domain/ không import: `door-engines/`, `ui/`, `hooks/`
- [ ] ui/ & hooks/ không import: `door-engines/`

**FAIL nếu có bất kỳ import ngược chiều.**

---

## 5) Door-specific compliance (trọng điểm cho hệ cửa)

### E1 — DoorEntity schema tối thiểu (data-only)

- [ ] DoorEntity chỉ chứa:
  - id, type="door"
  - position, rotation, scale
  - templateId, doorType, params {width,height,options?}, systemId (string)
  - previewBounds (UI-only)
  - engineOutputRef/engineOutputId + status (none/generated/outdated)
  - createdAt, updatedAt
- [ ] DoorEntity KHÔNG chứa:
  - geometry chi tiết
  - materials list
  - BOM/cost

### E2 — DoorRenderer

- [ ] Render từ previewBounds + params (UI-only)
- [ ] Không dùng EngineOutput cho render
- [ ] Không export data kỹ thuật từ render layer

### E3 — Engine execution boundary

- [ ] Door-engine chỉ chạy khi:
  - user mở File BOM / tính BOM
  - hoặc Ghi sổ / Export (khi được thiết kế)
- [ ] Kéo thả / resize / di chuyển chỉ mark `outdated` (lazy)

---

## 6) Auto-reject signals (nhìn là loại)

- [ ] Không có method logic trong Entity
- [ ] Không có hook gọi store update trực tiếp
- [ ] Không có BOM đọc từ preview/canvas
- [ ] Không có geometry kỹ thuật sinh ngoài door-engine
- [ ] Không có file import từ ≥2 layer khác nhau

**Nếu bất kỳ mục nào không đạt ⇒ REJECT.**

---

## 7) Quy trình review bắt buộc (để dùng với AI)

### Step A — AI self-audit (bắt AI tự khai báo)

- [ ] AI liệt kê các file nó tạo/sửa
- [ ] AI mô tả luồng mutate entity (qua Command nào)
- [ ] AI chỉ ra nơi ghi History (undo/redo)
- [ ] AI cam kết không import chéo layer

### Step B — Reviewer verify (người review kiểm chứng)

- [ ] Grep/scan import để phát hiện chéo layer
- [ ] Tìm mọi "updateDoor/addDoor/removeDoor" và xác nhận chỉ được gọi từ Commands
- [ ] Kiểm tra Entity không có methods logic
- [ ] Kiểm tra BOM không đọc canvas/preview

---

## 8) Nguyên lý kết luận (ghi nhớ)

> Canvas = để nhìn  
> Entity = trạng thái  
> Engine = tính kỹ thuật  
> BOM = hậu quả của Engine  
> Material = nguồn đơn giá  
> History = dấu vết bắt buộc

---

# End of file
