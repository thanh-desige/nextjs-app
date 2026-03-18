'use client';
import React from 'react';
import { useSanXuatThiCongStore } from '../store/sanXuatThiCongStore';
import {
  PROJECT_STATUS_LABELS, PROJECT_STATUS_COLORS,
  PO_STATUS_LABELS, PO_STATUS_COLORS,
  INST_STATUS_LABELS, INST_STATUS_COLORS,
  type SanXuatSection,
} from '../types';

const fmt = (n: number) => n.toLocaleString('vi-VN');

interface ProgressOverviewProps {
  onNavigate: (section: SanXuatSection) => void;
}

export default function ProgressOverview({ onNavigate }: ProgressOverviewProps) {
  const { projects, productionOrders, installations, acceptances, materialPlans } =
    useSanXuatThiCongStore();

  const today = new Date().toISOString().slice(0, 10);

  // Stats
  const activeProjects = projects.filter((p) => !['completed', 'warranty'].includes(p.status));
  const overdueOrders = productionOrders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled' && o.dueDate < today
  );
  const todayInstalls = installations.filter((j) => j.scheduledDate === today);
  const pendingAcceptances = acceptances.filter((a) => a.status === 'pending');
  const shortageItems = materialPlans
    .flatMap((p) => p.items)
    .filter((i) => i.shortageQty > 0);

  const statCards = [
    { label: 'Công trình đang chạy', value: activeProjects.length, color: '#89b4fa', section: 'overview' as SanXuatSection },
    { label: 'Lệnh SX đang xử lý', value: productionOrders.filter((o) => !['completed', 'cancelled'].includes(o.status)).length, color: '#f9e2af', section: 'production-orders' as SanXuatSection },
    { label: 'Lắp đặt hôm nay', value: todayInstalls.length, color: '#fab387', section: 'installations' as SanXuatSection },
    { label: 'Chờ nghiệm thu', value: pendingAcceptances.length, color: '#cba6f7', section: 'acceptances' as SanXuatSection },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: '#cdd6f4', fontSize: 20, fontWeight: 700, margin: '0 0 20px' }}>
        Tổng quan tiến độ
      </h2>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map((c) => (
          <div
            key={c.label}
            onClick={() => onNavigate(c.section)}
            style={{
              backgroundColor: '#181825',
              borderRadius: 8,
              padding: '16px 20px',
              cursor: 'pointer',
              borderLeft: `4px solid ${c.color}`,
            }}
          >
            <div style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4 }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: 28, fontWeight: 700 }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(overdueOrders.length > 0 || shortageItems.length > 0) && (
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <h3 style={{ color: '#f38ba8', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
            ⚠️ Cảnh báo
          </h3>
          {overdueOrders.length > 0 && (
            <div
              style={{ color: '#f38ba8', fontSize: 13, marginBottom: 8, cursor: 'pointer' }}
              onClick={() => onNavigate('production-orders')}
            >
              • {overdueOrders.length} lệnh SX trễ hạn:{' '}
              {overdueOrders.map((o) => o.orderCode).join(', ')}
            </div>
          )}
          {shortageItems.length > 0 && (
            <div
              style={{ color: '#fab387', fontSize: 13, cursor: 'pointer' }}
              onClick={() => onNavigate('material-plans')}
            >
              • {shortageItems.length} hạng mục thiếu vật tư — cần mua bổ sung
            </div>
          )}
        </div>
      )}

      {/* Active Projects Table */}
      <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16, marginBottom: 24 }}>
        <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
          Công trình đang triển khai
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['Mã CT', 'Tên công trình', 'Khách hàng', 'Hạn', 'Trạng thái'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '8px 10px',
                    textAlign: 'left',
                    color: '#a6adc8',
                    fontWeight: 600,
                    borderRight: '1px solid #313244',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.projectId} style={{ borderBottom: '1px solid #313244' }}>
                <td style={{ padding: '8px 10px', color: '#89b4fa', fontWeight: 600, borderRight: '1px solid #313244' }}>
                  {p.projectCode}
                </td>
                <td style={{ padding: '8px 10px', color: '#cdd6f4', borderRight: '1px solid #313244' }}>
                  {p.projectName}
                </td>
                <td style={{ padding: '8px 10px', color: '#bac2de', borderRight: '1px solid #313244' }}>
                  {p.customerName}
                </td>
                <td style={{ padding: '8px 10px', color: p.deadline < today ? '#f38ba8' : '#bac2de', borderRight: '1px solid #313244' }}>
                  {p.deadline}
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#1e1e2e',
                      backgroundColor: PROJECT_STATUS_COLORS[p.status],
                    }}
                  >
                    {PROJECT_STATUS_LABELS[p.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Production Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
            Lệnh SX gần đây
          </h3>
          {productionOrders.slice(0, 5).map((o) => (
            <div
              key={o.orderId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #313244',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate('production-orders')}
            >
              <div>
                <span style={{ color: '#89b4fa', fontWeight: 600, fontSize: 13 }}>{o.orderCode}</span>
                <span style={{ color: '#6c7086', marginLeft: 8, fontSize: 12 }}>{o.projectCode}</span>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#1e1e2e',
                  backgroundColor: PO_STATUS_COLORS[o.status],
                }}
              >
                {PO_STATUS_LABELS[o.status]}
              </span>
            </div>
          ))}
        </div>

        <div style={{ backgroundColor: '#181825', borderRadius: 8, padding: 16 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>
            Lắp đặt sắp tới
          </h3>
          {installations.slice(0, 5).map((j) => (
            <div
              key={j.jobId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #313244',
                cursor: 'pointer',
              }}
              onClick={() => onNavigate('installations')}
            >
              <div>
                <span style={{ color: '#89b4fa', fontWeight: 600, fontSize: 13 }}>{j.jobCode}</span>
                <span style={{ color: '#6c7086', marginLeft: 8, fontSize: 12 }}>
                  {j.teamName} — {j.scheduledDate}
                </span>
              </div>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#1e1e2e',
                  backgroundColor: INST_STATUS_COLORS[j.status],
                }}
              >
                {INST_STATUS_LABELS[j.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
