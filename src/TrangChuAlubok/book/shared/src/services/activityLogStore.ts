// ============================================================
// ActivityLogStore — Cross-cutting event log
//
// Gom ActivityEvents từ tất cả module stores.
// Mỗi khi module store thực hiện CRUD, gọi addEvent() vào đây.
//
// Nằm trong shared/ vì là hệ thống ngang — không phải module riêng.
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityEvent, ModuleKey, ActivityAction, ISOTimestamp } from '../types/time.types';

// ── Seed events (demo data from existing module operations) ──
const SEED_EVENTS: ActivityEvent[] = [
  {
    eventId: 'ev-001',
    module: 'BanHang',
    action: 'create',
    entityType: 'quote',
    entityId: 'q1',
    entityCode: 'BG-0001',
    description: 'Tạo báo giá BG-0001 — Dự án Sunrise',
    userId: 'u1',
    userName: 'Nguyễn Văn An',
    timestamp: '2026-03-01T08:00:00Z',
  },
  {
    eventId: 'ev-002',
    module: 'BanHang',
    action: 'approve',
    entityType: 'quote',
    entityId: 'q1',
    entityCode: 'BG-0001',
    description: 'Duyệt báo giá BG-0001',
    userId: 'u1',
    userName: 'Nguyễn Văn An',
    timestamp: '2026-03-05T10:30:00Z',
  },
  {
    eventId: 'ev-003',
    module: 'MuaHang',
    action: 'create',
    entityType: 'purchaseRequest',
    entityId: 'pr-001',
    entityCode: 'YCMH-0001',
    description: 'Tạo yêu cầu mua hàng YCMH-0001',
    userId: 'u2',
    userName: 'Trần Thanh Bình',
    timestamp: '2026-03-10T09:00:00Z',
  },
  {
    eventId: 'ev-004',
    module: 'TonKho',
    action: 'confirm',
    entityType: 'stockReceipt',
    entityId: 'rc-001',
    entityCode: 'PNK-0001',
    description: 'Xác nhận phiếu nhập kho PNK-0001',
    userId: 'u2',
    userName: 'Trần Thanh Bình',
    timestamp: '2026-03-16T10:00:00Z',
  },
  {
    eventId: 'ev-005',
    module: 'ThuChi',
    action: 'confirm',
    entityType: 'cashReceipt',
    entityId: 'cr-001',
    entityCode: 'PT-0001',
    description: 'Xác nhận phiếu thu PT-0001 — 50 tr',
    userId: 'u1',
    userName: 'Nguyễn Văn An',
    timestamp: '2026-03-17T08:30:00Z',
  },
  {
    eventId: 'ev-006',
    module: 'SanXuatThiCong',
    action: 'create',
    entityType: 'productionOrder',
    entityId: 'po-001',
    entityCode: 'LSX-0001',
    description: 'Tạo lệnh sản xuất LSX-0001 — Dự án Sunrise',
    userId: 'u3',
    userName: 'Lê Quốc Dũng',
    timestamp: '2026-03-17T13:00:00Z',
  },
  {
    eventId: 'ev-007',
    module: 'KeToan',
    action: 'approve',
    entityType: 'voucher',
    entityId: 'v-001',
    entityCode: 'CT-0001',
    description: 'Duyệt chứng từ CT-0001 — Thu tiền KH',
    userId: 'u1',
    userName: 'Nguyễn Văn An',
    timestamp: '2026-03-17T15:00:00Z',
  },
  {
    eventId: 'ev-008',
    module: 'BanHang',
    action: 'create',
    entityType: 'salesOrder',
    entityId: 'so-001',
    entityCode: 'DH-0001',
    description: 'Tạo đơn bán hàng DH-0001 — từ BG-0001',
    userId: 'u1',
    userName: 'Nguyễn Văn An',
    timestamp: '2026-03-18T08:00:00Z',
  },
  {
    eventId: 'ev-009',
    module: 'TonKho',
    action: 'create',
    entityType: 'stockIssue',
    entityId: 'si-001',
    entityCode: 'PXK-0001',
    description: 'Tạo phiếu xuất kho PXK-0001',
    userId: 'u2',
    userName: 'Trần Thanh Bình',
    timestamp: '2026-03-18T09:30:00Z',
  },
  {
    eventId: 'ev-010',
    module: 'SanXuatThiCong',
    action: 'complete',
    entityType: 'productionOrder',
    entityId: 'po-002',
    entityCode: 'LSX-0002',
    description: 'Hoàn thành sản xuất LSX-0002',
    userId: 'u3',
    userName: 'Lê Quốc Dũng',
    timestamp: '2026-03-18T14:00:00Z',
  },
];

// ── Store interface ──────────────────────────────────────────
interface ActivityLogState {
  events: ActivityEvent[];
  addEvent: (event: ActivityEvent) => void;
  addEvents: (events: ActivityEvent[]) => void;
  getByModule: (module: ModuleKey) => ActivityEvent[];
  getRecent: (count: number) => ActivityEvent[];
  resetAll: () => void;
}

let _nextId = SEED_EVENTS.length + 1;

/** Generate a unique event ID */
export function genEventId(): string {
  return `ev-${String(++_nextId).padStart(3, '0')}`;
}

/** Shorthand to build an ActivityEvent */
export function buildActivityEvent(
  module: ModuleKey,
  action: ActivityAction,
  entityType: string,
  entityId: string,
  entityCode: string,
  description: string,
  userId: string = 'u1',
  userName: string = 'Hệ thống',
): ActivityEvent {
  return {
    eventId: genEventId(),
    module,
    action,
    entityType,
    entityId,
    entityCode,
    description,
    userId,
    userName,
    timestamp: new Date().toISOString(),
  };
}

const INITIAL_STATE = { events: SEED_EVENTS };

export const useActivityLogStore = create<ActivityLogState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addEvent: (event) => set((s) => ({
        events: [event, ...s.events],
      })),

      addEvents: (newEvents) => set((s) => ({
        events: [...newEvents, ...s.events],
      })),

      getByModule: (module) =>
        get().events.filter(e => e.module === module),

      getRecent: (count) => {
        const sorted = [...get().events].sort(
          (a, b) => b.timestamp.localeCompare(a.timestamp),
        );
        return sorted.slice(0, count);
      },

      resetAll: () => set(INITIAL_STATE),
    }),
    { name: 'alubok-activity-log' },
  ),
);
