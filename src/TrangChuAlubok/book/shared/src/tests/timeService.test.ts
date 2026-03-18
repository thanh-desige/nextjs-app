// ============================================================
// Tests: timeService — Core time logic
// ============================================================

import {
  getNow,
  formatToLocalDate,
  resolvePreset,
  toSemanticTime,
  calcDueInfo,
  calcAgingBuckets,
  buildFiscalYear,
  isPeriodLocked,
  formatDate,
  formatDateTime,
  filterByTimeRange,
} from '../services/timeService';

// ── getNow ──────────────────────────────────────────────────

describe('getNow', () => {
  it('returns a valid ISO string', () => {
    const now = getNow();
    expect(new Date(now).toISOString()).toBe(now);
  });
});

// ── formatToLocalDate ───────────────────────────────────────

describe('formatToLocalDate', () => {
  it('UTC midnight → same date in UTC', () => {
    expect(formatToLocalDate('2026-03-18T00:00:00Z', 'UTC')).toBe('2026-03-18');
  });

  it('UTC midnight → next date in positive-offset timezone', () => {
    // 2026-03-18T00:00:00Z = 2026-03-18 07:00 in Asia/Ho_Chi_Minh
    expect(formatToLocalDate('2026-03-18T00:00:00Z', 'Asia/Ho_Chi_Minh')).toBe('2026-03-18');
  });

  it('late UTC → next date in positive-offset timezone', () => {
    // 2026-03-18T23:00:00Z = 2026-03-19 06:00 in Asia/Ho_Chi_Minh
    expect(formatToLocalDate('2026-03-18T23:00:00Z', 'Asia/Ho_Chi_Minh')).toBe('2026-03-19');
  });
});

// ── resolvePreset ───────────────────────────────────────────

describe('resolvePreset', () => {
  // Fix a known "now" so all tests are deterministic
  const SERVER_NOW = '2026-03-18T10:00:00Z'; // = 17:00 VN time, Wed
  const TZ = 'Asia/Ho_Chi_Minh';

  it('today → single day range', () => {
    const range = resolvePreset({ preset: 'today' }, TZ, SERVER_NOW);
    expect(range.start).toBeDefined();
    expect(range.end).toBeDefined();
    // Start < End (same day, start=00:00 end=23:59)
    expect(range.start <= range.end).toBe(true);
  });

  it('yesterday → single day range before today', () => {
    const yesterday = resolvePreset({ preset: 'yesterday' }, TZ, SERVER_NOW);
    const today = resolvePreset({ preset: 'today' }, TZ, SERVER_NOW);
    expect(yesterday.end < today.start).toBe(true);
  });

  it('last7days → 7-day range ending today', () => {
    const range = resolvePreset({ preset: 'last7days' }, TZ, SERVER_NOW);
    // Should span at least 6 full days
    const diffMs = new Date(range.end).getTime() - new Date(range.start).getTime();
    const diffDays = diffMs / 86_400_000;
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThan(8);
  });

  it('thisWeek → starts Monday', () => {
    const range = resolvePreset({ preset: 'thisWeek' }, TZ, SERVER_NOW);
    // 2026-03-18 is Wednesday → thisWeek starts Monday 2026-03-16
    expect(range.start).toBeDefined();
    expect(new Date(range.start).getTime()).toBeLessThanOrEqual(new Date(SERVER_NOW).getTime());
  });

  it('lastWeek → full Monday-Sunday range', () => {
    const range = resolvePreset({ preset: 'lastWeek' }, TZ, SERVER_NOW);
    const diffMs = new Date(range.end).getTime() - new Date(range.start).getTime();
    const diffDays = diffMs / 86_400_000;
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThan(8);
  });

  it('last30days → 30-day range', () => {
    const range = resolvePreset({ preset: 'last30days' }, TZ, SERVER_NOW);
    const diffMs = new Date(range.end).getTime() - new Date(range.start).getTime();
    const diffDays = diffMs / 86_400_000;
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThan(31);
  });

  it('thisMonth → starts on 1st of current month', () => {
    const range = resolvePreset({ preset: 'thisMonth' }, TZ, SERVER_NOW);
    // March → starts 2026-03-01
    expect(range.start).toBeDefined();
  });

  it('lastMonth → full Feb 2026', () => {
    const range = resolvePreset({ preset: 'lastMonth' }, TZ, SERVER_NOW);
    const diffMs = new Date(range.end).getTime() - new Date(range.start).getTime();
    const diffDays = diffMs / 86_400_000;
    // Feb 2026 has 28 days
    expect(diffDays).toBeGreaterThanOrEqual(27);
    expect(diffDays).toBeLessThan(29);
  });

  it('thisQuarter → starts Q1 (January)', () => {
    const range = resolvePreset({ preset: 'thisQuarter' }, TZ, SERVER_NOW);
    // March is in Q1 → starts 2026-01-01
    expect(range.start).toBeDefined();
  });

  it('thisYear → starts Jan 1', () => {
    const range = resolvePreset({ preset: 'thisYear' }, TZ, SERVER_NOW);
    expect(range.start).toBeDefined();
    expect(new Date(range.start).getFullYear()).toBeLessThanOrEqual(2026);
  });

  it('custom → uses provided dates', () => {
    const range = resolvePreset(
      { preset: 'custom', customStart: '2026-01-01', customEnd: '2026-01-31' },
      TZ,
      SERVER_NOW,
    );
    expect(range.start).toBeDefined();
    expect(range.end).toBeDefined();
    const diffMs = new Date(range.end).getTime() - new Date(range.start).getTime();
    const diffDays = diffMs / 86_400_000;
    expect(diffDays).toBeGreaterThanOrEqual(30);
    expect(diffDays).toBeLessThan(32);
  });

  it('custom → throws if missing dates', () => {
    expect(() =>
      resolvePreset({ preset: 'custom' }, TZ, SERVER_NOW),
    ).toThrow('Custom preset requires customStart and customEnd');
  });
});

// ── toSemanticTime ──────────────────────────────────────────

describe('toSemanticTime', () => {
  const NOW = '2026-03-18T12:00:00Z';

  it('just now → < 1 min ago', () => {
    const result = toSemanticTime('2026-03-18T11:59:30Z', NOW);
    expect(result.kind).toBe('just_now');
    expect(result.label).toBe('Vừa xong');
  });

  it('minutes ago', () => {
    const result = toSemanticTime('2026-03-18T11:30:00Z', NOW);
    expect(result.kind).toBe('minutes_ago');
    expect(result.value).toBe(30);
    expect(result.label).toContain('phút trước');
  });

  it('hours ago', () => {
    const result = toSemanticTime('2026-03-18T09:00:00Z', NOW);
    expect(result.kind).toBe('hours_ago');
    expect(result.value).toBe(3);
    expect(result.label).toContain('giờ trước');
  });

  it('days ago', () => {
    const result = toSemanticTime('2026-03-16T12:00:00Z', NOW);
    expect(result.kind).toBe('days_ago');
    expect(result.value).toBe(2);
    expect(result.label).toContain('ngày trước');
  });

  it('weeks ago', () => {
    const result = toSemanticTime('2026-03-04T12:00:00Z', NOW);
    expect(result.kind).toBe('weeks_ago');
    expect(result.value).toBe(2);
    expect(result.label).toContain('tuần trước');
  });

  it('older than 3 weeks → formatted date', () => {
    const result = toSemanticTime('2026-01-15T12:00:00Z', NOW);
    expect(result.kind).toBe('date');
    expect(result.label).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

// ── calcDueInfo ─────────────────────────────────────────────

describe('calcDueInfo', () => {
  const NOW = '2026-03-18T10:00:00Z';

  it('overdue → past due date', () => {
    const info = calcDueInfo('2026-03-15', NOW);
    expect(info.status).toBe('overdue');
    expect(info.daysRemaining).toBeLessThan(0);
    expect(info.label).toContain('Quá hạn');
    expect(info.color).toBe('#f38ba8');
  });

  it('due_today → same date', () => {
    const info = calcDueInfo('2026-03-18', NOW);
    expect(info.status).toBe('due_today');
    expect(info.daysRemaining).toBe(0);
    expect(info.label).toBe('Đến hạn hôm nay');
  });

  it('due_soon → 1-3 days remaining', () => {
    const info = calcDueInfo('2026-03-20', NOW);
    expect(info.status).toBe('due_soon');
    expect(info.daysRemaining).toBe(2);
    expect(info.label).toContain('Còn 2 ngày');
  });

  it('not_due → more than 3 days', () => {
    const info = calcDueInfo('2026-04-01', NOW);
    expect(info.status).toBe('not_due');
    expect(info.daysRemaining).toBeGreaterThan(3);
    expect(info.label).toContain('Còn');
  });
});

// ── calcAgingBuckets ────────────────────────────────────────

describe('calcAgingBuckets', () => {
  const NOW = '2026-03-18T10:00:00Z';

  it('classifies debts into correct buckets', () => {
    const debts = [
      { dueDate: '2026-03-25', remainingAmount: 10_000_000 }, // not yet due
      { dueDate: '2026-03-10', remainingAmount: 5_000_000 },  // 8 days overdue → 0-30
      { dueDate: '2026-02-01', remainingAmount: 3_000_000 },  // 45 days overdue → 31-60
      { dueDate: '2025-12-15', remainingAmount: 2_000_000 },  // ~93 days overdue → >90
    ];
    const buckets = calcAgingBuckets(debts, NOW);

    expect(buckets).toHaveLength(5);
    // "Chưa đến hạn" bucket
    expect(buckets[0].amount).toBe(10_000_000);
    expect(buckets[0].count).toBe(1);
    // "0-30 ngày" bucket
    expect(buckets[1].amount).toBe(5_000_000);
    // "31-60 ngày" bucket
    expect(buckets[2].amount).toBe(3_000_000);
    // ">90 ngày" bucket
    expect(buckets[4].amount).toBe(2_000_000);
  });

  it('ignores zero-remaining debts', () => {
    const debts = [
      { dueDate: '2026-03-01', remainingAmount: 0 },
    ];
    const buckets = calcAgingBuckets(debts, NOW);
    const totalCount = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(0);
  });

  it('returns empty buckets when no debts', () => {
    const buckets = calcAgingBuckets([], NOW);
    expect(buckets).toHaveLength(5);
    expect(buckets.every(b => b.amount === 0 && b.count === 0)).toBe(true);
  });
});

// ── buildFiscalYear ─────────────────────────────────────────

describe('buildFiscalYear', () => {
  it('default → 12 monthly periods starting January', () => {
    const fy = buildFiscalYear(2026);
    expect(fy.periods).toHaveLength(12);
    expect(fy.periods[0].month).toBe(1);
    expect(fy.periods[0].year).toBe(2026);
    expect(fy.periods[11].month).toBe(12);
    expect(fy.label).toBe('FY 2026');
  });

  it('fiscal start April → periods Apr-Mar', () => {
    const fy = buildFiscalYear(2026, 4);
    expect(fy.periods[0].month).toBe(4);
    expect(fy.periods[0].year).toBe(2026);
    expect(fy.periods[11].month).toBe(3);
    expect(fy.periods[11].year).toBe(2027);
    expect(fy.startMonth).toBe(4);
  });

  it('marks locked periods', () => {
    const locked = [{ month: 1, year: 2026 }, { month: 2, year: 2026 }];
    const fy = buildFiscalYear(2026, 1, locked);
    expect(fy.periods[0].locked).toBe(true);  // January
    expect(fy.periods[1].locked).toBe(true);  // February
    expect(fy.periods[2].locked).toBe(false); // March
  });

  it('period labels format correctly', () => {
    const fy = buildFiscalYear(2026);
    expect(fy.periods[0].label).toBe('T01/2026');
    expect(fy.periods[11].label).toBe('T12/2026');
  });

  it('period dates span full month', () => {
    const fy = buildFiscalYear(2026);
    // February 2026 = 28 days
    const feb = fy.periods[1];
    expect(feb.startDate).toBe('2026-02-01');
    expect(feb.endDate).toBe('2026-02-28');
  });
});

// ── isPeriodLocked ──────────────────────────────────────────

describe('isPeriodLocked', () => {
  const locked = [
    { month: 1, year: 2026 },
    { month: 2, year: 2026 },
  ];

  it('returns true for locked period', () => {
    expect(isPeriodLocked('2026-01-15', locked)).toBe(true);
    expect(isPeriodLocked('2026-02-28', locked)).toBe(true);
  });

  it('returns false for unlocked period', () => {
    expect(isPeriodLocked('2026-03-01', locked)).toBe(false);
    expect(isPeriodLocked('2025-12-31', locked)).toBe(false);
  });
});

// ── formatDate ──────────────────────────────────────────────

describe('formatDate', () => {
  it('default format DD/MM/YYYY', () => {
    expect(formatDate('2026-03-18')).toBe('18/03/2026');
  });

  it('MM/DD/YYYY format', () => {
    expect(formatDate('2026-03-18', 'MM/DD/YYYY')).toBe('03/18/2026');
  });

  it('YYYY-MM-DD format (passthrough)', () => {
    expect(formatDate('2026-03-18', 'YYYY-MM-DD')).toBe('2026-03-18');
  });

  it('handles ISO timestamp input', () => {
    expect(formatDate('2026-03-18T10:30:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });
});

// ── formatDateTime ──────────────────────────────────────────

describe('formatDateTime', () => {
  it('includes date and time', () => {
    const result = formatDateTime('2026-03-18T10:30:00Z');
    // Should contain DD/MM/YYYY and HH:mm
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});

// ── filterByTimeRange ───────────────────────────────────────

describe('filterByTimeRange', () => {
  const items = [
    { id: 'a', createdAt: '2026-03-01T08:00:00Z' },
    { id: 'b', createdAt: '2026-03-10T12:00:00Z' },
    { id: 'c', createdAt: '2026-03-20T16:00:00Z' },
    { id: 'd', createdAt: '2026-04-01T08:00:00Z' },
  ];

  it('filters items within range', () => {
    const range = {
      start: '2026-03-05T00:00:00Z',
      end: '2026-03-15T23:59:59Z',
    };
    const result = filterByTimeRange(items, 'createdAt', range);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });

  it('returns all items when range covers all', () => {
    const range = {
      start: '2026-01-01T00:00:00Z',
      end: '2026-12-31T23:59:59Z',
    };
    const result = filterByTimeRange(items, 'createdAt', range);
    expect(result).toHaveLength(4);
  });

  it('returns empty when range matches nothing', () => {
    const range = {
      start: '2025-01-01T00:00:00Z',
      end: '2025-12-31T23:59:59Z',
    };
    const result = filterByTimeRange(items, 'createdAt', range);
    expect(result).toHaveLength(0);
  });

  it('handles edge: item exactly at range start', () => {
    const range = {
      start: '2026-03-10T12:00:00Z',
      end: '2026-03-10T12:00:00Z',
    };
    const result = filterByTimeRange(items, 'createdAt', range);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('b');
  });
});
