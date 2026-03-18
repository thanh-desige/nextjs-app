'use client';
import React, { useState } from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import { MI_STATUS_LABELS, MI_STATUS_COLORS, type MaterialIssueStatus } from '../types';

const fmt = (n: number) => n.toLocaleString('vi-VN');

export default function MaterialIssuePage() {
  const { materialIssues, updateMaterialIssue } = useSanXuatThiCongStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MaterialIssueStatus | ''>('');

  const filtered = materialIssues.filter((i) => {
    if (statusFilter && i.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.issueCode.toLowerCase().includes(q) ||
        i.productionOrderCode.toLowerCase().includes(q) ||
        i.items.some((it) => it.materialName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleApprove = (id: string) => {
    updateMaterialIssue(id, { status: 'approved', approvedBy: 'Người dùng', approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  };

  const handleIssued = (id: string) => {
    updateMaterialIssue(id, { status: 'issued', updatedAt: new Date().toISOString() });
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>
        Xuất dùng sản xuất
      </h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm mã phiếu xuất, lệnh SX..."
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: '#313244',
            border: '1px solid #45475a',
            borderRadius: 6,
            color: '#cdd6f4',
            fontSize: 13,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as MaterialIssueStatus | '')}
          style={{
            padding: '8px 12px',
            backgroundColor: '#313244',
            border: '1px solid #45475a',
            borderRadius: 6,
            color: '#cdd6f4',
            fontSize: 13,
          }}
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(MI_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #313244' }}>
            {['Mã phiếu', 'Lệnh SX', 'Vật tư', 'SL yêu cầu', 'SL xuất', 'Hao hụt', 'Trạng thái', ''].map((h) => (
              <th key={h} style={{ padding: '10px', textAlign: 'left', color: '#a6adc8', fontWeight: 600, borderRight: '1px solid #313244' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((issue) => {
            const totalReq = issue.items.reduce((s, i) => s + i.requestedQty, 0);
            const totalIssued = issue.items.reduce((s, i) => s + i.issuedQty, 0);
            const totalWaste = issue.items.reduce((s, i) => s + i.wasteQty, 0);
            return (
              <tr key={issue.issueId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '10px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>
                  {issue.issueCode}
                </td>
                <td style={{ padding: '10px', color: '#bac2de', borderRight: '1px solid #313244' }}>
                  {issue.productionOrderCode}
                </td>
                <td style={{ padding: '10px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>
                  {issue.items.map((i) => i.materialName).join(', ').slice(0, 40)}
                  {issue.items.map((i) => i.materialName).join(', ').length > 40 ? '...' : ''}
                </td>
                <td style={{ padding: '10px', color: '#cdd6f4', textAlign: 'right', borderRight: '1px solid #313244' }}>
                  {fmt(totalReq)}
                </td>
                <td style={{ padding: '10px', color: '#a6e3a1', textAlign: 'right', fontWeight: 600, borderRight: '1px solid #313244' }}>
                  {fmt(totalIssued)}
                </td>
                <td style={{ padding: '10px', color: totalWaste > 0 ? '#f38ba8' : '#6c7086', textAlign: 'right', borderRight: '1px solid #313244' }}>
                  {totalWaste > 0 ? fmt(totalWaste) : '—'}
                </td>
                <td style={{ padding: '10px', borderRight: '1px solid #313244' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#1e1e2e',
                      backgroundColor: MI_STATUS_COLORS[issue.status],
                    }}
                  >
                    {MI_STATUS_LABELS[issue.status]}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {issue.status === 'pending' && (
                      <button
                        onClick={() => handleApprove(issue.issueId)}
                        style={{ padding: '4px 10px', backgroundColor: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                      >
                        Duyệt
                      </button>
                    )}
                    {issue.status === 'approved' && (
                      <button
                        onClick={() => handleIssued(issue.issueId)}
                        style={{ padding: '4px 10px', backgroundColor: '#a6e3a1', color: '#1e1e2e', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                      >
                        Xuất kho
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: 24, textAlign: 'center', color: '#6c7086' }}>
                Không có phiếu xuất dùng nào
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
