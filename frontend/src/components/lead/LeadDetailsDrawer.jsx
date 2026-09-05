import React, { useState } from 'react';
import { useCRM, normalizeDocumentId } from '../../context/CRMContext';
import QuotationPDFModal from '../quotation/QuotationPDFModal';
import { 
  X, 
  Send, 
  FileText, 
  IndianRupee, 
  MessageSquare, 
  UserCheck, 
  Calendar, 
  Phone, 
  Mail, 
  FilePlus, 
  MapPin, 
  Eye, 
  Copy, 
  Check, 
  Receipt,
  Code
} from 'lucide-react';

const LeadDetailsDrawer = ({ isOpen, onClose, lead, onAddQuoteForLead, onAddPaymentForLead }) => {
  if (!isOpen || !lead) return null;

  const { 
    quotations, 
    payments, 
    whatsappLogs, 
    addWhatsAppLog, 
    updateLeadStatus,
    clients,
    currentUser 
  } = useCRM();

  const [activeTab, setActiveTab] = useState('quotes'); // quotes, info, payments, whatsapp, json
  const [chatMessage, setChatMessage] = useState('');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfDoc, setSelectedPdfDoc] = useState(null);
  const [copiedJSON, setCopiedJSON] = useState(false);

  // 1. Find client if converted
  const clientRecord = clients.find(c => c.phone === lead.phone || c.email === lead.email);
  const isConverted = lead.status === 'Won' || !!clientRecord;
  const entityId = isConverted && clientRecord ? clientRecord.id : lead.id;
  const entityType = isConverted ? 'client' : 'lead';

  // 2. Filter linked records
  const linkedQuotes = quotations.filter(q => (q.clientOrLeadId === entityId && q.type === entityType) || q.clientOrLeadId === lead.id);
  const clientPayments = isConverted ? payments.filter(p => p.clientId === entityId) : [];
  const clientChat = whatsappLogs.filter(w => w.clientPhone === lead.phone);

  // Active Lead Quotation JSON
  const leadQuotationData = lead.quotation || (linkedQuotes.length > 0 ? linkedQuotes[0] : null);

  const handleOpenDocPDF = (doc) => {
    setSelectedPdfDoc(doc);
    setPdfModalOpen(true);
  };

  const handleCopyLeadJSON = () => {
    if (!leadQuotationData) return;
    navigator.clipboard.writeText(JSON.stringify(leadQuotationData, null, 2));
    setCopiedJSON(true);
    setTimeout(() => setCopiedJSON(false), 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    addWhatsAppLog(lead.phone, chatMessage, 'outbound');
    setChatMessage('');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'Contacted': return 'bg-amber-500/10 text-amber-400 border border-amber-500/30';
      case 'Quoted': return 'bg-purple-500/10 text-purple-400 border border-purple-500/30';
      case 'Negotiation': return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30';
      case 'Won': return 'bg-brand-500/10 text-brand-400 border border-brand-500/30';
      case 'Lost': return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/30';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl border-l border-slate-800 bg-slate-900 shadow-2xl flex flex-col h-full animate-[slideLeft_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-slate-100">{lead.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(lead.status)}`}>
                {lead.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">Lead ID: {lead.id} {isConverted && `| Client: ${clientRecord?.id}`}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Headers */}
        <div className="flex px-4 border-b border-slate-800 bg-slate-950/20 overflow-x-auto">
          {[
            { id: 'quotes', label: 'Quotation / Bill', icon: FileText },
            { id: 'json', label: 'Quotation JSON', icon: Code },
            { id: 'info', label: 'Lead Info', icon: UserCheck },
            { id: 'payments', label: 'Payments', icon: IndianRupee },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  active 
                    ? 'border-brand-500 text-brand-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Tab: Quotations & Invoices */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Lead Quotations & Invoices ({linkedQuotes.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddQuoteForLead(lead.id, 'lead')}
                    className="flex items-center gap-1 text-xs font-bold text-slate-950 bg-gradient-to-r from-brand-400 to-emerald-500 hover:from-brand-500 hover:to-emerald-600 px-3 py-1.5 rounded-xl hover-scale shadow-md shadow-brand-500/10"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Create Quote / Invoice</span>
                  </button>
                </div>
              </div>

              {/* Display lead.quotation if saved */}
              {leadQuotationData && (
                <div className="p-5 bg-slate-950/60 border border-brand-500/30 rounded-2xl relative overflow-hidden shadow-lg">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
                        {leadQuotationData.docType === 'Invoice' ? <Receipt className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-brand-400">
                            {normalizeDocumentId(leadQuotationData.docNumber || leadQuotationData.id, leadQuotationData.date)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-brand-500/15 text-brand-300 border border-brand-500/25">
                            {leadQuotationData.docType || 'Quotation'}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-100 mt-1">{leadQuotationData.title || leadQuotationData.clientName}</h5>
                      </div>
                    </div>

                    <span className="text-sm font-black text-brand-400 font-mono">
                      ₹{new Intl.NumberFormat('en-IN').format(leadQuotationData.total || 30000)}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                    <p><span className="text-slate-500">Address:</span> {leadQuotationData.address || lead.address || 'Nagpur'}</p>
                    <p><span className="text-slate-500">Date:</span> {leadQuotationData.date}</p>
                    {leadQuotationData.docType === 'Invoice' && (
                      <p className="text-amber-400 font-medium">
                        Advance Paid: ₹{new Intl.NumberFormat('en-IN').format(leadQuotationData.advancePaid || 0)} | Remaining: ₹{new Intl.NumberFormat('en-IN').format(leadQuotationData.remaining || 0)}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => handleOpenDocPDF(leadQuotationData)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-brand-400 hover:bg-brand-500 rounded-xl hover-scale transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Print PDF (SETU Format)</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('json')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700"
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>View JSON</span>
                    </button>
                  </div>
                </div>
              )}

              {linkedQuotes.length === 0 && !leadQuotationData ? (
                <div className="py-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center text-slate-500 bg-slate-950/10">
                  <FileText className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold">No quotation or invoice saved in this lead yet</p>
                  <button
                    onClick={() => onAddQuoteForLead(lead.id, 'lead')}
                    className="mt-3 px-3.5 py-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 rounded-xl border border-brand-500/20 bg-brand-500/5 hover:bg-brand-500/10"
                  >
                    Generate First Quotation
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {linkedQuotes.map(q => (
                    <div 
                      key={q.id}
                      className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-semibold text-slate-200">{q.title}</h5>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-300">
                            {q.docType || 'Quote'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          ID: {normalizeDocumentId(q.id, q.date)} | Date: {q.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-200">
                            ₹{new Intl.NumberFormat('en-IN').format(q.total)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {q.items?.length || 1} rows
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenDocPDF(q)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-brand-400 hover:text-brand-300 hover-scale"
                          title="View PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Quotation JSON Viewer */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Quotation JSON Stored in Lead Object
                </h4>
                {leadQuotationData && (
                  <button
                    onClick={handleCopyLeadJSON}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl transition-all"
                  >
                    {copiedJSON ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJSON ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                )}
              </div>

              {leadQuotationData ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                    {JSON.stringify(leadQuotationData, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="py-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center text-slate-500 bg-slate-950/10">
                  <Code className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold">No quotation JSON saved inside this lead yet</p>
                  <p className="text-xs text-slate-600 mt-1">Create a quotation or invoice to attach the JSON to this lead record.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Info */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/30 border border-slate-800/60 rounded-2xl flex items-center gap-3">
                  <Phone className="w-5 h-5 text-brand-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Phone</p>
                    <p className="text-sm font-semibold text-slate-200">{lead.phone}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/30 border border-slate-800/60 rounded-2xl flex items-center gap-3">
                  <Mail className="w-5 h-5 text-brand-400 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-slate-500">Email</p>
                    <p className="text-sm font-semibold text-slate-200 truncate">{lead.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/30 border border-slate-800/60 rounded-2xl flex items-center gap-3 sm:col-span-2">
                  <MapPin className="w-5 h-5 text-brand-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Address</p>
                    <p className="text-xs font-semibold text-slate-200">{lead.address || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/30 border border-slate-800/60 rounded-2xl flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-brand-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Created Date</p>
                    <p className="text-sm font-semibold text-slate-200">{lead.createdDate}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-950/30 border border-slate-800/60 rounded-2xl flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-brand-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Assigned To</p>
                    <p className="text-sm font-semibold text-slate-200">{lead.assignedTo}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Discovery Notes</h4>
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                  <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {lead.notes || 'No notes available for this lead.'}
                  </p>
                </div>
              </div>

              {/* Status Update Trigger Bar */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Pipeline Status Control</h4>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-950/20 border border-slate-800 rounded-2xl">
                  {['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'].map(st => {
                    const isCurrent = lead.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => updateLeadStatus(lead.id, st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isCurrent 
                            ? 'bg-brand-500 text-slate-950 border-brand-400 font-bold' 
                            : 'bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-800'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
                {isConverted && (
                  <div className="mt-3 p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                    <p className="text-xs font-semibold text-brand-300">
                      Successfully Converted to Client record. Linked records now display client logs.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Payments */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {!isConverted ? (
                <div className="py-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center text-slate-500 bg-slate-950/10 text-center px-4">
                  <IndianRupee className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">Lead is not converted to Client yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Payments are only tracked for full client records. Convert status to "Won" to activate client billing.
                  </p>
                </div>
              ) : clientPayments.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center text-slate-500 bg-slate-950/10">
                  <IndianRupee className="w-8 h-8 mb-2" />
                  <p className="text-sm font-semibold">No payment schedules recorded</p>
                  <button
                    onClick={() => onAddPaymentForLead(entityId)}
                    className="mt-4 px-3.5 py-1.5 text-xs font-bold text-brand-400 hover:text-brand-300 rounded-xl border border-brand-500/20 bg-brand-500/5 hover:bg-brand-500/10 hover-scale"
                  >
                    Set Instalment Schedule
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {clientPayments.map(p => {
                    const totalPaid = p.instalments.filter(i => i.status === 'Paid').reduce((sum, item) => sum + item.amount, 0);
                    const percent = p.totalAmount > 0 ? Math.round((totalPaid / p.totalAmount) * 100) : 0;
                    return (
                      <div key={p.id} className="p-4 bg-slate-950/40 border border-slate-800 rounded-2xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-semibold text-slate-200">Quote: {p.quotationId}</h5>
                            <p className="text-xs text-slate-400 mt-0.5">Total Schedule: ₹{new Intl.NumberFormat('en-IN').format(p.totalAmount)}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'Paid in Full' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30' :
                            p.status === 'Partial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="mt-4">
                          <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                            <span>Paid: ₹{new Intl.NumberFormat('en-IN').format(totalPaid)}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                            <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: WhatsApp chat */}
          {activeTab === 'whatsapp' && (
            <div className="flex flex-col h-[50vh] border border-slate-800 bg-slate-950/20 rounded-2xl overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
                <div className="space-y-3 flex flex-col justify-end">
                  {clientChat.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                      <MessageSquare className="w-8 h-8 mb-2" />
                      <p className="text-sm font-semibold">No messages exchanged yet</p>
                    </div>
                  ) : (
                    clientChat.map(msg => {
                      const isOutbound = msg.direction === 'outbound';
                      return (
                        <div 
                          key={msg.id}
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-xs flex flex-col ${
                            isOutbound 
                              ? 'self-end bg-brand-600/15 text-slate-200 border border-brand-500/25 rounded-tr-none' 
                              : 'self-start bg-slate-855 text-slate-300 border border-slate-800 rounded-tl-none'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <span className="text-[9px] text-slate-500 self-end mt-1">{msg.timestamp.substring(11, 16)}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950/60 flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message to simulate live WhatsApp..."
                  className="flex-1 px-4 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl outline-none text-slate-100"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold transition-all hover-scale"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* PDF Viewer Modal */}
      {pdfModalOpen && selectedPdfDoc && (
        <QuotationPDFModal
          isOpen={pdfModalOpen}
          onClose={() => setPdfModalOpen(false)}
          quotation={selectedPdfDoc}
          clientOrLead={lead}
        />
      )}
    </>
  );
};

export default LeadDetailsDrawer;
