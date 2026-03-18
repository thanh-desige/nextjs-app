'use client';
import React, { useState } from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import { MP_STATUS_LABELS, MP_STATUS_COLORS, type MaterialPlanStatus } from '../types';

const fmt = (n: number) => n.toLocaleString('vi-VN');

export default function MaterialPlanPage() {
  const { materialPlans, updateMaterialPlan } = useSanXuatThiCongStore();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = materialPlans.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.planCode.toLowerCase().includes(q) ||
      p.productionOrderCode.toLowerCase().includes(q) ||
      p.items.some((i) => i.materialName.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>
        Kế hoạch vật tư
      </h2>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm mã KHVT, lệnh SX, vật tư..."
        style={{
          width: '100%',
          padding: '8px 12px',
          backgroundColor: '#313244',
          border: '1px solid #45475a',
          borderRadius: 6,
          color: '#cdd6f4',
          fontSize: 13,
          marginBottom: 16,
        }}
      />

      {filtered.map((plan) => {
        const isExpanded = expandedId === plan.planId;
        const totalRequired = plan.items.reduce((s, i) => s + i.requiredQty, 0);
        const totalIssued = plan.items.reduce((s, i) => s + i.issuedQty, 0);
        const totalShortage = plan.items.reduce((s, i) => s + i.shortageQty, 0);

        return (
          <div
            key={plan.planId}
            style={{
              backgroundColor: '#181825',
              borderRadius: 8,
              marginBottom: 12,
              border: `1px solid ${isExpanded ? '#45475a' : '#313244'}`,
            }}
          >
            {/* Header */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : plan.planId)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#89b4fa', fontWeight: 600, fontSize: 14 }}>{plan.planCode}</span>
                <span style={{ color: '#6c7086', fontSize: 12 }}>→ {plan.productionOrderCode}</span>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#1e1e2e',
                    backgroundColor: MP_STATUS_COLORS[plan.status],
                  }}
                >
                  {MP_STATUS_LABELS[plan.status]}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ color: '#a6adc8' }}>Cần: {fmt(totalRequired)}</span>
                <span style={{ color: '#a6e3a1' }}>Cấp: {fmt(totalIssued)}</span>
                {totalShortage > 0 && (
                  <span style={{ color: '#f38ba8', fontWeight: 600 }}>Thiếu: {fmt(totalShortage)}</span>
                )}
                <span style={{ color: '#6c7086' }}>{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Detail */}
            {isExpanded && (
              <div style={{ padding: '0 16px 16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #313244' }}>
                      {['Vật tư', 'Mã', 'ĐVT', 'BOM cần', 'Tồn kho', 'Đã cấp', 'Thiếu'].map((h) => (
                        <th key={h} style={{ padding: '8px', textAlign: 'left', color: '#a6adc8', fontWeight: 600, borderRight: '1px solid #313244' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plan.items.map((it) => (
                      <tr key={it.itemId} style={{ borderBottom: '1px solid #313244' }}>
                        <td style={{ padding: '8px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>{it.materialName}</td>
                        <td style={{ padding: '8px', color: '#6c7086', borderRight: '1px solid #313244' }}>{it.materialCode || '—'}</td>
                        <td style={{ padding: '8px', color: '#bac2de', borderRight: '1px solid #313244' }}>{it.unit}</td>
                        <td style={{ padding: '8px', color: '#cdd6f4', textAlign: 'right', borderRight: '1px solid #313244' }}>{fmt(it.requiredQty)}</td>
                        <td style={{ padding: '8px', color: '#89b4fa', textAlign: 'right', borderRight: '1px solid #313244' }}>{fmt(it.stockQty)}</td>
                        <td style={{ padding: '8px', color: '#a6e3a1', textAlign: 'right', borderRight: '1px solid #313244' }}>{fmt(it.issuedQty)}</td>
                        <td style={{ padding: '8px', color: it.shortageQty > 0 ? '#f38ba8' : '#a6e3a1', textAlign: 'right', fontWeight: it.shortageQty > 0 ? 600 : 400 }}>
                          {it.shortageQty > 0 ? fmt(it.shortageQty) : '✓ Đủ'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {plan.notes && (
                  <div style={{ marginTop: 8, color: '#6c7086', fontSize: 12 }}>📝 {plan.notes}</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div style={{ color: '#6c7086', textAlign: 'center', padding: 32 }}>
          Không tìm thấy kế hoạch vật tư nào
        </div>
      )}
    </div>
  );
}
