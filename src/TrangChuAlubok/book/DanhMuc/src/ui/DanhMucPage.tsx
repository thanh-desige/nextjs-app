'use client';
// ============================================================
// DanhMucPage — Master Data management page
// Horizontal tab bar (12 categories) + dynamic CategoryPage content
// Renders INSIDE the global App Shell content area
// ============================================================

import React from 'react';
import { CategoryPage } from './CategoryPage';
import { CATEGORY_CONFIGS } from './categoryConfigs';
import { MODULE_ROUTES, ModuleTabBar } from '../../../navigation';

const DANH_MUC_TABS = MODULE_ROUTES.find(r => r.page === 7)!.tabs!;

// Lookup config map
const configMap = new Map(CATEGORY_CONFIGS.map(c => [c.key, c]));

interface DanhMucPageProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function DanhMucPage({ activeTab, onTabChange }: DanhMucPageProps): React.ReactElement {
  const activeConfig = configMap.get(activeTab)!;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <ModuleTabBar tabs={DANH_MUC_TABS} activeTab={activeTab} onTabChange={onTabChange} />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <CategoryPage key={activeTab} config={activeConfig} />
      </div>
    </div>
  );
}
