'use client';
// ============================================================
// UserManagement — D1: setting.user
// List users + invite modal + role assignment + deactivate
// ============================================================

import React, { useState, useMemo } from 'react';
import { FiSearch, FiPlus, FiX, FiCheck, FiUserX, FiMail } from 'react-icons/fi';
import { useThietLapStore } from '../store/thietLapStore';
import type { ManagedUser, InviteUserPayload } from '../types';

// ────────────────────────────────────────────────────────────
// Status badge
// ────────────────────────────────────────────────────────────
function UserStatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active:    { bg: 'rgba(166,227,161,0.15)', text: '#a6e3a1' },
    invited:   { bg: 'rgba(137,180,250,0.15)', text: '#89b4fa' },
    suspended: { bg: 'rgba(243,139,168,0.15)', text: '#f38ba8' },
  };
  const c = colors[status] ?? colors.active;
  const labels: Record<string, string> = { active: 'Hoạt động', invited: 'Đã mời', suspended: 'Tạm khóa' };
  return (
    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, backgroundColor: c.bg, color: c.text }}>
      {labels[status] ?? status}
    </span>
  );
}

// ────────────────────────────────────────────────────────────
// Invite Modal
// ────────────────────────────────────────────────────────────
function InviteModal({ roles, onClose, onInvite }: {
  roles: { roleId: string; roleName: string }[];
  onClose: () => void;
  onInvite: (payload: InviteUserPayload) => void;
}) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [platformRole, setPlatformRole] = useState<'admin' | 'member'>('member');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const toggleRole = (roleId: string) => {
    setSelectedRoles(prev => prev.includes(roleId) ? prev.filter(r => r !== roleId) : [...prev, roleId]);
  };

  const handleSubmit = () => {
    if (!email.trim() || !displayName.trim()) return;
    onInvite({ email: email.trim(), displayName: displayName.trim(), platformRole, roleIds: selectedRoles });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#1e1e2e', border: '1px solid #313244', borderRadius: 8, padding: 24, width: 440 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#cdd6f4', fontSize: 16, fontWeight: 600, margin: 0 }}>Mời thành viên</h3>
          <FiX size={18} style={{ cursor: 'pointer', color: '#6c7086' }} onClick={onClose} />
        </div>

        {/* Email */}
        <label style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4, display: 'block' }}>Email *</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="user@company.com"
          style={{ width: '100%', padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
        />

        {/* Display name */}
        <label style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4, display: 'block' }}>Tên hiển thị *</label>
        <input
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Nguyễn Văn X"
          style={{ width: '100%', padding: '8px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, marginBottom: 12, outline: 'none', boxSizing: 'border-box' }}
        />

        {/* Platform role */}
        <label style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4, display: 'block' }}>Vai trò nền tảng</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['member', 'admin'] as const).map(r => (
            <button key={r} onClick={() => setPlatformRole(r)} style={{
              padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              border: platformRole === r ? '1px solid #89b4fa' : '1px solid #45475a',
              backgroundColor: platformRole === r ? 'rgba(137,180,250,0.15)' : '#313244',
              color: platformRole === r ? '#89b4fa' : '#cdd6f4',
            }}>
              {r === 'member' ? 'Thành viên' : 'Admin'}
            </button>
          ))}
        </div>

        {/* App Roles */}
        <label style={{ color: '#a6adc8', fontSize: 12, marginBottom: 4, display: 'block' }}>Gán vai trò nghiệp vụ</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {roles.map(r => (
            <button key={r.roleId} onClick={() => toggleRole(r.roleId)} style={{
              padding: '4px 12px', borderRadius: 4, fontSize: 11, cursor: 'pointer',
              border: selectedRoles.includes(r.roleId) ? '1px solid #a6e3a1' : '1px solid #45475a',
              backgroundColor: selectedRoles.includes(r.roleId) ? 'rgba(166,227,161,0.15)' : '#313244',
              color: selectedRoles.includes(r.roleId) ? '#a6e3a1' : '#cdd6f4',
            }}>
              {r.roleName}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #45475a', backgroundColor: '#313244', color: '#cdd6f4', cursor: 'pointer', fontSize: 13 }}>
            Hủy
          </button>
          <button onClick={handleSubmit} disabled={!email.trim() || !displayName.trim()} style={{
            padding: '8px 16px', borderRadius: 6, border: 'none', backgroundColor: '#89b4fa', color: '#1e1e2e', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            opacity: (!email.trim() || !displayName.trim()) ? 0.5 : 1,
          }}>
            <FiMail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Gửi lời mời
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────
export default function UserManagement(): React.ReactElement {
  const { users, roles, setUsers } = useThietLapStore();
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.user.displayName.toLowerCase().includes(q) ||
      u.user.email.toLowerCase().includes(q) ||
      u.roleNames.some(r => r.toLowerCase().includes(q))
    );
  }, [users, search]);

  const handleDeactivate = (userId: string) => {
    setUsers(users.map(u =>
      u.user.userId === userId
        ? { ...u, membership: { ...u.membership, status: u.membership.status === 'suspended' ? 'active' : 'suspended' } }
        : u
    ));
  };

  const handleInvite = (payload: InviteUserPayload) => {
    const id = `u${Date.now()}`;
    const newUser: ManagedUser = {
      user: { userId: id, email: payload.email, displayName: payload.displayName, avatarUrl: null, authProvider: 'email', emailVerified: false, mfaEnabled: false, status: 'active', createdAt: new Date().toISOString() },
      membership: { memberId: `m${Date.now()}`, userId: id, orgId: 'org1', platformRole: payload.platformRole, status: 'invited', joinedAt: new Date().toISOString(), invitedBy: 'current' },
      assignedRoles: payload.roleIds.map(roleId => ({ memberId: `m${Date.now()}`, roleId, assignedAt: new Date().toISOString(), assignedBy: 'current' })),
      roleNames: payload.roleIds.map(rid => roles.find(r => r.role.roleId === rid)?.role.roleName ?? rid),
      lastLoginAt: null,
    };
    setUsers([...users, newUser]);
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e2e' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 600, margin: 0 }}>Quản lý người dùng</h2>
          <p style={{ color: '#6c7086', fontSize: 12, margin: '4px 0 0' }}>{users.length} thành viên</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6c7086' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              style={{ padding: '7px 12px 7px 32px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none', width: 200 }}
            />
          </div>
          <button onClick={() => setShowInvite(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 6, border: 'none', backgroundColor: '#89b4fa', color: '#1e1e2e', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            <FiPlus size={14} /> Mời
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #313244' }}>
              {['Tên', 'Email', 'Vai trò', 'Trạng thái', 'Đăng nhập cuối', ''].map((h, i) => (
                <th key={i} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6c7086', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.user.userId} style={{ borderBottom: '1px solid rgba(49,50,68,0.5)' }}>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#313244', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#89b4fa', fontSize: 13, fontWeight: 600 }}>
                      {u.user.displayName.charAt(0)}
                    </div>
                    <span style={{ color: '#cdd6f4', fontSize: 13, fontWeight: 500 }}>{u.user.displayName}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 8px', color: '#a6adc8', fontSize: 13 }}>{u.user.email}</td>
                <td style={{ padding: '10px 8px' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {u.roleNames.length > 0
                      ? u.roleNames.map(r => (
                          <span key={r} style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: 'rgba(137,180,250,0.12)', color: '#89b4fa', fontSize: 11, fontWeight: 500 }}>{r}</span>
                        ))
                      : <span style={{ color: '#6c7086', fontSize: 11 }}>Chưa gán</span>
                    }
                  </div>
                </td>
                <td style={{ padding: '10px 8px' }}><UserStatusBadge status={u.membership.status} /></td>
                <td style={{ padding: '10px 8px', color: '#6c7086', fontSize: 12 }}>{formatDate(u.lastLoginAt)}</td>
                <td style={{ padding: '10px 8px' }}>
                  <button onClick={() => handleDeactivate(u.user.userId)} title={u.membership.status === 'suspended' ? 'Mở khóa' : 'Tạm khóa'} style={{
                    padding: '4px 8px', borderRadius: 4, border: '1px solid #45475a', backgroundColor: 'transparent', cursor: 'pointer',
                    color: u.membership.status === 'suspended' ? '#a6e3a1' : '#f38ba8',
                  }}>
                    {u.membership.status === 'suspended' ? <FiCheck size={14} /> : <FiUserX size={14} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <InviteModal
          roles={roles.map(r => ({ roleId: r.role.roleId, roleName: r.role.roleName }))}
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  );
}
