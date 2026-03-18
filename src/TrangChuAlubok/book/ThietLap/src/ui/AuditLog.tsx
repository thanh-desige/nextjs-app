'use client';
// ============================================================
// AuditLog — D8: setting.audit_log (read-only)
// ============================================================

import React, { useState, useMemo } from 'react';
import { FiSearch } from 'react-icons/fi';
import { useThietLapStore } from '../store/thietLapStore';
import { RESOURCE_LABELS, ACTION_LABELS } from '../types';

export default function AuditLog(): React.ReactElement {
  const { auditLogs } = useThietLapStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return auditLogs;
    const q = search.toLowerCase();
    return auditLogs.filter(log =>
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.resource.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  }, [auditLogs, search]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e2e' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 600, margin: 0 }}>Nhật ký thao tác</h2>
          <p style={{ color: '#6c7086', fontSize: 12, margin: '4px 0 0' }}>{auditLogs.length} bản ghi</p>
        </div>
        <div style={{ position: 'relative' }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6c7086' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..."
            style={{ padding: '7px 12px 7px 32px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none', width: 200 }} />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['Thời gian', 'Người dùng', 'Hành động', 'Tài nguyên', 'Chi tiết', 'IP'].map((h, i) => (
                <th key={i} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6c7086', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(49,50,68,0.5)' }}>
                <td style={{ padding: '8px', color: '#6c7086', fontSize: 12, whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                <td style={{ padding: '8px', color: '#cdd6f4', fontSize: 12 }}>{log.userName}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{ padding: '2px 6px', borderRadius: 3, backgroundColor: 'rgba(137,180,250,0.12)', color: '#89b4fa', fontSize: 11 }}>
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                </td>
                <td style={{ padding: '8px', color: '#a6adc8', fontSize: 12 }}>{RESOURCE_LABELS[log.resource] ?? log.resource}</td>
                <td style={{ padding: '8px', color: '#a6adc8', fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</td>
                <td style={{ padding: '8px', color: '#6c7086', fontSize: 11, fontFamily: 'monospace' }}>{log.ipAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
