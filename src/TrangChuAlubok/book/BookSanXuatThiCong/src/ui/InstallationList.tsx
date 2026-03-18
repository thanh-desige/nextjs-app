'use client';
import React, { useState } from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import { INST_STATUS_LABELS, INST_STATUS_COLORS, type InstallationStatus } from '../types';

interface Props {
  onAdd: () => void;
  onSelect: (id: string) => void;
}

export default function InstallationList({ onAdd, onSelect }: Props) {
  const { installations } = useSanXuatThiCongStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InstallationStatus | ''>('');

  const filtered = installations.filter((j) => {
    if (statusFilter && j.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        j.jobCode.toLowerCase().includes(q) ||
        j.projectCode.toLowerCase().includes(q) ||
        j.teamName.toLowerCase().includes(q) ||
        j.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: 0 }}>Thi công / Lắp đặt</h2>
        <button
          onClick={onAdd}
          style={{ padding: '8px 20px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
        >
          + Tạo lịch lắp đặt
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã lắp đặt, công trình, đội..."
          style={{ flex: 1, padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InstallationStatus | '')}
          style={{ padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13 }}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(INST_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #313244' }}>
            {['Mã', 'Công trình', 'Đội thi công', 'Đội trưởng', 'Ngày', 'Địa chỉ', 'Trạng thái'].map((h) => (
              <th key={h} style={{ padding: '10px', textAlign: 'left', color: '#a6adc8', fontWeight: 600, borderRight: '1px solid #313244' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((j) => (
            <tr
              key={j.jobId}
              onClick={() => onSelect(j.jobId)}
              style={{ borderBottom: '1px solid #313244', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262637')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <td style={{ padding: '10px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>{j.jobCode}</td>
              <td style={{ padding: '10px', color: '#bac2de', borderRight: '1px solid #313244' }}>{j.projectCode}</td>
              <td style={{ padding: '10px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{j.teamName}</td>
              <td style={{ padding: '10px', color: '#bac2de', borderRight: '1px solid #313244' }}>{j.teamLeader}</td>
              <td style={{ padding: '10px', color: '#bac2de', borderRight: '1px solid #313244' }}>{j.scheduledDate}</td>
              <td style={{ padding: '10px', color: '#6c7086', fontSize: 12, borderRight: '1px solid #313244' }}>
                {j.address.length > 35 ? j.address.slice(0, 35) + '...' : j.address}
              </td>
              <td style={{ padding: '10px' }}>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#1e1e2e', backgroundColor: INST_STATUS_COLORS[j.status] }}>
                  {INST_STATUS_LABELS[j.status]}
                </span>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>Không tìm thấy lịch lắp đặt nào</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
