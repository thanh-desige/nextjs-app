'use client';
import React from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS,
  PO_STATUS_LABELS, PO_STATUS_COLORS,
  INST_STATUS_LABELS, INST_STATUS_COLORS,
  ACC_STATUS_LABELS, ACC_STATUS_COLORS,
  type ProductionOrderStatus,
} from '../types';

export default function ProductionReport() {
  const { projects, productionOrders, materialPlans, materialIssues, installations, acceptances } =
    useSanXuatThiCongStore();

  // ── Stats ─────────────────────────────────────────────────
  const totalPO = productionOrders.length;
  const completedPO = productionOrders.filter((o) => o.status === 'completed').length;
  const defectPO = productionOrders.filter((o) => o.status === 'defect').length;
  const completionRate = totalPO > 0 ? Math.round((completedPO / totalPO) * 100) : 0;
  const defectRate = totalPO > 0 ? Math.round((defectPO / totalPO) * 100) : 0;

  const totalInstall = installations.length;
  const completedInstall = installations.filter((j) => j.status === 'completed').length;
  const installRate = totalInstall > 0 ? Math.round((completedInstall / totalInstall) * 100) : 0;

  const totalAcceptance = acceptances.length;
  const approvedAcc = acceptances.filter((r) => r.status === 'approved').length;

  const totalShortage = materialPlans.reduce(
    (sum, p) => sum + p.items.reduce((s, i) => s + i.shortageQty, 0), 0
  );

  const totalWaste = materialIssues.reduce(
    (sum, mi) => sum + mi.items.reduce((s, i) => s + i.wasteQty, 0), 0
  );

  // ── PO status distribution ────────────────────────────────
  const poByStatus: Record<ProductionOrderStatus, number> = {
    new: 0, cutting: 0, processing: 0, qc: 0, completed: 0, defect: 0, cancelled: 0,
  };
  for (const o of productionOrders) poByStatus[o.status]++;

  const statCards = [
    { label: 'Tổng lệnh SX', value: totalPO, color: '#89b4fa' },
    { label: 'Hoàn tất SX', value: `${completedPO} (${completionRate}%)`, color: '#a6e3a1' },
    { label: 'Lỗi / Làm lại', value: `${defectPO} (${defectRate}%)`, color: '#f38ba8' },
    { label: 'Lắp đặt xong', value: `${completedInstall}/${totalInstall} (${installRate}%)`, color: '#fab387' },
    { label: 'Nghiệm thu đạt', value: `${approvedAcc}/${totalAcceptance}`, color: '#cba6f7' },
    { label: 'Thiếu vật tư', value: totalShortage, color: totalShortage > 0 ? '#f38ba8' : '#a6e3a1' },
  ];

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#181825', borderRadius: 8, padding: 16, textAlign: 'center',
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Báo cáo Sản xuất & Thi công</h2>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {statCards.map((c) => (
          <div key={c.label} style={cardStyle}>
            <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: 22, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* PO Status distribution */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ color: '#cdd6f4', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Phân bổ trạng thái Lệnh SX</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(Object.entries(poByStatus) as [ProductionOrderStatus, number][]).map(([status, count]) => (
            <div
              key={status}
              style={{
                padding: '8px 16px', borderRadius: 6,
                backgroundColor: count > 0 ? PO_STATUS_COLORS[status] + '22' : '#313244',
                border: `1px solid ${count > 0 ? PO_STATUS_COLORS[status] : '#45475a'}`,
                textAlign: 'center', minWidth: 100,
              }}
            >
              <div style={{ color: PO_STATUS_COLORS[status], fontSize: 18, fontWeight: 700 }}>{count}</div>
              <div style={{ color: '#a6adc8', fontSize: 11 }}>{PO_STATUS_LABELS[status]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Project progress table */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20, marginBottom: 24 }}>
        <div style={{ color: '#cdd6f4', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Tiến độ Công trình</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #313244' }}>
              {['Mã CT', 'Tên công trình', 'Khách hàng', 'Hạn', 'LSX', 'Lắp đặt', 'Trạng thái'].map((h) => (
                <th key={h} style={{ padding: '8px', textAlign: 'left', color: '#a6adc8', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const poCount = productionOrders.filter((o) => o.projectId === p.projectId).length;
              const poCompleted = productionOrders.filter((o) => o.projectId === p.projectId && o.status === 'completed').length;
              const instCount = installations.filter((j) => j.projectId === p.projectId).length;
              const instDone = installations.filter((j) => j.projectId === p.projectId && j.status === 'completed').length;
              return (
                <tr key={p.projectId} style={{ borderBottom: '1px solid #313244' }}>
                  <td style={{ padding: '8px', color: '#89b4fa', fontWeight: 600 }}>{p.projectCode}</td>
                  <td style={{ padding: '8px', color: '#cdd6f4' }}>{p.projectName}</td>
                  <td style={{ padding: '8px', color: '#bac2de' }}>{p.customerName}</td>
                  <td style={{ padding: '8px', color: '#bac2de' }}>{p.deadline}</td>
                  <td style={{ padding: '8px', color: '#cdd6f4' }}>{poCompleted}/{poCount}</td>
                  <td style={{ padding: '8px', color: '#cdd6f4' }}>{instDone}/{instCount}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, color: '#1e1e2e', backgroundColor: PROJECT_STATUS_COLORS[p.status] }}>
                      {PROJECT_STATUS_LABELS[p.status]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Material summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20 }}>
          <div style={{ color: '#cdd6f4', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Vật tư thiếu hụt</div>
          {materialPlans.flatMap((p) => p.items.filter((i) => i.shortageQty > 0).map((i) => (
            <div key={i.itemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #313244' }}>
              <span style={{ color: '#bac2de', fontSize: 13 }}>{i.materialName}</span>
              <span style={{ color: '#f38ba8', fontSize: 13, fontWeight: 600 }}>-{i.shortageQty} {i.unit}</span>
            </div>
          )))}
          {totalShortage === 0 && (
            <div style={{ color: '#a6e3a1', fontSize: 13 }}>✓ Không thiếu vật tư</div>
          )}
        </div>

        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 20 }}>
          <div style={{ color: '#cdd6f4', fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Hao hụt vật tư</div>
          {materialIssues.flatMap((mi) => mi.items.filter((i) => i.wasteQty > 0).map((i) => (
            <div key={i.itemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #313244' }}>
              <span style={{ color: '#bac2de', fontSize: 13 }}>{i.materialName}</span>
              <span style={{ color: '#fab387', fontSize: 13, fontWeight: 600 }}>{i.wasteQty} {i.unit}</span>
            </div>
          )))}
          {totalWaste === 0 && (
            <div style={{ color: '#a6e3a1', fontSize: 13 }}>✓ Không có hao hụt</div>
          )}
        </div>
      </div>
    </div>
  );
}
