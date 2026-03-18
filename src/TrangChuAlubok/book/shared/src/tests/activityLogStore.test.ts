// ============================================================
// Tests: activityLogStore + useLogActivity
// ============================================================

import {
  useActivityLogStore,
  genEventId,
  buildActivityEvent,
} from '../services/activityLogStore';
import { logActivityDirect } from '../hooks/useLogActivity';
import type { ActivityEvent } from '../types/time.types';

// Reset store before each test
beforeEach(() => {
  useActivityLogStore.getState().resetAll();
});

// ── Seed data ───────────────────────────────────────────────

describe('seed events', () => {
  it('has 10 seed events', () => {
    const events = useActivityLogStore.getState().events;
    expect(events).toHaveLength(10);
  });

  it('seed events have required fields', () => {
    const events = useActivityLogStore.getState().events;
    for (const e of events) {
      expect(e.eventId).toBeDefined();
      expect(e.module).toBeDefined();
      expect(e.action).toBeDefined();
      expect(e.entityType).toBeDefined();
      expect(e.entityId).toBeDefined();
      expect(e.entityCode).toBeDefined();
      expect(e.timestamp).toBeDefined();
    }
  });

  it('seed events cover multiple modules', () => {
    const events = useActivityLogStore.getState().events;
    const modules = new Set(events.map(e => e.module));
    expect(modules.size).toBeGreaterThanOrEqual(5);
  });
});

// ── genEventId ──────────────────────────────────────────────

describe('genEventId', () => {
  it('generates unique IDs', () => {
    const id1 = genEventId();
    const id2 = genEventId();
    expect(id1).not.toBe(id2);
  });

  it('returns string starting with ev-', () => {
    const id = genEventId();
    expect(id).toMatch(/^ev-\d{3,}$/);
  });
});

// ── buildActivityEvent ──────────────────────────────────────

describe('buildActivityEvent', () => {
  it('builds event with all fields', () => {
    const event = buildActivityEvent(
      'BanHang', 'create', 'quote', 'q99', 'BG-0099', 'Test event',
    );
    expect(event.module).toBe('BanHang');
    expect(event.action).toBe('create');
    expect(event.entityType).toBe('quote');
    expect(event.entityId).toBe('q99');
    expect(event.entityCode).toBe('BG-0099');
    expect(event.description).toBe('Test event');
    expect(event.eventId).toBeDefined();
    expect(event.timestamp).toBeDefined();
  });

  it('default user is u1 / Hệ thống', () => {
    const event = buildActivityEvent(
      'MuaHang', 'update', 'po', 'po1', 'DMH-0001', 'test',
    );
    expect(event.userId).toBe('u1');
    expect(event.userName).toBe('Hệ thống');
  });

  it('accepts custom user', () => {
    const event = buildActivityEvent(
      'TonKho', 'delete', 'receipt', 'r1', 'PNK-0001', 'test', 'u5', 'Admin',
    );
    expect(event.userId).toBe('u5');
    expect(event.userName).toBe('Admin');
  });
});

// ── addEvent ────────────────────────────────────────────────

describe('addEvent', () => {
  it('adds event to beginning of events array', () => {
    const event = buildActivityEvent(
      'BanHang', 'create', 'quote', 'q-new', 'BG-NEW', 'New quote',
    );
    useActivityLogStore.getState().addEvent(event);

    const events = useActivityLogStore.getState().events;
    expect(events[0].entityCode).toBe('BG-NEW');
    expect(events).toHaveLength(11);
  });
});

// ── addEvents ───────────────────────────────────────────────

describe('addEvents', () => {
  it('adds multiple events at once', () => {
    const newEvents = [
      buildActivityEvent('BanHang', 'create', 'quote', 'q-a', 'BG-A', 'A'),
      buildActivityEvent('BanHang', 'create', 'quote', 'q-b', 'BG-B', 'B'),
    ];
    useActivityLogStore.getState().addEvents(newEvents);

    const events = useActivityLogStore.getState().events;
    expect(events).toHaveLength(12);
  });
});

// ── getByModule ─────────────────────────────────────────────

describe('getByModule', () => {
  it('filters events by module', () => {
    const banHangEvents = useActivityLogStore.getState().getByModule('BanHang');
    expect(banHangEvents.length).toBeGreaterThan(0);
    expect(banHangEvents.every(e => e.module === 'BanHang')).toBe(true);
  });

  it('returns empty for module with no events', () => {
    // DanhMuc is not in the seeds
    const events = useActivityLogStore.getState().getByModule('DanhMuc');
    expect(events).toHaveLength(0);
  });
});

// ── getRecent ───────────────────────────────────────────────

describe('getRecent', () => {
  it('returns N most recent events sorted by timestamp desc', () => {
    const recent = useActivityLogStore.getState().getRecent(3);
    expect(recent).toHaveLength(3);
    // Verify descending order
    for (let i = 1; i < recent.length; i++) {
      expect(recent[i - 1].timestamp >= recent[i].timestamp).toBe(true);
    }
  });

  it('returns all events if count > total', () => {
    const recent = useActivityLogStore.getState().getRecent(100);
    expect(recent).toHaveLength(10);
  });
});

// ── resetAll ────────────────────────────────────────────────

describe('resetAll', () => {
  it('resets events to seed data', () => {
    // Add an event first
    useActivityLogStore.getState().addEvent(
      buildActivityEvent('BanHang', 'create', 'quote', 'q1', 'BG-X', 'test'),
    );
    expect(useActivityLogStore.getState().events).toHaveLength(11);

    // Reset
    useActivityLogStore.getState().resetAll();
    expect(useActivityLogStore.getState().events).toHaveLength(10);
  });
});

// ── logActivityDirect ───────────────────────────────────────

describe('logActivityDirect', () => {
  it('adds event to activity log store', () => {
    logActivityDirect(
      'KeToan', 'create', 'voucher', 'v-99', 'CT-0099', 'Tạo chứng từ CT-0099',
    );
    const events = useActivityLogStore.getState().events;
    expect(events).toHaveLength(11);
    expect(events[0].module).toBe('KeToan');
    expect(events[0].entityCode).toBe('CT-0099');
  });

  it('uses default user when not specified', () => {
    logActivityDirect(
      'ThuChi', 'update', 'cashReceipt', 'cr-99', 'PT-0099', 'Update test',
    );
    const latest = useActivityLogStore.getState().events[0];
    expect(latest.userId).toBe('u1');
    expect(latest.userName).toBe('Hệ thống');
  });

  it('uses custom user when specified', () => {
    logActivityDirect(
      'TonKho', 'delete', 'stockReceipt', 'rc-99', 'PNK-0099', 'Delete test', 'u5', 'Admin',
    );
    const latest = useActivityLogStore.getState().events[0];
    expect(latest.userId).toBe('u5');
    expect(latest.userName).toBe('Admin');
  });
});
