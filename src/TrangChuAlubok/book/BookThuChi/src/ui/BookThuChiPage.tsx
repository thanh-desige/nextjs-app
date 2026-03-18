'use client';
// ============================================================
// BookThuChiPage — Cash Receipt/Payment + Debt management page
// Horizontal tab bar (6 tabs) + dynamic content area
// Tabs: Phiếu thu, Phiếu chi, Công nợ phải thu, Công nợ phải trả, BC Công nợ, BC Dòng tiền
// ============================================================

import React, { useState } from 'react';
import type { ThuChiTab, ThuChiViewMode } from '../types';
import { MODULE_ROUTES, ModuleTabBar } from '../../../navigation';
import CashReceiptList from './CashReceiptList';
import CashReceiptForm from './CashReceiptForm';
import CashReceiptDetail from './CashReceiptDetail';
import CashPaymentList from './CashPaymentList';
import CashPaymentForm from './CashPaymentForm';
import CashPaymentDetail from './CashPaymentDetail';
import AccountsReceivablePage from './AccountsReceivablePage';
import AccountsPayablePage from './AccountsPayablePage';
import DebtReport from './DebtReport';
import CashFlowReport from './CashFlowReport';

const THU_CHI_TABS = MODULE_ROUTES.find(r => r.page === 5)!.tabs!;

interface BookThuChiPageProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BookThuChiPage({ activeTab, onTabChange }: BookThuChiPageProps): React.ReactElement {
  const [receiptView, setReceiptView] = useState<ThuChiViewMode>('list');
  const [receiptSelectedId, setReceiptSelectedId] = useState<string | null>(null);
  const [paymentView, setPaymentView] = useState<ThuChiViewMode>('list');
  const [paymentSelectedId, setPaymentSelectedId] = useState<string | null>(null);
  const [arSelectedId, setArSelectedId] = useState<string | null>(null);
  const [apSelectedId, setApSelectedId] = useState<string | null>(null);

  const tab = activeTab as ThuChiTab;

  function renderContent(): React.ReactNode {
    switch (tab) {
      case 'receipts':
        if (receiptView === 'form')
          return <CashReceiptForm editId={receiptSelectedId} onBack={() => { setReceiptView('list'); setReceiptSelectedId(null); }} />;
        if (receiptView === 'detail' && receiptSelectedId)
          return <CashReceiptDetail receiptId={receiptSelectedId} onBack={() => { setReceiptView('list'); setReceiptSelectedId(null); }} onEdit={(id) => { setReceiptSelectedId(id); setReceiptView('form'); }} />;
        return <CashReceiptList onView={(id) => { setReceiptSelectedId(id); setReceiptView('detail'); }} onCreate={() => { setReceiptSelectedId(null); setReceiptView('form'); }} />;
      case 'payments':
        if (paymentView === 'form')
          return <CashPaymentForm editId={paymentSelectedId} onBack={() => { setPaymentView('list'); setPaymentSelectedId(null); }} />;
        if (paymentView === 'detail' && paymentSelectedId)
          return <CashPaymentDetail paymentId={paymentSelectedId} onBack={() => { setPaymentView('list'); setPaymentSelectedId(null); }} onEdit={(id) => { setPaymentSelectedId(id); setPaymentView('form'); }} />;
        return <CashPaymentList onView={(id) => { setPaymentSelectedId(id); setPaymentView('detail'); }} onCreate={() => { setPaymentSelectedId(null); setPaymentView('form'); }} />;
      case 'ar':
        if (arSelectedId)
          return <AccountsReceivablePage selectedId={arSelectedId} onBack={() => setArSelectedId(null)} />;
        return <AccountsReceivablePage selectedId={null} onBack={() => {}} onSelect={(id) => setArSelectedId(id)} />;
      case 'ap':
        if (apSelectedId)
          return <AccountsPayablePage selectedId={apSelectedId} onBack={() => setApSelectedId(null)} />;
        return <AccountsPayablePage selectedId={null} onBack={() => {}} onSelect={(id) => setApSelectedId(id)} />;
      case 'debt-report':
        return <DebtReport />;
      case 'cashflow-report':
        return <CashFlowReport />;
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      <ModuleTabBar tabs={THU_CHI_TABS} activeTab={activeTab} onTabChange={onTabChange} />
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e1e2e' }}>
        {renderContent()}
      </div>
    </div>
  );
}
