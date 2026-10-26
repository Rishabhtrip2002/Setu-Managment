import React, { useState } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Clients from './pages/Clients';
import Quotations from './pages/Quotations';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import Employees from './pages/Employees';
import Expenses from './pages/Expenses';
import Telecaller from './pages/Telecaller';
import ColdCalling from './pages/ColdCalling';
import QuotationForm from './components/quotation/QuotationForm';
import QuotationPDFModal from './components/quotation/QuotationPDFModal';
import LeadFormModal from './components/lead/LeadFormModal';
import PaymentFormModal from './components/payment/PaymentFormModal';
import LeadDetailsDrawer from './components/lead/LeadDetailsDrawer';
import { Loader2 } from 'lucide-react';
import './App.css';

// Main Inner App which has access to Context
const CRMApp = () => {
  const { authUser, authLoading, currentUser, payments, deletePayment, deleteQuotation } = useCRM();
  const [activePage, setActivePage] = useState('dashboard');
  
  // Shared quick action modals
  const [quickLeadOpen, setQuickLeadOpen] = useState(false);
  const [quickQuoteOpen, setQuickQuoteOpen] = useState(false);
  const [quickPaymentOpen, setQuickPaymentOpen] = useState(false);
  const [globalDrawerLead, setGlobalDrawerLead] = useState(null);

  // Prefill states for quotations/payments
  const [prefillClientId, setPrefillClientId] = useState('');
  const [prefillType, setPrefillType] = useState('client');
  const [prefillPaymentContext, setPrefillPaymentContext] = useState(null);
  const [editingPaymentForModal, setEditingPaymentForModal] = useState(null);

  // Instant generated bill preview state
  const [generatedBillDoc, setGeneratedBillDoc] = useState(null);
  const [generatedBillClient, setGeneratedBillClient] = useState(null);

  // 1. Initial Firebase Auth Session Verification
  if (authLoading || (authUser && !currentUser)) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white gap-5">
        <div className="w-24 h-24 rounded-2xl bg-white shadow-lg shadow-orange-500/10 border border-slate-100 p-3 flex items-center justify-center">
          <img
            src="/SETULOGO.png"
            alt="Setu Solution"
            className="w-full h-full object-contain"
            onError={(e) => { e.target.onerror = null; e.target.src = '/SETULOGO_WHITE.png'; }}
          />
        </div>
        <div className="flex flex-col items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4.5 h-4.5 text-orange-500 animate-spin" />
            <p className="text-sm text-slate-600 font-semibold tracking-wide">Loading CRM...</p>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Setu Solution — Custom Software</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render Sign In & First-Time Setup
  if (!authUser) {
    return <Login />;
  }

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

  const handleAddPaymentTrigger = (clientId, contextData = null) => {
    setPrefillClientId(clientId);
    setPrefillPaymentContext(contextData);
    setQuickPaymentOpen(true);
  };

  // Role and Permission Access Validator
  const hasAccessToPage = (page) => {
    if (currentUser?.role === 'Super Admin') return true;
    if (page === 'dashboard' || page === 'telecaller' || page === 'coldcalling') return true;
    if (page === 'employees') return false; // Strictly restricted to Super Admin
    if (currentUser?.permissions && Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.includes(page);
    }
    return true;
  };

  const renderActivePage = () => {
    if (!hasAccessToPage(activePage)) {
      return (
        <Dashboard 
          setActivePage={setActivePage} 
          onQuickAction={handleQuickAction} 
        />
      );
    }

    switch (activePage) {
      case 'dashboard':
        return (
          <Dashboard 
            setActivePage={setActivePage} 
            onQuickAction={handleQuickAction} 
          />
        );
      case 'coldcalling':
        return <ColdCalling />;
      case 'telecaller':
        return (
          <Telecaller
            addQuoteTrigger={handleAddQuoteTrigger}
            addPaymentTrigger={handleAddPaymentTrigger}
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
      case 'expenses':
        return <Expenses />;
      case 'employees':
        return <Employees />;
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
      onOpenLeadDrawer={(lead) => setGlobalDrawerLead(lead)}
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
        onClose={() => { setQuickPaymentOpen(false); setPrefillPaymentContext(null); setEditingPaymentForModal(null); }}
        preselectedClientId={prefillClientId}
        preselectedContext={prefillPaymentContext}
        paymentToEdit={editingPaymentForModal}
        onBillCreated={(quoteDoc, clientDoc) => {
          setGeneratedBillDoc(quoteDoc);
          setGeneratedBillClient(clientDoc);
        }}
      />

      {/* Instant Bill Preview after creation */}
      {generatedBillDoc && (
        <QuotationPDFModal
          isOpen={!!generatedBillDoc}
          onClose={() => { setGeneratedBillDoc(null); setGeneratedBillClient(null); }}
          quotation={generatedBillDoc}
          clientOrLead={generatedBillClient}
          onEdit={(doc) => {
            const p = payments.find(item => item.quotationId === doc.id || item.id === doc.id);
            setGeneratedBillDoc(null);
            if (p) {
              setEditingPaymentForModal(p);
              setPrefillClientId(p.clientId);
              setQuickPaymentOpen(true);
            } else {
              setPrefillClientId(doc.clientOrLeadId || '');
              setQuickQuoteOpen(true);
            }
          }}
          onDelete={(doc) => {
            const p = payments.find(item => item.quotationId === doc.id || item.id === doc.id);
            if (p) {
              deletePayment(p.id);
            } else {
              deleteQuotation(doc.id);
            }
            setGeneratedBillDoc(null);
          }}
        />
      )}

      {/* Global Lead Details Drawer (e.g. from Follow-up Alert) */}
      {globalDrawerLead && (
        <LeadDetailsDrawer
          isOpen={!!globalDrawerLead}
          onClose={() => setGlobalDrawerLead(null)}
          lead={globalDrawerLead}
          onAddQuoteForLead={handleAddQuoteTrigger}
          onAddPaymentForLead={handleAddPaymentTrigger}
        />
      )}
    </Layout>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('SETU CRM caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4 border border-orange-200 text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error occurred. Please reload the workspace.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
          >
            Reload Workspace
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Wrap with provider and error boundary at the root
function App() {
  return (
    <ErrorBoundary>
      <CRMProvider>
        <CRMApp />
      </CRMProvider>
    </ErrorBoundary>
  );
}

export default App;
