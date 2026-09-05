import React, { useState } from 'react';
import { useCRM, normalizeDocumentId } from '../context/CRMContext';
import PaymentFormModal from '../components/payment/PaymentFormModal';
import QuotationPDFModal from '../components/quotation/QuotationPDFModal';
import { 
  IndianRupee, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Coins,
  History,
  FileText,
  Receipt,
  Eye
} from 'lucide-react';

const Payments = ({ initialOpenForm = false, preselectedClientId = '' }) => {
  const { 
    payments, 
    clients, 
    quotations, 
    recordPaymentPayment, 
    deletePayment, 
    currentUser 
  } = useCRM();

  // Search & Modals
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(initialOpenForm);
  const [clientId, setClientId] = useState(preselectedClientId);
  const [invoicePdfOpen, setInvoicePdfOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const getClientName = (id) => {
    const c = clients.find(item => item.id === id);
    return c ? `${c.name} (${c.companyName || 'Client'})` : 'Unknown Client';
  };

  const getClientRecord = (id) => {
    return clients.find(item => item.id === id);
  };

  const getQuoteTitle = (id) => {
    const q = quotations.find(item => item.id === id);
    return q ? q.title : 'Custom Payment Schedule';
  };

  const handleOpenInvoicePDF = (payment) => {
    const linkedQuote = quotations.find(q => q.id === payment.quotationId);
    const client = clients.find(c => c.id === payment.clientId);
    const quoteDate = linkedQuote?.date || '2026-09-05';
    const invoiceId = normalizeDocumentId(payment.quotationId || payment.id, quoteDate);

    const paidAmt = payment.instalments.filter(i => i.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
    const balance = payment.totalAmount - paidAmt;

    const invoiceDoc = {
      id: invoiceId,
      docNumber: invoiceId,
      docType: 'Invoice',
      title: linkedQuote?.title || `Invoice for ${client?.name || 'Client'}`,
      date: quoteDate,
      clientName: client?.name || "Tarang Solar System's",
      address: client?.address || "Building No.: 69, Sita Nagar Road, Near Satish Bakery, Sita Nagar Nagpur, Maharashtra PIN Code: 440025",
      phone: client?.phone || "+91 8830487351",
      email: client?.email || "tarangsolar@gmail.com",
      items: linkedQuote?.items || [
        { description: 'Project Cost (Solar Business Management ,Employee Tracking Android Application)', breakdown: '30,000', rate: payment.totalAmount, qty: 1 }
      ],
      total: payment.totalAmount,
      advancePaid: paidAmt > 0 ? paidAmt : 14000,
      remaining: balance >= 0 ? balance : 16000
    };

    setSelectedInvoice(invoiceDoc);
    setInvoicePdfOpen(true);
  };

  // Filter list
  const filteredPayments = payments.filter(p => {
    const cName = getClientName(p.clientId).toLowerCase();
    const qTitle = getQuoteTitle(p.quotationId).toLowerCase();
    const matchSearch = cName.includes(search.toLowerCase()) || 
                        qTitle.includes(search.toLowerCase()) ||
                        p.id.toLowerCase().includes(search.toLowerCase()) ||
                        p.quotationId.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Calculate Metrics
  const totalInvoicedSum = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  
  const totalCollectedSum = payments.reduce((sum, p) => {
    const paidInstalmentsAmt = p.instalments
      .filter(inst => inst.status === 'Paid')
      .reduce((s, i) => s + i.amount, 0);
    return sum + paidInstalmentsAmt;
  }, 0);

  const totalOutstandingSum = totalInvoicedSum - totalCollectedSum;
  const overallCollectionPercent = totalInvoicedSum > 0 ? Math.round((totalCollectedSum / totalInvoicedSum) * 100) : 0;

  const handleDelete = (paymentId) => {
    if (confirm("Are you sure you want to delete this payment schedule?")) {
      const success = deletePayment(paymentId);
      if (!success) {
        alert("Action Denied: Staff roles do not have permission to delete records.");
      }
    }
  };

  const handleOpenFormNew = () => {
    setClientId('');
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics Grid header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Invoiced */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <p className="text-xl font-black text-slate-100 mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalInvoicedSum)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-850 flex items-center justify-center text-slate-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Amount Collected */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Collected Revenue</span>
            <p className="text-xl font-black text-brand-400 mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalCollectedSum)}
            </p>
            <span className="text-[10px] text-slate-500 font-semibold">{overallCollectionPercent}% collection rate</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
            <p className="text-xl font-black text-rose-400 mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalOutstandingSum)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search payment logs by client company, quote code, schedule ID..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl outline-none text-slate-100 placeholder-slate-500 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Add Payment Trigger */}
        <button
          onClick={handleOpenFormNew}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-brand-400 to-emerald-500 hover:from-brand-500 hover:to-emerald-600 rounded-xl hover-scale shadow-md shadow-brand-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Set Schedule</span>
        </button>
      </div>

      {/* Main Ledger List */}
      <div className="space-y-4">
        {filteredPayments.map(p => {
          const clientName = getClientName(p.clientId);
          const quoteTitle = getQuoteTitle(p.quotationId);

          const paidAmt = p.instalments.filter(i => i.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
          const balance = p.totalAmount - paidAmt;
          const percentage = p.totalAmount > 0 ? Math.round((paidAmt / p.totalAmount) * 100) : 0;

          return (
            <div 
              key={p.id}
              className="p-6 bg-slate-900/30 border border-slate-800 rounded-2xl hover:border-slate-750 transition-all"
            >
              {/* Header Title info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-850 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-extrabold text-slate-200">{clientName}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      p.status === 'Paid in Full' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' :
                      p.status === 'Partial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-medium">
                    Schedule ID: <span className="font-mono">{p.id}</span> | Link Quote: <span className="font-mono text-brand-400 font-semibold">{p.quotationId}</span> - {quoteTitle}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenInvoicePDF(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-xl transition-all hover-scale"
                    title="View Official Setu Invoice (Bill)"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>View Bill / Invoice</span>
                  </button>

                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Outstanding Balance</p>
                    <p className="text-base font-black text-slate-100 mt-0.5">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(balance)}
                    </p>
                  </div>
                  {currentUser.role === 'Admin' && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-slate-500 hover:text-red-400 bg-slate-950 border border-slate-850 rounded-xl hover-scale"
                      title="Remove Ledger Schedule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar & Split Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-5">
                {/* Visual Progress */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <History className="w-3.5 h-3.5" />
                      <span>Received: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paidAmt)}</span>
                    </span>
                    <span>Collection Progress: {percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-850 p-[1px]">
                    <div 
                      className="bg-gradient-to-r from-brand-500 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(34,197,94,0.4)]" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-950/40 p-3.5 border border-slate-850 rounded-xl flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Total Contract Value</span>
                    <p className="text-sm font-black text-slate-300 mt-0.5">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.totalAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-500">Total Splits</span>
                    <p className="text-sm font-black text-slate-300 mt-0.5">{p.instalments.length} Parts</p>
                  </div>
                </div>
              </div>

              {/* Instalments list */}
              <div>
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">Instalments Tracker</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {p.instalments.map((inst, index) => {
                    const isPaid = inst.status === 'Paid';
                    return (
                      <div 
                        key={inst.id} 
                        className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                          isPaid 
                            ? 'bg-slate-950/20 border-slate-850' 
                            : 'bg-slate-900/60 border-slate-800'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Part {index+1}</span>
                            <p className="text-xs font-black text-slate-200 mt-1">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inst.amount)}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                            isPaid ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {inst.status}
                          </span>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-slate-850/50 flex items-center justify-between text-[10px] text-slate-500">
                          <div>
                            <p className="font-semibold uppercase tracking-wider text-[8px]">Due Date</p>
                            <span className="text-slate-400 font-bold">{inst.dueDate}</span>
                          </div>

                          {!isPaid ? (
                            <button
                              onClick={() => recordPaymentPayment(p.id, inst.id)}
                              className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-slate-950 bg-brand-400 hover:bg-brand-500 rounded-lg hover-scale transition-colors"
                            >
                              Collect
                            </button>
                          ) : (
                            <div className="text-right">
                              <p className="font-semibold uppercase tracking-wider text-[8px] text-brand-400">Collected</p>
                              <span className="text-[9px] font-bold text-slate-500">{inst.paidDate}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })}

        {filteredPayments.length === 0 && (
          <div className="py-16 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/10">
            <Coins className="w-12 h-12 mb-3" />
            <p className="text-sm font-semibold">No payment ledgers matching search</p>
            <p className="text-xs text-slate-600 mt-1">Choose accepted quotation records to build invoice instalment schedules.</p>
          </div>
        )}
      </div>

      {/* Payment Form Modal */}
      <PaymentFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        preselectedClientId={clientId}
      />

      {/* Invoice (Bill) PDF Viewer Modal */}
      <QuotationPDFModal
        isOpen={invoicePdfOpen}
        onClose={() => setInvoicePdfOpen(false)}
        quotation={selectedInvoice}
        clientOrLead={selectedInvoice ? getClientRecord(selectedInvoice.clientId) : null}
      />

    </div>
  );
};

export default Payments;
