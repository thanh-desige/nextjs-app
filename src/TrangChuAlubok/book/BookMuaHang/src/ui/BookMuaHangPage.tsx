'use client';
// ============================================================
// BookMuaHangPage — Purchase management page
// Horizontal tab bar (4 tabs) + dynamic content area
// Tabs: Đơn mua hàng, Yêu cầu mua, BC Mua hàng, Shop ALUBOK
// ============================================================

import React, { useState } from 'react';
import type { MuaHangTab, ViewMode } from '../types';
import { MODULE_ROUTES, ModuleTabBar } from '../../../navigation';
import PurchaseOrderList from './PurchaseOrderList';
import PurchaseOrderForm from './PurchaseOrderForm';
import PurchaseOrderDetail from './PurchaseOrderDetail';
import PurchaseRequestList from './PurchaseRequestList';
import PurchaseRequestForm from './PurchaseRequestForm';
import PurchaseRequestDetail from './PurchaseRequestDetail';
import PurchaseReport from './PurchaseReport';
import MuaHangPage from '../../../../MuaHangPage/MuaHangPage';

const MUA_HANG_TABS = MODULE_ROUTES.find(r => r.page === 2)!.tabs!;

interface BookMuaHangPageProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BookMuaHangPage({ activeTab, onTabChange }: BookMuaHangPageProps): React.ReactElement {
  const [orderView, setOrderView] = useState<ViewMode>('list');
  const [orderSelectedId, setOrderSelectedId] = useState<string | null>(null);
  const [requestView, setRequestView] = useState<ViewMode>('list');
  const [requestSelectedId, setRequestSelectedId] = useState<string | null>(null);

  const tab = activeTab as MuaHangTab;

  const handleTabChange = (key: string) => {
    onTabChange(key);
  };

  function renderContent(): React.ReactNode {
    switch (tab) {
      case 'orders':
        if (orderView === 'form')
          return <PurchaseOrderForm editId={orderSelectedId} onBack={() => { setOrderView('list'); setOrderSelectedId(null); }} />;
        if (orderView === 'detail' && orderSelectedId)
          return <PurchaseOrderDetail orderId={orderSelectedId} onBack={() => { setOrderView('list'); setOrderSelectedId(null); }} onEdit={(id) => { setOrderSelectedId(id); setOrderView('form'); }} />;
        return <PurchaseOrderList onView={(id) => { setOrderSelectedId(id); setOrderView('detail'); }} onCreate={() => { setOrderSelectedId(null); setOrderView('form'); }} />;
      case 'requests':
        if (requestView === 'form')
          return <PurchaseRequestForm editId={requestSelectedId} onBack={() => { setRequestView('list'); setRequestSelectedId(null); }} />;
        if (requestView === 'detail' && requestSelectedId)
          return <PurchaseRequestDetail requestId={requestSelectedId} onBack={() => { setRequestView('list'); setRequestSelectedId(null); }} onEdit={(id) => { setRequestSelectedId(id); setRequestView('form'); }} />;
        return <PurchaseRequestList onView={(id) => { setRequestSelectedId(id); setRequestView('detail'); }} onCreate={() => { setRequestSelectedId(null); setRequestView('form'); }} />;
      case 'reports':
        return <PurchaseReport />;
      case 'shop':
        return <MuaHangPage onBackClick={() => onTabChange('orders')} />;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <ModuleTabBar tabs={MUA_HANG_TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e1e2e' }}>
        {renderContent()}
      </div>
    </div>
  );
}
