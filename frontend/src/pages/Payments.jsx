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
      title: linkedQuote?.title || `Invoice for ${client?.name || client?.companyName || 'Client'}`,
      date: quoteDate,
      clientName: client?.name || client?.companyName || 'Valued Client',
      address: client?.address || '',
      phone: client?.phone || '',
      email: client?.email || '',
      items: linkedQuote?.items && linkedQuote.items.length > 0 ? linkedQuote.items : [
        { description: linkedQuote?.title || 'Professional Services', breakdown: '', rate: payment.totalAmount, qty: 1 }
      ],
      total: payment.totalAmount || 0,
      advancePaid: paidAmt,
      remaining: balance >= 0 ? balance : 0
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
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Invoiced</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalInvoicedSum)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Amount Collected */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Collected Revenue</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalCollectedSum)}
            </p>
            <span className="text-[11px] text-emerald-700 font-bold">{overallCollectionPercent}% collection rate</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</span>
            <p className="text-2xl font-black text-rose-600 mt-1">
              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalOutstandingSum)}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search payment logs by client company, quote code, schedule ID..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl outline-none text-slate-800 placeholder-slate-400 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Add Payment Trigger */}
        <button
          onClick={handleOpenFormNew}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-xs cursor-pointer"
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
              className="p-6 bg-white border border-slate-200 hover:border-orange-300 rounded-2xl shadow-xs transition-all"
            >
              {/* Header Title info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-extrabold text-slate-900">{clientName}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.status === 'Paid in Full' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      p.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Schedule ID: <span className="font-mono font-bold text-slate-700">{p.id}</span> | Linked Quote: <span className="font-mono text-orange-600 font-bold">{p.quotationId}</span> - {quoteTitle}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleOpenInvoicePDF(p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all hover-scale cursor-pointer"
                    title="View Official Setu Invoice (Bill)"
                  >
                    <Receipt className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Bill / Invoice</span>
                  </button>

                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Outstanding Balance</p>
                    <p className="text-base font-black text-slate-900 mt-0.5">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(balance)}
                    </p>
                  </div>
                  {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 rounded-xl hover-scale cursor-pointer transition-colors"
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
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-orange-500" />
                      <span>Received: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paidAmt)}</span>
                    </span>
                    <span className="text-orange-600">Collection Progress: {percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-700 shadow-xs" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Contract Value</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.totalAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total Splits</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{p.instalments.length} Parts</p>
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
                            ? 'bg-emerald-50/30 border-emerald-200' 
                            : 'bg-slate-50/70 border-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Part {index+1}</span>
                            <p className="text-xs font-black text-slate-900 mt-1">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inst.amount)}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wide ${
                            isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {inst.status}
                          </span>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                          <div>
                            <p className="font-semibold uppercase tracking-wider text-[8px] text-slate-400">Due Date</p>
                            <span className="text-slate-700 font-bold">{inst.dueDate}</span>
                          </div>

                          {!isPaid ? (
                            <button
                              onClick={() => recordPaymentPayment(p.id, inst.id)}
                              className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg hover-scale transition-colors shadow-2xs cursor-pointer"
                            >
                              Collect
                            </button>
                          ) : (
                            <div className="text-right">
                              <p className="font-semibold uppercase tracking-wider text-[8px] text-emerald-600">Collected</p>
                              <span className="text-[10px] font-bold text-slate-700">{inst.paidDate}</span>
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
          <div className="py-16 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-orange-50/20">
            <Coins className="w-12 h-12 mb-3 text-orange-400" />
            <p className="text-sm font-bold text-slate-800">No payment ledgers matching search</p>
            <p className="text-xs text-slate-500 mt-1">Choose accepted quotation records to build invoice instalment schedules.</p>
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
