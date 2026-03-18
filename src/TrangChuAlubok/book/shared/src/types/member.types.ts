// ============================================================
// Member Types — DB tables: org_member, user_entitlement, member_role
// ============================================================

import type { ModuleKey } from './session.types';

export type PlatformRole = 'owner' | 'admin' | 'member';
export type MemberStatus = 'active' | 'invited' | 'suspended';

/** DB table: org_member (user ↔ org relationship) */
export interface OrgMember {
  memberId: string;
  userId: string;
  orgId: string;
  platformRole: PlatformRole;
  status: MemberStatus;
  joinedAt: string;
  invitedBy: string | null;
}

/** DB table: user_entitlement (module access per member) */
export interface UserEntitlement {
  entitlementId: string;
  memberId: string;
  moduleKey: ModuleKey;
  granted: boolean;
  grantedBy: string;
}

/** DB table: member_role (member ↔ role assignment) */
export interface MemberRole {
  memberId: string;
  roleId: string;
  assignedAt: string;
  assignedBy: string;
}
