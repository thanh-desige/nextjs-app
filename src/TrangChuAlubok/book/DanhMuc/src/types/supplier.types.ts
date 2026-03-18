// ============================================================
// A2: Supplier (Nhà cung cấp)
// ============================================================

import type { MasterEntityBase } from './base.types';

export type SupplierCategory = 'aluminum' | 'glass' | 'accessory' | 'material' | 'other';

export interface Supplier extends MasterEntityBase {
  category: SupplierCategory;
  contactPerson: string;
  phone: string;
  email: string;
  taxCode: string;
  address: string;
  city: string;
  bankAccount: string;
  bankName: string;
  paymentTermDays: number;
  notes: string;
}
