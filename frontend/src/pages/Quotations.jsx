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
  SlidersHorizontal
} from 'lucide-react';

const Quotations = ({ initialOpenForm = false, prefilledId = '', prefilledType = 'client' }) => {
  const { 
    quotations, 
    leads, 
    clients, 
    updateQuotationStatus, 
    deleteQuotation, 
    currentUser 
  } = useCRM();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All'); // All, Quotation, Invoice
  const [statusFilter, setStatusFilter] = useState('All');
  
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

  const handleOpenFormNew = (type = 'Quotation') => {
    setQuoteToEdit(null);
    setActiveDocType(type);
    setFormPrefillId('');
    setFormPrefillType('client');
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

  const handleSendWhatsApp = (q) => {
    updateQuotationStatus(q.id, 'Sent');
    alert(`${q.docType || 'Document'} ${q.id} logged in WhatsApp communications.`);
  };

  const handleAcceptQuote = (qId) => {
    updateQuotationStatus(qId, 'Accepted');
  };

  const handleRejectQuote = (qId) => {
    updateQuotationStatus(qId, 'Rejected');
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row flex-1 gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by title, SETU Serial ID, or client name..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl outline-none text-slate-100 placeholder-slate-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2.5">
            <select
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-xl outline-none focus:border-brand-500"
              value={docTypeFilter}
              onChange={e => setDocTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              <option value="Quotation">Quotations Only</option>
              <option value="Invoice">Invoices (Bills) Only</option>
            </select>

            <select
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-xl outline-none focus:border-brand-500"
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
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-400 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/25 rounded-xl transition-all hover-scale"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </button>

          <button
            onClick={() => handleOpenFormNew('Invoice')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-xl hover-scale shadow-md shadow-amber-500/10"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>New Invoice (Bill)</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuotes.map(q => {
          const clientName = getEntityName(q.clientOrLeadId, q.type);
          const isInvoice = (q.docType || '').toLowerCase() === 'invoice';

          return (
            <div 
              key={q.id}
              className={`p-5 bg-slate-900/40 border rounded-2xl transition-all hover-scale flex flex-col justify-between ${
                isInvoice ? 'border-amber-500/30 hover:border-amber-500/50' : 'border-slate-800 hover:border-slate-700/60'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-brand-400">{q.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                      isInvoice ? 'bg-amber-500/15 text-amber-300 border border-amber-500/25' : 'bg-brand-500/15 text-brand-300 border border-brand-500/25'
                    }`}>
                      {q.docType || 'Quotation'}
                    </span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    q.status === 'Accepted' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' :
                    q.status === 'Sent' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                    q.status === 'Draft' ? 'bg-slate-800 text-slate-400 border border-slate-700/40' :
                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {q.status}
                  </span>
                </div>

                <h4 
                  className="text-sm font-bold text-slate-200 mt-2.5 line-clamp-1 hover:text-brand-400 cursor-pointer transition-colors" 
                  onClick={() => handleOpenPDF(q)}
                >
                  {q.title}
                </h4>

                <p className="text-xs text-slate-400 mt-1.5 truncate">
                  <span className="font-semibold text-slate-500">To:</span> {clientName}
                </p>

                <p className="text-[10px] text-slate-500 mt-1">Date: {q.date}</p>

                {/* Items / Splits preview */}
                <div className="mt-3.5 space-y-1 p-2.5 bg-slate-950/40 border border-slate-850 rounded-xl">
                  {q.items && q.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[70%]">{item.description}</span>
                      <span className="font-semibold text-slate-300">{item.breakdown || `${item.qty}x`}</span>
                    </div>
                  ))}
                  {isInvoice && q.advancePaid > 0 && (
                    <div className="flex justify-between text-[10px] text-amber-400 pt-1 border-t border-slate-800">
                      <span>Advance Paid: ₹{new Intl.NumberFormat('en-IN').format(q.advancePaid)}</span>
                      <span>Remaining: ₹{new Intl.NumberFormat('en-IN').format(q.remaining || 0)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer and controls */}
              <div className="mt-5 pt-3.5 border-t border-slate-850 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Price</p>
                  <p className="text-sm font-black text-slate-100 mt-0.5">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(q.total)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenPDF(q)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-300 hover:text-white text-xs font-semibold hover-scale"
                    title="View PDF (SETU Format)"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-slate-200"
                    title="Edit Document"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSendWhatsApp(q)}
                    className="p-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500 border border-brand-500/25 hover:border-transparent text-brand-400 hover:text-slate-950 transition-colors"
                    title="Send via WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  {currentUser.role === 'Admin' && (
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-red-400"
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
          <div className="col-span-full py-16 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/10">
            <FileText className="w-12 h-12 mb-3" />
            <p className="text-sm font-semibold">No documents matching your search</p>
            <p className="text-xs text-slate-600 mt-1">Click "New Quotation" or "New Invoice" to create a document with the official SETU template.</p>
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
