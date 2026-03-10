# Copilot Custom Instructions

## Quy tắc ĐẦU SESSION — Lấy lại context

Khi bắt đầu session mới, nếu user nói "tiếp tục" hoặc hỏi về tiến độ, **PHẢI đọc các file sau** (theo thứ tự ưu tiên):

1. **src/TrangChuAlubok/book/BOOK_STRUCTURE.md** — Tổng quan 10 module, trạng thái hiện tại
2. **src/TrangChuAlubok/book/BookThietKeBocTach/ROADMAP.md** — CAD module: tiến độ chi tiết, 875 tests, phases đã xong/chưa
3. **src/TrangChuAlubok/book/BookThietKeBocTach/src/docs/docs_history_commit.md** — Session history, task gần nhất
4. **src/TrangChuAlubok/book/BookThietKeBocTach/ARCHITECTURE.md** — Kiến trúc, cấu trúc thư mục, files quan trọng

Đặc biệt chú ý section **"🔮 FUTURE PHASES"** trong BookThietKeBocTach/ROADMAP.md và các ROADMAP.md riêng của từng module — đây là định hướng tương lai của dự án.

Sau khi đọc, tóm tắt ngắn cho user: "Đã đọc context. Hiện tại: X tests, Y suites. Task gần nhất: Z. Tiếp theo: W."

---

## Quy tắc bắt buộc

### 1. Cập nhật file .md sau mỗi task hoàn tất

Sau khi hoàn thành BẤT KỲ task nào (feature mới, fix bug, refactor, viết test...), **PHẢI** cập nhật các file .md liên quan:

- **BookThietKeBocTach/ROADMAP.md** — Cập nhật bảng tiến độ CAD, tổng tests, thêm section mới nếu cần
- **ROADMAP.md của module tương ứng** — Cập nhật nếu task liên quan module khác
- **ARCHITECTURE.md** — Cập nhật cấu trúc thư mục, bảng files quan trọng nếu có file mới
- **PROJECT_STRUCTURE_ANALYSIS.md** — Cập nhật cấu trúc nếu thêm thư mục/module/file mới (BẮT BUỘC khi tạo file mới)
- **docs_history_commit.md** — Ghi chức năng đã hoàn thành vào file `docs_history_commit.md` **của module tương ứng**:
  - `shared/docs_history_commit.md`
  - `DanhMuc/docs_history_commit.md`
  - `BookTongQuan/docs_history_commit.md`
  - `BookThietKeBocTach/src/docs/docs_history_commit.md`
  - `BookBanHang/docs_history_commit.md`
  - `BookMuaHang/docs_history_commit.md`
  - `BookTonKho/docs_history_commit.md`
  - `BookThuChi/docs_history_commit.md`
  - `BookKeToan/docs_history_commit.md`
  - `ThietLap/docs_history_commit.md`

**Không được bỏ qua bước này. Luôn thêm "Cập nhật .md" làm bước cuối trong todo list.**

### 2. Giới hạn file

- Mỗi file ≤ 800 dòng
- Nếu vượt quá, phải tách file (extract hook, module, utils...)

### 3. Ba mục tiêu NON-NEGOTIABLE

1. **Extensible** — Dễ mở rộng
2. **3D-ready** — Sẵn sàng cho 3D
3. **Integration-ready** — Sẵn sàng tích hợp

### 4. Encoding

- **KHÔNG** dùng PowerShell `Set-Content -Encoding UTF8` trên file có tiếng Việt
- Dùng `create_file` hoặc `replace_string_in_file` tool thay thế

### 5. Entity system

- **IEntity** = core, data-only (không methods) — dùng cho logic/export/test
- **CadEntity** = UI/canvas, legacy — chỉ dùng cho render
- Default layer ID: `"0"`

### 6. Test conventions

- Jest + ts-jest, path alias `@/*` → `./src/*`
- Entity test helpers: `makeLine()`, `makeRect()`, `makeCircle()`... với `layerId: "0"`
- Chạy tests: `npx jest --no-cache`
