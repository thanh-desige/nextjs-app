'use client';
// ============================================================
// PermissionMatrix — D3: setting.permission
// MISA-style grid: Group → Resource → Action columns → Toggle
// Select a role, then toggle individual permissions or "Toàn quyền"
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { FiCheck, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { useThietLapStore } from '../store/thietLapStore';
import { PERMISSION_CATALOG, PERMISSION_GROUPS } from '../../../shared/src/constants/permissionCatalog';
import { PERMISSION_GROUP_LABELS, RESOURCE_LABELS, ACTION_LABELS } from '../types';
import type { PermissionCatalogEntry } from '../../../shared/src/types';

// ────────────────────────────────────────────────────────────
// Collect all unique actions across the catalog (for column headers)
// ────────────────────────────────────────────────────────────
const ALL_ACTIONS = Array.from(new Set(PERMISSION_CATALOG.flatMap(e => [...e.actions]))).sort((a, b) => {
  const order = ['read', 'create', 'update', 'delete', 'import', 'export', 'share', 'generate', 'approve', 'reject', 'confirm', 'close', 'cancel', 'manage', 'assign', 'restore', 'archive'];
  return order.indexOf(a) - order.indexOf(b);
});

// Groups to show (A-D, not E/platform)
const VISIBLE_GROUPS = ['A', 'B', 'C', 'D'] as const;

// ────────────────────────────────────────────────────────────
// Checkbox component
// ────────────────────────────────────────────────────────────
function PermCheckbox({ checked, available, onChange }: {
  checked: boolean;
  available: boolean;
  onChange: () => void;
}) {
  if (!available) {
    return <div style={{ width: 20, height: 20 }} />;
  }
  return (
    <div
      onClick={onChange}
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        border: checked ? '1px solid #89b4fa' : '1px solid #45475a',
        backgroundColor: checked ? 'rgba(137,180,250,0.2)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {checked && <FiCheck size={12} style={{ color: '#89b4fa' }} />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// "Toàn quyền" (Full access) checkbox per resource
// ────────────────────────────────────────────────────────────
function FullAccessCheckbox({ allGranted, onChange }: {
  allGranted: boolean;
  onChange: () => void;
}) {
  return (
    <div
      onClick={onChange}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: allGranted ? 'rgba(166,227,161,0.12)' : 'transparent',
        border: allGranted ? '1px solid rgba(166,227,161,0.3)' : '1px solid transparent',
      }}
    >
      <div style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        border: allGranted ? '1px solid #a6e3a1' : '1px solid #45475a',
        backgroundColor: allGranted ? 'rgba(166,227,161,0.3)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {allGranted && <FiCheck size={10} style={{ color: '#a6e3a1' }} />}
      </div>
      <span style={{ fontSize: 10, color: allGranted ? '#a6e3a1' : '#6c7086', whiteSpace: 'nowrap' }}>
        Toàn quyền
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────
export default function PermissionMatrix(): React.ReactElement {
  const { roles, setRoles } = useThietLapStore();
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.role.roleId ?? '');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const selectedRole = roles.find(r => r.role.roleId === selectedRoleId);
  const isOwner = selectedRole?.permissions.includes('*:*') ?? false;

  // Build a set of granted permissions for quick lookup
  const grantedSet = useMemo(() => {
    if (!selectedRole) return new Set<string>();
    const set = new Set<string>();
    for (const perm of selectedRole.permissions) {
      if (perm === '*:*') {
        // All permissions
        for (const entry of PERMISSION_CATALOG) {
          for (const action of entry.actions) {
            set.add(`${entry.resource}:${action}`);
          }
        }
      } else if (perm.endsWith(':*')) {
        // All actions on a resource pattern
        const prefix = perm.slice(0, -2);
        for (const entry of PERMISSION_CATALOG) {
          if (entry.resource === prefix || entry.resource.startsWith(prefix + '.')) {
            for (const action of entry.actions) {
              set.add(`${entry.resource}:${action}`);
            }
          }
        }
      } else {
        set.add(perm);
      }
    }
    return set;
  }, [selectedRole]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const togglePermission = useCallback((resource: string, action: string) => {
    if (!selectedRole || isOwner) return;
    const perm = `${resource}:${action}`;
    const currentPerms = selectedRole.permissions.filter(p => p !== '*:*');
    const expanded = new Set<string>();
    for (const p of currentPerms) {
      if (p.endsWith(':*')) {
        const prefix = p.slice(0, -2);
        for (const entry of PERMISSION_CATALOG) {
          if (entry.resource === prefix || entry.resource.startsWith(prefix + '.')) {
            for (const a of entry.actions) {
              expanded.add(`${entry.resource}:${a}`);
            }
          }
        }
      } else {
        expanded.add(p);
      }
    }

    if (expanded.has(perm)) expanded.delete(perm);
    else expanded.add(perm);

    const newPerms = Array.from(expanded);
    setRoles(roles.map(r =>
      r.role.roleId === selectedRoleId ? { ...r, permissions: newPerms } : r
    ));
  }, [selectedRole, isOwner, roles, selectedRoleId, setRoles]);

  const toggleFullAccess = useCallback((entry: PermissionCatalogEntry) => {
    if (!selectedRole || isOwner) return;
    const allGranted = entry.actions.every(a => grantedSet.has(`${entry.resource}:${a}`));
    const currentPerms = selectedRole.permissions.filter(p => p !== '*:*');
    const expanded = new Set<string>();
    for (const p of currentPerms) {
      if (p.endsWith(':*')) {
        const prefix = p.slice(0, -2);
        for (const e of PERMISSION_CATALOG) {
          if (e.resource === prefix || e.resource.startsWith(prefix + '.')) {
            for (const a of e.actions) expanded.add(`${e.resource}:${a}`);
          }
        }
      } else {
        expanded.add(p);
      }
    }

    if (allGranted) {
      for (const a of entry.actions) expanded.delete(`${entry.resource}:${a}`);
    } else {
      for (const a of entry.actions) expanded.add(`${entry.resource}:${a}`);
    }

    setRoles(roles.map(r =>
      r.role.roleId === selectedRoleId ? { ...r, permissions: Array.from(expanded) } : r
    ));
  }, [selectedRole, isOwner, grantedSet, roles, selectedRoleId, setRoles]);

  // Stats
  const totalGranted = grantedSet.size;
  const totalPossible = PERMISSION_CATALOG.reduce((sum, e) => sum + e.actions.length, 0);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e2e' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #313244', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 18, fontWeight: 600, margin: 0 }}>Ma trận quyền</h2>
          <p style={{ color: '#6c7086', fontSize: 12, margin: '4px 0 0' }}>
            {totalGranted}/{totalPossible} quyền đã gán cho vai trò đang chọn
          </p>
        </div>
        {/* Role selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ color: '#a6adc8', fontSize: 12 }}>Vai trò:</label>
          <select
            value={selectedRoleId}
            onChange={e => setSelectedRoleId(e.target.value)}
            style={{ padding: '6px 12px', backgroundColor: '#313244', border: '1px solid #45475a', borderRadius: 6, color: '#cdd6f4', fontSize: 13, outline: 'none' }}
          >
            {roles.map(r => (
              <option key={r.role.roleId} value={r.role.roleId}>{r.role.roleName}</option>
            ))}
          </select>
        </div>
      </div>

      {isOwner && (
        <div style={{ padding: '8px 20px', backgroundColor: 'rgba(249,226,175,0.08)', borderBottom: '1px solid rgba(249,226,175,0.2)', color: '#f9e2af', fontSize: 12 }}>
          ⚠ OWNER có toàn quyền (*:*) — không thể chỉnh sửa.
        </div>
      )}

      {/* Matrix grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ position: 'sticky', top: 0, backgroundColor: '#1e1e2e', zIndex: 5 }}>
              <th style={{ padding: '10px 8px', textAlign: 'left', color: '#6c7086', fontWeight: 600, fontSize: 11, width: 200, minWidth: 200 }}>
                Tài nguyên
              </th>
              <th style={{ padding: '10px 4px', textAlign: 'center', color: '#6c7086', fontWeight: 600, fontSize: 10, width: 70 }}>
                Toàn quyền
              </th>
              {ALL_ACTIONS.map(action => (
                <th key={action} style={{ padding: '10px 2px', textAlign: 'center', color: '#6c7086', fontWeight: 600, fontSize: 10, minWidth: 36 }}>
                  {ACTION_LABELS[action] ?? action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VISIBLE_GROUPS.map(groupKey => {
              const entries = PERMISSION_GROUPS[groupKey];
              const isCollapsed = collapsedGroups.has(groupKey);
              return (
                <React.Fragment key={groupKey}>
                  {/* Group header */}
                  <tr
                    onClick={() => toggleGroup(groupKey)}
                    style={{ cursor: 'pointer', backgroundColor: 'rgba(137,180,250,0.04)' }}
                  >
                    <td colSpan={2 + ALL_ACTIONS.length} style={{ padding: '8px 8px', borderBottom: '1px solid #313244' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isCollapsed ? <FiChevronRight size={14} style={{ color: '#6c7086' }} /> : <FiChevronDown size={14} style={{ color: '#6c7086' }} />}
                        <span style={{ color: '#89b4fa', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {groupKey}. {PERMISSION_GROUP_LABELS[groupKey] ?? groupKey}
                        </span>
                        <span style={{ color: '#6c7086', fontSize: 11, fontWeight: 400 }}>({entries.length} resources)</span>
                      </div>
                    </td>
                  </tr>
                  {/* Resource rows */}
                  {!isCollapsed && entries.map((entry) => {
                    const allGranted = entry.actions.every(a => grantedSet.has(`${entry.resource}:${a}`));
                    return (
                      <tr key={entry.resource} style={{ borderBottom: '1px solid rgba(49,50,68,0.4)' }}>
                        <td style={{ padding: '6px 8px 6px 24px', color: '#cdd6f4', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {RESOURCE_LABELS[entry.resource] ?? entry.resource}
                        </td>
                        <td style={{ padding: '6px 4px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <FullAccessCheckbox allGranted={allGranted} onChange={() => toggleFullAccess(entry)} />
                          </div>
                        </td>
                        {ALL_ACTIONS.map(action => {
                          const available = entry.actions.includes(action);
                          const checked = grantedSet.has(`${entry.resource}:${action}`);
                          return (
                            <td key={action} style={{ padding: '6px 2px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <PermCheckbox
                                  checked={checked}
                                  available={available}
                                  onChange={() => togglePermission(entry.resource, action)}
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
