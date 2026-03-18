'use client';
// ============================================================
// CategoryPage — Generic page component for a master data category
// Wires: DataTable + EntityForm + crudService + danhMucStore
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { DataTable } from './DataTable';
import { EntityForm } from './EntityForm';
import { createCrudService } from '../services/crudService';
import { useDanhMucStore } from '../store/danhMucStore';
import type { CategoryConfig } from './categoryConfigs';
import type { MasterEntityBase } from '../types';

interface CategoryPageProps {
  config: CategoryConfig;
}

// Mock org/user for now — will come from auth context
const ORG_ID = 'org-default';
const USER_ID = 'user-default';

let _counter = 0;
const generateId = () => `${Date.now()}-${++_counter}`;

export function CategoryPage({ config }: CategoryPageProps): React.ReactElement {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MasterEntityBase | null>(null);
  const PAGE_SIZE = 20;

  // Access store dynamically
  const items = useDanhMucStore(
    (s) => (s as unknown as Record<string, unknown>)[config.storeKey] as MasterEntityBase[],
  );
  const setter = useDanhMucStore(
    (s) => (s as unknown as Record<string, (...args: unknown[]) => void>)[config.setterKey],
  );

  // Create a CRUD service for this category
  const service = useMemo(
    () =>
      createCrudService(
        () => items,
        (newItems: MasterEntityBase[]) => setter(newItems),
        generateId,
        ORG_ID,
        USER_ID,
      ),
    [items, setter],
  );

  // Fetch data
  const result = useMemo(
    () => service.getAll({ page, pageSize: PAGE_SIZE, search, sortBy, sortOrder }),
    [service, page, search, sortBy, sortOrder],
  );

  const handleSort = useCallback((key: string, order: 'asc' | 'desc') => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  const handleAdd = useCallback(() => {
    setEditItem(null);
    setShowForm(true);
  }, []);

  const handleRowClick = useCallback((row: MasterEntityBase) => {
    setEditItem(row);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((ids: string[]) => {
    ids.forEach(id => service.delete(id));
  }, [service]);

  const handleSubmit = useCallback(
    (values: Record<string, unknown>) => {
      if (editItem) {
        service.update(editItem.id, values);
      } else {
        service.create({
          ...values,
          isActive: values.isActive !== false,
          orgId: ORG_ID,
        } as Omit<MasterEntityBase, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>);
      }
      setShowForm(false);
      setEditItem(null);
    },
    [editItem, service],
  );

  return (
    <>
      <DataTable
        columns={config.columns}
        data={result.items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        onPageChange={setPage}
        onSort={handleSort}
        onSearch={handleSearch}
        onRowClick={handleRowClick}
        onAdd={handleAdd}
        onDelete={handleDelete}
        title={config.label}
        searchPlaceholder={`Tìm ${config.label.toLowerCase()}...`}
      />
      {showForm && (
        <EntityForm
          title={editItem ? `Sửa ${config.label}` : `Thêm ${config.label}`}
          fields={config.fields}
          initialValues={editItem ? (editItem as unknown as Record<string, unknown>) : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditItem(null); }}
          submitLabel={editItem ? 'Cập nhật' : 'Thêm mới'}
        />
      )}
    </>
  );
}
