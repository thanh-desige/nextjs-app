'use client';
// ============================================================
// BookTongQuanPage — Dashboard main layout
// Scrollable grid: TimeFilter → KPIs → Chart + Flow → Alerts + Activity + Quick
// ============================================================

import React, { useState, useMemo } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import KpiCards from './KpiCards';
import RevenueChart from './RevenueChart';
import OrderFlowWidget from './OrderFlowWidget';
import AlertsWidget from './AlertsWidget';
import QuickAccess from './QuickAccess';
import DateRangeFilter from '../../../shared/src/ui/DateRangeFilter';
import ActivityTimeline from '../../../shared/src/ui/ActivityTimeline';
import { useActivityLogStore } from '../../../shared/src/services/activityLogStore';
import { resolvePreset } from '../../../shared/src/services/timeService';
import type { TimeRangeQuery, TimeRange } from '../../../shared/src/types/time.types';

interface BookTongQuanPageProps {
  onNavigate?: (page: number, tab?: string) => void;
}

export default function BookTongQuanPage({ onNavigate }: BookTongQuanPageProps): React.ReactElement {
  const [timeQuery, setTimeQuery] = useState<TimeRangeQuery>({ preset: 'thisMonth' });

  const timeRange: TimeRange | undefined = useMemo(() => {
    try {
      return resolvePreset(timeQuery);
    } catch {
      return undefined;
    }
  }, [timeQuery]);

  const { kpis, chartBars, flowSteps, alerts } = useDashboardData(timeRange);
  const events = useActivityLogStore((s) => s.events);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'auto',
      backgroundColor: '#1e1e2e',
      padding: 24,
    }}>
      {/* Header + Time Filter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h2 style={{ color: '#cdd6f4', fontSize: 22, fontWeight: 700, margin: 0 }}>
            📊 Tổng quan hệ thống
          </h2>
          <p style={{ color: '#6c7086', fontSize: 13, margin: '4px 0 0' }}>
            Dashboard tổng hợp dữ liệu từ tất cả module
          </p>
        </div>
        <DateRangeFilter value={timeQuery} onChange={setTimeQuery} />
      </div>

      {/* Row 1: KPI Cards (3×2) */}
      <div style={{ marginBottom: 20 }}>
        <KpiCards kpis={kpis} />
      </div>

      {/* Row 2: Chart + Order Flow (2 columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 20,
      }}>
        <RevenueChart bars={chartBars} />
        <OrderFlowWidget steps={flowSteps} />
      </div>

      {/* Row 3: Alerts + Activity Timeline (2 columns) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
        marginBottom: 20,
      }}>
        <AlertsWidget alerts={alerts} />
        <ActivityTimeline events={events} maxItems={8} />
      </div>

      {/* Row 4: Quick Access */}
      <div style={{ marginBottom: 20 }}>
        <QuickAccess onNavigate={onNavigate} />
      </div>
    </div>
  );
}
