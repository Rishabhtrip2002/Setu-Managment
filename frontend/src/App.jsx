import React, { useState } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Clients from './pages/Clients';
import Quotations from './pages/Quotations';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import QuotationForm from './components/quotation/QuotationForm';
import LeadFormModal from './components/lead/LeadFormModal';
import PaymentFormModal from './components/payment/PaymentFormModal';
import './App.css';

// Main Inner App which has access to Context
const CRMApp = () => {
  const [activePage, setActivePage] = useState('dashboard');
  
  // Shared quick action modals
  const [quickLeadOpen, setQuickLeadOpen] = useState(false);
  const [quickQuoteOpen, setQuickQuoteOpen] = useState(false);
  const [quickPaymentOpen, setQuickPaymentOpen] = useState(false);

  // Prefill states for quotations/payments
  const [prefillClientId, setPrefillClientId] = useState('');
  const [prefillType, setPrefillType] = useState('client');

  const handleQuickAction = (action) => {
    if (action === 'add_lead') {
      setQuickLeadOpen(true);
    } else if (action === 'add_quote') {
      setPrefillClientId('');
      setPrefillType('client');
      setQuickQuoteOpen(true);
    } else if (action === 'add_payment') {
      setPrefillClientId('');
      setQuickPaymentOpen(true);
    }
  };

  const handleAddQuoteTrigger = (entityId, entityType) => {
    setPrefillClientId(entityId);
    setPrefillType(entityType);
    setQuickQuoteOpen(true);
  };

  const handleAddPaymentTrigger = (clientId) => {
    setPrefillClientId(clientId);
    setQuickPaymentOpen(true);
  };

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard 
            setActivePage={setActivePage} 
            onQuickAction={handleQuickAction} 
          />
        );
      case 'leads':
        return (
          <Leads 
            addQuoteTrigger={handleAddQuoteTrigger} 
            addPaymentTrigger={handleAddPaymentTrigger} 
          />
        );
      case 'clients':
        return (
          <Clients 
            initialClientId="" 
            addQuoteTrigger={handleAddQuoteTrigger} 
            addPaymentTrigger={handleAddPaymentTrigger} 
          />
        );
      case 'quotations':
        return <Quotations />;
      case 'payments':
        return <Payments />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard setActivePage={setActivePage} onQuickAction={handleQuickAction} />;
    }
  };

  return (
    <Layout 
      activePage={activePage} 
      setActivePage={setActivePage} 
      onQuickAction={handleQuickAction}
    >
      {renderActivePage()}

      {/* Shared Quick Modals */}
      <LeadFormModal
        isOpen={quickLeadOpen}
        onClose={() => setQuickLeadOpen(false)}
        leadToEdit={null}
      />

      <QuotationForm
        isOpen={quickQuoteOpen}
        onClose={() => setQuickQuoteOpen(false)}
        clientOrLeadId={prefillClientId}
        type={prefillType}
        quotationToEdit={null}
      />

      <PaymentFormModal
        isOpen={quickPaymentOpen}
        onClose={() => setQuickPaymentOpen(false)}
        preselectedClientId={prefillClientId}
      />
    </Layout>
  );
};

// Wrap with provider at the root
function App() {
  return (
    <CRMProvider>
      <CRMApp />
    </CRMProvider>
  );
}

export default App;
