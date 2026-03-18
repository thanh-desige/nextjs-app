'use client';
// ============================================================
// BookTonKhoPage — Warehouse/Inventory management page
// Horizontal tab bar (5 tabs) + dynamic content area
// Tabs: Phiếu nhập kho, Phiếu xuất kho, Chuyển kho, Tồn kho, BC Tồn kho
// ============================================================

import React, { useState } from 'react';
import type { TonKhoTab, ViewMode } from '../types';
import { MODULE_ROUTES, ModuleTabBar } from '../../../navigation';
import StockReceiptList from './StockReceiptList';
import StockReceiptForm from './StockReceiptForm';
import StockReceiptDetail from './StockReceiptDetail';
import StockIssueList from './StockIssueList';
import StockIssueForm from './StockIssueForm';
import StockIssueDetail from './StockIssueDetail';
import StockTransferList from './StockTransferList';
import StockTransferForm from './StockTransferForm';
import StockTransferDetail from './StockTransferDetail';
import InventoryBalancePage from './InventoryBalancePage';
import InventoryReport from './InventoryReport';

const TON_KHO_TABS = MODULE_ROUTES.find(r => r.page === 6)!.tabs!;

interface BookTonKhoPageProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BookTonKhoPage({ activeTab, onTabChange }: BookTonKhoPageProps): React.ReactElement {
  const [receiptView, setReceiptView] = useState<ViewMode>('list');
  const [receiptSelectedId, setReceiptSelectedId] = useState<string | null>(null);
  const [issueView, setIssueView] = useState<ViewMode>('list');
  const [issueSelectedId, setIssueSelectedId] = useState<string | null>(null);
  const [transferView, setTransferView] = useState<ViewMode>('list');
  const [transferSelectedId, setTransferSelectedId] = useState<string | null>(null);

  const tab = activeTab as TonKhoTab;

  function renderContent(): React.ReactNode {
    switch (tab) {
      case 'receipts':
        if (receiptView === 'form')
          return <StockReceiptForm editId={receiptSelectedId} onBack={() => { setReceiptView('list'); setReceiptSelectedId(null); }} />;
        if (receiptView === 'detail' && receiptSelectedId)
          return <StockReceiptDetail receiptId={receiptSelectedId} onBack={() => { setReceiptView('list'); setReceiptSelectedId(null); }} onEdit={(id) => { setReceiptSelectedId(id); setReceiptView('form'); }} />;
        return <StockReceiptList onView={(id) => { setReceiptSelectedId(id); setReceiptView('detail'); }} onCreate={() => { setReceiptSelectedId(null); setReceiptView('form'); }} />;
      case 'issues':
        if (issueView === 'form')
          return <StockIssueForm editId={issueSelectedId} onBack={() => { setIssueView('list'); setIssueSelectedId(null); }} />;
        if (issueView === 'detail' && issueSelectedId)
          return <StockIssueDetail issueId={issueSelectedId} onBack={() => { setIssueView('list'); setIssueSelectedId(null); }} onEdit={(id) => { setIssueSelectedId(id); setIssueView('form'); }} />;
        return <StockIssueList onView={(id) => { setIssueSelectedId(id); setIssueView('detail'); }} onCreate={() => { setIssueSelectedId(null); setIssueView('form'); }} />;
      case 'transfers':
        if (transferView === 'form')
          return <StockTransferForm editId={transferSelectedId} onBack={() => { setTransferView('list'); setTransferSelectedId(null); }} />;
        if (transferView === 'detail' && transferSelectedId)
          return <StockTransferDetail transferId={transferSelectedId} onBack={() => { setTransferView('list'); setTransferSelectedId(null); }} onEdit={(id) => { setTransferSelectedId(id); setTransferView('form'); }} />;
        return <StockTransferList onView={(id) => { setTransferSelectedId(id); setTransferView('detail'); }} onCreate={() => { setTransferSelectedId(null); setTransferView('form'); }} />;
      case 'balance':
        return <InventoryBalancePage />;
      case 'reports':
        return <InventoryReport />;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <ModuleTabBar tabs={TON_KHO_TABS} activeTab={activeTab} onTabChange={onTabChange} />
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e1e2e' }}>
        {renderContent()}
      </div>
    </div>
  );
}
