// ============================================================
// Route Configuration — Single source of truth for URL routing
// Maps: page numbers ↔ URL slugs ↔ tab keys
// ============================================================

export interface TabConfig {
  key: string;
  slug: string;
  label: string;
  group?: string;
}

export interface ModuleRoute {
  page: number;
  slug: string;
  label: string;
  defaultTab?: string;
  tabs?: TabConfig[];
}

export const MODULE_ROUTES: ModuleRoute[] = [
  { page: 1, slug: 'tong-quan', label: 'Tổng quan' },
  {
    page: 2, slug: 'mua-hang', label: 'Mua hàng',
    defaultTab: 'orders',
    tabs: [
      { key: 'orders',   slug: 'don-mua-hang', label: 'Đơn mua hàng',  group: 'Nghiệp vụ' },
      { key: 'requests', slug: 'yeu-cau-mua',   label: 'Yêu cầu mua',   group: 'Nghiệp vụ' },
      { key: 'reports',  slug: 'bc-mua-hang',   label: 'BC Mua hàng',    group: 'Báo cáo' },
      { key: 'shop',     slug: 'shop-alubok',   label: 'Shop ALUBOK',    group: 'Khác' },
    ],
  },
  {
    page: 3, slug: 'ban-hang', label: 'Bán hàng',
    defaultTab: 'quotes',
    tabs: [
      { key: 'quotes',        slug: 'bao-gia',      label: 'Báo giá',       group: 'Nghiệp vụ' },
      { key: 'orders',        slug: 'don-ban-hang',  label: 'Đơn bán hàng',  group: 'Nghiệp vụ' },
      { key: 'report-quotes', slug: 'bc-bao-gia',    label: 'BC Báo giá',    group: 'Báo cáo' },
      { key: 'report-sales',  slug: 'bc-ban-hang',   label: 'BC Bán hàng',   group: 'Báo cáo' },
    ],
  },
  { page: 4, slug: 'thiet-ke', label: 'Thiết kế & bóc tách' },
  {
    page: 5, slug: 'thu-chi', label: 'Thu - chi',
    defaultTab: 'receipts',
    tabs: [
      { key: 'receipts',       slug: 'phieu-thu',     label: 'Phiếu thu',          group: 'Nghiệp vụ' },
      { key: 'payments',       slug: 'phieu-chi',     label: 'Phiếu chi',          group: 'Nghiệp vụ' },
      { key: 'ar',             slug: 'cong-no-thu',   label: 'Công nợ phải thu',  group: 'Công nợ' },
      { key: 'ap',             slug: 'cong-no-tra',   label: 'Công nợ phải trả', group: 'Công nợ' },
      { key: 'debt-report',    slug: 'bc-cong-no',    label: 'BC Công nợ',      group: 'Báo cáo' },
      { key: 'cashflow-report', slug: 'bc-dong-tien', label: 'BC Dòng tiền',    group: 'Báo cáo' },
    ],
  },
  {
    page: 6, slug: 'ton-kho', label: 'Tồn kho',
    defaultTab: 'receipts',
    tabs: [
      { key: 'receipts',  slug: 'phieu-nhap',  label: 'Phiếu nhập kho', group: 'Nghiệp vụ' },
      { key: 'issues',    slug: 'phieu-xuat',  label: 'Phiếu xuất kho', group: 'Nghiệp vụ' },
      { key: 'transfers', slug: 'chuyen-kho',  label: 'Chuyển kho',     group: 'Nghiệp vụ' },
      { key: 'balance',   slug: 'ton-kho-hl',  label: 'Tồn kho',        group: 'Kho' },
      { key: 'reports',   slug: 'bc-ton-kho',  label: 'BC Tồn kho',     group: 'Báo cáo' },
    ],
  },
  {
    page: 7, slug: 'danh-muc', label: 'Danh mục',
    defaultTab: 'customer',
    tabs: [
      { key: 'customer',     slug: 'khach-hang',    label: 'Khách hàng',     group: 'Đối tượng' },
      { key: 'supplier',     slug: 'nha-cung-cap',  label: 'Nhà cung cấp',   group: 'Đối tượng' },
      { key: 'employee',     slug: 'nhan-vien',     label: 'Nhân viên',      group: 'Đối tượng' },
      { key: 'profile',      slug: 'thanh-nhom',    label: 'Thanh nhôm',     group: 'Vật liệu' },
      { key: 'glass',        slug: 'kinh',          label: 'Kính',           group: 'Vật liệu' },
      { key: 'accessory',    slug: 'phu-kien',      label: 'Phụ kiện',       group: 'Vật liệu' },
      { key: 'material',     slug: 'vat-tu',        label: 'Vật tư',         group: 'Vật liệu' },
      { key: 'unit',         slug: 'don-vi-tinh',   label: 'Đơn vị tính',    group: 'Danh mục' },
      { key: 'warehouse',    slug: 'kho',           label: 'Kho',            group: 'Danh mục' },
      { key: 'pricelist',    slug: 'bang-gia',       label: 'Bảng giá',       group: 'Danh mục' },
      { key: 'taxrate',      slug: 'thue-suat',     label: 'Thuế suất',      group: 'Danh mục' },
      { key: 'doortemplate', slug: 'mau-cua',       label: 'Mẫu cửa',       group: 'Mẫu' },
    ],
  },
  {
    page: 8, slug: 'thiet-lap', label: 'Thiết lập',
    defaultTab: 'users',
    tabs: [
      { key: 'users',       slug: 'nguoi-dung',     label: 'Người dùng',    group: 'Tài khoản' },
      { key: 'roles',       slug: 'vai-tro',        label: 'Vai trò',       group: 'Phân quyền' },
      { key: 'permissions', slug: 'ma-tran-quyen',  label: 'Ma trận quyền', group: 'Phân quyền' },
      { key: 'org',         slug: 'to-chuc',        label: 'Tổ chức',       group: 'Tổ chức' },
      { key: 'branches',    slug: 'chi-nhanh',      label: 'Chi nhánh',     group: 'Tổ chức' },
      { key: 'system',      slug: 'cau-hinh',       label: 'Cấu hình',     group: 'Hệ thống' },
      { key: 'print',       slug: 'mau-in',         label: 'Mẫu in',       group: 'Hệ thống' },
      { key: 'audit',       slug: 'nhat-ky',        label: 'Nhật ký',      group: 'Hệ thống' },
    ],
  },
  {
    page: 9, slug: 'ke-toan', label: 'Kế toán',
    defaultTab: 'vouchers',
    tabs: [
      { key: 'vouchers', slug: 'chung-tu',    label: 'Chứng từ kế toán', group: 'Nghiệp vụ' },
      { key: 'invoices', slug: 'hoa-don',      label: 'Hóa đơn',          group: 'Nghiệp vụ' },
      { key: 'ledger',   slug: 'so-ke-toan',   label: 'Sổ kế toán',       group: 'Sổ sách' },
      { key: 'reports',  slug: 'bc-ke-toan',   label: 'BC Kế toán',       group: 'Báo cáo' },
    ],
  },
];

// ── Lookup helpers ──────────────────────────────────────────

export function getModuleByPage(page: number): ModuleRoute | undefined {
  return MODULE_ROUTES.find(r => r.page === page);
}

export function getModuleBySlug(slug: string): ModuleRoute | undefined {
  return MODULE_ROUTES.find(r => r.slug === slug);
}

export function getTabBySlug(mod: ModuleRoute, tabSlug: string): TabConfig | undefined {
  return mod.tabs?.find(t => t.slug === tabSlug);
}

export function getTabByKey(mod: ModuleRoute, tabKey: string): TabConfig | undefined {
  return mod.tabs?.find(t => t.key === tabKey);
}

export function buildPath(moduleSlug: string, tabSlug?: string): string {
  if (tabSlug) return `/${moduleSlug}/${tabSlug}`;
  return `/${moduleSlug}`;
}

export function parsePath(pathname: string): { moduleSlug?: string; tabSlug?: string } {
  const segments = pathname.split('/').filter(Boolean);
  return { moduleSlug: segments[0], tabSlug: segments[1] };
}
