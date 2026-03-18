'use client';
// ============================================================
// Category Configs — Column definitions + Form field definitions
// for all 12 master data categories
// ============================================================

import React from 'react';
import type { ColumnDef } from './DataTable';
import type { FieldDef } from './EntityForm';
import type { MasterEntityBase } from '../types';
import { StatusBadge } from './StatusBadge';

// ── Helpers ─────────────────────────────────────────────────

const fmtMoney = (v: unknown) => {
  if (typeof v !== 'number') return '';
  return v.toLocaleString('vi-VN') + ' ₫';
};

const fmtBool = (v: unknown) => (
  <StatusBadge status={v ? 'active' : 'inactive'} />
);

// ── A1: Customer ────────────────────────────────────────────

export const CUSTOMER_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã KH', width: 100 },
  { key: 'name', label: 'Tên khách hàng', width: 200 },
  { key: 'type', label: 'Loại', width: 90, render: (v) => v === 'company' ? 'Công ty' : 'Cá nhân' },
  { key: 'contactPerson', label: 'Người liên hệ', width: 150 },
  { key: 'phone', label: 'Điện thoại', width: 120 },
  { key: 'email', label: 'Email', width: 180 },
  { key: 'city', label: 'Thành phố', width: 120 },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const CUSTOMER_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã KH', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên khách hàng', type: 'text', required: true, width: '50%' },
  { key: 'type', label: 'Loại', type: 'select', required: true, width: '50%', options: [{ value: 'individual', label: 'Cá nhân' }, { value: 'company', label: 'Công ty' }] },
  { key: 'contactPerson', label: 'Người liên hệ', type: 'text', width: '50%' },
  { key: 'phone', label: 'Điện thoại', type: 'tel', width: '50%' },
  { key: 'email', label: 'Email', type: 'email', width: '50%' },
  { key: 'taxCode', label: 'Mã số thuế', type: 'text', width: '50%' },
  { key: 'city', label: 'Thành phố', type: 'text', width: '50%' },
  { key: 'address', label: 'Địa chỉ', type: 'text' },
  { key: 'debtLimit', label: 'Hạn mức công nợ (VNĐ)', type: 'number', width: '50%' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'notes', label: 'Ghi chú', type: 'textarea' },
];

// ── A2: Supplier ────────────────────────────────────────────

export const SUPPLIER_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã NCC', width: 100 },
  { key: 'name', label: 'Tên NCC', width: 200 },
  { key: 'category', label: 'Nhóm', width: 100, render: (v) => {
    const map: Record<string, string> = { aluminum: 'Nhôm', glass: 'Kính', accessory: 'Phụ kiện', material: 'Vật tư', other: 'Khác' };
    return map[v as string] ?? v;
  }},
  { key: 'contactPerson', label: 'Người liên hệ', width: 150 },
  { key: 'phone', label: 'Điện thoại', width: 120 },
  { key: 'paymentTermDays', label: 'Kỳ thanh toán', width: 100, render: (v) => `${v} ngày` },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const SUPPLIER_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã NCC', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên NCC', type: 'text', required: true, width: '50%' },
  { key: 'category', label: 'Nhóm', type: 'select', required: true, width: '50%', options: [
    { value: 'aluminum', label: 'Nhôm' }, { value: 'glass', label: 'Kính' },
    { value: 'accessory', label: 'Phụ kiện' }, { value: 'material', label: 'Vật tư' }, { value: 'other', label: 'Khác' },
  ]},
  { key: 'contactPerson', label: 'Người liên hệ', type: 'text', width: '50%' },
  { key: 'phone', label: 'Điện thoại', type: 'tel', width: '50%' },
  { key: 'email', label: 'Email', type: 'email', width: '50%' },
  { key: 'taxCode', label: 'Mã số thuế', type: 'text', width: '50%' },
  { key: 'address', label: 'Địa chỉ', type: 'text', width: '50%' },
  { key: 'city', label: 'Thành phố', type: 'text', width: '50%' },
  { key: 'bankAccount', label: 'Số TK ngân hàng', type: 'text', width: '50%' },
  { key: 'bankName', label: 'Ngân hàng', type: 'text', width: '50%' },
  { key: 'paymentTermDays', label: 'Kỳ thanh toán (ngày)', type: 'number', width: '50%' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'notes', label: 'Ghi chú', type: 'textarea' },
];

// ── A3: Employee ────────────────────────────────────────────

export const EMPLOYEE_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã NV', width: 90 },
  { key: 'name', label: 'Họ tên', width: 180 },
  { key: 'position', label: 'Chức vụ', width: 130 },
  { key: 'department', label: 'Phòng ban', width: 120 },
  { key: 'phone', label: 'Điện thoại', width: 120 },
  { key: 'employeeStatus', label: 'Trạng thái', width: 100, render: (v) => <StatusBadge status={v as string} /> },
];

export const EMPLOYEE_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã NV', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Họ tên', type: 'text', required: true, width: '50%' },
  { key: 'position', label: 'Chức vụ', type: 'text', width: '50%' },
  { key: 'department', label: 'Phòng ban', type: 'text', width: '50%' },
  { key: 'phone', label: 'Điện thoại', type: 'tel', width: '50%' },
  { key: 'email', label: 'Email', type: 'email', width: '50%' },
  { key: 'employeeStatus', label: 'Trạng thái', type: 'select', width: '50%', options: [
    { value: 'working', label: 'Đang làm' }, { value: 'resigned', label: 'Đã nghỉ' }, { value: 'on_leave', label: 'Nghỉ phép' },
  ]},
  { key: 'joinDate', label: 'Ngày vào', type: 'date', width: '50%' },
  { key: 'address', label: 'Địa chỉ', type: 'text' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'notes', label: 'Ghi chú', type: 'textarea' },
];

// ── A4: Profile (Thanh nhôm) ────────────────────────────────

export const PROFILE_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã', width: 100 },
  { key: 'name', label: 'Tên thanh', width: 200 },
  { key: 'system', label: 'Hệ', width: 80, render: (v) => (v as string)?.toUpperCase() },
  { key: 'surface', label: 'Bề mặt', width: 110 },
  { key: 'weight', label: 'Trọng lượng', width: 90, render: (v) => `${v} kg/m` },
  { key: 'unitPrice', label: 'Đơn giá', width: 120, render: fmtMoney },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const PROFILE_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã thanh', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên thanh', type: 'text', required: true, width: '50%' },
  { key: 'system', label: 'Hệ nhôm', type: 'select', required: true, width: '50%', options: [
    { value: 'xingfa', label: 'Xingfa' }, { value: 'pma', label: 'PMA' },
    { value: 'maxpro', label: 'Maxpro' }, { value: 'pmi', label: 'PMI' },
    { value: 'hopo', label: 'HOPO' }, { value: 'other', label: 'Khác' },
  ]},
  { key: 'surface', label: 'Bề mặt', type: 'select', width: '50%', options: [
    { value: 'anodized', label: 'Anodized' }, { value: 'powder_coated', label: 'Sơn tĩnh điện' },
    { value: 'electrophoresis', label: 'Điện di' }, { value: 'wood_grain', label: 'Vân gỗ' }, { value: 'raw', label: 'Thô' },
  ]},
  { key: 'weight', label: 'Trọng lượng (kg/m)', type: 'number', width: '50%' },
  { key: 'length', label: 'Chiều dài cây (mm)', type: 'number', width: '50%' },
  { key: 'width', label: 'Rộng (mm)', type: 'number', width: '50%' },
  { key: 'height', label: 'Cao (mm)', type: 'number', width: '50%' },
  { key: 'thickness', label: 'Dày (mm)', type: 'number', width: '50%' },
  { key: 'unitPrice', label: 'Đơn giá (VNĐ)', type: 'number', width: '50%' },
  { key: 'priceUnit', label: 'Đơn vị giá', type: 'select', width: '50%', options: [
    { value: 'per_meter', label: 'VNĐ/m' }, { value: 'per_bar', label: 'VNĐ/cây' },
  ]},
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'notes', label: 'Ghi chú', type: 'textarea' },
];

// ── A5: Glass ───────────────────────────────────────────────

export const GLASS_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã', width: 100 },
  { key: 'name', label: 'Tên kính', width: 200 },
  { key: 'glassType', label: 'Loại', width: 110 },
  { key: 'thickness', label: 'Dày (mm)', width: 80 },
  { key: 'color', label: 'Màu', width: 80 },
  { key: 'unitPrice', label: 'Đơn giá/m²', width: 120, render: fmtMoney },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const GLASS_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã kính', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên kính', type: 'text', required: true, width: '50%' },
  { key: 'glassType', label: 'Loại kính', type: 'select', required: true, width: '50%', options: [
    { value: 'clear', label: 'Trắng' }, { value: 'tempered', label: 'Cường lực' },
    { value: 'laminated', label: 'Dán an toàn' }, { value: 'insulated', label: 'Hộp cách nhiệt' },
    { value: 'low_e', label: 'Low-E' }, { value: 'tinted', label: 'Màu' },
    { value: 'reflective', label: 'Phản quang' }, { value: 'frosted', label: 'Mờ' },
  ]},
  { key: 'thickness', label: 'Dày (mm)', type: 'number', required: true, width: '50%' },
  { key: 'color', label: 'Màu sắc', type: 'text', width: '50%' },
  { key: 'unitPrice', label: 'Đơn giá (VNĐ/m²)', type: 'number', width: '50%' },
  { key: 'maxWidth', label: 'Rộng tối đa (mm)', type: 'number', width: '50%' },
  { key: 'maxHeight', label: 'Cao tối đa (mm)', type: 'number', width: '50%' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'notes', label: 'Ghi chú', type: 'textarea' },
];

// ── A6: Accessory ───────────────────────────────────────────

export const ACCESSORY_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã', width: 100 },
  { key: 'name', label: 'Tên phụ kiện', width: 200 },
  { key: 'category', label: 'Nhóm', width: 100, render: (v) => {
    const map: Record<string, string> = { handle: 'Tay nắm', lock: 'Khóa', hinge: 'Bản lề', roller: 'Bánh xe', seal: 'Ron', corner_joint: 'Ke góc', screw: 'Vít', other: 'Khác' };
    return map[v as string] ?? v;
  }},
  { key: 'brand', label: 'Thương hiệu', width: 100 },
  { key: 'unitPrice', label: 'Đơn giá', width: 120, render: fmtMoney },
  { key: 'unit', label: 'ĐVT', width: 60 },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const ACCESSORY_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã PK', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên phụ kiện', type: 'text', required: true, width: '50%' },
  { key: 'category', label: 'Nhóm', type: 'select', required: true, width: '50%', options: [
    { value: 'handle', label: 'Tay nắm' }, { value: 'lock', label: 'Khóa' },
    { value: 'hinge', label: 'Bản lề' }, { value: 'roller', label: 'Bánh xe' },
    { value: 'seal', label: 'Ron' }, { value: 'corner_joint', label: 'Ke góc' },
    { value: 'screw', label: 'Vít' }, { value: 'other', label: 'Khác' },
  ]},
  { key: 'brand', label: 'Thương hiệu', type: 'text', width: '50%' },
  { key: 'model', label: 'Model', type: 'text', width: '50%' },
  { key: 'unitPrice', label: 'Đơn giá (VNĐ)', type: 'number', width: '50%' },
  { key: 'unit', label: 'Đơn vị tính', type: 'text', width: '50%', placeholder: 'cái, bộ, m...' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'notes', label: 'Ghi chú', type: 'textarea' },
];

// ── A7: Material ────────────────────────────────────────────

export const MATERIAL_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã', width: 100 },
  { key: 'name', label: 'Tên vật tư', width: 200 },
  { key: 'category', label: 'Nhóm', width: 100, render: (v) => {
    const map: Record<string, string> = { sealant: 'Keo', adhesive: 'Băng dính', foam: 'Bọt xốp', steel: 'Thép', wood: 'Gỗ', paint: 'Sơn', other: 'Khác' };
    return map[v as string] ?? v;
  }},
  { key: 'unit', label: 'ĐVT', width: 60 },
  { key: 'unitPrice', label: 'Đơn giá', width: 120, render: fmtMoney },
  { key: 'minStock', label: 'Tồn tối thiểu', width: 100 },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const MATERIAL_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã vật tư', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên vật tư', type: 'text', required: true, width: '50%' },
  { key: 'category', label: 'Nhóm', type: 'select', required: true, width: '50%', options: [
    { value: 'sealant', label: 'Keo' }, { value: 'adhesive', label: 'Băng dính' },
    { value: 'foam', label: 'Bọt xốp' }, { value: 'steel', label: 'Thép' },
    { value: 'wood', label: 'Gỗ' }, { value: 'paint', label: 'Sơn' }, { value: 'other', label: 'Khác' },
  ]},
  { key: 'unit', label: 'Đơn vị tính', type: 'text', required: true, width: '50%' },
  { key: 'unitPrice', label: 'Đơn giá (VNĐ)', type: 'number', width: '50%' },
  { key: 'minStock', label: 'Tồn tối thiểu', type: 'number', width: '50%' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'notes', label: 'Ghi chú', type: 'textarea' },
];

// ── A8: Unit ────────────────────────────────────────────────

export const UNIT_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã', width: 80 },
  { key: 'name', label: 'Tên đơn vị', width: 180 },
  { key: 'abbreviation', label: 'Viết tắt', width: 80 },
  { key: 'description', label: 'Mô tả', width: 250 },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const UNIT_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã ĐVT', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên đơn vị', type: 'text', required: true, width: '50%' },
  { key: 'abbreviation', label: 'Viết tắt', type: 'text', required: true, width: '50%', placeholder: 'm, kg, cái...' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'description', label: 'Mô tả', type: 'textarea' },
];

// ── A9: Warehouse ───────────────────────────────────────────

export const WAREHOUSE_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã', width: 80 },
  { key: 'name', label: 'Tên kho', width: 200 },
  { key: 'warehouseType', label: 'Loại', width: 100, render: (v) => {
    const map: Record<string, string> = { main: 'Kho chính', branch: 'Kho CN', transit: 'Kho trung chuyển', defective: 'Kho lỗi' };
    return map[v as string] ?? v;
  }},
  { key: 'address', label: 'Địa chỉ', width: 250 },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const WAREHOUSE_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã kho', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên kho', type: 'text', required: true, width: '50%' },
  { key: 'warehouseType', label: 'Loại kho', type: 'select', required: true, width: '50%', options: [
    { value: 'main', label: 'Kho chính' }, { value: 'branch', label: 'Kho chi nhánh' },
    { value: 'transit', label: 'Kho trung chuyển' }, { value: 'defective', label: 'Kho lỗi' },
  ]},
  { key: 'address', label: 'Địa chỉ', type: 'text' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'notes', label: 'Ghi chú', type: 'textarea' },
];

// ── A10: PriceList ──────────────────────────────────────────

export const PRICELIST_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã', width: 100 },
  { key: 'name', label: 'Tên bảng giá', width: 200 },
  { key: 'priceListType', label: 'Loại', width: 100, render: (v) => v === 'purchase' ? 'Mua' : 'Bán' },
  { key: 'effectiveFrom', label: 'Hiệu lực từ', width: 120 },
  { key: 'effectiveTo', label: 'Đến', width: 120, render: (v) => (v as string) || '—' },
  { key: 'currency', label: 'Tiền tệ', width: 80 },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const PRICELIST_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã bảng giá', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên bảng giá', type: 'text', required: true, width: '50%' },
  { key: 'priceListType', label: 'Loại', type: 'select', required: true, width: '50%', options: [
    { value: 'purchase', label: 'Bảng giá mua' }, { value: 'sales', label: 'Bảng giá bán' },
  ]},
  { key: 'currency', label: 'Tiền tệ', type: 'text', width: '50%', placeholder: 'VNĐ' },
  { key: 'effectiveFrom', label: 'Hiệu lực từ', type: 'date', required: true, width: '50%' },
  { key: 'effectiveTo', label: 'Đến ngày', type: 'date', width: '50%' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'notes', label: 'Ghi chú', type: 'textarea' },
];

// ── A11: TaxRate ────────────────────────────────────────────

export const TAXRATE_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã', width: 80 },
  { key: 'name', label: 'Tên thuế', width: 180 },
  { key: 'taxType', label: 'Loại', width: 100, render: (v) => {
    const map: Record<string, string> = { vat: 'VAT', import: 'NK', excise: 'TTĐB', other: 'Khác' };
    return map[v as string] ?? v;
  }},
  { key: 'rate', label: 'Thuế suất', width: 100, render: (v) => `${v}%` },
  { key: 'description', label: 'Mô tả', width: 250 },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const TAXRATE_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã thuế', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên thuế', type: 'text', required: true, width: '50%' },
  { key: 'taxType', label: 'Loại thuế', type: 'select', required: true, width: '50%', options: [
    { value: 'vat', label: 'VAT' }, { value: 'import', label: 'Nhập khẩu' },
    { value: 'excise', label: 'Tiêu thụ đặc biệt' }, { value: 'other', label: 'Khác' },
  ]},
  { key: 'rate', label: 'Thuế suất (%)', type: 'number', required: true, width: '50%' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'description', label: 'Mô tả', type: 'textarea' },
];

// ── A12: DoorTemplate ───────────────────────────────────────

export const DOORTEMPLATE_COLUMNS: ColumnDef<MasterEntityBase>[] = [
  { key: 'code', label: 'Mã', width: 100 },
  { key: 'name', label: 'Tên mẫu cửa', width: 200 },
  { key: 'category', label: 'Loại', width: 100, render: (v) => {
    const map: Record<string, string> = { window: 'Cửa sổ', door: 'Cửa đi', sliding_door: 'Cửa trượt', folding_door: 'Cửa gấp', fixed_panel: 'Vách kính', curtain_wall: 'Façade' };
    return map[v as string] ?? v;
  }},
  { key: 'profileSystem', label: 'Hệ nhôm', width: 100 },
  { key: 'defaultWidth', label: 'Rộng (mm)', width: 90 },
  { key: 'defaultHeight', label: 'Cao (mm)', width: 90 },
  { key: 'isActive', label: 'Trạng thái', width: 90, render: fmtBool },
];

export const DOORTEMPLATE_FIELDS: FieldDef[] = [
  { key: 'code', label: 'Mã mẫu', type: 'text', required: true, width: '50%' },
  { key: 'name', label: 'Tên mẫu cửa', type: 'text', required: true, width: '50%' },
  { key: 'category', label: 'Loại cửa', type: 'select', required: true, width: '50%', options: [
    { value: 'window', label: 'Cửa sổ' }, { value: 'door', label: 'Cửa đi' },
    { value: 'sliding_door', label: 'Cửa trượt' }, { value: 'folding_door', label: 'Cửa gấp' },
    { value: 'fixed_panel', label: 'Vách kính cố định' }, { value: 'curtain_wall', label: 'Façade' },
  ]},
  { key: 'material', label: 'Chất liệu', type: 'select', width: '50%', options: [
    { value: 'aluminum', label: 'Nhôm' }, { value: 'upvc', label: 'uPVC' },
    { value: 'steel', label: 'Thép' }, { value: 'wood_composite', label: 'Gỗ composite' },
  ]},
  { key: 'profileSystem', label: 'Hệ nhôm', type: 'text', width: '50%' },
  { key: 'glassLayers', label: 'Số lớp kính', type: 'number', width: '50%' },
  { key: 'defaultWidth', label: 'Rộng mặc định (mm)', type: 'number', width: '50%' },
  { key: 'defaultHeight', label: 'Cao mặc định (mm)', type: 'number', width: '50%' },
  { key: 'minWidth', label: 'Rộng tối thiểu (mm)', type: 'number', width: '50%' },
  { key: 'maxWidth', label: 'Rộng tối đa (mm)', type: 'number', width: '50%' },
  { key: 'minHeight', label: 'Cao tối thiểu (mm)', type: 'number', width: '50%' },
  { key: 'maxHeight', label: 'Cao tối đa (mm)', type: 'number', width: '50%' },
  { key: 'isActive', label: 'Đang hoạt động', type: 'checkbox', width: '50%' },
  { key: 'description', label: 'Mô tả', type: 'textarea' },
];

// ── Registry: Map category key → config ─────────────────────

export interface CategoryConfig {
  key: string;
  label: string;
  resource: string;        // permission resource
  columns: ColumnDef<MasterEntityBase>[];
  fields: FieldDef[];
  storeKey: string;         // key in DanhMucStore
  setterKey: string;        // setter method name
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { key: 'customer',      label: 'Khách hàng',     resource: 'master.customer',      columns: CUSTOMER_COLUMNS,     fields: CUSTOMER_FIELDS,     storeKey: 'customers',    setterKey: 'setCustomers' },
  { key: 'supplier',      label: 'Nhà cung cấp',   resource: 'master.supplier',      columns: SUPPLIER_COLUMNS,     fields: SUPPLIER_FIELDS,     storeKey: 'suppliers',    setterKey: 'setSuppliers' },
  { key: 'employee',      label: 'Nhân viên',       resource: 'master.employee',      columns: EMPLOYEE_COLUMNS,     fields: EMPLOYEE_FIELDS,     storeKey: 'employees',    setterKey: 'setEmployees' },
  { key: 'profile',       label: 'Thanh nhôm',      resource: 'master.profile',       columns: PROFILE_COLUMNS,      fields: PROFILE_FIELDS,      storeKey: 'profiles',     setterKey: 'setProfiles' },
  { key: 'glass',         label: 'Kính',            resource: 'master.glass',         columns: GLASS_COLUMNS,        fields: GLASS_FIELDS,        storeKey: 'glasses',      setterKey: 'setGlasses' },
  { key: 'accessory',     label: 'Phụ kiện',        resource: 'master.accessory',     columns: ACCESSORY_COLUMNS,    fields: ACCESSORY_FIELDS,    storeKey: 'accessories',  setterKey: 'setAccessories' },
  { key: 'material',      label: 'Vật tư',          resource: 'master.material',      columns: MATERIAL_COLUMNS,     fields: MATERIAL_FIELDS,     storeKey: 'materials',    setterKey: 'setMaterials' },
  { key: 'unit',          label: 'Đơn vị tính',     resource: 'master.unit',          columns: UNIT_COLUMNS,         fields: UNIT_FIELDS,         storeKey: 'units',        setterKey: 'setUnits' },
  { key: 'warehouse',     label: 'Kho',             resource: 'master.warehouse',     columns: WAREHOUSE_COLUMNS,    fields: WAREHOUSE_FIELDS,    storeKey: 'warehouses',   setterKey: 'setWarehouses' },
  { key: 'pricelist',     label: 'Bảng giá',        resource: 'master.price_list',    columns: PRICELIST_COLUMNS,    fields: PRICELIST_FIELDS,    storeKey: 'priceLists',   setterKey: 'setPriceLists' },
  { key: 'taxrate',       label: 'Thuế suất',       resource: 'master.tax_rate',      columns: TAXRATE_COLUMNS,      fields: TAXRATE_FIELDS,      storeKey: 'taxRates',     setterKey: 'setTaxRates' },
  { key: 'doortemplate',  label: 'Mẫu cửa',        resource: 'master.door_template', columns: DOORTEMPLATE_COLUMNS,  fields: DOORTEMPLATE_FIELDS,  storeKey: 'doorTemplates', setterKey: 'setDoorTemplates' },
];
