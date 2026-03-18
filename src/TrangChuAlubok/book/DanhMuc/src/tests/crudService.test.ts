// ============================================================
// crudService tests — CRUD operations, search, pagination, sort
// ============================================================

import { createCrudService } from '../services/crudService';
import type { MasterEntityBase } from '../types';

interface TestEntity extends MasterEntityBase {
  phone?: string;
}

function makeStore() {
  let items: TestEntity[] = [];
  return {
    get: () => items,
    set: (v: TestEntity[]) => { items = v; },
  };
}

let counter = 0;
const genId = () => `test-${++counter}`;
const ORG = 'org-1';
const USER = 'user-1';

function seed(store: ReturnType<typeof makeStore>, count: number) {
  const svc = createCrudService<TestEntity>(store.get, store.set, genId, ORG, USER);
  for (let i = 1; i <= count; i++) {
    svc.create({
      code: `CODE-${String(i).padStart(3, '0')}`,
      name: `Entity ${i}`,
      isActive: i % 3 !== 0, // every 3rd is inactive
      orgId: ORG,
    } as Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>);
  }
  return svc;
}

beforeEach(() => { counter = 0; });

describe('createCrudService', () => {
  // ── Create ──────────────────────────────────────────────
  it('creates an entity with generated id and timestamps', () => {
    const store = makeStore();
    const svc = createCrudService<TestEntity>(store.get, store.set, genId, ORG, USER);
    const result = svc.create({ code: 'C-001', name: 'Test', isActive: true, orgId: ORG } as Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>);
    expect(result.id).toBeDefined();
    expect(result.code).toBe('C-001');
    expect(result.createdBy).toBe(USER);
    expect(result.orgId).toBe(ORG);
    expect(result.createdAt).toBeDefined();
    expect(store.get()).toHaveLength(1);
  });

  // ── Read ────────────────────────────────────────────────
  it('getById returns the correct entity', () => {
    const store = makeStore();
    const svc = createCrudService<TestEntity>(store.get, store.set, genId, ORG, USER);
    const created = svc.create({ code: 'C-002', name: 'Find me', isActive: true, orgId: ORG } as Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>);
    const found = svc.getById(created.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe('Find me');
  });

  it('getById returns undefined for wrong org', () => {
    const store = makeStore();
    const svc = createCrudService<TestEntity>(store.get, store.set, genId, 'other-org', USER);
    store.set([{ id: 'x', code: 'X', name: 'X', isActive: true, orgId: ORG, createdAt: '', updatedAt: '', createdBy: '' }]);
    expect(svc.getById('x')).toBeUndefined();
  });

  // ── Update ──────────────────────────────────────────────
  it('updates an entity and bumps updatedAt', () => {
    const store = makeStore();
    const svc = createCrudService<TestEntity>(store.get, store.set, genId, ORG, USER);
    const created = svc.create({ code: 'C-003', name: 'Old', isActive: true, orgId: ORG } as Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>);
    const updated = svc.update(created.id, { name: 'New' });
    expect(updated.name).toBe('New');
    expect(updated.id).toBe(created.id);
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(created.updatedAt).getTime());
  });

  it('throws when updating non-existent entity', () => {
    const store = makeStore();
    const svc = createCrudService<TestEntity>(store.get, store.set, genId, ORG, USER);
    expect(() => svc.update('nonexistent', { name: 'fail' })).toThrow();
  });

  // ── Delete ──────────────────────────────────────────────
  it('deletes an entity', () => {
    const store = makeStore();
    const svc = createCrudService<TestEntity>(store.get, store.set, genId, ORG, USER);
    const created = svc.create({ code: 'C-004', name: 'Delete me', isActive: true, orgId: ORG } as Omit<TestEntity, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>);
    svc.delete(created.id);
    expect(store.get()).toHaveLength(0);
    expect(svc.getById(created.id)).toBeUndefined();
  });

  // ── Search ──────────────────────────────────────────────
  it('searches by name and code', () => {
    const store = makeStore();
    const svc = seed(store, 10);
    const result = svc.search('Entity 3');
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result[0].name).toContain('3');
  });

  // ── getAll with filters ─────────────────────────────────
  it('filters by active status', () => {
    const store = makeStore();
    const svc = seed(store, 9); // 3 inactive (3,6,9)
    const active = svc.getAll({ status: 'active' });
    expect(active.total).toBe(6);
    const inactive = svc.getAll({ status: 'inactive' });
    expect(inactive.total).toBe(3);
  });

  it('searches within getAll', () => {
    const store = makeStore();
    const svc = seed(store, 5);
    const result = svc.getAll({ search: 'Entity 2' });
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Entity 2');
  });

  // ── Pagination ──────────────────────────────────────────
  it('paginates results correctly', () => {
    const store = makeStore();
    const svc = seed(store, 25);
    const page1 = svc.getAll({ page: 1, pageSize: 10 });
    expect(page1.items).toHaveLength(10);
    expect(page1.total).toBe(25);
    expect(page1.totalPages).toBe(3);
    expect(page1.page).toBe(1);

    const page3 = svc.getAll({ page: 3, pageSize: 10 });
    expect(page3.items).toHaveLength(5);
  });

  // ── Sort ────────────────────────────────────────────────
  it('sorts by name ascending', () => {
    const store = makeStore();
    const svc = seed(store, 5);
    const result = svc.getAll({ sortBy: 'name', sortOrder: 'asc' });
    const names = result.items.map(i => i.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  it('sorts by name descending', () => {
    const store = makeStore();
    const svc = seed(store, 5);
    const result = svc.getAll({ sortBy: 'name', sortOrder: 'desc' });
    const names = result.items.map(i => i.name);
    const sorted = [...names].sort().reverse();
    expect(names).toEqual(sorted);
  });
});
