// ============================================================
// A3: Employee (Nhân viên)
// ============================================================

import type { MasterEntityBase } from './base.types';

export type EmployeeStatus = 'working' | 'resigned' | 'on_leave';

export interface Employee extends MasterEntityBase {
  phone: string;
  email: string;
  position: string;
  department: string;
  employeeStatus: EmployeeStatus;
  joinDate: string;
  address: string;
  notes: string;
}
