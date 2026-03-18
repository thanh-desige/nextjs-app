// ============================================================
// A8:  Unit (Đơn vị tính)
// A9:  Warehouse (Kho)
// A10: PriceList (Bảng giá)
// A11: TaxRate (Thuế suất)
// ============================================================

import type { MasterEntityBase } from './base.types';

// --- A8: Unit (Đơn vị tính) ---

export interface Unit extends MasterEntityBase {
  abbreviation: string;       // m, kg, cái, bộ, m²...
  description: string;
}

// --- A9: Warehouse (Kho) ---

export type WarehouseType = 'main' | 'branch' | 'transit' | 'defective';

export interface Warehouse extends MasterEntityBase {
  warehouseType: WarehouseType;
  address: string;
  branchId: string;
  managerId: string;
  notes: string;
}

// --- A10: PriceList (Bảng giá) ---

export type PriceListType = 'purchase' | 'sales';

export interface PriceListItem {
  itemId: string;
  resourceType: 'profile' | 'glass' | 'accessory' | 'material';
  resourceId: string;
  resourceName: string;
  unit: string;
  price: number;
}

export interface PriceList extends MasterEntityBase {
  priceListType: PriceListType;
  supplierId: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  currency: string;
  items: PriceListItem[];
  notes: string;
}

// --- A11: TaxRate (Thuế suất) ---

export type TaxType = 'vat' | 'import' | 'excise' | 'other';

export interface TaxRate extends MasterEntityBase {
  taxType: TaxType;
  rate: number;              // % (10 = 10%)
  description: string;
}
