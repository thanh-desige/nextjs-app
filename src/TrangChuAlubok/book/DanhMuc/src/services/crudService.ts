// ============================================================
// Generic CRUD Service — In-memory data management
// Later replaced with API calls to PostgreSQL
// ============================================================

import type { MasterEntityBase, ListParams, PaginatedResult } from '../types';

/**
 * Generic in-memory CRUD service for master data entities.
 * Provides search, pagination, sort — all locally.
 * Will be swapped with API service when backend is connected.
 */
export function createCrudService<T extends MasterEntityBase>(
  getItems: () => T[],
  setItems: (items: T[]) => void,
  generateId: () => string,
  orgId: string,
  userId: string,
) {
  function getAll(params?: ListParams): PaginatedResult<T> {
    let items = getItems().filter(i => i.orgId === orgId);

    // Filter by status
    if (params?.status) {
      items = items.filter(i => {
        if (params.status === 'active') return i.isActive;
        if (params.status === 'inactive') return !i.isActive;
        return true;
      });
    }

    // Search
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q),
      );
    }

    // Sort
    const sortBy = params?.sortBy ?? 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';
    items = [...items].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortBy];
      const bVal = (b as Record<string, unknown>)[sortBy];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    // Paginate
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const total = items.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paged = items.slice(start, start + pageSize);

    return { items: paged, total, page, pageSize, totalPages };
  }

  function getById(id: string): T | undefined {
    return getItems().find(i => i.id === id && i.orgId === orgId);
  }

  function create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): T {
    const now = new Date().toISOString();
    const item = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      orgId,
    } as T;
    setItems([...getItems(), item]);
    return item;
  }

  function update(id: string, data: Partial<T>): T {
    const items = getItems();
    const idx = items.findIndex(i => i.id === id && i.orgId === orgId);
    if (idx === -1) throw new Error(`Entity ${id} not found`);
    const updated = {
      ...items[idx],
      ...data,
      id: items[idx].id,           // prevent overwriting id
      orgId: items[idx].orgId,     // prevent overwriting orgId
      createdBy: items[idx].createdBy,
      createdAt: items[idx].createdAt,
      updatedAt: new Date().toISOString(),
    } as T;
    const newItems = [...items];
    newItems[idx] = updated;
    setItems(newItems);
    return updated;
  }

  function remove(id: string): void {
    setItems(getItems().filter(i => !(i.id === id && i.orgId === orgId)));
  }

  function search(query: string): T[] {
    const q = query.toLowerCase();
    return getItems().filter(i =>
      i.orgId === orgId && (
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q)
      ),
    );
  }

  return { getAll, getById, create, update, delete: remove, search };
}
