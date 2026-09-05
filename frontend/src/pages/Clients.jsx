import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import QuotationPDFModal from '../components/quotation/QuotationPDFModal';
import { 
  UserSquare2, 
  Search, 
  Eye, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  IndianRupee, 
  FileText, 
  Bell, 
  MessageSquare,
  Send,
  SlidersHorizontal,
  FolderOpen,
  ArrowUpRight,
  TrendingUp,
  FilePlus,
  ArrowRight
} from 'lucide-react';

const Clients = ({ initialClientId = '', addQuoteTrigger, addPaymentTrigger }) => {
  const { 
    clients, 
    leads, 
    quotations, 
    payments, 
    reminders, 
    whatsappLogs, 
    recordPaymentPayment, 
    triggerClientReminderImmediately,
    addWhatsAppLog,
    currentUser,
    getTodayDateString
  } = useCRM();

  // Search & Navigation States
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || (clients.length > 0 ? clients[0].id : ''));
  const [activeTab, setActiveTab] = useState('profile'); // profile, quotes, payments, reminders, whatsapp
  const [chatMsg, setChatMsg] = useState('');
  
  // PDF Preview states
  const [pdfOpen, setPdfOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  // 1. Calculations & Selectors
  const activeClient = clients.find(c => c.id === selectedClientId);

  const filteredClients = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                        c.companyName.toLowerCase().includes(search.toLowerCase()) || 
                        c.phone.includes(search) || 
                        (c.email && c.email.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  // 2. Fetch linked data for active client
  const clientLeadInfo = leads.find(l => l.phone === activeClient?.phone || l.email === activeClient?.email);
  const clientQuotes = activeClient ? quotations.filter(q => q.clientOrLeadId === activeClient.id && q.type === 'client') : [];
  const clientPayments = activeClient ? payments.filter(p => p.clientId === activeClient.id) : [];
  const clientReminders = activeClient ? reminders.filter(r => r.clientId === activeClient.id) : [];
  const clientChat = activeClient ? whatsappLogs.filter(w => w.clientPhone === activeClient.phone) : [];

  // 3. Payment Aggregations for Active Client
  const totalValue = clientPayments.reduce((sum, p) => sum + p.totalAmount, 0);
  const paidAmount = clientPayments.reduce((sum, p) => {
    return sum + p.instalments.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  }, 0);
  const balanceAmount = totalValue - paidAmount;
  const progressPercent = totalValue > 0 ? Math.round((paidAmount / totalValue) * 100) : 0;

  // Handlers
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim() || !activeClient) return;
    addWhatsAppLog(activeClient.phone, chatMsg, 'outbound');
    setChatMsg('');
  };

  const handleManualRemind = () => {
    if (!activeClient) return;
    if (balanceAmount <= 0) {
      alert("This client has no outstanding balance to remind them for.");
      return;
    }
    // Find next pending instalment
    let nextInst = null;
    for (const p of clientPayments) {
      const pending = p.instalments.find(i => i.status === 'Pending');
      if (pending) {
        nextInst = pending;
        break;
      }
    }

    const remindAmt = nextInst ? nextInst.amount : balanceAmount;
    const remindDate = nextInst ? nextInst.dueDate : getTodayDateString();

    triggerClientReminderImmediately(activeClient, remindAmt, remindDate);
    alert(`Manual invoice alert dispatched via WhatsApp to ${activeClient.name} for amount ₹${remindAmt}. Log updated.`);
  };

  const handleOpenQuotePDF = (q) => {
    setSelectedQuote(q);
    setPdfOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      {/* Left Panel: Client List */}
      <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col h-[75vh]">
        {/* Search */}
        <div className="p-4 border-b border-slate-850">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search clients list..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl outline-none text-slate-100 placeholder-slate-500 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
          {filteredClients.map(c => {
            const isSelected = c.id === selectedClientId;
            return (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedClientId(c.id);
                  setActiveTab('profile');
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-brand-600/10 border-brand-500/30 text-brand-400' 
                    : 'bg-slate-950/20 border-slate-850/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-brand-400 font-extrabold' : 'text-slate-200 group-hover:text-brand-400'}`}>
                    {c.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 block mt-1 font-semibold">{c.companyName}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'text-brand-400 translate-x-1' : 'text-slate-600 group-hover:text-slate-400'}`} />
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
              No clients found.
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Unified Client Workspace */}
      <div className="lg:col-span-2 flex flex-col bg-slate-900/20 border border-slate-800 rounded-2xl h-[75vh] overflow-hidden">
        {activeClient ? (
          <>
            {/* Workspace Header */}
            <div className="p-6 border-b border-slate-850 bg-slate-950/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <UserSquare2 className="w-5 h-5 text-brand-400" />
                  <h3 className="text-base font-extrabold text-slate-100">{activeClient.name}</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-semibold">Company: {activeClient.companyName} | Client ID: {activeClient.id}</p>
              </div>

              {/* Outstanding Alert status */}
              {balanceAmount > 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleManualRemind}
                    className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-extrabold uppercase bg-brand-400 hover:bg-brand-500 text-slate-950 rounded-xl hover-scale transition-colors shadow-md shadow-brand-500/10"
                  >
                    <Bell className="w-3 h-3 animate-bounce" />
                    <span>WhatsApp Reminder</span>
                  </button>
                </div>
              ) : (
                <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-brand-500/15 text-brand-400 border border-brand-500/25">
                  Paid in Full
                </span>
              )}
            </div>

            {/* Workspace Workspace Tabs */}
            <div className="flex border-b border-slate-850 bg-slate-950/15 px-3">
              {[
                { id: 'profile', label: 'Client Profile', icon: Building2 },
                { id: 'quotes', label: 'Quotes Log', icon: FileText },
                { id: 'payments', label: 'Payments splits', icon: IndianRupee },
                { id: 'reminders', label: 'Reminders', icon: Bell },
                { id: 'whatsapp', label: 'WhatsApp Thread', icon: MessageSquare }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all ${
                      active 
                        ? 'border-brand-500 text-brand-400' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Workspace Workspace Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950/5">
              
              {/* Tab: Profile Overview */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center gap-3">
                      <Phone className="w-5 h-5 text-brand-400 flex-shrink-0" />
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-500">Phone Contact</span>
                        <span className="text-xs font-semibold text-slate-200">{activeClient.phone}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center gap-3">
                      <Mail className="w-5 h-5 text-brand-400 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <span className="block text-[9px] uppercase font-bold text-slate-500">Email Address</span>
                        <span className="text-xs font-semibold text-slate-200 truncate block">{activeClient.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-brand-400 flex-shrink-0" />
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-500">Converted On</span>
                        <span className="text-xs font-semibold text-slate-200">{activeClient.convertedDate}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-brand-400 flex-shrink-0" />
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-500">Source Lead Origin</span>
                        <span className="text-xs font-semibold text-slate-200">{activeClient.source}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl flex items-center gap-3 sm:col-span-2">
                      <Building2 className="w-5 h-5 text-brand-400 flex-shrink-0" />
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-500">Office / Billing Address</span>
                        <span className="text-xs font-semibold text-slate-200">{activeClient.address || 'Naka No. 10, Revti Complex, Nagpur, 440023'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2.5">Discovery & Project details</h4>
                    <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {activeClient.notes || 'No discovery notes recorded.'}
                    </div>
                  </div>

                  {clientLeadInfo && (
                    <div className="p-4 bg-brand-500/5 border border-brand-500/10 rounded-2xl">
                      <span className="block text-[9px] uppercase font-bold text-brand-400 mb-1.5">Lead Pipeline Log Reference</span>
                      <p className="text-xs text-slate-400">
                        Originating Lead ID was <span className="font-mono text-slate-200">{clientLeadInfo.id}</span>. 
                        Assigned to representative <span className="text-slate-200 font-semibold">{clientLeadInfo.assignedTo}</span>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Quotations History */}
              {activeTab === 'quotes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Quotations History ({clientQuotes.length})</h4>
                    <button
                      onClick={() => addQuoteTrigger(activeClient.id, 'client')}
                      className="flex items-center gap-1 text-[10px] font-bold text-brand-400 hover:text-brand-300 px-3 py-1.5 border border-brand-500/20 bg-brand-500/5 rounded-xl hover-scale"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Quote</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {clientQuotes.map(q => (
                      <div key={q.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-extrabold text-slate-200">{q.title}</h5>
                          <p className="text-[10px] text-slate-500 mt-1">ID: <span className="font-mono">{q.id}</span> | Date: {q.date}</p>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold mt-2 uppercase ${
                            q.status === 'Accepted' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {q.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-xs font-black text-brand-400">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(q.total)}
                            </p>
                            <span className="text-[9px] text-slate-500 mt-0.5 block">{q.items.length} services</span>
                          </div>
                          <button
                            onClick={() => handleOpenQuotePDF(q)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-slate-200"
                            title="Invoice Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {clientQuotes.length === 0 && (
                      <div className="py-12 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-950/5">
                        <FileText className="w-8 h-8 mb-2" />
                        <span className="text-xs font-semibold">No quotations drafted yet</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Payments History */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  {/* Aggregation card */}
                  <div className="p-5 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Total Contract</span>
                        <p className="text-sm font-black text-slate-200 mt-1">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalValue)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-semibold">Total Paid</span>
                        <p className="text-sm font-black text-brand-400 mt-1">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paidAmount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Balance</span>
                        <p className="text-sm font-black text-rose-400 mt-1">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(balanceAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Progress visual */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>Collections Ratio</span>
                        <span>{progressPercent}% Collected</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Linked Invoice Schedules</h4>
                    {clientQuotes.some(q => q.status === 'Accepted' && !clientPayments.some(p => p.quotationId === q.id)) && (
                      <button
                        onClick={() => addPaymentTrigger(activeClient.id)}
                        className="flex items-center gap-1 text-[10px] font-bold text-brand-400 hover:text-brand-300 px-3 py-1.5 border border-brand-500/20 bg-brand-500/5 rounded-xl hover-scale"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Schedule</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {clientPayments.map(p => (
                      <div key={p.id} className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-500">ID: {p.id}</span>
                            <h5 className="text-xs font-bold text-slate-300 mt-0.5">Quote Ref: {p.quotationId}</h5>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            p.status === 'Paid in Full' ? 'bg-brand-500/10 text-brand-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* List instalments */}
                        <div className="space-y-2">
                          {p.instalments.map((inst, index) => {
                            const isPaid = inst.status === 'Paid';
                            return (
                              <div key={inst.id} className="p-2.5 bg-slate-950/50 border border-slate-900 rounded-lg flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold text-slate-300">Instalment {index+1}</span>
                                  <p className="text-[9px] text-slate-500 mt-0.5">Due date: {inst.dueDate}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-slate-200">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inst.amount)}
                                  </span>
                                  {!isPaid ? (
                                    <button
                                      onClick={() => recordPaymentPayment(p.id, inst.id)}
                                      className="px-2 py-0.5 text-[9px] font-bold text-slate-950 bg-brand-400 hover:bg-brand-500 rounded transition-colors"
                                    >
                                      Collect
                                    </button>
                                  ) : (
                                    <span className="text-[9px] font-bold text-brand-400">Paid ({inst.paidDate})</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {clientPayments.length === 0 && (
                      <div className="py-12 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-950/5 text-center px-4">
                        <IndianRupee className="w-8 h-8 mb-2" />
                        <span className="text-xs font-semibold">No payment schedules drafted</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Reminders */}
              {activeTab === 'reminders' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Automated Reminders History</h4>
                  
                  <div className="space-y-2.5">
                    {clientReminders.map(rem => (
                      <div key={rem.id} className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-slate-300">Trigger: {rem.triggerType.replace('_', ' ')}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Amount: ₹{rem.amount} | Due: {rem.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${
                            rem.status === 'Sent' ? 'bg-brand-500/10 text-brand-400 border border-brand-500/25' :
                            rem.status === 'Pending' ? 'bg-slate-850 text-slate-500 border border-slate-800' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                          }`}>
                            {rem.status}
                          </span>
                          {rem.sentDate && <p className="text-[9px] text-slate-500 mt-1">Sent: {rem.sentDate}</p>}
                        </div>
                      </div>
                    ))}

                    {clientReminders.length === 0 && (
                      <div className="py-12 border border-dashed border-slate-850 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-950/5">
                        <Bell className="w-8 h-8 mb-2" />
                        <span className="text-xs font-semibold">No reminders scheduled</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: WhatsApp Live Chat Simulation */}
              {activeTab === 'whatsapp' && (
                <div className="flex flex-col h-[48vh] border border-slate-800 bg-slate-950/30 rounded-2xl overflow-hidden">
                  
                  {/* Messages log */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse">
                    <div className="space-y-3 flex flex-col justify-end">
                      {clientChat.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-600 text-center px-4">
                          <MessageSquare className="w-8 h-8 mb-2" />
                          <span className="text-xs font-semibold">WhatsApp conversation thread empty</span>
                          <span className="text-[10px] text-slate-700 mt-1">Fired system notifications will appear here.</span>
                        </div>
                      ) : (
                        clientChat.map(msg => {
                          const isOutbound = msg.direction === 'outbound';
                          return (
                            <div 
                              key={msg.id}
                              className={`max-w-[75%] rounded-2xl px-4 py-2 text-xs flex flex-col ${
                                isOutbound 
                                  ? 'self-end bg-brand-600/15 text-slate-200 border border-brand-500/20 rounded-tr-none' 
                                  : 'self-start bg-slate-850 text-slate-300 border border-slate-800 rounded-tl-none'
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              <span className="text-[8px] text-slate-500 self-end mt-1">{msg.timestamp.substring(11, 16)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendChat} className="p-3 border-t border-slate-800 bg-slate-950/60 flex gap-2">
                    <input
                      type="text"
                      placeholder="Type custom message to simulate live chat (auto-reply in 2s)..."
                      className="flex-1 px-4 py-2 text-xs bg-slate-900 border border-slate-800 focus:border-brand-500 focus:ring-0 rounded-xl outline-none text-slate-100 placeholder-slate-500"
                      value={chatMsg}
                      onChange={e => setChatMsg(e.target.value)}
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
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <FolderOpen className="w-12 h-12 mb-3" />
            <p className="text-sm font-semibold">No active customer selected</p>
            <p className="text-xs text-slate-600 mt-1">Choose a client from the left pane to open their workspace.</p>
          </div>
        )}
      </div>

      {/* PDF preview modal */}
      <QuotationPDFModal
        isOpen={pdfOpen}
        onClose={() => setPdfOpen(false)}
        quotation={selectedQuote}
        clientOrLead={selectedQuote ? activeClient : null}
      />

    </div>
  );
};

export default Clients;
