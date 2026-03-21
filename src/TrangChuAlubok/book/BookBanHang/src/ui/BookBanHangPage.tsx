'use client';
// ============================================================
// BookBanHangPage — Sales management page
// Horizontal tab bar (5 tabs) + dynamic content area
// Tabs: Báo giá, Hợp đồng, Đơn bán hàng, BC Báo giá, BC Bán hàng
// ============================================================

import React, { useState } from 'react';
import type { BanHangTab, ViewMode } from '../types';
import { MODULE_ROUTES, ModuleTabBar } from '../../../navigation';
import QuoteList from './QuoteList';
import QuoteForm from './QuoteForm';
import QuoteDetail from './QuoteDetail';
import ContractList from './ContractList';
import SalesOrderList from './SalesOrderList';
import SalesOrderForm from './SalesOrderForm';
import SalesOrderDetail from './SalesOrderDetail';
import QuoteReport from './QuoteReport';
import SalesReport from './SalesReport';

const BAN_HANG_TABS = MODULE_ROUTES.find(r => r.page === 3)!.tabs!;

interface BookBanHangPageProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BookBanHangPage({ activeTab, onTabChange }: BookBanHangPageProps): React.ReactElement {
  // Navigation within each tab
  const [quoteView, setQuoteView] = useState<ViewMode>('list');
  const [quoteSelectedId, setQuoteSelectedId] = useState<string | null>(null);
  const [orderView, setOrderView] = useState<ViewMode>('list');
  const [orderSelectedId, setOrderSelectedId] = useState<string | null>(null);
  const [contractView, setContractView] = useState<ViewMode>('list');
  const [contractSelectedId, setContractSelectedId] = useState<string | null>(null);

  const tab = activeTab as BanHangTab;

  function renderContent(): React.ReactNode {
    switch (tab) {
      case 'quotes':
        if (quoteView === 'form')
          return <QuoteForm editId={quoteSelectedId} onBack={() => { setQuoteView('list'); setQuoteSelectedId(null); }} />;
        if (quoteView === 'detail' && quoteSelectedId)
          return <QuoteDetail quoteId={quoteSelectedId} onBack={() => { setQuoteView('list'); setQuoteSelectedId(null); }} onEdit={(id) => { setQuoteSelectedId(id); setQuoteView('form'); }} />;
        return <QuoteList onView={(id) => { setQuoteSelectedId(id); setQuoteView('detail'); }} onCreate={() => { setQuoteSelectedId(null); setQuoteView('form'); }} />;
      case 'contracts':
        return <ContractList onView={(id) => { setContractSelectedId(id); setContractView('detail'); }} />;
      case 'orders':
        if (orderView === 'form')
          return <SalesOrderForm editId={orderSelectedId} onBack={() => { setOrderView('list'); setOrderSelectedId(null); }} />;
        if (orderView === 'detail' && orderSelectedId)
          return <SalesOrderDetail orderId={orderSelectedId} onBack={() => { setOrderView('list'); setOrderSelectedId(null); }} onEdit={(id) => { setOrderSelectedId(id); setOrderView('form'); }} />;
        return <SalesOrderList onView={(id) => { setOrderSelectedId(id); setOrderView('detail'); }} onCreate={() => { setOrderSelectedId(null); setOrderView('form'); }} />;
      case 'report-quotes':
        return <QuoteReport />;
      case 'report-sales':
        return <SalesReport />;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <ModuleTabBar tabs={BAN_HANG_TABS} activeTab={activeTab} onTabChange={onTabChange} />
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e1e2e' }}>
        {renderContent()}
      </div>
    </div>
  );
}
