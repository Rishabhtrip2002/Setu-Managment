import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import QuotationForm from '../components/quotation/QuotationForm';
import QuotationPDFModal from '../components/quotation/QuotationPDFModal';
import { 
  FileText, 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  Send, 
  CheckCircle2, 
  XSquare,
  FilePlus,
  Receipt,
  MessageSquare,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const Quotations = ({ initialOpenForm = false, prefilledId = '', prefilledType = 'client' }) => {
  const { 
    quotations, 
    leads, 
    clients, 
    updateQuotationStatus, 
    sendQuotationWhatsApp,
    deleteQuotation, 
    currentUser 
  } = useCRM();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All'); // All, Quotation, Invoice
  const [statusFilter, setStatusFilter] = useState('All');
  const [feedbackNotice, setFeedbackNotice] = useState(null);
  
  // Modal states
  const [formOpen, setFormOpen] = useState(initialOpenForm);
  const [activeDocType, setActiveDocType] = useState('Quotation');
  const [pdfOpen, setPdfOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteToEdit, setQuoteToEdit] = useState(null);

  // Prefill hooks passed down from Leads
  const [formPrefillId, setFormPrefillId] = useState(prefilledId);
  const [formPrefillType, setFormPrefillType] = useState(prefilledType);

  const getEntityName = (id, type) => {
    if (type === 'client') {
      const c = clients.find(item => item.id === id);
      return c ? `${c.name} (${c.companyName || 'Client'})` : 'Unknown Client';
    } else {
      const l = leads.find(item => item.id === id);
      return l ? `${l.name} (Lead)` : 'Unknown Lead';
    }
  };

  const getEntityRecord = (id, type) => {
    if (type === 'client') {
      return clients.find(item => item.id === id);
    } else {
      return leads.find(item => item.id === id);
    }
  };

  // Filter list
  const filteredQuotes = quotations.filter(q => {
    const name = getEntityName(q.clientOrLeadId, q.type).toLowerCase();
    const matchSearch = q.title?.toLowerCase().includes(search.toLowerCase()) || 
                        q.id.toLowerCase().includes(search.toLowerCase()) ||
                        name.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || q.status === statusFilter;
    const qDocType = q.docType || 'Quotation';
    const matchDocType = docTypeFilter === 'All' || qDocType.toLowerCase() === docTypeFilter.toLowerCase();
    return matchSearch && matchStatus && matchDocType;
  });

  const handleOpenFormNew = (type = 'Quotation', prefillRecord = null) => {
    if (prefillRecord) {
      // Pre-populate from accepted quotation to create tax invoice
      setQuoteToEdit({
        ...prefillRecord,
        id: '', // New ID will be generated
        docType: 'Invoice',
        title: `Invoice - ${prefillRecord.title || 'Settlement'}`,
        status: 'Draft'
      });
      setActiveDocType('Invoice');
      setFormPrefillId(prefillRecord.clientOrLeadId);
      setFormPrefillType(prefillRecord.type);
    } else {
      setQuoteToEdit(null);
      setActiveDocType(type);
      setFormPrefillId('');
      setFormPrefillType('client');
    }
    setFormOpen(true);
  };

  const handleOpenEdit = (q) => {
    setQuoteToEdit(q);
    setActiveDocType(q.docType || 'Quotation');
    setFormOpen(true);
  };

  const handleOpenPDF = (q) => {
    setSelectedQuote(q);
    setPdfOpen(true);
  };

  const handleStatusChange = (q, newStatus) => {
    const res = updateQuotationStatus(q.id, newStatus);
    if (newStatus === 'Accepted') {
      setFeedbackNotice({
        type: 'success',
        msg: `Quotation ${q.id} marked as Accepted! Originating Lead updated to Won, Client linked idempotently, and payment schedule created.`
      });
    } else {
      setFeedbackNotice({
        type: 'info',
        msg: `Quotation ${q.id} status updated to ${newStatus}.`
      });
    }
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const handleSendWhatsApp = (q) => {
    const entity = getEntityRecord(q.clientOrLeadId, q.type);
    const targetPhone = entity?.phone || '';
    
    const res = sendQuotationWhatsApp(q.id, targetPhone);
    if (res.success && res.url) {
      window.open(res.url, '_blank');
      setFeedbackNotice({
        type: 'success',
        msg: `Quotation link generated and logged in WhatsApp history. Opening WhatsApp chat with ${targetPhone || 'client'}...`
      });
    } else {
      setFeedbackNotice({
        type: 'info',
        msg: `Quotation dispatch logged. Note: Phone number not found for recipient.`
      });
    }
    setTimeout(() => setFeedbackNotice(null), 6000);
  };

  const handleDelete = (quoteId) => {
    if (confirm("Are you sure you want to delete this document?")) {
      const success = deleteQuotation(quoteId);
      if (!success) {
        alert("Action Denied: Staff roles do not have permission to delete records.");
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, SETU Serial ID, or client name..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl outline-none text-slate-800 placeholder-slate-400 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2.5">
            <select
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl outline-none focus:border-orange-500 cursor-pointer"
              value={docTypeFilter}
              onChange={e => setDocTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Quotation">Quotations Only</option>
              <option value="Invoice">Invoices (Bills) Only</option>
            </select>

            <select
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl outline-none focus:border-orange-500 cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {['Draft', 'Sent', 'Accepted', 'Rejected'].map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenFormNew('Quotation')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all hover-scale cursor-pointer"
          >
            <FilePlus className="w-3.5 h-3.5 text-orange-600" />
            <span>New Quotation</span>
          </button>

          <button
            onClick={() => handleOpenFormNew('Invoice')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-xs cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>New Invoice (Bill)</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {feedbackNotice && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border animate-[fadeIn_0.2s_ease-out] ${
          feedbackNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-blue-50 text-blue-900 border-blue-300'
        }`}>
          <span>{feedbackNotice.msg}</span>
          <button onClick={() => setFeedbackNotice(null)} className="text-slate-500 hover:text-slate-800 ml-3 font-bold">✕</button>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuotes.map(q => {
          const clientName = getEntityName(q.clientOrLeadId, q.type);
          const isInvoice = (q.docType || '').toLowerCase() === 'invoice';

          return (
            <div 
              key={q.id}
              className={`p-5 bg-white border rounded-2xl transition-all hover-scale shadow-xs flex flex-col justify-between ${
                isInvoice 
                  ? 'border-amber-300/80 bg-gradient-to-br from-white via-white to-amber-50/30 hover:border-amber-400' 
                  : 'border-slate-200 hover:border-orange-300'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200/80">
                      {q.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                      isInvoice ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {q.docType || 'Quotation'}
                    </span>
                  </div>

                  <select
                    value={q.status}
                    onChange={(e) => handleStatusChange(q, e.target.value)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer outline-none border transition-colors ${
                      q.status === 'Accepted' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      q.status === 'Sent' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                      q.status === 'Draft' ? 'bg-slate-100 text-slate-700 border-slate-300' :
                      'bg-rose-50 text-rose-800 border-rose-300'
                    }`}
                    title="Change document lifecycle status"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted (Won)</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <h4 
                  className="text-sm font-bold text-slate-900 mt-2.5 line-clamp-1 hover:text-orange-600 cursor-pointer transition-colors" 
                  onClick={() => handleOpenPDF(q)}
                >
                  {q.title}
                </h4>

                <p className="text-xs text-slate-600 mt-1.5 truncate">
                  <span className="font-semibold text-slate-400">To:</span> {clientName}
                </p>

                <p className="text-[11px] text-slate-400 mt-1 font-medium">Date: {q.date}</p>

                {/* Items / Splits preview */}
                <div className="mt-3.5 space-y-1.5 p-3 bg-slate-50/80 border border-slate-200 rounded-xl">
                  {q.items && q.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                      <span className="truncate max-w-[70%] font-medium">{item.description}</span>
                      <span className="font-bold text-slate-800">{item.breakdown || `${item.qty}x`}</span>
                    </div>
                  ))}
                  {isInvoice && q.advancePaid > 0 && (
                    <div className="flex justify-between text-[11px] text-amber-700 font-bold pt-1.5 border-t border-slate-200">
                      <span>Advance Paid: ₹{new Intl.NumberFormat('en-IN').format(q.advancePaid)}</span>
                      <span>Remaining: ₹{new Intl.NumberFormat('en-IN').format(q.remaining || 0)}</span>
                    </div>
                  )}
                </div>

                {/* Billing Stage Action: Generate Tax Invoice from Accepted Quotation */}
                {q.status === 'Accepted' && !isInvoice && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                      ✓ Deal Accepted
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenFormNew('Invoice', q)}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer"
                      title="Create official Tax Invoice at billing stage"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-600" />
                      <span>Generate Invoice</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Footer and controls */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Price</p>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(q.total)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenPDF(q)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold hover-scale cursor-pointer"
                    title="View PDF (SETU Format)"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer"
                    title="Edit Document"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSendWhatsApp(q)}
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Send via WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  {(currentUser?.role === 'Admin' || currentUser?.role === 'Super Admin') && (
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {filteredQuotes.length === 0 && (
          <div className="col-span-full py-16 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-orange-50/20">
            <FileText className="w-12 h-12 mb-3 text-orange-400" />
            <p className="text-sm font-bold text-slate-800">No documents matching your search</p>
            <p className="text-xs text-slate-500 mt-1">Click "New Quotation" or "New Invoice" to create a document with the official SETU template.</p>
          </div>
        )}
      </div>

      {/* Quotation & Invoice Form Modal */}
      <QuotationForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        clientOrLeadId={formPrefillId}
        type={formPrefillType}
        quotationToEdit={quoteToEdit}
        defaultDocType={activeDocType}
      />

      {/* PDF Viewer Modal (Exact Setu Format) */}
      <QuotationPDFModal
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        quotation={selectedQuote}
        clientOrLead={selectedQuote ? getEntityRecord(selectedQuote.clientOrLeadId, selectedQuote.type) : null}
      />

    </div>
  );
};

export default Quotations;
