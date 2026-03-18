// ============================================================
// ThietLap Store Tests
// ============================================================

import { useThietLapStore } from '../store/thietLapStore';
import { DEFAULT_SYSTEM_SETTINGS } from '../types';

// Reset store between tests
beforeEach(() => {
  useThietLapStore.getState().resetAll();
});

describe('thietLapStore', () => {
  describe('initial state', () => {
    it('has seed users', () => {
      const { users } = useThietLapStore.getState();
      expect(users.length).toBe(5);
      expect(users[0].user.email).toBe('owner@alubok.vn');
      expect(users[0].roleNames).toContain('OWNER');
    });

    it('has seed roles', () => {
      const { roles } = useThietLapStore.getState();
      expect(roles.length).toBe(6);
      expect(roles.map(r => r.role.roleName)).toEqual(['OWNER', 'ADMIN', 'DESIGNER', 'ACCOUNTANT', 'WAREHOUSE', 'SALES']);
    });

    it('has org info', () => {
      const { org } = useThietLapStore.getState();
      expect(org.orgId).toBe('org1');
      expect(org.orgName).toContain('ALUBOK');
      expect(org.subscriptionPlan).toBe('professional');
    });

    it('has branches', () => {
      const { branches } = useThietLapStore.getState();
      expect(branches.length).toBe(2);
      expect(branches[0].branchName).toBe('Trụ sở chính');
    });

    it('has default system settings', () => {
      const { systemSettings } = useThietLapStore.getState();
      expect(systemSettings).toEqual(DEFAULT_SYSTEM_SETTINGS);
    });

    it('has audit logs', () => {
      const { auditLogs } = useThietLapStore.getState();
      expect(auditLogs.length).toBe(3);
    });
  });

  describe('setters', () => {
    it('setUsers replaces users array', () => {
      const { setUsers } = useThietLapStore.getState();
      setUsers([]);
      expect(useThietLapStore.getState().users).toEqual([]);
    });

    it('setRoles replaces roles array', () => {
      const { setRoles, roles } = useThietLapStore.getState();
      const newRoles = roles.slice(0, 2);
      setRoles(newRoles);
      expect(useThietLapStore.getState().roles.length).toBe(2);
    });

    it('setOrg updates org info', () => {
      const { setOrg, org } = useThietLapStore.getState();
      setOrg({ ...org, orgName: 'Test Corp' });
      expect(useThietLapStore.getState().org.orgName).toBe('Test Corp');
    });

    it('setBranches replaces branches', () => {
      const { setBranches } = useThietLapStore.getState();
      setBranches([]);
      expect(useThietLapStore.getState().branches).toEqual([]);
    });

    it('setSystemSettings updates settings', () => {
      const { setSystemSettings } = useThietLapStore.getState();
      setSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, currency: 'USD', language: 'en' });
      const { systemSettings } = useThietLapStore.getState();
      expect(systemSettings.currency).toBe('USD');
      expect(systemSettings.language).toBe('en');
    });

    it('addAuditLog prepends entry', () => {
      const { addAuditLog } = useThietLapStore.getState();
      const entry = { id: 'a99', userId: 'u1', userName: 'Test', action: 'create', resource: 'setting.role', details: 'test', ipAddress: '127.0.0.1', createdAt: '2026-03-17T10:00:00Z' };
      addAuditLog(entry);
      const { auditLogs } = useThietLapStore.getState();
      expect(auditLogs[0].id).toBe('a99');
      expect(auditLogs.length).toBe(4);
    });
  });

  describe('resetAll', () => {
    it('restores all state to seed data', () => {
      const store = useThietLapStore.getState();
      store.setUsers([]);
      store.setRoles([]);
      store.setBranches([]);
      store.resetAll();
      const restored = useThietLapStore.getState();
      expect(restored.users.length).toBe(5);
      expect(restored.roles.length).toBe(6);
      expect(restored.branches.length).toBe(2);
    });
  });

  describe('role permissions', () => {
    it('OWNER has wildcard permissions', () => {
      const { roles } = useThietLapStore.getState();
      const owner = roles.find(r => r.role.roleName === 'OWNER');
      expect(owner?.permissions).toEqual(['*:*']);
    });

    it('system roles are typed as system', () => {
      const { roles } = useThietLapStore.getState();
      expect(roles.every(r => r.role.roleType === 'system')).toBe(true);
    });

    it('each role has orgId', () => {
      const { roles } = useThietLapStore.getState();
      expect(roles.every(r => r.role.orgId === 'org1')).toBe(true);
    });
  });

  describe('user membership', () => {
    it('each user has valid membership', () => {
      const { users } = useThietLapStore.getState();
      for (const u of users) {
        expect(u.membership.orgId).toBe('org1');
        expect(['owner', 'admin', 'member']).toContain(u.membership.platformRole);
        expect(['active', 'invited', 'suspended']).toContain(u.membership.status);
      }
    });

    it('invited user has no roles', () => {
      const { users } = useThietLapStore.getState();
      const invited = users.find(u => u.membership.status === 'invited');
      expect(invited).toBeDefined();
      expect(invited!.assignedRoles.length).toBe(0);
      expect(invited!.roleNames.length).toBe(0);
    });
  });
});
