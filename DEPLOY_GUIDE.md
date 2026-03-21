# ALUBOK — Hướng dẫn triển khai lên Internet

> Ngày tạo: **21/03/2026**
> Trạng thái hiện tại: Frontend 10 modules hoàn chỉnh, 1500 tests, chưa có backend

---

## Đánh giá hiện trạng

### Đã có (rất tốt):
- UI 10 modules hoàn chỉnh, luồng nghiệp vụ đầy đủ từ Thiết kế → Thu tiền
- CAD engine mạnh: vẽ, DXF import/export, 5 format xuất file
- 1500 tests, RBAC, BOM, Quy trình 8 phase
- Code quality cao, kiến trúc rõ ràng

### Chưa có (blocker cho production):

| Thiếu | Mức độ | Lý do |
|-------|--------|-------|
| **Backend + Database** | **Chặn hoàn toàn** | Mọi data đang ở memory/localStorage. Tắt trình duyệt = mất hết |
| **Authentication** | **Chặn hoàn toàn** | Không có đăng nhập → ai cũng truy cập được mọi thứ |
| **API routes** | **Chặn hoàn toàn** | Không có server-side xử lý → không validate, không bảo vệ dữ liệu |
| **Multi-user** | Quan trọng | ERP cần nhiều người dùng cùng lúc, hiện chỉ chạy trên 1 browser |

---

## Con đường ngắn nhất đưa lên internet

### Bước 1: Chuẩn bị codebase cho production

- [ ] Fix tất cả ESLint warnings/errors
- [ ] Chạy `npm run build` — fix mọi build error
- [ ] Loại bỏ `console.log` dư thừa
- [ ] Kiểm tra responsive (mobile/tablet) — hiện tại UI chỉ tối ưu desktop
- [ ] Thêm `<title>`, `<meta>`, favicon cho SEO cơ bản

### Bước 2: Trang Landing Page

- [ ] Trang chủ (`/`) giới thiệu sản phẩm: Alubok là gì, screenshot, tính năng nổi bật
- [ ] Nút CTA "Thử ngay" → vào CAD
- [ ] Ghi rõ "Bản Demo — dữ liệu không được lưu" cho đến khi có backend

### Bước 3: Deploy bản Demo lên Vercel

```bash
npm i -g vercel
vercel login
vercel deploy --prod
```

- Miễn phí, HTTPS tự động, domain `*.vercel.app`
- Mua domain riêng nếu muốn (ví dụ `alubok.vn`)
- **Kết quả**: có link chia sẻ, khách hàng/nhà đầu tư vào xem được

### Bước 4: Authentication (Đăng nhập)

- [ ] Cài `next-auth` (hoặc `better-auth`)
- [ ] Hỗ trợ đăng nhập bằng Google + Email/Password
- [ ] Tạo bảng `users` trong database
- [ ] Bảo vệ route `/thiet-ke/du-an` — chỉ user đã đăng nhập
- [ ] Trang `/login`, `/register`

### Bước 5: Database + API cho CAD projects

- [ ] Chọn database: **Supabase** (PostgreSQL miễn phí) hoặc **Neon** hoặc **PlanetScale**
- [ ] Cài ORM: **Prisma** hoặc **Drizzle**
- [ ] Schema tối thiểu:

```
User:     id, email, name, avatar, createdAt
Project:  id, userId, name, data (JSONB), createdAt, updatedAt
```

- [ ] 5 API routes:

```
POST   /api/projects          — tạo mới
GET    /api/projects          — danh sách của user
GET    /api/projects/:id      — load 1 project
PUT    /api/projects/:id      — save (CadDocument.toJSON())
DELETE /api/projects/:id      — xóa
```

- [ ] Nút "Lưu" / "Auto-save" trong CAD → gọi `PUT /api/projects/:id`
- [ ] Trang "Danh sách dự án" → gọi `GET /api/projects`

> **Lưu ý**: Data đã có sẵn `CadDocument.toJSON()` / `CadDocument.fromJSON()` — chỉ cần lưu JSON blob vào database là xong.

> **Tại sao chỉ làm backend cho CAD trước?** CAD là thứ duy nhất mà đối thủ không có → đây là lợi thế cạnh tranh. 9 module ERP khác làm sau khi đã có user.

### Bước 6: File Storage

- [ ] Upload/lưu file DXF đã import, PDF/PNG đã export
- [ ] Dùng **Supabase Storage** hoặc **Cloudflare R2** (free tier lớn)
- [ ] Hoặc đơn giản hơn: chỉ lưu JSON blob trong database (đã đủ cho giai đoạn đầu)

### Bước 7: Testing production

- [ ] Test đăng ký → đăng nhập → tạo project → vẽ → save → reload → load lại → kiểm tra data đúng
- [ ] Test trên Chrome, Firefox, Safari, Edge
- [ ] Test trên máy tính khác (không phải máy dev)
- [ ] Test tốc độ load trang (Lighthouse)

### Bước 8: Mở rộng dần

- [ ] Thêm backend cho module tiếp theo (Báo giá, Đơn hàng...)
- [ ] RBAC thật (phân quyền theo role)
- [ ] Multi-tenant (mỗi công ty có data riêng)
- [ ] Collaboration (nhiều người cùng 1 project)

---

## Tóm tắt thứ tự

```
Bước 1-3: Deploy demo          → CÓ LINK CHIA SẺ
Bước 4-5: Auth + DB + API      → NGƯỜI DÙNG LƯU ĐƯỢC DỮ LIỆU
Bước 6-7: Storage + Test       → SẢN PHẨM DÙNG ĐƯỢC THẬT
Bước 8:   Mở rộng              → ERP ĐẦY ĐỦ
```

---

## Lưu trữ mã nguồn

Mã nguồn **phải** được lưu trên GitHub (đã thực hiện ✅):
- Code nằm trên máy tính + sao lưu trên GitHub
- Có lịch sử mọi thay đổi — quay lại bất kỳ phiên bản nào
- Vercel kết nối GitHub → tự động deploy

---

## Quy trình làm việc sau khi đã deploy

```
Máy tính của bạn (localhost:3000)     →    GitHub    →    Vercel (internet)
       [Code + Test]                    [Lưu trữ]        [Chạy cho mọi người]
```

### Mỗi lần thêm tính năng mới:

**Bước 1 — Code trên máy tính**
```
- Mở VS Code như bình thường
- npm run dev → test tại localhost:3000
- Viết code, sửa code, test — giống y như đang làm hiện tại
```

**Bước 2 — Test kỹ**
```
- npx jest --no-cache → chạy tất cả tests
- Mở trình duyệt → test thủ công tính năng mới
- Đảm bảo tính năng cũ không bị hỏng
```

**Bước 3 — Đẩy code lên GitHub**
```bash
git add .
git commit -m "Thêm tính năng XYZ"
git push
```

**Bước 4 — Vercel tự động cập nhật**
```
- Vercel kết nối GitHub → phát hiện code mới → tự build + deploy
- Sau 1-2 phút → trang web trên internet tự động có tính năng mới
- Không cần làm gì thêm
```

### Bảng tóm tắt:

| Câu hỏi | Trả lời |
|----------|---------|
| Code ở đâu? | **Trên máy bạn**, thư mục hiện tại, dùng VS Code |
| Test ở đâu? | **localhost:3000** trên máy bạn |
| Làm sao cập nhật lên internet? | **`git push`** — Vercel tự làm phần còn lại |
| Mất bao lâu để cập nhật? | **1-2 phút** sau khi git push |
| Có cần tắt server không? | **Không** — Vercel tự chuyển đổi, người dùng không bị gián đoạn |

### Ví dụ thực tế:

```
Sáng:  Thêm tính năng "Export bản vẽ ra Excel"
       → Code trên VS Code → Test tại localhost
       → git add . → git commit → git push

2 phút sau: Khách hàng vào trang web → đã thấy nút "Export Excel"
```

Quy trình giống hệt cách đang làm việc mỗi ngày — chỉ thêm 1 bước `git push` cuối cùng.
