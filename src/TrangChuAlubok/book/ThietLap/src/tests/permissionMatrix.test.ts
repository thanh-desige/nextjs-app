// ============================================================
// PermissionMatrix logic tests
// Test permission expansion: wildcard, resource-level, specific
// ============================================================

import { PERMISSION_CATALOG, PERMISSION_GROUPS } from '../../../shared/src/constants/permissionCatalog';

// Replicate the expansion logic from PermissionMatrix.tsx
function expandPermissions(permissions: string[]): Set<string> {
  const set = new Set<string>();
  for (const perm of permissions) {
    if (perm === '*:*') {
      for (const entry of PERMISSION_CATALOG) {
        for (const action of entry.actions) {
          set.add(`${entry.resource}:${action}`);
        }
      }
    } else if (perm.endsWith(':*')) {
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
}

describe('Permission expansion logic', () => {
  it('*:* expands to all permissions', () => {
    const expanded = expandPermissions(['*:*']);
    const totalActions = PERMISSION_CATALOG.reduce((sum, e) => sum + e.actions.length, 0);
    expect(expanded.size).toBe(totalActions);
  });

  it('master.customer:* expands to all customer actions', () => {
    const expanded = expandPermissions(['master.customer:*']);
    const customerEntry = PERMISSION_CATALOG.find(e => e.resource === 'master.customer')!;
    expect(expanded.size).toBe(customerEntry.actions.length);
    for (const action of customerEntry.actions) {
      expect(expanded.has(`master.customer:${action}`)).toBe(true);
    }
  });

  it('design:* expands to design resource and all design.* sub-resources', () => {
    const expanded = expandPermissions(['design:*']);
    const designEntries = PERMISSION_CATALOG.filter(e => e.resource === 'design' || e.resource.startsWith('design.'));
    const totalActions = designEntries.reduce((sum, e) => sum + e.actions.length, 0);
    expect(expanded.size).toBe(totalActions);
  });

  it('specific permission stays as-is', () => {
    const expanded = expandPermissions(['quote:read', 'quote:create']);
    expect(expanded.size).toBe(2);
    expect(expanded.has('quote:read')).toBe(true);
    expect(expanded.has('quote:create')).toBe(true);
  });

  it('mixed wildcards and specifics', () => {
    const expanded = expandPermissions(['master.customer:*', 'quote:read', 'design.project:read']);
    const customerEntry = PERMISSION_CATALOG.find(e => e.resource === 'master.customer')!;
    expect(expanded.size).toBe(customerEntry.actions.length + 2);
    expect(expanded.has('quote:read')).toBe(true);
    expect(expanded.has('design.project:read')).toBe(true);
  });

  it('empty permissions produces empty set', () => {
    const expanded = expandPermissions([]);
    expect(expanded.size).toBe(0);
  });

  describe('PERMISSION_CATALOG structure', () => {
    it('has 67 resources total', () => {
      expect(PERMISSION_CATALOG.length).toBe(67);
    });

    it('Group A has 12 resources', () => {
      expect(PERMISSION_GROUPS.A.length).toBe(12);
    });

    it('Group B has 20 resources', () => {
      expect(PERMISSION_GROUPS.B.length).toBe(20);
    });

    it('Group C has 11 resources', () => {
      expect(PERMISSION_GROUPS.C.length).toBe(11);
    });

    it('Group D has 8 resources', () => {
      expect(PERMISSION_GROUPS.D.length).toBe(8);
    });

    it('Group E has 16 resources', () => {
      expect(PERMISSION_GROUPS.E.length).toBe(16);
    });

    it('every resource has at least one action', () => {
      for (const entry of PERMISSION_CATALOG) {
        expect(entry.actions.length).toBeGreaterThan(0);
      }
    });

    it('every resource has a group', () => {
      for (const entry of PERMISSION_CATALOG) {
        expect(['A', 'B', 'C', 'D', 'E']).toContain(entry.group);
      }
    });
  });
});
