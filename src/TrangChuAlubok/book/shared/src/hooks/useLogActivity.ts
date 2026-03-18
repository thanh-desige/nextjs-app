// ============================================================
// useLogActivity — Hook to emit ActivityEvent into shared log
//
// Usage in any module store action:
//   const logActivity = useLogActivity();
//   logActivity('BanHang', 'create', 'quote', 'q3', 'BG-0003', 'Tạo báo giá BG-0003');
//
// Or use directly:
//   logActivityDirect('BanHang', 'create', ...)
// ============================================================

import { useCallback } from 'react';
import { useActivityLogStore, buildActivityEvent } from '../services/activityLogStore';
import type { ModuleKey, ActivityAction } from '../types/time.types';

/**
 * React hook — use within components or other hooks
 */
export function useLogActivity() {
  const addEvent = useActivityLogStore((s) => s.addEvent);

  return useCallback(
    (
      module: ModuleKey,
      action: ActivityAction,
      entityType: string,
      entityId: string,
      entityCode: string,
      description: string,
      userId?: string,
      userName?: string,
    ) => {
      addEvent(
        buildActivityEvent(module, action, entityType, entityId, entityCode, description, userId, userName),
      );
    },
    [addEvent],
  );
}

/**
 * Direct function — use inside Zustand store actions (no hooks allowed)
 * Calls getState() on the activity log store
 */
export function logActivityDirect(
  module: ModuleKey,
  action: ActivityAction,
  entityType: string,
  entityId: string,
  entityCode: string,
  description: string,
  userId: string = 'u1',
  userName: string = 'Hệ thống',
): void {
  const event = buildActivityEvent(module, action, entityType, entityId, entityCode, description, userId, userName);
  useActivityLogStore.getState().addEvent(event);
}
