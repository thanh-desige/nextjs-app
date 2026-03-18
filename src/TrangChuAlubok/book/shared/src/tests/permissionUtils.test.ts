// ============================================================
// Tests: permissionUtils — Core permission logic
// ============================================================

import {
  parsePermission,
  formatPermission,
  matchPermission,
  hasPermission,
  hasPermissionString,
  expandRolePermissions,
  expandAppRole,
  expandInternalRole,
  getResourceActions,
  isValidPermission,
} from '../utils/permissionUtils';

// ────────────────────────────────────────────────────────────
// parsePermission
// ────────────────────────────────────────────────────────────
describe('parsePermission', () => {
  it('parses "quote:approve" correctly', () => {
    expect(parsePermission('quote:approve')).toEqual({
      resource: 'quote',
      action: 'approve',
    });
  });

  it('parses dotted resource "design.project:read"', () => {
    expect(parsePermission('design.project:read')).toEqual({
      resource: 'design.project',
      action: 'read',
    });
  });

  it('parses wildcard action "quote:*"', () => {
    expect(parsePermission('quote:*')).toEqual({
      resource: 'quote',
      action: '*',
    });
  });

  it('parses full wildcard "*:*"', () => {
    expect(parsePermission('*:*')).toEqual({
      resource: '*',
      action: '*',
    });
  });

  it('returns null for empty string', () => {
    expect(parsePermission('')).toBeNull();
  });

  it('returns null for string without colon', () => {
    expect(parsePermission('quoteapprove')).toBeNull();
  });

  it('returns null for ":action" (no resource)', () => {
    expect(parsePermission(':read')).toBeNull();
  });

  it('returns null for "resource:" (no action)', () => {
    expect(parsePermission('quote:')).toBeNull();
  });
});

// ────────────────────────────────────────────────────────────
// formatPermission
// ────────────────────────────────────────────────────────────
describe('formatPermission', () => {
  it('formats resource + action', () => {
    expect(formatPermission('quote', 'approve')).toBe('quote:approve');
  });

  it('formats dotted resource', () => {
    expect(formatPermission('design.project', 'read')).toBe('design.project:read');
  });
});

// ────────────────────────────────────────────────────────────
// matchPermission
// ────────────────────────────────────────────────────────────
describe('matchPermission', () => {
  it('exact match', () => {
    expect(matchPermission('quote:approve', 'quote:approve')).toBe(true);
  });

  it('exact mismatch (different action)', () => {
    expect(matchPermission('quote:read', 'quote:approve')).toBe(false);
  });

  it('exact mismatch (different resource)', () => {
    expect(matchPermission('sales.order:read', 'quote:read')).toBe(false);
  });

  it('action wildcard "quote:*" matches any action', () => {
    expect(matchPermission('quote:*', 'quote:approve')).toBe(true);
    expect(matchPermission('quote:*', 'quote:read')).toBe(true);
    expect(matchPermission('quote:*', 'quote:delete')).toBe(true);
  });

  it('action wildcard does not match different resource', () => {
    expect(matchPermission('quote:*', 'sales.order:read')).toBe(false);
  });

  it('full wildcard "*:*" matches everything', () => {
    expect(matchPermission('*:*', 'quote:approve')).toBe(true);
    expect(matchPermission('*:*', 'design.project:read')).toBe(true);
    expect(matchPermission('*:*', 'platform.tenant:manage')).toBe(true);
  });

  it('resource prefix wildcard "platform.*:*" matches platform resources', () => {
    expect(matchPermission('platform.*:*', 'platform.tenant:read')).toBe(true);
    expect(matchPermission('platform.*:*', 'platform.backup:restore')).toBe(true);
  });

  it('resource prefix wildcard does not match non-matching prefix', () => {
    expect(matchPermission('platform.*:*', 'design.project:read')).toBe(false);
    expect(matchPermission('platform.*:*', 'quote:read')).toBe(false);
  });

  it('resource prefix wildcard with specific action', () => {
    expect(matchPermission('platform.*:read', 'platform.tenant:read')).toBe(true);
    expect(matchPermission('platform.*:read', 'platform.tenant:manage')).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// hasPermission
// ────────────────────────────────────────────────────────────
describe('hasPermission', () => {
  const perms = new Set([
    'quote:read',
    'quote:create',
    'design.project:*',
    'master.customer:read',
  ]);

  it('exact match found', () => {
    expect(hasPermission(perms, 'quote', 'read')).toBe(true);
    expect(hasPermission(perms, 'master.customer', 'read')).toBe(true);
  });

  it('exact match not found', () => {
    expect(hasPermission(perms, 'quote', 'delete')).toBe(false);
    expect(hasPermission(perms, 'sales.order', 'read')).toBe(false);
  });

  it('wildcard action allows any action', () => {
    expect(hasPermission(perms, 'design.project', 'read')).toBe(true);
    expect(hasPermission(perms, 'design.project', 'update')).toBe(true);
    expect(hasPermission(perms, 'design.project', 'manage')).toBe(true);
  });

  it('accepts array of permissions', () => {
    const permArray = ['quote:read', 'quote:create'];
    expect(hasPermission(permArray, 'quote', 'read')).toBe(true);
    expect(hasPermission(permArray, 'quote', 'delete')).toBe(false);
  });

  it('OWNER with *:* has everything', () => {
    const ownerPerms = new Set(['*:*']);
    expect(hasPermission(ownerPerms, 'quote', 'approve')).toBe(true);
    expect(hasPermission(ownerPerms, 'platform.tenant', 'manage')).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────
// hasPermissionString
// ────────────────────────────────────────────────────────────
describe('hasPermissionString', () => {
  const perms = new Set(['quote:read', 'design.project:*']);

  it('checks "resource:action" string', () => {
    expect(hasPermissionString(perms, 'quote:read')).toBe(true);
    expect(hasPermissionString(perms, 'design.project:export')).toBe(true);
    expect(hasPermissionString(perms, 'sales.order:read')).toBe(false);
  });

  it('returns false for invalid string', () => {
    expect(hasPermissionString(perms, 'invalid')).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// expandRolePermissions
// ────────────────────────────────────────────────────────────
describe('expandRolePermissions', () => {
  it('returns concrete permissions unchanged', () => {
    const perms = ['quote:read', 'quote:create'];
    const expanded = expandRolePermissions(perms);
    expect(expanded).toContain('quote:read');
    expect(expanded).toContain('quote:create');
    expect(expanded.length).toBe(2);
  });

  it('expands "quote:*" to all quote actions from catalog', () => {
    const expanded = expandRolePermissions(['quote:*']);
    expect(expanded).toContain('quote:read');
    expect(expanded).toContain('quote:create');
    expect(expanded).toContain('quote:approve');
    expect(expanded).toContain('quote:reject');
    expect(expanded).toContain('quote:close');
    expect(expanded).toContain('quote:cancel');
    expect(expanded.length).toBe(11); // quote has 11 actions
  });

  it('expands "*:*" to all permissions in catalog', () => {
    const expanded = expandRolePermissions(['*:*']);
    // Should include permissions from all groups
    expect(expanded).toContain('master.customer:read');
    expect(expanded).toContain('quote:approve');
    expect(expanded).toContain('report.sales:read');
    expect(expanded).toContain('setting.user:manage');
    expect(expanded).toContain('platform.tenant:manage');
    expect(expanded.length).toBeGreaterThan(100); // many concrete permissions
  });

  it('deduplicates when multiple patterns match same permission', () => {
    const expanded = expandRolePermissions(['quote:read', 'quote:*']);
    const readCount = expanded.filter(p => p === 'quote:read').length;
    expect(readCount).toBe(1);
  });
});

// ────────────────────────────────────────────────────────────
// expandAppRole / expandInternalRole
// ────────────────────────────────────────────────────────────
describe('expandAppRole', () => {
  it('DESIGNER has design.project permissions', () => {
    const perms = expandAppRole('DESIGNER');
    expect(perms).toContain('design.project:read');
    expect(perms).toContain('design.project:create');
    expect(perms).toContain('bom.report:read');
    expect(perms).not.toContain('quote:delete');
    expect(perms).not.toContain('sales.order:create');
  });

  it('OWNER has all permissions', () => {
    const perms = expandAppRole('OWNER');
    expect(perms).toContain('quote:approve');
    expect(perms).toContain('design.project:manage');
    expect(perms).toContain('master.customer:delete');
    expect(perms.length).toBeGreaterThan(100);
  });

  it('WAREHOUSE has inventory permissions', () => {
    const perms = expandAppRole('WAREHOUSE');
    expect(perms).toContain('inventory.stock_receipt:read');
    expect(perms).toContain('inventory.balance:read');
    expect(perms).not.toContain('quote:approve');
  });

  it('returns empty for unknown role', () => {
    expect(expandAppRole('NONEXISTENT')).toEqual([]);
  });
});

describe('expandInternalRole', () => {
  it('SUPER_ADMIN has all platform permissions', () => {
    const perms = expandInternalRole('SUPER_ADMIN');
    expect(perms).toContain('platform.tenant:read');
    expect(perms).toContain('platform.backup:restore');
    expect(perms).toContain('platform.config:manage');
    // Should NOT include non-platform resources
    expect(perms).not.toContain('quote:approve');
  });

  it('DEVOPS has health + job + backup', () => {
    const perms = expandInternalRole('DEVOPS');
    expect(perms).toContain('platform.health:read');
    expect(perms).toContain('platform.job:manage');
    expect(perms).toContain('platform.backup:restore');
    expect(perms).not.toContain('platform.tenant:manage');
  });

  it('returns empty for unknown role', () => {
    expect(expandInternalRole('NONEXISTENT')).toEqual([]);
  });
});

// ────────────────────────────────────────────────────────────
// getResourceActions / isValidPermission
// ────────────────────────────────────────────────────────────
describe('getResourceActions', () => {
  it('returns actions for "quote"', () => {
    const actions = getResourceActions('quote');
    expect(actions).toContain('read');
    expect(actions).toContain('approve');
    expect(actions).toContain('reject');
    expect(actions).toContain('close');
    expect(actions.length).toBe(11);
  });

  it('returns empty for unknown resource', () => {
    const actions = getResourceActions('nonexistent' as any);
    expect(actions).toEqual([]);
  });
});

describe('isValidPermission', () => {
  it('valid: quote:approve', () => {
    expect(isValidPermission('quote', 'approve')).toBe(true);
  });

  it('invalid: quote:manage (not in catalog)', () => {
    expect(isValidPermission('quote', 'manage')).toBe(false);
  });

  it('invalid: nonexistent resource', () => {
    expect(isValidPermission('nonexistent', 'read')).toBe(false);
  });
});
