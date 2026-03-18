'use client';
// ============================================================
// usePermission — React hook for permission checks
// ============================================================

import { useMemo, useCallback } from 'react';
import type { SessionContext, ModuleKey } from '../types';
import { hasPermission, hasPermissionString } from '../utils/permissionUtils';
import { useSessionContext } from './useCurrentUser';

/**
 * Hook: check if current user has a specific permission.
 * @param resource - e.g. "quote"
 * @param action - e.g. "approve"
 * @returns boolean
 */
export function usePermission(resource: string, action: string): boolean {
  const session = useSessionContext();
  return useMemo(
    () => hasPermission(session.permissions, resource, action),
    [session.permissions, resource, action],
  );
}

/**
 * Hook: check permission using "resource:action" string.
 */
export function usePermissionString(permissionString: string): boolean {
  const session = useSessionContext();
  return useMemo(
    () => hasPermissionString(session.permissions, permissionString),
    [session.permissions, permissionString],
  );
}

/**
 * Hook: check if current user has access to a module (Layer 1).
 */
export function useModuleAccess(module: ModuleKey): boolean {
  const session = useSessionContext();
  return useMemo(
    () => session.entitledModules.includes(module),
    [session.entitledModules, module],
  );
}

/**
 * Hook: returns a function to check any permission dynamically.
 * Useful when the resource/action aren't known at render time.
 */
export function usePermissionChecker(): (resource: string, action: string) => boolean {
  const session = useSessionContext();
  return useCallback(
    (resource: string, action: string) => hasPermission(session.permissions, resource, action),
    [session.permissions],
  );
}
