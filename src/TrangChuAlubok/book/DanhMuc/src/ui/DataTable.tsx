'use client';
// ============================================================
// DataTable — Generic reusable table with sort, search, pagination
// Used across all 12 master data categories
// ============================================================

import React, { useState, useMemo } from 'react';

export interface ColumnDef<T> {
  key: string;
  label: string;
  width?: number;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onSearch?: (query: string) => void;
  onRowClick?: (row: T) => void;
  onAdd?: () => void;
  onDelete?: (ids: string[]) => void;
  searchPlaceholder?: string;
  title?: string;
  loading?: boolean;
}

const STYLES = {
  container: { display: 'flex', flexDirection: 'column' as const, height: '100%', backgroundColor: '#1e1e2e', color: '#cdd6f4' },
  toolbar: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid #313244' },
  searchInput: { flex: 1, maxWidth: 320, padding: '6px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none' },
  addBtn: { padding: '6px 16px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  deleteBtn: { padding: '6px 16px', backgroundColor: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { padding: '8px 12px', textAlign: 'left' as const, borderBottom: '2px solid #45475a', backgroundColor: '#181825', fontWeight: 600, color: '#a6adc8', cursor: 'pointer', userSelect: 'none' as const, whiteSpace: 'nowrap' as const },
  td: { padding: '8px 12px', borderBottom: '1px solid #313244' },
  trHover: { backgroundColor: '#313244' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid #313244', fontSize: 13 },
  pageBtn: { padding: '4px 12px', backgroundColor: '#313244', color: '#cdd6f4', border: '1px solid #45475a', borderRadius: 4, cursor: 'pointer' },
  pageBtnDisabled: { opacity: 0.4, cursor: 'default' },
  checkbox: { accentColor: '#89b4fa', width: 14, height: 14 },
  empty: { padding: 40, textAlign: 'center' as const, color: '#6c7086' },
};

export function DataTable<T extends { id: string }>({
  columns, data, total, page, pageSize, onPageChange,
  onSort, onSearch, onRowClick, onAdd, onDelete,
  searchPlaceholder = 'Tìm kiếm...', title, loading,
}: DataTableProps<T>): React.ReactElement {
  const [searchValue, setSearchValue] = useState('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const totalPages = Math.ceil(total / pageSize);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleSort = (key: string) => {
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(newOrder);
    onSort?.(key, newOrder);
  };

  const toggleAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(r => r.id)));
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedIds(next);
  };

  const sortIndicator = (key: string) => {
    if (sortKey !== key) return '';
    return sortOrder === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div style={STYLES.container}>
      {/* Toolbar */}
      <div style={STYLES.toolbar}>
        {title && <span style={{ fontWeight: 600, fontSize: 15, marginRight: 12 }}>{title}</span>}
        <input
          type="text"
          value={searchValue}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          style={STYLES.searchInput}
        />
        {onAdd && <button onClick={onAdd} style={STYLES.addBtn}>+ Thêm mới</button>}
        {onDelete && selectedIds.size > 0 && (
          <button onClick={() => { onDelete([...selectedIds]); setSelectedIds(new Set()); }} style={STYLES.deleteBtn}>
            Xóa ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={STYLES.table}>
          <thead>
            <tr>
              <th style={{ ...STYLES.th, width: 40 }}>
                <input type="checkbox" checked={data.length > 0 && selectedIds.size === data.length} onChange={toggleAll} style={STYLES.checkbox} />
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ ...STYLES.th, width: col.width }}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  {col.label}{col.sortable !== false ? sortIndicator(col.key) : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan={columns.length + 1} style={STYLES.empty}>{loading ? 'Đang tải...' : 'Không có dữ liệu'}</td></tr>
            )}
            {data.map(row => (
              <tr
                key={row.id}
                style={hoveredRow === row.id ? STYLES.trHover : undefined}
                onMouseEnter={() => setHoveredRow(row.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onRowClick?.(row)}
              >
                <td style={{ ...STYLES.td, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    onClick={e => e.stopPropagation()}
                    style={STYLES.checkbox}
                  />
                </td>
                {columns.map(col => (
                  <td key={col.key} style={STYLES.td}>
                    {col.render
                      ? col.render((row as Record<string, unknown>)[col.key], row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={STYLES.pagination}>
        <span>Hiển thị {data.length} / {total} bản ghi</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            style={{ ...STYLES.pageBtn, ...(page <= 1 ? STYLES.pageBtnDisabled : {}) }}
          >←</button>
          <span style={{ padding: '0 8px' }}>Trang {page} / {totalPages || 1}</span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={{ ...STYLES.pageBtn, ...(page >= totalPages ? STYLES.pageBtnDisabled : {}) }}
          >→</button>
        </div>
      </div>
    </div>
  );
}
