'use client';
import React, { useState } from 'react';
import { MODULE_ROUTES, ModuleTabBar } from '../../../navigation';
import type { KeToanViewMode } from '../types';
import VoucherList from './VoucherList';
import VoucherForm from './VoucherForm';
import VoucherDetail from './VoucherDetail';
import InvoiceList from './InvoiceList';
import InvoiceForm from './InvoiceForm';
import InvoiceDetail from './InvoiceDetail';
import LedgerPage from './LedgerPage';
import AccountingReport from './AccountingReport';

interface BookKeToanPageProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = MODULE_ROUTES.find((r) => r.page === 9)!.tabs!;

export default function BookKeToanPage({ activeTab, onTabChange }: BookKeToanPageProps) {
  // Voucher view state
  const [voucherView, setVoucherView] = useState<KeToanViewMode>('list');
  const [voucherSelectedId, setVoucherSelectedId] = useState<string | null>(null);
  const [voucherEditId, setVoucherEditId] = useState<string | null>(null);

  // Invoice view state
  const [invoiceView, setInvoiceView] = useState<KeToanViewMode>('list');
  const [invoiceSelectedId, setInvoiceSelectedId] = useState<string | null>(null);
  const [invoiceEditId, setInvoiceEditId] = useState<string | null>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'vouchers':
        if (voucherView === 'form') {
          return (
            <VoucherForm
              editId={voucherEditId}
              onBack={() => { setVoucherView('list'); setVoucherEditId(null); }}
              onSaved={() => { setVoucherView('list'); setVoucherEditId(null); }}
            />
          );
        }
        if (voucherView === 'detail' && voucherSelectedId) {
          return (
            <VoucherDetail
              voucherId={voucherSelectedId}
              onBack={() => { setVoucherView('list'); setVoucherSelectedId(null); }}
              onEdit={(id) => { setVoucherEditId(id); setVoucherView('form'); }}
            />
          );
        }
        return (
          <VoucherList
            onAdd={() => { setVoucherEditId(null); setVoucherView('form'); }}
            onSelect={(id) => { setVoucherSelectedId(id); setVoucherView('detail'); }}
          />
        );

      case 'invoices':
        if (invoiceView === 'form') {
          return (
            <InvoiceForm
              editId={invoiceEditId}
              onBack={() => { setInvoiceView('list'); setInvoiceEditId(null); }}
              onSaved={() => { setInvoiceView('list'); setInvoiceEditId(null); }}
            />
          );
        }
        if (invoiceView === 'detail' && invoiceSelectedId) {
          return (
            <InvoiceDetail
              invoiceId={invoiceSelectedId}
              onBack={() => { setInvoiceView('list'); setInvoiceSelectedId(null); }}
              onEdit={(id) => { setInvoiceEditId(id); setInvoiceView('form'); }}
            />
          );
        }
        return (
          <InvoiceList
            onAdd={() => { setInvoiceEditId(null); setInvoiceView('form'); }}
            onSelect={(id) => { setInvoiceSelectedId(id); setInvoiceView('detail'); }}
          />
        );

      case 'ledger':
        return <LedgerPage />;

      case 'reports':
        return <AccountingReport />;

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ModuleTabBar tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e1e2e' }}>{renderContent()}</div>
    </div>
  );
}
