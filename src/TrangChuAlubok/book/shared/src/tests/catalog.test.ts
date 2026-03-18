// ============================================================
// Tests: Permission Catalog + Default Roles integrity
// ============================================================

import { PERMISSION_CATALOG, PERMISSION_GROUPS, GROUP_COUNTS } from '../constants/permissionCatalog';
import { DEFAULT_APP_ROLES, DEFAULT_INTERNAL_ROLES, getDefaultAppRole, getInternalRole } from '../constants/defaultRoles';
import { isValidPermission, parsePermission } from '../utils/permissionUtils';

// ────────────────────────────────────────────────────────────
// Catalog integrity
// ────────────────────────────────────────────────────────────
describe('PERMISSION_CATALOG', () => {
  it('has 67 total resources', () => {
    expect(PERMISSION_CATALOG.length).toBe(67);
  });

  it('GROUP_COUNTS matches actual lengths', () => {
    expect(GROUP_COUNTS.A).toBe(12);
    expect(GROUP_COUNTS.B).toBe(20);
    expect(GROUP_COUNTS.C).toBe(11);
    expect(GROUP_COUNTS.D).toBe(8);
    expect(GROUP_COUNTS.E).toBe(16);
    expect(GROUP_COUNTS.total).toBe(67);
  });

  it('no duplicate resources', () => {
    const resources = PERMISSION_CATALOG.map(e => e.resource);
    expect(new Set(resources).size).toBe(resources.length);
  });

  it('every entry has at least "read" action', () => {
    for (const entry of PERMISSION_CATALOG) {
      expect(entry.actions).toContain('read');
    }
  });

  it('every entry has a valid group', () => {
    const validGroups = ['A', 'B', 'C', 'D', 'E'];
    for (const entry of PERMISSION_CATALOG) {
      expect(validGroups).toContain(entry.group);
    }
  });

  it('PERMISSION_GROUPS matches subsets', () => {
    expect(PERMISSION_GROUPS.A.length).toBe(12);
    expect(PERMISSION_GROUPS.B.length).toBe(20);
    expect(PERMISSION_GROUPS.C.length).toBe(11);
    expect(PERMISSION_GROUPS.D.length).toBe(8);
    expect(PERMISSION_GROUPS.E.length).toBe(16);
  });

  it('Group A resources all start with "master."', () => {
    for (const entry of PERMISSION_GROUPS.A) {
      expect(entry.resource).toMatch(/^master\./);
    }
  });

  it('Group E resources all start with "platform."', () => {
    for (const entry of PERMISSION_GROUPS.E) {
      expect(entry.resource).toMatch(/^platform\./);
    }
  });
});

// ────────────────────────────────────────────────────────────
// Default Roles integrity
// ────────────────────────────────────────────────────────────
describe('DEFAULT_APP_ROLES', () => {
  it('has 6 roles', () => {
    expect(DEFAULT_APP_ROLES.length).toBe(6);
  });

  it('includes all system role names', () => {
    const names = DEFAULT_APP_ROLES.map(r => r.name);
    expect(names).toEqual(['OWNER', 'ADMIN', 'DESIGNER', 'ACCOUNTANT', 'WAREHOUSE', 'SALES']);
  });

  it('OWNER has wildcard *:*', () => {
    const owner = getDefaultAppRole('OWNER');
    expect(owner).toBeDefined();
    expect(owner!.permissions).toContain('*:*');
  });

  it('every role has at least one permission', () => {
    for (const role of DEFAULT_APP_ROLES) {
      expect(role.permissions.length).toBeGreaterThan(0);
    }
  });

  it('non-OWNER roles only reference valid permissions or wildcards', () => {
    for (const role of DEFAULT_APP_ROLES) {
      if (role.name === 'OWNER') continue; // *:* is valid
      for (const perm of role.permissions) {
        if (perm.includes('*')) continue; // wildcards are expanded at runtime
        const parsed = parsePermission(perm);
        expect(parsed).not.toBeNull();
        expect(isValidPermission(parsed!.resource, parsed!.action)).toBe(true);
      }
    }
  });
});

describe('DEFAULT_INTERNAL_ROLES', () => {
  it('has 6 roles', () => {
    expect(DEFAULT_INTERNAL_ROLES.length).toBe(6);
  });

  it('includes all internal role names', () => {
    const names = DEFAULT_INTERNAL_ROLES.map(r => r.name);
    expect(names).toEqual([
      'SUPER_ADMIN', 'SUPPORT_LEAD', 'SUPPORT_AGENT',
      'DEVOPS', 'FINANCE_ADMIN', 'PRODUCT_MANAGER',
    ]);
  });

  it('SUPER_ADMIN has platform.*:* wildcard', () => {
    const superAdmin = getInternalRole('SUPER_ADMIN');
    expect(superAdmin).toBeDefined();
    expect(superAdmin!.permissions).toContain('platform.*:*');
  });

  it('internal roles only reference platform.* or wildcard permissions', () => {
    for (const role of DEFAULT_INTERNAL_ROLES) {
      for (const perm of role.permissions) {
        if (perm.includes('*')) continue;
        const parsed = parsePermission(perm);
        expect(parsed).not.toBeNull();
        expect(parsed!.resource).toMatch(/^platform\./);
      }
    }
  });
});

describe('getDefaultAppRole / getInternalRole', () => {
  it('getDefaultAppRole finds DESIGNER', () => {
    const role = getDefaultAppRole('DESIGNER');
    expect(role).toBeDefined();
    expect(role!.name).toBe('DESIGNER');
  });

  it('getDefaultAppRole returns undefined for unknown', () => {
    expect(getDefaultAppRole('NONEXISTENT' as any)).toBeUndefined();
  });

  it('getInternalRole finds DEVOPS', () => {
    const role = getInternalRole('DEVOPS');
    expect(role).toBeDefined();
    expect(role!.name).toBe('DEVOPS');
  });

  it('getInternalRole returns undefined for unknown', () => {
    expect(getInternalRole('NONEXISTENT' as any)).toBeUndefined();
  });
});
