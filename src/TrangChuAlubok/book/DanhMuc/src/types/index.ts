// ============================================================
// DanhMuc/src/types — Barrel export
// ============================================================

// Base types
export type { MasterEntityBase, EntityStatus, ListParams, PaginatedResult, CrudService } from './base.types';

// A1: Customer
export type { CustomerType, Customer } from './customer.types';

// A2: Supplier
export type { SupplierCategory, Supplier } from './supplier.types';

// A3: Employee
export type { EmployeeStatus, Employee } from './employee.types';

// A4-A7: Materials
export type {
  ProfileSystem, ProfileSurface, Profile,
  GlassType, Glass,
  AccessoryCategory, Accessory,
  MaterialCategory, Material,
} from './material.types';

// A8-A11: Catalog
export type {
  Unit,
  WarehouseType, Warehouse,
  PriceListType, PriceListItem, PriceList,
  TaxType, TaxRate,
} from './catalog.types';

// A12: Door Template
export type { DoorCategory, DoorMaterial, DoorTemplate } from './doorTemplate.types';
