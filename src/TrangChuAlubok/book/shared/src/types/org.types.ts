// ============================================================
// Organization Types — DB tables: org, org_branch, platform_policy
// ============================================================

export type OrgStatus = 'active' | 'suspended' | 'trial' | 'deleted';
export type BranchStatus = 'active' | 'inactive';

/** DB table: org (tenant) */
export interface Org {
  orgId: string;
  orgName: string;
  orgSlug: string;
  subscriptionPlan: string;
  subscriptionExpiry: string | null;
  maxUsers: number;
  maxBranches: number;
  enabledModules: string[];
  status: OrgStatus;
  createdAt: string;
}

/** DB table: org_branch */
export interface OrgBranch {
  branchId: string;
  orgId: string;
  branchName: string;
  address: string;
  status: BranchStatus;
}

/** DB table: platform_policy (IP/Time/Device/Rate-limit rules per org) */
export type PolicyType = 'ip' | 'time' | 'device' | 'rate_limit';

export interface PlatformPolicy {
  policyId: string;
  orgId: string;
  policyType: PolicyType;
  config: Record<string, unknown>;
  enabled: boolean;
  updatedBy: string;
}
