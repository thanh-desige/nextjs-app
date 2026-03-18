// ============================================================
// A1: Customer (Khách hàng)
// ============================================================

import type { MasterEntityBase } from './base.types';

export type CustomerType = 'individual' | 'company';

export interface Customer extends MasterEntityBase {
  type: CustomerType;
  contactPerson: string;
  phone: string;
  email: string;
  taxCode: string;
  address: string;
  city: string;
  notes: string;
  debtLimit: number | null;
}
