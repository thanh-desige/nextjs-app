// ============================================================
// Audit Types — DB tables: audit_log, security_log,
//   approval_config, approval_delegation
// ============================================================

/** DB table: audit_log (business action log) */
export interface AuditLog {
  logId: string;
  orgId: string;
  memberId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

/** DB table: security_log (auth & authz events) */
export type SecurityEventType =
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'permission_denied'
  | 'policy_blocked';

export interface SecurityLog {
  logId: string;
  userId: string;
  eventType: SecurityEventType;
  detail: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

/** DB table: approval_config */
export type ApproverType = 'role' | 'user' | 'hierarchy';

export interface ApprovalConfig {
  configId: string;
  orgId: string;
  resource: string;
  level: 1 | 2 | 3;
  conditionExpr: string;
  approverType: ApproverType;
  approverValue: string;
  enabled: boolean;
}

/** DB table: approval_delegation */
export type DelegationStatus = 'active' | 'expired' | 'revoked';

export interface ApprovalDelegation {
  delegationId: string;
  fromMemberId: string;
  toMemberId: string;
  resource: string;
  maxAmount: number | null;
  startDate: string;
  endDate: string;
  reason: string;
  status: DelegationStatus;
}
