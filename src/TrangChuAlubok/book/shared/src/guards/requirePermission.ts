// ============================================================
// Permission Guards — Server-side access control helpers
// ============================================================

import type { SessionContext, ModuleKey, PolicyResult } from '../types';
import { hasPermission } from '../utils/permissionUtils';

/** Error thrown when access is denied */
export class AccessDeniedError extends Error {
  public readonly code: string;
  constructor(message: string, code: string = 'ACCESS_DENIED') {
    super(message);
    this.name = 'AccessDeniedError';
    this.code = code;
  }
}

/**
 * Guard: require user to be a member of an org.
 * Throws AccessDeniedError if session has no orgId.
 */
export function requireOrgMember(session: SessionContext): void {
  if (!session.orgId) {
    throw new AccessDeniedError(
      'Bạn không thuộc tổ chức nào',
      'NO_ORG_MEMBERSHIP',
    );
  }
}

/**
 * Guard: require a specific permission.
 * Throws AccessDeniedError if user lacks the permission.
 */
export function requirePermission(
  session: SessionContext,
  resource: string,
  action: string,
): void {
  requireOrgMember(session);
  if (!hasPermission(session.permissions, resource, action)) {
    throw new AccessDeniedError(
      `Bạn không có quyền ${action} trên ${resource}`,
      'PERMISSION_DENIED',
    );
  }
}

/**
 * Guard: require access to a module (Layer 1 entitlement check).
 */
export function requireModuleAccess(
  session: SessionContext,
  module: ModuleKey,
): void {
  requireOrgMember(session);
  if (!session.entitledModules.includes(module)) {
    throw new AccessDeniedError(
      `Gói dịch vụ của bạn không bao gồm module "${module}"`,
      'MODULE_NOT_ENTITLED',
    );
  }
}

/**
 * Guard: require approval capability for a resource + amount.
 * Returns { allowed, needsEscalation, nextLevel }.
 */
export function checkApprovalLimit(
  session: SessionContext,
  resource: string,
  amount: number,
): { allowed: boolean; needsEscalation: boolean; nextLevel?: number } {
  const limit = session.approvalLimits.find(l => l.resource === resource);
  if (!limit) return { allowed: false, needsEscalation: true };
  if (limit.maxAmount === null || amount <= limit.maxAmount) {
    return { allowed: true, needsEscalation: false };
  }
  return { allowed: false, needsEscalation: true, nextLevel: limit.maxLevel + 1 };
}

/**
 * Guard: check business policy (ownership, workflow state, period lock).
 */
export function checkBusinessPolicy(
  session: SessionContext,
  resource: string,
  action: string,
  record: { createdBy?: string; state?: string; periodLocked?: boolean },
): PolicyResult {
  // Ownership: only creator can edit draft records
  if (action === 'update' && record.state === 'draft' && record.createdBy && record.createdBy !== session.userId) {
    return { allowed: false, reason: 'Chỉ người tạo mới được sửa bản nháp' };
  }

  // Period lock: cannot modify records in locked period
  if (record.periodLocked && ['update', 'delete', 'cancel'].includes(action)) {
    return { allowed: false, reason: 'Kỳ kế toán đã khóa — không thể sửa/xóa' };
  }

  // Workflow state: cannot edit approved/closed records
  if (['approved', 'closed', 'cancelled'].includes(record.state ?? '') && action === 'update') {
    return { allowed: false, reason: `Không thể sửa bản ghi ở trạng thái "${record.state}"` };
  }

  return { allowed: true };
}

/**
 * Apply data scope filter to determine visible data.
 */
export function getDataScopeFilter(
  session: SessionContext,
  resourceGroup: string,
): { scopeLevel: string; scopeIds: string[] } | null {
  const scope = session.dataScopes.find(
    s => s.resourceGroup === resourceGroup || s.resourceGroup === 'all',
  );
  if (!scope) return null;
  return { scopeLevel: scope.scopeLevel, scopeIds: scope.scopeIds };
}
