# ALUBOK — Kiến trúc phân quyền HYBRID 2 LỚP

> **Mô hình**: RBAC + ABAC/Policy + Data Scope + Approval Scope
> **Tư duy**: Enterprise Authorization theo mô hình MISA, áp dụng cho ALUBOK
> **Ngày chốt**: 16/03/2026
> **Trạng thái**: CHỐT KIẾN TRÚC — Không thay đổi mô hình, chỉ bổ sung chi tiết

---

## MỤC LỤC

1. [Tổng quan 2 lớp](#1-tổng-quan-2-lớp)
2. [Luồng Authorization đầy đủ](#2-luồng-authorization-đầy-đủ)
3. [LỚP 1 — Platform Authorization](#3-lớp-1--platform-authorization)
4. [LỚP 2 — Application Authorization](#4-lớp-2--application-authorization)
5. [Data Scope](#5-data-scope)
6. [Approval Scope](#6-approval-scope)
7. [DB Schema](#7-db-schema)
8. [TypeScript Contracts](#8-typescript-contracts)
9. [Enforcement Rules](#9-enforcement-rules)
10. [Mapping với PERMISSION_CATALOG.md](#10-mapping-với-permission_catalogmd)
11. [QuanTriAdmin — Phân quyền nền tảng](#11-quantriadmin--phân-quyền-nền-tảng-tách-biệt-khỏi-2-lớp-trên)

---

## 1. Tổng quan 2 lớp

```
┌─────────────────────────────────────────────────────────┐
│                    ALUBOK HOME                          │
│                  (App Portal / Cổng)                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │           LỚP 1: PLATFORM AUTHORIZATION         │    │
│  │                                                   │    │
│  │  Identity ─► Tenant ─► Session                    │    │
│  │       │                    │                       │    │
│  │       ▼                    ▼                       │    │
│  │  Platform RBAC      Platform Policy               │    │
│  │  (platform_role)    (IP/time/device/sub)          │    │
│  │       │                    │                       │    │
│  │       └────────┬───────────┘                       │    │
│  │                ▼                                   │    │
│  │       App Entitlement                             │    │
│  │  "User X được vào Module Y không?"                │    │
│  └─────────────────────┬───────────────────────────┘    │
│                        │ YES → launch app                │
│                        ▼                                 │
│  ┌─────────────────────────────────────────────────┐    │
│  │           LỚP 2: APPLICATION AUTHORIZATION       │    │
│  │              (bên trong từng module)              │    │
│  │                                                   │    │
│  │  App RBAC ─────► Business Policy                  │    │
│  │  (app_role +      (workflow state,                │    │
│  │   permission)      ownership rule)                │    │
│  │       │                    │                       │    │
│  │       ▼                    ▼                       │    │
│  │  Data Scope         Approval Scope                │    │
│  │  (org/branch/       (limit, hierarchy,            │    │
│  │   warehouse/own)     delegation)                  │    │
│  │       │                    │                       │    │
│  │       └────────┬───────────┘                       │    │
│  │                ▼                                   │    │
│  │  "User X được làm Action Z,                       │    │
│  │   trên Data nào, duyệt mức nào?"                 │    │
│  └─────────────────────────────────────────────────┘    │
│                        │                                 │
│                        ▼                                 │
│               Audit Log / Security Log                   │
└─────────────────────────────────────────────────────────┘
```

### Nguyên tắc TUYỆT ĐỐI

| # | Nguyên tắc | Giải thích |
|---|-----------|------------|
| 1 | **2 lớp bắt buộc** | Không bao giờ chỉ có 1 lớp role chung |
| 2 | **Backend enforce** | Ẩn/hiện UI chỉ là UX, backend PHẢI check |
| 3 | **Data scope bắt buộc** | Mọi query nghiệp vụ PHẢI filter theo scope |
| 4 | **Approval scope bắt buộc** | Chứng từ có giá trị PHẢI qua approval flow |
| 5 | **Audit mọi thao tác** | Mọi action có side-effect PHẢI ghi log |

---

## 2. Luồng Authorization đầy đủ

```
User mở ALUBOK
  │
  ▼
[1] IDENTITY: Ai đang đăng nhập?
  │  → userId, email, authProvider
  │
  ▼
[2] TENANT: User thuộc tổ chức nào?
  │  → orgId, membership status (active/suspended)
  │  → 1 user có thể thuộc nhiều org → chọn org khi login
  │
  ▼
[3] SESSION: Phiên làm việc hợp lệ?
  │  → token, expiry, device fingerprint, IP
  │
  ▼
[4] PLATFORM RBAC: User có platform_role gì trong org này?
  │  → owner / admin / member
  │  → platform_role quyết định tầm nhìn cấp portal
  │
  ▼
[5] PLATFORM POLICY: Có bị chặn bởi policy ngoại vi?
  │  → IP whitelist/blacklist
  │  → Giờ làm việc (nếu bật)
  │  → Device trust (nếu bật)
  │  → Subscription còn hạn? Gói nào?
  │  → Account locked/suspended?
  │
  ▼
[6] APP ENTITLEMENT: User được vào module nào?
  │  → entitlement_map: userId + orgId → [modules]
  │  → Ví dụ: Kế toán chỉ thấy BookThuChi, BookKeToan
  │  → Owner/Admin thấy tất cả
  │  KẾT QUẢ LỚP 1: danh sách modules user được mở
  │
  ▼ (user click vào 1 module)
  │
[7] APP RBAC: Trong module này, user có app_role gì?
  │  → app_role gắn với permission set (43 resources × 17 actions)
  │  → Xem PERMISSION_CATALOG.md cho chi tiết
  │
  ▼
[8] BUSINESS POLICY: Action này có hợp lệ theo ngữ cảnh?
  │  → Ownership: chỉ owner mới sửa draft
  │  → Workflow state: không sửa đơn đã approve
  │  → Time lock: không sửa chứng từ kỳ đã khóa
  │  → Dependency: không xóa NCC đang có PO
  │
  ▼
[9] DATA SCOPE: User được thấy dữ liệu nào?
  │  → Toàn công ty (orgId)
  │  → Chỉ chi nhánh (branchId)
  │  → Chỉ kho (warehouseId)
  │  → Chỉ của mình (ownerId)
  │
  ▼
[10] APPROVAL SCOPE: User được duyệt tới mức nào?
  │  → Hạn mức duyệt (VD: PO ≤ 50 triệu)
  │  → Cấp duyệt (level 1, 2, 3)
  │  → Delegation (ủy quyền tạm thời)
  │
  ▼
[11] ACTION EXECUTED
  │
  ▼
[12] AUDIT LOG: Ghi lại ai làm gì, lúc nào, trên data nào
```

---

## 3. LỚP 1 — Platform Authorization

### 3.1 Identity

| Thuộc tính | Mô tả | Bắt buộc |
|-----------|-------|---------|
| `userId` | UUID, unique global | ✅ |
| `email` | Email đăng nhập | ✅ |
| `displayName` | Tên hiển thị | ✅ |
| `avatarUrl` | Avatar | ❌ |
| `authProvider` | `email` / `google` / `microsoft` | ✅ |
| `emailVerified` | Đã xác thực email | ✅ |
| `mfaEnabled` | 2FA bật chưa | ❌ (MVP: không) |
| `createdAt` | Ngày tạo tài khoản | ✅ |
| `status` | `active` / `suspended` / `deleted` | ✅ |

### 3.2 Tenant (Organization)

| Thuộc tính | Mô tả |
|-----------|-------|
| `orgId` | UUID, định danh tổ chức |
| `orgName` | Tên công ty |
| `orgSlug` | URL-friendly slug |
| `subscriptionPlan` | `free` / `starter` / `business` / `enterprise` |
| `subscriptionExpiry` | Ngày hết hạn |
| `maxUsers` | Giới hạn user theo gói |
| `maxBranches` | Giới hạn chi nhánh theo gói |
| `enabledModules` | Danh sách module được bật theo gói |
| `status` | `active` / `suspended` / `deleted` |
| `createdAt` | Ngày tạo |

### 3.3 Membership (User ↔ Org)

```
1 User ────── N Membership ────── 1 Org
                  │
                  ├── platformRole: owner | admin | member
                  ├── status: active | invited | suspended
                  ├── joinedAt
                  └── invitedBy
```

**Quan trọng**: 1 user có thể thuộc **nhiều org**. Khi login, chọn org → tạo session gắn orgId.

### 3.4 Platform Role

| Platform Role | Mô tả | Scope |
|--------------|-------|-------|
| `owner` | Chủ sở hữu org. Toàn quyền. Chỉ 1 per org. | Tất cả module + setting + billing |
| `admin` | Quản trị viên. Gần toàn quyền trừ chuyển quyền owner, xóa org. | Tất cả module + setting (trừ billing) |
| `member` | Thành viên. Quyền tùy theo app_role được gán. | Chỉ module được entitle |

### 3.5 Platform Policy Engine

| Policy | Logic | Mặc định |
|--------|-------|---------|
| **IP Policy** | Whitelist/blacklist IP range cho org | Tắt (cho phép tất cả) |
| **Time Policy** | Chỉ cho phép truy cập trong khung giờ | Tắt |
| **Device Policy** | Trust device, giới hạn số thiết bị | Tắt |
| **Subscription Policy** | Kiểm tra gói còn hạn, module có trong gói | ✅ Luôn bật |
| **Account Policy** | User bị suspended/locked → chặn | ✅ Luôn bật |
| **Rate Limit** | Giới hạn request/phút | ✅ Luôn bật |

### 3.6 App Entitlement

App Entitlement = **danh sách module mà user được phép MỞ**.

Quyết định bởi:
1. `org.enabledModules` (gói subscription cho phép module nào)
2. `membership.platformRole` (owner/admin → tất cả; member → theo entitlement)
3. `user_entitlement` table (admin gán module nào cho member nào)

```
Entitlement Map (ví dụ):

User: Nguyễn Văn A (member)
Org: Công ty Nhôm Kính ABC

Modules được vào:
  ✅ BookThietKeBocTach (CAD + BOM)
  ✅ BookBanHang (Báo giá + SO)
  ❌ BookMuaHang
  ❌ BookTonKho
  ❌ BookThuChi
  ❌ BookKeToan
  ❌ ThietLap

→ Sidebar chỉ hiện: "Tổng quan", "Thiết kế & bóc tách", "Bán hàng"
→ Các module khác KHÔNG hiện, click URL trực tiếp → 403
```

---

## 4. LỚP 2 — Application Authorization

### 4.1 App Role

App Role = vai trò **bên trong 1 module/nhóm module** của 1 org.

| Thuộc tính | Mô tả |
|-----------|-------|
| `roleId` | UUID |
| `orgId` | Thuộc org nào |
| `roleName` | Tên: "Kế toán trưởng", "Thủ kho HN", "Designer" |
| `roleType` | `system` (6 role mặc định) / `custom` |
| `permissions` | Set of `resource:action` |
| `dataScope` | Default data scope cho role (xem mục 5) |
| `approvalLimit` | Default approval limit (xem mục 6) |

**6 System Roles** (từ PERMISSION_CATALOG.md):

| Role | Nhóm module chính | Permission scope |
|------|-------------------|-----------------|
| `OWNER` | Tất cả | `*:*` |
| `ADMIN` | Tất cả | `*:*` trừ owner-only |
| `DESIGNER` | CAD + BOM + Quote(read) | B1-B6 (hạn chế) |
| `ACCOUNTANT` | Thu chi + Kế toán + Quote | B6,B15-B20, C4,C8-C10 |
| `WAREHOUSE` | Tồn kho + Master(read) | B10-B14, A4-A9(read) |
| `SALES` | Bán hàng + KH + Quote | B6-B7, A1, C4-C5 |

**Custom Roles**: Admin có thể tạo role mới, chọn permission từ matrix 43 resources × 17 actions.

### 4.2 Permission (Resource × Action)

Giữ nguyên từ [PERMISSION_CATALOG.md](PERMISSION_CATALOG.md):
- **43 resources** trong 4 nhóm (A: Master, B: Business, C: Report, D: Setting)
- **17 standard actions** (read, create, update, delete, import, export, share, generate, approve, reject, confirm, close, cancel, manage, assign, restore, archive)
- **~250 permission combinations**

### 4.3 Business Policy Engine

Business Policy = rule nghiệp vụ **kiểm tra sau khi đã có permission**.

Có permission ≠ được làm. Còn phải thỏa business policy.

| Policy | Mô tả | Ví dụ |
|--------|-------|-------|
| **Ownership Policy** | Chỉ owner/creator mới sửa record ở trạng thái nhất định | Chỉ người tạo báo giá draft mới sửa được |
| **Workflow State Policy** | Action chỉ hợp lệ ở state nhất định | Không sửa PO đã approved |
| **Period Lock Policy** | Không thao tác trên kỳ kế toán đã khóa | Không tạo chứng từ tháng 1 khi đã khóa sổ |
| **Dependency Policy** | Không xóa/sửa khi có record phụ thuộc | Không xóa NCC đang có PO chưa close |
| **Quantity Policy** | Không xuất quá tồn, không nhận quá PO | stock_issue.qty ≤ balance.qty |
| **Financial Policy** | Giới hạn giá trị giao dịch | Phiếu chi > 100 triệu → cần duyệt cấp 2 |

```
Ví dụ luồng check:

User muốn: update quote #Q-001

[1] Permission check: user có `quote:update`? → ✅
[2] Ownership check: user là creator HOẶC có manage? → ✅
[3] State check: quote ở state `draft`? → ✅ (nếu `approved` → ❌)
[4] Period check: quote thuộc kỳ đang mở? → ✅
→ KẾT QUẢ: CHO PHÉP
```

---

## 5. Data Scope

Data Scope = **phạm vi dữ liệu** user được thấy và thao tác.

### 5.1 Các cấp Data Scope

| Scope Level | Filter | Mô tả |
|------------|--------|-------|
| `org` | `WHERE orgId = ?` | Thấy toàn bộ data công ty |
| `branch` | `WHERE orgId = ? AND branchId IN (?)` | Chỉ thấy data chi nhánh mình |
| `warehouse` | `WHERE orgId = ? AND warehouseId IN (?)` | Chỉ thấy kho mình quản lý |
| `own` | `WHERE orgId = ? AND createdBy = ?` | Chỉ thấy data mình tạo |

### 5.2 Scope áp dụng theo resource

| Resource nhóm | Scope mặc định | Cho phép override |
|--------------|----------------|-------------------|
| **Master Data** (A1-A12) | `org` | Không (master data toàn công ty) |
| **Design** (B1-B5) | `own` → `org` | Có (share mở rộng scope) |
| **Sales** (B6-B7) | `branch` | Có (admin: org) |
| **Purchase** (B8-B9) | `branch` | Có |
| **Inventory** (B10-B14) | `warehouse` | Có (admin: branch/org) |
| **Finance** (B15-B18) | `branch` | Có |
| **Accounting** (B19-B20) | `org` | Không (kế toán tổng hợp) |
| **Reports** (C1-C11) | Theo resource gốc | Tự động |
| **Settings** (D1-D11) | `org` | Không |

### 5.3 Data Scope gán cho user

```
member_data_scope:
  memberId    → user nào
  orgId       → trong org nào
  scopeLevel  → 'org' | 'branch' | 'warehouse' | 'own'
  scopeIds    → string[] (branchIds hoặc warehouseIds)
  resourceGroup → 'all' | 'sales' | 'inventory' | 'finance' ...
```

**Ví dụ**:

| User | Role | Data Scope |
|------|------|-----------|
| Giám đốc | OWNER | `org` toàn bộ |
| Kế toán trưởng HN | ACCOUNTANT | `branch: ['HN']` cho finance, `org` cho accounting |
| Thủ kho SG-1 | WAREHOUSE | `warehouse: ['SG-KHO-1']` cho inventory |
| Sales rep | SALES | `own` cho quote (chỉ thấy báo giá mình tạo) |
| Designer | DESIGNER | `own` cho design (chỉ thấy project mình) |

### 5.4 Enforcement

```
// MỌI query nghiệp vụ PHẢI qua DataScopeFilter

// ❌ SAI — không lọc scope
const orders = await db.salesOrder.findMany({ where: { orgId } });

// ✅ ĐÚNG — lọc theo scope
const orders = await db.salesOrder.findMany({
  where: applyScopeFilter(session, 'sales.order')
  // → tự động thêm: orgId AND branchId IN [...] AND/OR createdBy
});
```

---

## 6. Approval Scope

Approval Scope = **phạm vi và hạn mức duyệt** của user.

### 6.1 Approval Flow

Các resource có approval flow:

| Resource | Cần duyệt khi | Approval levels |
|----------|---------------|----------------|
| `quote` | Tổng giá trị > limit | 1-2 cấp |
| `sales.order` | Luôn luôn | 1 cấp |
| `purchase.order` | Tổng giá trị > limit | 1-3 cấp |
| `purchase.request` | Luôn luôn | 1-2 cấp |
| `bom.report` | Nếu bật approval | 1 cấp |
| `finance.receipt` | Nếu > limit | 1-2 cấp |
| `finance.payment` | Luôn luôn | 1-3 cấp |
| `accounting.voucher` | Nếu bật | 1-2 cấp |

### 6.2 Approval Config

```
approval_config:
  orgId           → org nào
  resource        → 'purchase.order' | 'quote' | ...
  rules:
    - level: 1
      condition: "amount <= 50_000_000"
      approverRole: "WAREHOUSE"        # hoặc specific userId
      autoApprove: false
    - level: 2
      condition: "amount <= 200_000_000"
      approverRole: "ADMIN"
      autoApprove: false
    - level: 3
      condition: "amount > 200_000_000"
      approverRole: "OWNER"
      autoApprove: false
```

### 6.3 Approval Limit per User

```
member_approval_limit:
  memberId         → user nào
  orgId            → org nào
  resource         → resource nào
  maxAmount        → số tiền tối đa được duyệt (VNĐ)
  maxLevel         → cấp duyệt tối đa (1, 2, 3)
  canDelegate      → có thể ủy quyền không (boolean)
```

**Ví dụ**:

| User | Resource | Max Amount | Level |
|------|----------|-----------|-------|
| Trưởng phòng mua hàng | purchase.order | 50,000,000 | 1 |
| Phó giám đốc | purchase.order | 200,000,000 | 2 |
| Giám đốc | purchase.order | Unlimited | 3 |
| Kế toán trưởng | finance.payment | 100,000,000 | 2 |

### 6.4 Delegation (Ủy quyền)

```
approval_delegation:
  fromMemberId    → người ủy quyền
  toMemberId      → người được ủy quyền
  resource        → resource nào (hoặc 'all')
  startDate       → bắt đầu
  endDate         → kết thúc
  maxAmount       → hạn mức ủy quyền (≤ hạn mức người ủy quyền)
  reason          → lý do (nghỉ phép, công tác...)
  status          → active | expired | revoked
```

---

## 7. DB Schema

### 7.1 Tổng quan bảng

```
═══════════════════════════════════════════════════════════
  IDENTITY & TENANT
═══════════════════════════════════════════════════════════

  user                    # Global user account
  ├── userId (PK)
  ├── email (UNIQUE)
  ├── displayName
  ├── avatarUrl
  ├── authProvider
  ├── emailVerified
  ├── mfaEnabled
  ├── status
  └── createdAt

  org                     # Tenant / Organization
  ├── orgId (PK)
  ├── orgName
  ├── orgSlug (UNIQUE)
  ├── subscriptionPlan
  ├── subscriptionExpiry
  ├── maxUsers
  ├── maxBranches
  ├── enabledModules      # string[] theo gói
  ├── status
  └── createdAt

  org_branch              # Chi nhánh
  ├── branchId (PK)
  ├── orgId (FK → org)
  ├── branchName
  ├── address
  └── status

═══════════════════════════════════════════════════════════
  LỚP 1 — PLATFORM AUTHORIZATION
═══════════════════════════════════════════════════════════

  org_member              # User ↔ Org membership
  ├── memberId (PK)
  ├── userId (FK → user)
  ├── orgId (FK → org)
  ├── platformRole        # 'owner' | 'admin' | 'member'
  ├── status              # 'active' | 'invited' | 'suspended'
  ├── joinedAt
  └── invitedBy

  user_entitlement        # Module access per member
  ├── entitlementId (PK)
  ├── memberId (FK → org_member)
  ├── moduleKey           # 'cad' | 'sales' | 'purchase' | ...
  ├── granted             # boolean
  └── grantedBy

  platform_policy         # IP/Time/Device policy per org
  ├── policyId (PK)
  ├── orgId (FK → org)
  ├── policyType          # 'ip' | 'time' | 'device' | 'rate_limit'
  ├── config              # JSON: rules
  ├── enabled             # boolean
  └── updatedBy

═══════════════════════════════════════════════════════════
  LỚP 2 — APPLICATION AUTHORIZATION
═══════════════════════════════════════════════════════════

  app_role                # Role definition per org
  ├── roleId (PK)
  ├── orgId (FK → org)
  ├── roleName
  ├── roleType            # 'system' | 'custom'
  ├── description
  └── createdAt

  permission              # Permission catalog (seed data)
  ├── permissionId (PK)
  ├── resource            # 'design.project' | 'quote' | ...
  ├── action              # 'read' | 'create' | 'approve' | ...
  ├── group               # 'A' | 'B' | 'C' | 'D'
  └── description

  role_permission         # Role ↔ Permission matrix
  ├── roleId (FK → app_role)
  ├── permissionId (FK → permission)
  └── (PK: roleId + permissionId)

  member_role             # Member ↔ Role assignment
  ├── memberId (FK → org_member)
  ├── roleId (FK → app_role)
  ├── assignedAt
  └── assignedBy

  member_data_scope       # Data visibility per member
  ├── scopeId (PK)
  ├── memberId (FK → org_member)
  ├── resourceGroup       # 'all' | 'sales' | 'inventory' | ...
  ├── scopeLevel          # 'org' | 'branch' | 'warehouse' | 'own'
  ├── scopeIds            # string[] (branchIds/warehouseIds)
  └── updatedBy

  member_approval_limit   # Approval limit per member
  ├── limitId (PK)
  ├── memberId (FK → org_member)
  ├── resource            # 'purchase.order' | 'quote' | ...
  ├── maxAmount           # VNĐ, null = unlimited
  ├── maxLevel            # 1 | 2 | 3
  ├── canDelegate         # boolean
  └── updatedBy

═══════════════════════════════════════════════════════════
  APPROVAL WORKFLOW
═══════════════════════════════════════════════════════════

  approval_config         # Approval rules per resource per org
  ├── configId (PK)
  ├── orgId (FK → org)
  ├── resource
  ├── level               # 1 | 2 | 3
  ├── conditionExpr       # "amount <= 50000000"
  ├── approverType        # 'role' | 'user' | 'hierarchy'
  ├── approverValue       # roleId hoặc userId
  └── enabled

  approval_delegation     # Temporary delegation
  ├── delegationId (PK)
  ├── fromMemberId (FK)
  ├── toMemberId (FK)
  ├── resource            # or 'all'
  ├── maxAmount
  ├── startDate
  ├── endDate
  ├── reason
  └── status              # 'active' | 'expired' | 'revoked'

═══════════════════════════════════════════════════════════
  AUDIT & SECURITY
═══════════════════════════════════════════════════════════

  audit_log               # Business action log
  ├── logId (PK)
  ├── orgId
  ├── memberId
  ├── action              # 'create' | 'update' | 'approve' | ...
  ├── resource
  ├── resourceId          # ID của record bị tác động
  ├── changes             # JSON: { field: { old, new } }
  ├── ipAddress
  ├── userAgent
  └── timestamp

  security_log            # Authentication & authorization events
  ├── logId (PK)
  ├── userId
  ├── eventType           # 'login' | 'logout' | 'login_failed' |
  │                       # 'permission_denied' | 'policy_blocked'
  ├── detail              # JSON: context
  ├── ipAddress
  ├── userAgent
  └── timestamp
```

### 7.2 ER Diagram (quan hệ)

```
user ──1:N── org_member ──N:1── org
                │
                ├──1:N── user_entitlement
                ├──1:N── member_role ──N:1── app_role
                ├──1:N── member_data_scope
                ├──1:N── member_approval_limit
                └──1:N── approval_delegation (from/to)

org ──1:N── org_branch
org ──1:N── platform_policy
org ──1:N── app_role ──M:N── permission (via role_permission)
org ──1:N── approval_config

audit_log ── references org, member, resource
security_log ── references user
```

---

## 8. TypeScript Contracts

### 8.1 Session Context (truyền qua mọi request)

```typescript
/** Kết quả sau khi qua LỚP 1 + LỚP 2 */
interface SessionContext {
  // Identity
  userId: string;
  email: string;
  displayName: string;

  // Tenant
  orgId: string;
  orgName: string;

  // Platform (Lớp 1)
  platformRole: 'owner' | 'admin' | 'member';
  entitledModules: ModuleKey[];
  subscriptionPlan: SubscriptionPlan;

  // Application (Lớp 2)
  appRoles: AppRoleRef[];
  permissions: Set<string>;       // "quote:approve", "design.project:read"
  dataScopes: DataScopeEntry[];
  approvalLimits: ApprovalLimitEntry[];
}
```

### 8.2 Module Keys

```typescript
type ModuleKey =
  | 'dashboard'       // BookTongQuan
  | 'cad'             // BookThietKeBocTach — CAD + BOM
  | 'sales'           // BookBanHang — Báo giá + SO
  | 'purchase'        // BookMuaHang — PO + PR
  | 'inventory'       // BookTonKho — Nhập xuất tồn
  | 'finance'         // BookThuChi — Thu chi + công nợ
  | 'accounting'      // BookKeToan — Chứng từ + sổ sách
  | 'master'          // DanhMuc — Master data
  | 'settings'        // ThietLap — Cấu hình cấp Tenant (D1-D8)
  | 'shop';           // MuaHangPage — B2C catalog

// QuanTriAdmin KHÔNG nằm trong ModuleKey (ứng dụng riêng biệt)
// Truy cập qua PlatformAdminRole, KHÔNG qua user_entitlement
type PlatformAdminRole =
  | 'SUPER_ADMIN'
  | 'SUPPORT_LEAD'
  | 'SUPPORT_AGENT'
  | 'DEVOPS'
  | 'FINANCE_ADMIN'
  | 'PRODUCT_MANAGER';
```

### 8.3 Permission Check Functions

```typescript
/** LỚP 1: Kiểm tra user có được vào module không */
function canAccessModule(
  session: SessionContext,
  module: ModuleKey
): boolean {
  // owner/admin → true cho tất cả module enabled trong org
  // member → check entitledModules
  return session.entitledModules.includes(module);
}

/** LỚP 2: Kiểm tra permission */
function hasPermission(
  session: SessionContext,
  resource: string,
  action: string
): boolean {
  return session.permissions.has(`${resource}:${action}`);
}

/** LỚP 2: Kiểm tra business policy */
function checkBusinessPolicy(
  session: SessionContext,
  resource: string,
  action: string,
  record: { state?: string; createdBy?: string; periodLocked?: boolean }
): PolicyResult {
  // 1. Ownership check
  // 2. Workflow state check
  // 3. Period lock check
  // 4. Dependency check
  return { allowed: true } | { allowed: false, reason: string };
}

/** LỚP 2: Apply data scope filter */
function applyScopeFilter(
  session: SessionContext,
  resourceGroup: string
): WhereClause {
  const scope = session.dataScopes.find(s =>
    s.resourceGroup === resourceGroup || s.resourceGroup === 'all'
  );
  // Tự động build WHERE clause theo scopeLevel + scopeIds
}

/** LỚP 2: Kiểm tra approval limit */
function canApprove(
  session: SessionContext,
  resource: string,
  amount: number
): { allowed: boolean; needsEscalation: boolean; nextLevel?: number } {
  const limit = session.approvalLimits.find(l => l.resource === resource);
  if (!limit) return { allowed: false, needsEscalation: true };
  if (amount <= limit.maxAmount) return { allowed: true, needsEscalation: false };
  return { allowed: false, needsEscalation: true, nextLevel: limit.maxLevel + 1 };
}
```

### 8.4 Data Scope Types

```typescript
type ScopeLevel = 'org' | 'branch' | 'warehouse' | 'own';

interface DataScopeEntry {
  resourceGroup: string;   // 'all' | 'sales' | 'inventory' | ...
  scopeLevel: ScopeLevel;
  scopeIds: string[];      // branchIds or warehouseIds
}

interface ApprovalLimitEntry {
  resource: string;
  maxAmount: number | null; // null = unlimited
  maxLevel: number;
  canDelegate: boolean;
}

type SubscriptionPlan = 'free' | 'starter' | 'business' | 'enterprise';
```

---

## 9. Enforcement Rules

### 9.1 Frontend (UI Layer)

| Rule | Cách thực hiện |
|------|---------------|
| Sidebar visibility | `canAccessModule(session, moduleKey)` → ẩn/hiện menu item |
| Tab visibility | `hasPermission(session, resource, 'read')` → ẩn/hiện tab |
| Button visibility | `hasPermission(session, resource, action)` → ẩn/hiện nút |
| Data filtering | Gọi API → backend tự filter theo scope |
| Approval button | `canApprove(session, resource, amount)` → ẩn/hiện + tooltip |

**Quan trọng**: Frontend ẩn/hiện chỉ là **UX convenience**. Backend PHẢI enforce lại.

### 9.2 Backend (API Layer)

```
Mỗi API endpoint PHẢI qua middleware stack:

Request
  → [1] AuthMiddleware        (verify token → session)
  → [2] TenantMiddleware      (verify orgId, membership active)
  → [3] PlatformPolicy        (IP, time, device, subscription)
  → [4] ModuleGuard           (canAccessModule)
  → [5] PermissionGuard       (hasPermission)
  → [6] BusinessPolicyGuard   (checkBusinessPolicy)
  → [7] DataScopeInjector     (inject scope filter vào query)
  → [8] Controller            (business logic)
  → [9] AuditLogger           (ghi audit_log)
  → Response
```

### 9.3 Checklist mỗi API

| # | Check | Bắt buộc |
|---|-------|---------|
| 1 | Token valid, not expired | ✅ |
| 2 | User active, not suspended | ✅ |
| 3 | Org active, subscription valid | ✅ |
| 4 | Platform policy pass | ✅ |
| 5 | Module entitlement check | ✅ |
| 6 | Permission `resource:action` check | ✅ |
| 7 | Business policy check (state, ownership, period) | ✅ cho write |
| 8 | Data scope filter applied | ✅ cho read |
| 9 | Approval limit check | ✅ cho approve action |
| 10 | Audit log written | ✅ cho write |

---

## 10. Mapping với PERMISSION_CATALOG.md

### Mối quan hệ giữa 2 file

| File | Vai trò |
|------|---------|
| **PERMISSION_CATALOG.md** | Catalog chi tiết 43 resources × 17 actions + 6 default roles. Đây là **nội dung** của Lớp 2 App RBAC. |
| **AUTHORIZATION_ARCHITECTURE.md** (file này) | Kiến trúc tổng thể 2 lớp. Bao gồm cả Lớp 1 (Platform) + Lớp 2 (App) + Data Scope + Approval Scope + DB Schema. |

### Những gì PERMISSION_CATALOG.md đã có (Lớp 2)

- ✅ 43 resources trong 4 nhóm (A/B/C/D)
- ✅ 17 standard actions
- ✅ 6 default roles với permission mapping
- ✅ DB schema cơ bản (user, org, org_member, role, permission, role_permission, member_role)
- ✅ Implementation rules

### Những gì file này BỔ SUNG

- ✅ Lớp 1: Platform Authorization (identity, tenant, session, platform role, policy, entitlement)
- ✅ Data Scope (org/branch/warehouse/own)
- ✅ Approval Scope (limit, level, delegation)
- ✅ Business Policy Engine
- ✅ DB schema mở rộng (user_entitlement, platform_policy, member_data_scope, member_approval_limit, approval_config, approval_delegation, audit_log, security_log)
- ✅ TypeScript contracts
- ✅ Enforcement rules (frontend + backend middleware stack)
- ✅ Luồng authorization đầy đủ 12 bước

### Tương lai: cập nhật PERMISSION_CATALOG.md

PERMISSION_CATALOG.md sẽ được giữ nguyên vai trò **catalog chi tiết**, chỉ cần bổ sung reference đến file này ở đầu file.

---

## 11. QuanTriAdmin — Phân quyền nền tảng (Tách biệt khỏi 2 lớp trên)

### 11.1 Định nghĩa

QuanTriAdmin (PlatformAdmin) là **ứng dụng tách biệt** phục vụ đội nội bộ ALUBOK quản trị toàn bộ SaaS platform.

| Tiêu chí | ThietLap (Module 10 trong Book) | QuanTriAdmin (App riêng `/admin`) |
|----------|--------------------------------|-----------------------------------|
| **Cấp độ** | Tenant (org-level) | Platform (toàn hệ thống) |
| **Người dùng** | Khách hàng doanh nghiệp | Đội nội bộ ALUBOK |
| **Phạm vi dữ liệu** | Chỉ data trong tenant mình | Data tất cả tenants |
| **Quyền hạn** | D1-D8 (setting.*) | E1-E16 (platform.*) |
| **Route** | Trong Book app | `/admin` (tách biệt) |
| **Code** | `src/TrangChuAlubok/book/ThietLap/` | `src/PlatformAdmin/` |

### 11.2 Luồng phân quyền QuanTriAdmin

```
User mở /admin
  │
  ▼
[1] IDENTITY: Ai đang đăng nhập?
  │  → Phải là user có platform_admin_role
  │
  ▼
[2] SUPER ADMIN CHECK: Có phải internal admin?
  │  → Kiểm tra bảng platform_admin riêng (KHÔNG dùng org_member)
  │  → MFA bắt buộc
  │  → IP whitelist bắt buộc
  │
  ▼
[3] PLATFORM ADMIN ROLE: Vai trò nội bộ nào?
  │  → SUPER_ADMIN / SUPPORT_LEAD / SUPPORT_AGENT / DEVOPS / FINANCE_ADMIN / PRODUCT_MANAGER
  │  → Mỗi role có permission set riêng (E1-E16)
  │
  ▼
[4] PERMISSION CHECK: platform.tenant:read? platform.backup:manage?
  │  → Tương tự Lớp 2 nhưng trên resource group E
  │
  ▼
[5] ACTION + AUDIT LOG
  │  → Mọi thao tác platform-level PHẢI ghi security_log
```

### 11.3 DB Schema bổ sung

```
platform_admin              # Internal admin account
├── adminId (PK)
├── userId (FK → user)      # Liên kết user global
├── adminRole               # 'SUPER_ADMIN' | 'SUPPORT_LEAD' | ...
├── mfaRequired             # true (bắt buộc)
├── ipWhitelist             # string[] (danh sách IP cho phép)
├── status                  # 'active' | 'suspended'
├── createdAt
└── createdBy

platform_admin_permission   # Permission mapping cho internal roles
├── adminRole               # role nào
├── resource                # 'platform.tenant' | 'platform.backup' | ...
├── action                  # 'read' | 'manage' | ...
└── (PK: adminRole + resource + action)
```

### 11.4 Security Requirements

| Yêu cầu | Mức độ | Chi tiết |
|----------|--------|---------|
| MFA | Bắt buộc | Tất cả internal admin phải bật 2FA |
| IP Whitelist | Bắt buộc | Chỉ từ IP công ty ALUBOK |
| Session timeout | 30 phút | Tự đăng xuất sau 30 phút không hoạt động |
| Audit tuyệt đối | Bắt buộc | Mọi thao tác đều ghi log chi tiết |
| Impersonation log | Bắt buộc | Khi support vào xem tenant → ghi log riêng |
| Separation of duties | Khuyến nghị | Không ai vừa DevOps vừa Finance |

---

## Tham chiếu

| File | Vai trò |
|------|---------|
| [PERMISSION_CATALOG.md](PERMISSION_CATALOG.md) | Catalog 43 resources × 17 actions, 6 roles |
| [MODULE_TAB_PAGE_MAP.md](MODULE_TAB_PAGE_MAP.md) | Module → Tab → Page mapping |
| [MODULE_TAB_PAGE_DETAIL.md](MODULE_TAB_PAGE_DETAIL.md) | Chi tiết pages + permissions |
| [BOOK_STRUCTURE.md](BOOK_STRUCTURE.md) | Tổng quan 10 module |
| [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md) | Thứ tự build |
