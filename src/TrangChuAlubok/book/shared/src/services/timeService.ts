// ============================================================
// ALUBOK TimeService — Backend-first time logic
//
// NƠI DUY NHẤT xử lý: timezone conversion, preset → range,
// semantic time, due/overdue, aging, fiscal period, period lock.
//
// Frontend KHÔNG tự tính logic thời gian.
// Frontend gọi TimeService methods (hoặc gửi preset qua API).
//
// === D. KIẾN TRÚC BACKEND ===
//
// TimeService (file này):
//   resolvePreset()     — preset + tz → absolute TimeRange
//   toSemanticTime()    — timestamp → "2 giờ trước"
//   calcDueInfo()       — dueDate → DueInfo (overdue/due_soon/...)
//   calcAgingBuckets()  — debts[] → AgingBucket[]
//   buildFiscalYear()   — year + startMonth → FiscalPeriod[]
//   isPeriodLocked()    — date + periods → boolean
//   formatDate()        — ISO → display format
//   formatDateTime()    — ISO → display format with time
//   getNow()            — server "now" (single source)
//
// Tại sao nằm trong shared/src/services/?
//   - Cross-cutting: mọi module đều dùng
//   - Không tạo module Time riêng
//   - Import từ shared/ giống permission/guards
//
// ============================================================

import type {
  ISOTimestamp,
  ISODate,
  TimePreset,
  TimeRange,
  TimeRangeQuery,
  SemanticTime,
  SemanticTimeKind,
  DueInfo,
  DueStatus,
  DUE_STATUS_COLORS,
  AgingBucket,
  AGING_BUCKET_DEFS,
  FiscalPeriod,
  FiscalYear,
} from '../types/time.types';

// Re-import constants (values, not just types)
const DUE_COLORS: Record<DueStatus, string> = {
  not_due: '#a6adc8',
  due_soon: '#f9e2af',
  due_today: '#fab387',
  overdue: '#f38ba8',
};

const AGING_DEFS = [
  { label: 'Chưa đến hạn', min: -Infinity, max: 0, color: '#a6e3a1' },
  { label: '0–30 ngày', min: 0, max: 30, color: '#f9e2af' },
  { label: '31–60 ngày', min: 31, max: 60, color: '#fab387' },
  { label: '61–90 ngày', min: 61, max: 90, color: '#f38ba8' },
  { label: '>90 ngày', min: 91, max: Infinity, color: '#ed8796' },
];

// ── CORE: Server "now" ───────────────────────────────────────
// Single source of truth. In production, this comes from server.
// All other functions derive from this.

/** Get current server time as ISO string (UTC) */
export function getNow(): ISOTimestamp {
  return new Date().toISOString();
}

/** Get current date in timezone as ISO date string */
export function getToday(timezone: string = 'Asia/Ho_Chi_Minh'): ISODate {
  return formatToLocalDate(getNow(), timezone);
}

// ── TIMEZONE HELPERS ─────────────────────────────────────────

/** Convert UTC ISO timestamp to local date string (YYYY-MM-DD) in given tz */
export function formatToLocalDate(iso: ISOTimestamp, timezone: string): ISODate {
  const d = new Date(iso);
  // Use Intl to get correct local date parts
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const dd = parts.find(p => p.type === 'day')!.value;
  return `${y}-${m}-${dd}`;
}

/** Get start of day in timezone as UTC ISO timestamp */
function startOfDayInTz(date: ISODate, timezone: string): ISOTimestamp {
  // Create date interpretation in the target timezone
  // For Asia/Ho_Chi_Minh (UTC+7): "2026-03-18" 00:00 local = "2026-03-17T17:00:00Z"
  const localMidnight = new Date(`${date}T00:00:00`);
  const utcStr = localMidnight.toLocaleString('en-US', { timeZone: 'UTC' });
  const localStr = localMidnight.toLocaleString('en-US', { timeZone: timezone });
  const diff = new Date(utcStr).getTime() - new Date(localStr).getTime();
  return new Date(localMidnight.getTime() + diff).toISOString();
}

/** Get end of day in timezone as UTC ISO timestamp */
function endOfDayInTz(date: ISODate, timezone: string): ISOTimestamp {
  const localEnd = new Date(`${date}T23:59:59.999`);
  const utcStr = localEnd.toLocaleString('en-US', { timeZone: 'UTC' });
  const localStr = localEnd.toLocaleString('en-US', { timeZone: timezone });
  const diff = new Date(utcStr).getTime() - new Date(localStr).getTime();
  return new Date(localEnd.getTime() + diff).toISOString();
}

// ── PRESET → RANGE ───────────────────────────────────────────
// Backend resolves preset to absolute UTC range based on timezone.

/**
 * Resolve a TimePreset to absolute UTC TimeRange.
 * This is the SINGLE SOURCE OF TRUTH for time range computation.
 * Frontend sends preset, backend returns computed range.
 */
export function resolvePreset(
  query: TimeRangeQuery,
  timezone: string = 'Asia/Ho_Chi_Minh',
  serverNow?: ISOTimestamp, // injectable for testing
): TimeRange {
  const now = serverNow ? new Date(serverNow) : new Date();
  const today = formatToLocalDate(now.toISOString(), timezone);

  if (query.preset === 'custom') {
    if (!query.customStart || !query.customEnd) {
      throw new Error('Custom preset requires customStart and customEnd');
    }
    return {
      start: startOfDayInTz(query.customStart, timezone),
      end: endOfDayInTz(query.customEnd, timezone),
    };
  }

  // Parse today into local components
  const [ty, tm, td] = today.split('-').map(Number);
  const todayDate = new Date(ty, tm - 1, td);

  function localDate(y: number, m: number, d: number): ISODate {
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function daysAgo(n: number): ISODate {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - n);
    return localDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function lastDayOfMonth(y: number, m: number): number {
    return new Date(y, m, 0).getDate();
  }

  let start: ISODate;
  let end: ISODate;

  switch (query.preset) {
    case 'today':
      start = end = today;
      break;

    case 'yesterday': {
      const yd = daysAgo(1);
      start = end = yd;
      break;
    }

    case 'last7days':
      start = daysAgo(6);
      end = today;
      break;

    case 'thisWeek': {
      // Monday-based week (ISO 8601)
      const dow = todayDate.getDay() || 7; // Sun=7
      start = daysAgo(dow - 1);
      end = today;
      break;
    }

    case 'lastWeek': {
      const dow = todayDate.getDay() || 7;
      const lastMonday = daysAgo(dow - 1 + 7);
      const lastSunday = daysAgo(dow);
      start = lastMonday;
      end = lastSunday;
      break;
    }

    case 'last30days':
      start = daysAgo(29);
      end = today;
      break;

    case 'thisMonth':
      start = localDate(ty, tm, 1);
      end = today;
      break;

    case 'lastMonth': {
      const pm = tm === 1 ? 12 : tm - 1;
      const py = tm === 1 ? ty - 1 : ty;
      start = localDate(py, pm, 1);
      end = localDate(py, pm, lastDayOfMonth(py, pm));
      break;
    }

    case 'thisQuarter': {
      const qStart = Math.floor((tm - 1) / 3) * 3 + 1;
      start = localDate(ty, qStart, 1);
      end = today;
      break;
    }

    case 'thisYear':
      start = localDate(ty, 1, 1);
      end = today;
      break;

    default:
      start = end = today;
  }

  return {
    start: startOfDayInTz(start, timezone),
    end: endOfDayInTz(end, timezone),
  };
}

// ── SEMANTIC TIME ────────────────────────────────────────────

/**
 * Convert a timestamp to human-readable relative time.
 * "Vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước"
 */
export function toSemanticTime(
  timestamp: ISOTimestamp,
  serverNow?: ISOTimestamp,
): SemanticTime {
  const now = serverNow ? new Date(serverNow).getTime() : Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffMin < 1)
    return { kind: 'just_now', label: 'Vừa xong', value: 0, color: '#a6e3a1' };
  if (diffMin < 60)
    return { kind: 'minutes_ago', label: `${diffMin} phút trước`, value: diffMin, color: '#a6adc8' };
  if (diffHour < 24)
    return { kind: 'hours_ago', label: `${diffHour} giờ trước`, value: diffHour, color: '#a6adc8' };
  if (diffDay < 7)
    return { kind: 'days_ago', label: `${diffDay} ngày trước`, value: diffDay, color: '#a6adc8' };
  if (diffWeek <= 3)
    return { kind: 'weeks_ago', label: `${diffWeek} tuần trước`, value: diffWeek, color: '#6c7086' };

  // Older than 3 weeks → show date
  return { kind: 'date', label: formatDate(timestamp), value: diffDay, color: '#6c7086' };
}

// ── DUE DATE / OVERDUE ───────────────────────────────────────

/**
 * Calculate due status for a deadline.
 * Returns: overdue / due_today / due_soon (≤3 days) / not_due
 */
export function calcDueInfo(
  dueDate: ISODate,
  serverNow?: ISOTimestamp,
): DueInfo {
  const now = serverNow ? new Date(serverNow) : new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate);
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffMs = dueDay.getTime() - today.getTime();
  const daysRemaining = Math.round(diffMs / 86_400_000);

  let status: DueStatus;
  let label: string;

  if (daysRemaining < 0) {
    status = 'overdue';
    label = `Quá hạn ${Math.abs(daysRemaining)} ngày`;
  } else if (daysRemaining === 0) {
    status = 'due_today';
    label = 'Đến hạn hôm nay';
  } else if (daysRemaining <= 3) {
    status = 'due_soon';
    label = `Còn ${daysRemaining} ngày`;
  } else {
    status = 'not_due';
    label = `Còn ${daysRemaining} ngày`;
  }

  return { status, label, daysRemaining, color: DUE_COLORS[status] };
}

// ── AGING BUCKETS ────────────────────────────────────────────

/**
 * Classify a list of debts into aging buckets.
 * Used for: AR aging, AP aging in BookThuChi reports.
 */
export function calcAgingBuckets(
  debts: Array<{ dueDate: ISODate; remainingAmount: number }>,
  serverNow?: ISOTimestamp,
): AgingBucket[] {
  const now = serverNow ? new Date(serverNow) : new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const buckets: AgingBucket[] = AGING_DEFS.map(d => ({
    ...d, amount: 0, count: 0,
  }));

  for (const debt of debts) {
    if (debt.remainingAmount <= 0) continue;
    const due = new Date(debt.dueDate);
    const overdueDays = Math.floor((today.getTime() - due.getTime()) / 86_400_000);

    for (const bucket of buckets) {
      if (overdueDays >= bucket.min && overdueDays <= bucket.max) {
        bucket.amount += debt.remainingAmount;
        bucket.count += 1;
        break;
      }
    }
  }

  return buckets;
}

// ── FISCAL PERIOD ────────────────────────────────────────────

/**
 * Build a full fiscal year with 12 monthly periods.
 * Reads fiscalYearStart from SystemSettings (default: January).
 */
export function buildFiscalYear(
  calendarYear: number,
  fiscalYearStart: number = 1,
  lockedPeriods?: Array<{ month: number; year: number }>,
): FiscalYear {
  const periods: FiscalPeriod[] = [];

  for (let i = 0; i < 12; i++) {
    let month = ((fiscalYearStart - 1 + i) % 12) + 1;
    let year = calendarYear;
    if (month < fiscalYearStart) year += 1;

    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const locked = lockedPeriods?.some(
      lp => lp.month === month && lp.year === year,
    ) ?? false;

    periods.push({
      year,
      month,
      label: `T${String(month).padStart(2, '0')}/${year}`,
      startDate,
      endDate,
      locked,
    });
  }

  return {
    year: calendarYear,
    startMonth: fiscalYearStart,
    periods,
    label: `FY ${calendarYear}`,
  };
}

/**
 * Check if a given date falls in a locked fiscal period.
 * Used by guards/checkBusinessPolicy for write operations.
 */
export function isPeriodLocked(
  date: ISODate,
  lockedPeriods: Array<{ month: number; year: number }>,
): boolean {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return lockedPeriods.some(lp => lp.month === month && lp.year === year);
}

// ── FORMAT HELPERS ───────────────────────────────────────────
// These use SystemSettings.dateFormat — default DD/MM/YYYY

/**
 * Format ISO date to display format.
 * Default: DD/MM/YYYY (Vietnamese standard)
 */
export function formatDate(
  iso: ISODate | ISOTimestamp,
  format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY',
): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  switch (format) {
    case 'DD/MM/YYYY': return `${dd}/${mm}/${yyyy}`;
    case 'MM/DD/YYYY': return `${mm}/${dd}/${yyyy}`;
    case 'YYYY-MM-DD': return `${yyyy}-${mm}-${dd}`;
  }
}

/**
 * Format ISO timestamp to display format with time.
 * Default: DD/MM/YYYY HH:mm
 */
export function formatDateTime(
  iso: ISOTimestamp,
  format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' = 'DD/MM/YYYY',
  timezone: string = 'Asia/Ho_Chi_Minh',
): string {
  const d = new Date(iso);
  const timeStr = d.toLocaleTimeString('vi-VN', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${formatDate(iso, format)} ${timeStr}`;
}

// ── FILTER HELPER ────────────────────────────────────────────

/**
 * Filter an array of items by time range on a specified date field.
 * This is the STANDARD way to filter lists by date in all modules.
 *
 * @param items Array of entities
 * @param field Name of the date field to filter on
 * @param range TimeRange (UTC start/end from resolvePreset)
 */
export function filterByTimeRange<T>(
  items: T[],
  field: keyof T,
  range: TimeRange,
): T[] {
  return items.filter(item => {
    const val = item[field];
    if (typeof val !== 'string') return false;
    return val >= range.start && val <= range.end;
  });
}
