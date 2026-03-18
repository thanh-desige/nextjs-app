// ============================================================
// DanhMuc Base Types — Common fields for all master data entities
// ============================================================

/** Base fields shared across all master data entities */
export interface MasterEntityBase {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  orgId: string;
}

/** Status for soft-delete / archive */
export type EntityStatus = 'active' | 'inactive' | 'archived';

/** Common list query params */
export interface ListParams {
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: EntityStatus;
}

/** Paginated list result */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Generic CRUD service interface */
export interface CrudService<T extends MasterEntityBase, TCreate = Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>> {
  getAll(params?: ListParams): PaginatedResult<T>;
  getById(id: string): T | undefined;
  create(data: TCreate): T;
  update(id: string, data: Partial<TCreate>): T;
  delete(id: string): void;
  search(query: string): T[];
}
