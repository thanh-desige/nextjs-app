/**
 * useProjectSync — Syncs doorCount → soLuongBo & documentVersion → designRevision
 *
 * Phase 2 Quy trình: Tự động cập nhật ProjectInfo khi canvas thay đổi
 *
 * 1. Khi số cửa thay đổi → cập nhật soLuongBo
 * 2. Khi document modified (entity add/remove/modify) → designRevision++
 *    (Chỉ tăng revision khi project đang mở và thực sự có entity thay đổi)
 */

'use client';

import { useEffect, useRef } from 'react';
import { useDoorStore, selectDoorCount } from '../store/doorStore';
import { useEngineStore } from '../store/engineStore';
import { useProjectStore } from '../store/projectStore';

export function useProjectSync(): void {
  const doorCount = useDoorStore(selectDoorCount);
  const documentVersion = useEngineStore((s) => s.documentVersion);
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateProject = useProjectStore((s) => s.updateProject);

  // Track previous values to only fire on real changes
  const prevDoorCountRef = useRef<number>(doorCount);
  const prevDocVersionRef = useRef<number>(documentVersion);
  // Track if we've done initial sync (skip first documentVersion to avoid false increment)
  const initializedRef = useRef(false);

  // Sync door count → soLuongBo
  useEffect(() => {
    if (!currentProject) return;
    if (doorCount === prevDoorCountRef.current) return;
    prevDoorCountRef.current = doorCount;
    if (currentProject.soLuongBo !== doorCount) {
      updateProject({ soLuongBo: doorCount });
    }
  }, [doorCount, currentProject, updateProject]);

  // Sync documentVersion → designRevision++
  useEffect(() => {
    if (!currentProject) return;

    // On first mount, just capture the current version without incrementing
    if (!initializedRef.current) {
      initializedRef.current = true;
      prevDocVersionRef.current = documentVersion;
      return;
    }

    if (documentVersion === prevDocVersionRef.current) return;
    prevDocVersionRef.current = documentVersion;

    // designRevision only increases (never decreases)
    updateProject({ designRevision: (currentProject.designRevision ?? 0) + 1 });
  }, [documentVersion, currentProject, updateProject]);

  // Reset initialized flag when project changes
  useEffect(() => {
    initializedRef.current = false;
  }, [currentProject?.id]);
}
