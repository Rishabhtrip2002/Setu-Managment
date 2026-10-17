import React, { useState } from 'react';
import { useCRM, normalizeDocumentId, normalizePhoneNumber } from '../../context/CRMContext';
import QuotationPDFModal from '../quotation/QuotationPDFModal';
import FollowUpModal from '../followup/FollowUpModal';
import CallLogModal from '../telecaller/CallLogModal';
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
  Check, 
  Receipt,
  CalendarClock,
  RotateCw,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  PhoneCall,
  History,
  PhoneForwarded,
  Timer
} from 'lucide-react';

const LeadDetailsDrawer = ({ isOpen, onClose, lead, onAddQuoteForLead, onAddPaymentForLead }) => {
  if (!isOpen || !lead) return null;

  const { 
    quotations, 
    payments, 
    whatsappLogs, 
    addWhatsAppLog, 
    updateLeadStatus,
    updateLead,
    clients,
    followUps,
    completeFollowUp,
    deleteFollowUp,
    getTodayDateString,
    currentUser,
    employees
  } = useCRM();

  const [activeTab, setActiveTab] = useState('calls'); // calls, quotes, followups, info, payments, whatsapp
  const [chatMessage, setChatMessage] = useState('');
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfDoc, setSelectedPdfDoc] = useState(null);
  
  // Follow-up modal states
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [followUpNotice, setFollowUpNotice] = useState(null);

  // Telecaller call modal state
  const [callLogModalOpen, setCallLogModalOpen] = useState(false);

  // 1. Find client if converted (idempotently linked via convertedClientId, originatingLeadId, or normalized phone)
  const normLeadPhone = normalizePhoneNumber(lead.phone);
  const clientRecord = clients.find(c => 
    c.id === lead.convertedClientId || 
    c.originatingLeadId === lead.id || 
    (normLeadPhone && normalizePhoneNumber(c.phone) === normLeadPhone) || 
    (lead.email && c.email === lead.email)
  );
  const isConverted = lead.status === 'Won' || !!clientRecord;
  const entityId = isConverted && clientRecord ? clientRecord.id : lead.id;
  const entityType = isConverted ? 'client' : 'lead';

  // 2. Filter linked records
  const linkedQuotes = quotations.filter(q => (q.clientOrLeadId === entityId && q.type === entityType) || q.clientOrLeadId === lead.id);
  const clientPayments = isConverted ? payments.filter(p => p.clientId === entityId) : [];
  const clientChat = whatsappLogs.filter(w => w.clientPhone === lead.phone);
  
  // Follow-ups for this lead
  const leadFollowUps = followUps.filter(f => f.leadId === lead.id);
  const pendingFollowUps = leadFollowUps.filter(f => f.status === 'Pending');
  const completedFollowUps = leadFollowUps.filter(f => f.status === 'Completed');

  // Active Lead Quotation JSON
  const leadQuotationData = lead.quotation || (linkedQuotes.length > 0 ? linkedQuotes[0] : null);

  const handleOpenDocPDF = (doc) => {
    setSelectedPdfDoc(doc);
    setPdfModalOpen(true);
  };


  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    addWhatsAppLog(lead.phone, chatMessage, 'outbound');
    setChatMessage('');
  };

  const handleMarkDoneFollowUp = (fuId) => {
    completeFollowUp(fuId);
    setFollowUpNotice("Follow-up marked Done! Lead automatically moved to 'New' stage.");
    setTimeout(() => setFollowUpNotice(null), 4000);
  };

  const handleRescheduleFollowUp = (fu) => {
    setEditingFollowUp(fu);
    setFollowUpModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'Contacted': return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'Quoted': return 'bg-purple-50 text-purple-600 border border-purple-200';
      case 'Negotiation': return 'bg-indigo-50 text-indigo-600 border border-indigo-200';
      case 'Won': return 'bg-orange-50 text-orange-600 border border-orange-200';
      case 'Lost': return 'bg-rose-50 text-rose-600 border border-rose-200';
      default: return 'bg-slate-100 text-slate-600 border border-slate-200';
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl border-l border-slate-200 bg-white shadow-2xl flex flex-col h-full animate-[slideLeft_0.3s_ease-out] text-slate-800">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/90 gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-slate-900">{lead.name}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(lead.status)}`}>
                {lead.status}
              </span>
              {lead.coldLeadId && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 font-sans">
                  From Cold #{lead.coldLeadId}
                </span>
              )}
              {isConverted && clientRecord && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 font-sans">
                  Client #{clientRecord.id}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Lead ID: {lead.id} {lead.company ? `• ${lead.company}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a 
              href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all shadow-xs"
              title="Call on Phone"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Call</span>
            </a>

            <button
              onClick={() => setCallLogModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover-scale transition-all"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Log Outcome</span>
            </button>

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Headers */}
        <div className="flex px-4 border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
          {[
            { id: 'calls', label: 'Telecaller & Calls', icon: PhoneCall, badge: (lead.callLogs?.length || null) },
            { id: 'quotes', label: 'Quotation / Bill', icon: FileText },
            { id: 'followups', label: 'Follow-ups', icon: CalendarClock, badge: pendingFollowUps.length > 0 ? pendingFollowUps.length : null },
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
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  active 
                    ? 'border-orange-500 text-orange-600 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notice alert */}
        {followUpNotice && (
          <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{followUpNotice}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          
          {/* ======================================================== */}
          {/* Tab: Telecaller & Call Logs                              */}
          {/* ======================================================== */}
          {activeTab === 'calls' && (
            <div className="space-y-5">
              {/* Telecaller Assignment & Fast Dial Card */}
              <div className="p-4 bg-gradient-to-r from-orange-50 via-white to-amber-50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 border border-orange-200 flex items-center justify-center">
                    <PhoneForwarded className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Telecaller</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {(currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin' || currentUser?.role === 'Manager') ? (
                        <select
                          value={lead.assignedTo || 'Unassigned'}
                          onChange={(e) => {
                            const newRep = e.target.value;
                            const matchedEmp = employees.find(emp => emp.name === newRep);
                            updateLead(lead.id, { 
                              assignedTo: newRep, 
                              assignedToId: matchedEmp ? matchedEmp.id : '' 
                            });
                          }}
                          className="text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1 outline-none focus:border-orange-500 shadow-xs"
                        >
                          <option value="Unassigned">Unassigned</option>
                          {employees.filter(e => e.status === 'Active').map(emp => (
                            <option key={emp.id} value={emp.name}>{emp.name} ({emp.position || 'Staff'})</option>
                          ))}
                          {currentUser && !employees.some(e => e.name === currentUser.name) && (
                            <option value={currentUser.name}>{currentUser.name} (You)</option>
                          )}
                        </select>
                      ) : (
                        <p className="text-sm font-bold text-slate-800">{lead.assignedTo || 'Unassigned'}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call ({lead.phone})</span>
                  </a>
                  <button
                    onClick={() => setCallLogModalOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 hover-scale"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Record Attempt</span>
                  </button>
                </div>
              </div>

              {/* Lead Calling Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Calls</span>
                  <span className="text-base font-extrabold text-slate-900 mt-0.5 block">{lead.callLogs?.length || 0}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Last Outcome</span>
                  <span className="text-xs font-bold text-orange-600 mt-0.5 block truncate">
                    {lead.lastCallOutcome || 'Never Called'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Last Call Date</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block font-mono">
                    {lead.lastCallDate || 'N/A'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Next Follow-up</span>
                  <span className="text-xs font-bold text-emerald-600 mt-0.5 block truncate">
                    {pendingFollowUps[0] ? pendingFollowUps[0].dueDate : 'None'}
                  </span>
                </div>
              </div>

              {/* Chronological Call Attempts Activity Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-orange-500" />
                    <span>Call History & Discussion Timeline ({lead.callLogs?.length || 0})</span>
                  </h4>
                  <button
                    onClick={() => setCallLogModalOpen(true)}
                    className="text-xs text-orange-600 font-bold hover:underline"
                  >
                    + Log Call
                  </button>
                </div>

                {(!lead.callLogs || lead.callLogs.length === 0) ? (
                  <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 mb-2">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">No call attempts logged yet</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                      Dial {lead.name} at <span className="font-mono font-semibold">{lead.phone}</span> and log the conversation outcome.
                    </p>
                    <button
                      onClick={() => setCallLogModalOpen(true)}
                      className="mt-3.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold hover-scale shadow-sm"
                    >
                      Record First Call
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 pl-2">
                    {lead.callLogs.map((log) => {
                      const isInterested = log.outcome?.includes('Interested') && !log.outcome?.includes('Not Interested');
                      const isWon = log.outcome?.includes('Converted');
                      const isLost = log.outcome?.includes('Not Interested') || log.outcome?.includes('Wrong');
                      const isPending = log.outcome?.includes('No Answer') || log.outcome?.includes('Busy');

                      const badgeClass = isWon 
                        ? 'bg-purple-100 text-purple-800 border-purple-200' 
                        : isInterested 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : isLost 
                            ? 'bg-rose-100 text-rose-800 border-rose-200' 
                            : 'bg-amber-100 text-amber-800 border-amber-200';

                      return (
                        <div 
                          key={log.id} 
                          className="relative pl-6 pb-2"
                        >
                          {/* Dot on timeline */}
                          <div className={`absolute left-2.5 top-2.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
                            isWon ? 'bg-purple-500' : isInterested ? 'bg-emerald-500' : isLost ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />

                          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-orange-300 transition-colors space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeClass}`}>
                                  {log.outcome}
                                </span>
                                {log.duration && (
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                    <Timer className="w-3 h-3 text-slate-400" />
                                    {log.duration}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {log.timestamp || log.date}
                              </span>
                            </div>

                            {/* Discussion notes */}
                            {log.notes && (
                              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                                {log.notes}
                              </p>
                            )}

                            {/* Next follow-up indicator */}
                            {log.nextFollowUpDate && (
                              <div className="flex items-center gap-2 text-[11px] text-orange-700 bg-orange-50/70 border border-orange-200/80 px-2.5 py-1.5 rounded-xl font-medium">
                                <CalendarClock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                <span>
                                  Scheduled Next Follow-up: <span className="font-bold">{log.nextFollowUpDate}</span> at <span className="font-bold">{log.nextFollowUpTime || '11:00'}</span>
                                  {log.nextFollowUpReason && ` (${log.nextFollowUpReason})`}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                              <span>Telecaller: <span className="font-semibold text-slate-600">{log.callerName || 'Staff'}</span></span>
                              <span className="font-mono">Ref: {log.id}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ======================================================== */}
          {activeTab === 'followups' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Lead Follow-up Reminders ({leadFollowUps.length})
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Schedule calls, meetings, or WhatsApp touchpoints. Marking done resets stage to "New".
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingFollowUp(null);
                    setFollowUpModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-3.5 py-2 rounded-xl hover-scale shadow-md shadow-orange-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Set Follow-up</span>
                </button>
              </div>

              {/* Pending Follow-ups */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-orange-700 uppercase tracking-wide">
                  Pending Tasks ({pendingFollowUps.length})
                </h5>

                {pendingFollowUps.length === 0 ? (
                  <div className="py-8 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-4 bg-slate-50/60">
                    <CalendarClock className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-700">No pending follow-ups</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Click 'Set Follow-up' above to schedule a reminder.</p>
                  </div>
                ) : (
                  pendingFollowUps.map(fu => (
                    <div 
                      key={fu.id}
                      className="p-4 bg-white border border-orange-200/90 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">
                              {fu.type || 'Call'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              fu.priority === 'Urgent' ? 'bg-red-50 text-red-600 border border-red-200' :
                              fu.priority === 'High' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {fu.priority || 'High'}
                            </span>
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1 font-mono">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              {fu.dueDate} at {fu.dueTime || '11:00 AM'}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 mt-2">{fu.title}</h4>
                          {fu.notes && (
                            <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-xl border border-slate-100">
                              {fu.notes}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => deleteFollowUp(fu.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"
                          title="Delete follow-up"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleMarkDoneFollowUp(fu.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-xs hover-scale"
                            title="Done & move lead to New status"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Done (Move to New)</span>
                          </button>

                          <button
                            onClick={() => handleRescheduleFollowUp(fu)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
                          >
                            <RotateCw className="w-3.5 h-3.5 text-slate-500" />
                            <span>Reschedule</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-3 text-xs font-semibold">
                          <a href={`tel:${lead.phone}`} className="text-orange-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Call
                          </a>
                          <a href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Completed Follow-ups History */}
              {completedFollowUps.length > 0 && (
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                    Completed Follow-ups ({completedFollowUps.length})
                  </h5>
                  {completedFollowUps.map(fu => (
                    <div key={fu.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between opacity-80">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <span className="text-xs font-bold text-slate-800 line-through">{fu.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({fu.dueDate})</span>
                        </div>
                        {fu.completionNotes && (
                          <p className="text-[11px] text-slate-600 mt-1 pl-4">Note: {fu.completionNotes}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Done ✓
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* Tab: Quotations & Invoices                               */}
          {/* ======================================================== */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Lead Quotations & Invoices ({linkedQuotes.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onAddQuoteForLead(lead.id, 'lead')}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 px-3.5 py-1.5 rounded-xl hover-scale shadow-md shadow-orange-500/20"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Create Quote / Invoice</span>
                  </button>
                </div>
              </div>

              {/* Display lead.quotation if saved */}
              {leadQuotationData && (
                <div className="p-5 bg-white border border-orange-200 rounded-2xl relative overflow-hidden shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
                        {leadQuotationData.docType === 'Invoice' ? <Receipt className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-black text-orange-600">
                            {normalizeDocumentId(leadQuotationData.docNumber || leadQuotationData.id, leadQuotationData.date)}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-50 text-orange-700 border border-orange-200">
                            {leadQuotationData.docType || 'Quotation'}
                          </span>
                        </div>
                        <h5 className="text-sm font-bold text-slate-900 mt-1">{leadQuotationData.title || leadQuotationData.clientName}</h5>
                      </div>
                    </div>

                    <span className="text-sm font-black text-orange-600 font-mono">
                      ₹{new Intl.NumberFormat('en-IN').format(leadQuotationData.total || 30000)}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                    <p><span className="text-slate-400">Address:</span> {leadQuotationData.address || lead.address || 'Nagpur'}</p>
                    <p><span className="text-slate-400">Date:</span> {leadQuotationData.date}</p>
                    {leadQuotationData.docType === 'Invoice' && (
                      <p className="text-amber-700 font-medium">
                        Advance Paid: ₹{new Intl.NumberFormat('en-IN').format(leadQuotationData.advancePaid || 0)} | Remaining: ₹{new Intl.NumberFormat('en-IN').format(leadQuotationData.remaining || 0)}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenDocPDF(leadQuotationData)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale transition-all shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View & Print PDF (SETU Format)</span>
                    </button>
                  </div>
                </div>
              )}

              {linkedQuotes.length === 0 && !leadQuotationData ? (
                <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center text-slate-400 bg-slate-50/50">
                  <FileText className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No quotation or invoice saved in this lead yet</p>
                  <button
                    onClick={() => onAddQuoteForLead(lead.id, 'lead')}
                    className="mt-3 px-3.5 py-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100/70"
                  >
                    Generate First Quotation
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {linkedQuotes.map(q => (
                    <div 
                      key={q.id}
                      className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-orange-300 transition-colors flex items-center justify-between shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-semibold text-slate-900">{q.title}</h5>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {q.docType || 'Quote'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          ID: {normalizeDocumentId(q.id, q.date)} | Date: {q.date}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">
                            ₹{new Intl.NumberFormat('en-IN').format(q.total)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {q.items?.length || 1} rows
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenDocPDF(q)}
                          className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-600 hover-scale"
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


          {/* ======================================================== */}
          {/* Tab: Info                                                */}
          {/* ======================================================== */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <Phone className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Phone</p>
                    <p className="text-sm font-semibold text-slate-800">{lead.phone}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <Mail className="w-5 h-5 text-orange-500 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">{lead.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 sm:col-span-2">
                  <MapPin className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Address</p>
                    <p className="text-xs font-semibold text-slate-800">{lead.address || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Created Date</p>
                    <p className="text-sm font-semibold text-slate-800">{lead.createdDate}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Assigned To</p>
                    <p className="text-sm font-semibold text-slate-800">{lead.assignedTo}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Discovery Notes</h4>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {lead.notes || 'No notes available for this lead.'}
                  </p>
                </div>
              </div>

              {/* Status Update Trigger Bar */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Pipeline Status Control</h4>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-100/70 border border-slate-200 rounded-2xl">
                  {['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'].map(st => {
                    const isCurrent = lead.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => updateLeadStatus(lead.id, st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isCurrent 
                            ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-xs' 
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
                {isConverted && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    <p className="text-xs font-semibold text-orange-700">
                      Successfully Converted to Client record. Linked records now display client logs.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* Tab: Payments                                            */}
          {/* ======================================================== */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {!isConverted ? (
                <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center text-slate-400 bg-slate-50/50 text-center px-4">
                  <IndianRupee className="w-8 h-8 mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">Lead is not converted to Client yet</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Move status to 'Won' to automatically convert this lead into a client record with unified payment schedules.
                  </p>
                  <button 
                    onClick={() => updateLeadStatus(lead.id, 'Won')}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold hover-scale shadow-sm"
                  >
                    Mark Won & Convert Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Converted Client Payment Schedules ({clientPayments.length})
                    </h4>
                    <button
                      onClick={() => onAddPaymentForLead(clientRecord?.id || lead.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl hover-scale shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Installment</span>
                    </button>
                  </div>

                  {clientPayments.map(p => {
                    const totalPaid = p.installments?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
                    const percent = Math.round((totalPaid / p.totalAmount) * 100) || 0;
                    return (
                      <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-semibold text-slate-900">Quote: {p.quotationId}</h5>
                            <p className="text-xs text-slate-500 mt-0.5">Total Schedule: ₹{new Intl.NumberFormat('en-IN').format(p.totalAmount)}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'Paid in Full' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.status === 'Partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* Progress */}
                        <div className="mt-4">
                          <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                            <span>Paid: ₹{new Intl.NumberFormat('en-IN').format(totalPaid)}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* Tab: WhatsApp chat                                       */}
          {/* ======================================================== */}
          {activeTab === 'whatsapp' && (
            <div className="flex flex-col h-[50vh] border border-slate-200 bg-slate-50/50 rounded-2xl overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
                <div className="space-y-3 flex flex-col justify-end">
                  {clientChat.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                      <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-600">No messages exchanged yet</p>
                    </div>
                  ) : (
                    clientChat.map(msg => {
                      const isOutbound = msg.direction === 'outbound';
                      return (
                        <div 
                          key={msg.id}
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs flex flex-col ${
                            isOutbound 
                              ? 'self-end bg-orange-500 text-white rounded-tr-none shadow-xs' 
                              : 'self-start bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-xs'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <span className={`text-[9px] self-end mt-1 ${isOutbound ? 'text-orange-100' : 'text-slate-400'}`}>
                            {msg.timestamp.substring(11, 16)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                <input
                  type="text"
                  placeholder="Type a message to simulate live WhatsApp..."
                  className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl outline-none text-slate-900"
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all hover-scale shadow-sm"
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

      {/* Follow-up Modal inside drawer */}
      {followUpModalOpen && (
        <FollowUpModal
          isOpen={followUpModalOpen}
          onClose={() => setFollowUpModalOpen(false)}
          lead={lead}
          initialFollowUp={editingFollowUp}
        />
      )}

      {/* Telecaller Call Log Modal */}
      {callLogModalOpen && (
        <CallLogModal
          isOpen={callLogModalOpen}
          onClose={() => setCallLogModalOpen(false)}
          lead={lead}
          onSuccess={() => {
            setFollowUpNotice("Call attempt recorded successfully! History updated.");
            setTimeout(() => setFollowUpNotice(null), 4000);
          }}
        />
      )}
    </>
  );
};

export default LeadDetailsDrawer;
