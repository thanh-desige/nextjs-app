'use client';
import React, { useState } from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import { ACC_STATUS_LABELS, ACC_STATUS_COLORS, type AcceptanceStatus } from '../types';

interface Props {
  onAdd: () => void;
  onSelect: (id: string) => void;
}

export default function AcceptanceList({ onAdd, onSelect }: Props) {
  const { acceptances, projects } = useSanXuatThiCongStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<AcceptanceStatus | ''>('');

  const filtered = acceptances.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.recordCode.toLowerCase().includes(q) ||
        r.projectCode.toLowerCase().includes(q) ||
        r.inspectedBy.toLowerCase().includes(q) ||
        r.volumeDescription.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getProjectName = (projectId: string) =>
    projects.find((p) => p.projectId === projectId)?.projectName ?? '';

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>Nghiệm thu / Bàn giao</h2>
        <button
          onClick={onAdd}
          style={{ padding: '8px 20px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
        >
          + Tạo biên bản
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã biên bản, công trình, người nghiệm thu..."
          style={{ flex: 1, padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AcceptanceStatus | '')}
          style={{ padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13 }}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(ACC_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #313244' }}>
            {['Mã', 'Công trình', 'Loại', 'Ngày nghiệm thu', 'Người NT', 'Khối lượng', 'Trạng thái'].map((h) => (
              <th key={h} style={{ padding: '10px', textAlign: 'left', color: '#a6adc8', fontWeight: 600, borderRight: '1px solid #313244' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr
              key={r.recordId}
              onClick={() => onSelect(r.recordId)}
              style={{ borderBottom: '1px solid #313244', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262637')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <td style={{ padding: '10px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>{r.recordCode}</td>
              <td style={{ padding: '10px', color: '#bac2de', borderRight: '1px solid #313244' }}>
                <div>{r.projectCode}</div>
                <div style={{ fontSize: 11, color: '#6c7086' }}>{getProjectName(r.projectId)}</div>
              </td>
              <td style={{ padding: '10px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>
                {r.type === 'partial' ? 'Từng phần' : 'Toàn bộ'}
              </td>
              <td style={{ padding: '10px', color: '#bac2de', borderRight: '1px solid #313244' }}>{r.acceptanceDate}</td>
              <td style={{ padding: '10px', color: '#bac2de', borderRight: '1px solid #313244' }}>{r.inspectedBy}</td>
              <td style={{ padding: '10px', color: '#6c7086', fontSize: 12, borderRight: '1px solid #313244', maxWidth: 200 }}>
                {r.volumeDescription.length > 40 ? r.volumeDescription.slice(0, 40) + '...' : r.volumeDescription}
              </td>
              <td style={{ padding: '10px' }}>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#1e1e2e', backgroundColor: ACC_STATUS_COLORS[r.status] }}>
                  {ACC_STATUS_LABELS[r.status]}
                </span>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>Không tìm thấy biên bản nghiệm thu nào</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
