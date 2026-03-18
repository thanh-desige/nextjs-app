'use client';
import React, { useState } from 'react';
import type { SanXuatSection, SXViewMode } from '../types';
import SubSidebar from './SubSidebar';
import ProgressOverview from './ProgressOverview';
import ProductionOrderList from './ProductionOrderList';
import ProductionOrderForm from './ProductionOrderForm';
import ProductionOrderDetail from './ProductionOrderDetail';
import MaterialPlanPage from './MaterialPlanPage';
import MaterialIssuePage from './MaterialIssuePage';
import InstallationList from './InstallationList';
import InstallationForm from './InstallationForm';
import InstallationDetail from './InstallationDetail';
import AcceptanceList from './AcceptanceList';
import AcceptanceForm from './AcceptanceForm';
import AcceptanceDetail from './AcceptanceDetail';
import ProductionReport from './ProductionReport';

export default function BookSanXuatThiCongPage() {
  const [section, setSection] = useState<SanXuatSection>('overview');

  // View states for CRUD sections
  const [poView, setPOView] = useState<SXViewMode>('list');
  const [poSelectedId, setPOSelectedId] = useState<string | null>(null);
  const [poEditId, setPOEditId] = useState<string | null>(null);

  const [instView, setInstView] = useState<SXViewMode>('list');
  const [instSelectedId, setInstSelectedId] = useState<string | null>(null);
  const [instEditId, setInstEditId] = useState<string | null>(null);

  const [accView, setAccView] = useState<SXViewMode>('list');
  const [accSelectedId, setAccSelectedId] = useState<string | null>(null);
  const [accEditId, setAccEditId] = useState<string | null>(null);

  // Reset view when changing section
  const handleSectionChange = (s: SanXuatSection) => {
    setSection(s);
    setPOView('list'); setPOSelectedId(null); setPOEditId(null);
    setInstView('list'); setInstSelectedId(null); setInstEditId(null);
    setAccView('list'); setAccSelectedId(null); setAccEditId(null);
  };

  const renderContent = () => {
    switch (section) {
      case 'overview':
        return <ProgressOverview onNavigate={handleSectionChange} />;

      case 'production-orders':
        if (poView === 'form') {
          return (
            <ProductionOrderForm
              editId={poEditId}
              onBack={() => { setPOView('list'); setPOEditId(null); }}
              onSaved={() => { setPOView('list'); setPOEditId(null); }}
            />
          );
        }
        if (poView === 'detail' && poSelectedId) {
          return (
            <ProductionOrderDetail
              orderId={poSelectedId}
              onBack={() => { setPOView('list'); setPOSelectedId(null); }}
              onEdit={(id) => { setPOEditId(id); setPOView('form'); }}
            />
          );
        }
        return (
          <ProductionOrderList
            onAdd={() => { setPOEditId(null); setPOView('form'); }}
            onSelect={(id) => { setPOSelectedId(id); setPOView('detail'); }}
          />
        );

      case 'material-plans':
        return <MaterialPlanPage />;

      case 'material-issues':
        return <MaterialIssuePage />;

      case 'installations':
        if (instView === 'form') {
          return (
            <InstallationForm
              editId={instEditId}
              onBack={() => { setInstView('list'); setInstEditId(null); }}
              onSaved={() => { setInstView('list'); setInstEditId(null); }}
            />
          );
        }
        if (instView === 'detail' && instSelectedId) {
          return (
            <InstallationDetail
              jobId={instSelectedId}
              onBack={() => { setInstView('list'); setInstSelectedId(null); }}
              onEdit={(id) => { setInstEditId(id); setInstView('form'); }}
            />
          );
        }
        return (
          <InstallationList
            onAdd={() => { setInstEditId(null); setInstView('form'); }}
            onSelect={(id) => { setInstSelectedId(id); setInstView('detail'); }}
          />
        );

      case 'acceptances':
        if (accView === 'form') {
          return (
            <AcceptanceForm
              editId={accEditId}
              onBack={() => { setAccView('list'); setAccEditId(null); }}
              onSaved={() => { setAccView('list'); setAccEditId(null); }}
            />
          );
        }
        if (accView === 'detail' && accSelectedId) {
          return (
            <AcceptanceDetail
              recordId={accSelectedId}
              onBack={() => { setAccView('list'); setAccSelectedId(null); }}
              onEdit={(id) => { setAccEditId(id); setAccView('form'); }}
            />
          );
        }
        return (
          <AcceptanceList
            onAdd={() => { setAccEditId(null); setAccView('form'); }}
            onSelect={(id) => { setAccSelectedId(id); setAccView('detail'); }}
          />
        );

      case 'reports':
        return <ProductionReport />;

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <SubSidebar activeSection={section} onSectionChange={handleSectionChange} />
      <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e1e2e' }}>
        {renderContent()}
      </div>
    </div>
  );
}
