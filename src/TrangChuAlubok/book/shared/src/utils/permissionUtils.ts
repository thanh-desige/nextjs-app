// ============================================================
// Permission Utilities — Core permission checking functions
// ============================================================

import type { PermissionResource, PermissionAction } from '../types';
import { PERMISSION_CATALOG } from '../constants/permissionCatalog';
import type { DefaultRoleDefinition, InternalRoleDefinition } from '../constants/defaultRoles';
import { DEFAULT_APP_ROLES, DEFAULT_INTERNAL_ROLES } from '../constants/defaultRoles';

/** Parse "resource:action" string into its parts */
export function parsePermission(perm: string): { resource: string; action: string } | null {
  const idx = perm.lastIndexOf(':');
  if (idx <= 0 || idx === perm.length - 1) return null;
  return {
    resource: perm.slice(0, idx),
    action: perm.slice(idx + 1),
  };
}

/** Format resource + action into "resource:action" string */
export function formatPermission(resource: string, action: string): string {
  return `${resource}:${action}`;
}

/**
 * Check if a permission string matches a pattern (supports wildcards).
 * - Exact: "quote:read" matches "quote:read"
 * - Action wildcard: "quote:*" matches "quote:read", "quote:approve"
 * - Full wildcard: "*:*" matches everything
 * - Resource prefix wildcard: "platform.*:*" matches "platform.tenant:read"
 */
export function matchPermission(pattern: string, target: string): boolean {
  if (pattern === '*:*') return true;

  const patParsed = parsePermission(pattern);
  const tgtParsed = parsePermission(target);
  if (!patParsed || !tgtParsed) return false;

  const resourceMatch =
    patParsed.resource === tgtParsed.resource ||
    (patParsed.resource.endsWith('.*') &&
      tgtParsed.resource.startsWith(patParsed.resource.slice(0, -1)));

  const actionMatch =
    patParsed.action === '*' || patParsed.action === tgtParsed.action;

  return resourceMatch && actionMatch;
}

/**
 * Check if a user's permission set contains a required permission.
 * Supports wildcards in the user's permission set.
 */
export function hasPermission(
  userPermissions: ReadonlySet<string> | readonly string[],
  resource: string,
  action: string,
): boolean {
  const target = formatPermission(resource, action);
  const perms = userPermissions instanceof Set
    ? userPermissions
    : new Set(userPermissions);

  // Fast path: exact match
  if (perms.has(target)) return true;

  // Slow path: check wildcard patterns
  for (const perm of perms) {
    if (perm.includes('*') && matchPermission(perm, target)) return true;
  }
  return false;
}

/**
 * Check permission using "resource:action" string format.
 * Convenience wrapper around hasPermission.
 */
export function hasPermissionString(
  userPermissions: ReadonlySet<string> | readonly string[],
  permissionString: string,
): boolean {
  const parsed = parsePermission(permissionString);
  if (!parsed) return false;
  return hasPermission(userPermissions, parsed.resource, parsed.action);
}

/**
 * Expand a role into its full list of concrete permissions.
 * Resolves wildcards (e.g., "quote:*" → all quote actions from catalog).
 */
export function expandRolePermissions(
  rolePermissions: readonly string[],
): string[] {
  const result: string[] = [];

  for (const perm of rolePermissions) {
    if (!perm.includes('*')) {
      result.push(perm);
      continue;
    }

    // Wildcard: expand from catalog
    for (const entry of PERMISSION_CATALOG) {
      for (const action of entry.actions) {
        const concrete = formatPermission(entry.resource, action);
        if (matchPermission(perm, concrete)) {
          result.push(concrete);
        }
      }
    }
  }

  return [...new Set(result)]; // deduplicate
}

/**
 * Expand a default app role into its concrete permission strings.
 */
export function expandAppRole(roleName: string): string[] {
  const role = DEFAULT_APP_ROLES.find(r => r.name === roleName) as DefaultRoleDefinition | undefined;
  if (!role) return [];
  return expandRolePermissions(role.permissions);
}

/**
 * Expand an internal admin role into its concrete permission strings.
 */
export function expandInternalRole(roleName: string): string[] {
  const role = DEFAULT_INTERNAL_ROLES.find(r => r.name === roleName) as InternalRoleDefinition | undefined;
  if (!role) return [];
  return expandRolePermissions(role.permissions);
}

/**
 * Get all valid actions for a given resource from the catalog.
 */
export function getResourceActions(resource: PermissionResource): readonly PermissionAction[] {
  const entry = PERMISSION_CATALOG.find(e => e.resource === resource);
  return entry?.actions ?? [];
}

/**
 * Check if a given resource:action combination is valid in the catalog.
 */
export function isValidPermission(resource: string, action: string): boolean {
  const entry = PERMISSION_CATALOG.find(e => e.resource === resource);
  if (!entry) return false;
  return (entry.actions as readonly string[]).includes(action);
}
