// ============================================================
// Tests: guards — Access control helpers
// ============================================================

import type { SessionContext } from '../types';
import {
  AccessDeniedError,
  requireOrgMember,
  requirePermission,
  requireModuleAccess,
  checkApprovalLimit,
  checkBusinessPolicy,
  getDataScopeFilter,
} from '../guards/requirePermission';

function makeSession(overrides: Partial<SessionContext> = {}): SessionContext {
  return {
    userId: 'user-1',
    email: 'test@example.com',
    displayName: 'Test User',
    orgId: 'org-1',
    orgName: 'Test Org',
    platformRole: 'member',
    entitledModules: ['cad', 'sales', 'inventory'],
    subscriptionPlan: 'professional',
    appRoles: [{ roleId: 'role-1', roleName: 'DESIGNER' }],
    permissions: new Set(['design.project:read', 'design.project:create', 'quote:read']),
    dataScopes: [{ resourceGroup: 'all', scopeLevel: 'org', scopeIds: [] }],
    approvalLimits: [
      { resource: 'quote', maxAmount: 50_000_000, maxLevel: 1, canDelegate: false },
    ],
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────────
// requireOrgMember
// ────────────────────────────────────────────────────────────
describe('requireOrgMember', () => {
  it('passes when orgId exists', () => {
    expect(() => requireOrgMember(makeSession())).not.toThrow();
  });

  it('throws AccessDeniedError when no orgId', () => {
    expect(() => requireOrgMember(makeSession({ orgId: '' }))).toThrow(AccessDeniedError);
  });

  it('error has code NO_ORG_MEMBERSHIP', () => {
    try {
      requireOrgMember(makeSession({ orgId: '' }));
    } catch (err) {
      expect(err).toBeInstanceOf(AccessDeniedError);
      expect((err as AccessDeniedError).code).toBe('NO_ORG_MEMBERSHIP');
    }
  });
});

// ────────────────────────────────────────────────────────────
// requirePermission
// ────────────────────────────────────────────────────────────
describe('requirePermission', () => {
  it('passes when user has permission', () => {
    expect(() => requirePermission(makeSession(), 'design.project', 'read')).not.toThrow();
  });

  it('throws when user lacks permission', () => {
    expect(() => requirePermission(makeSession(), 'quote', 'approve')).toThrow(AccessDeniedError);
  });

  it('throws with PERMISSION_DENIED code', () => {
    try {
      requirePermission(makeSession(), 'quote', 'approve');
    } catch (err) {
      expect((err as AccessDeniedError).code).toBe('PERMISSION_DENIED');
    }
  });

  it('also checks org membership first', () => {
    expect(() =>
      requirePermission(makeSession({ orgId: '' }), 'design.project', 'read'),
    ).toThrow(AccessDeniedError);
  });
});

// ────────────────────────────────────────────────────────────
// requireModuleAccess
// ────────────────────────────────────────────────────────────
describe('requireModuleAccess', () => {
  it('passes when module is entitled', () => {
    expect(() => requireModuleAccess(makeSession(), 'cad')).not.toThrow();
  });

  it('throws when module is not entitled', () => {
    expect(() => requireModuleAccess(makeSession(), 'accounting')).toThrow(AccessDeniedError);
  });

  it('error has MODULE_NOT_ENTITLED code', () => {
    try {
      requireModuleAccess(makeSession(), 'accounting');
    } catch (err) {
      expect((err as AccessDeniedError).code).toBe('MODULE_NOT_ENTITLED');
    }
  });
});

// ────────────────────────────────────────────────────────────
// checkApprovalLimit
// ────────────────────────────────────────────────────────────
describe('checkApprovalLimit', () => {
  it('allows when amount <= limit', () => {
    const result = checkApprovalLimit(makeSession(), 'quote', 30_000_000);
    expect(result).toEqual({ allowed: true, needsEscalation: false });
  });

  it('allows when maxAmount is null (unlimited)', () => {
    const session = makeSession({
      approvalLimits: [{ resource: 'quote', maxAmount: null, maxLevel: 1, canDelegate: false }],
    });
    const result = checkApprovalLimit(session, 'quote', 999_999_999);
    expect(result).toEqual({ allowed: true, needsEscalation: false });
  });

  it('escalates when amount > limit', () => {
    const result = checkApprovalLimit(makeSession(), 'quote', 100_000_000);
    expect(result).toEqual({ allowed: false, needsEscalation: true, nextLevel: 2 });
  });

  it('escalates when no limit for resource', () => {
    const result = checkApprovalLimit(makeSession(), 'purchase.order', 1_000);
    expect(result).toEqual({ allowed: false, needsEscalation: true });
  });
});

// ────────────────────────────────────────────────────────────
// checkBusinessPolicy
// ────────────────────────────────────────────────────────────
describe('checkBusinessPolicy', () => {
  it('allows normal operations', () => {
    const result = checkBusinessPolicy(makeSession(), 'quote', 'read', {});
    expect(result).toEqual({ allowed: true });
  });

  it('blocks editing draft by non-creator', () => {
    const result = checkBusinessPolicy(makeSession(), 'quote', 'update', {
      state: 'draft',
      createdBy: 'other-user',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('người tạo');
  });

  it('allows editing draft by creator', () => {
    const result = checkBusinessPolicy(makeSession(), 'quote', 'update', {
      state: 'draft',
      createdBy: 'user-1',
    });
    expect(result.allowed).toBe(true);
  });

  it('blocks editing in locked period', () => {
    const result = checkBusinessPolicy(makeSession(), 'accounting.voucher', 'update', {
      periodLocked: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('khóa');
  });

  it('blocks editing approved/closed records', () => {
    const result = checkBusinessPolicy(makeSession(), 'quote', 'update', {
      state: 'approved',
    });
    expect(result.allowed).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// getDataScopeFilter
// ────────────────────────────────────────────────────────────
describe('getDataScopeFilter', () => {
  it('returns scope for matching resourceGroup', () => {
    const result = getDataScopeFilter(makeSession(), 'sales');
    expect(result).toEqual({ scopeLevel: 'org', scopeIds: [] });
  });

  it('returns scope for "all" resourceGroup', () => {
    const result = getDataScopeFilter(makeSession(), 'inventory');
    expect(result).toEqual({ scopeLevel: 'org', scopeIds: [] });
  });

  it('returns null when no matching scope', () => {
    const session = makeSession({ dataScopes: [] });
    expect(getDataScopeFilter(session, 'sales')).toBeNull();
  });
});
