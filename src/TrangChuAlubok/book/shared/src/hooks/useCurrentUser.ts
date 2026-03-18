'use client';
// ============================================================
// useCurrentUser — React context + hook for session
// ============================================================

import { createContext, useContext } from 'react';
import type { SessionContext } from '../types';

/** Empty session (unauthenticated state) */
const EMPTY_SESSION: SessionContext = {
  userId: '',
  email: '',
  displayName: '',
  orgId: '',
  orgName: '',
  platformRole: 'member',
  entitledModules: [],
  subscriptionPlan: 'free',
  appRoles: [],
  permissions: new Set(),
  dataScopes: [],
  approvalLimits: [],
};

/**
 * React context providing SessionContext.
 * Must be wrapped with SessionProvider at app root.
 */
export const SessionContextReact = createContext<SessionContext>(EMPTY_SESSION);

/**
 * Hook: get the current SessionContext.
 */
export function useSessionContext(): SessionContext {
  return useContext(SessionContextReact);
}

/**
 * Hook: get current user identity.
 */
export function useCurrentUser() {
  const session = useSessionContext();
  return {
    userId: session.userId,
    email: session.email,
    displayName: session.displayName,
    isAuthenticated: !!session.userId,
  };
}

/**
 * Hook: get current org context.
 */
export function useCurrentOrg() {
  const session = useSessionContext();
  return {
    orgId: session.orgId,
    orgName: session.orgName,
    platformRole: session.platformRole,
    subscriptionPlan: session.subscriptionPlan,
    entitledModules: session.entitledModules,
    hasOrg: !!session.orgId,
  };
}
