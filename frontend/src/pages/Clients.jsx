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
  ArrowRight,
  Receipt,
  Plus,
  Fuel,
  UtensilsCrossed,
  Plane,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import ExpenseFormModal from '../components/expense/ExpenseFormModal';
import ExpenseDetailsModal from '../components/expense/ExpenseDetailsModal';

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
    getTodayDateString,
    expenses,
    formatDateDMY
  } = useCRM();

  // Search & Navigation States
  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || (clients.length > 0 ? clients[0].id : ''));
  const [activeTab, setActiveTab] = useState('profile'); // profile, quotes, payments, reminders, whatsapp, expenses
  const [chatMsg, setChatMsg] = useState('');
  
  // Expense Modal States
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [detailsExpenseModalOpen, setDetailsExpenseModalOpen] = useState(false);
  const [selectedClientExpense, setSelectedClientExpense] = useState(null);
  
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
  const clientExpenses = activeClient ? expenses.filter(e => e.clientId === activeClient.id) : [];

  // Internal Client Expense Aggregations (Completely isolated from billing)
  const clientApprovedExpenses = clientExpenses.filter(e => e.status === 'Approved');
  const clientPendingExpenses = clientExpenses.filter(e => e.status === 'Pending');
  const clientExpenseTotal = clientApprovedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const clientPendingExpenseTotal = clientPendingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // 3. Payment Aggregations for Active Client (Strictly quotations & invoice payments)
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
      <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col h-auto max-h-[50vh] lg:max-h-none lg:h-[75vh]">
        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients list..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl outline-none text-slate-800 placeholder-slate-400 transition-all"
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
                    ? 'bg-orange-50 border-orange-300 text-orange-900 shadow-2xs' 
                    : 'bg-slate-50/60 border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-bold transition-colors ${isSelected ? 'text-orange-600 font-extrabold' : 'text-slate-900 group-hover:text-orange-600'}`}>
                    {c.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">{c.companyName}</span>
                </div>
                <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'text-orange-600 translate-x-1' : 'text-slate-400 group-hover:text-slate-600'}`} />
              </div>
            );
          })}

          {filteredClients.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
              No clients found.
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Unified Client Workspace */}
      <div className="lg:col-span-2 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xs h-auto min-h-[60vh] lg:h-[75vh] overflow-hidden">
        {activeClient ? (
          <>
            {/* Workspace Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-orange-50/50 via-white to-amber-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                    <UserSquare2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{activeClient.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">Company: {activeClient.companyName} | Client ID: {activeClient.id}</p>
                  </div>
                </div>
              </div>

              {/* Status / Alert status */}
              <div className="flex flex-wrap items-center gap-2">
                {balanceAmount > 0 ? (
                  <button
                    onClick={handleManualRemind}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale transition-colors shadow-xs cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 animate-bounce" />
                    <span>WhatsApp Reminder</span>
                  </button>
                ) : (
                  <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Paid in Full
                  </span>
                )}

                {/* Internal Cost Indicator Pill */}
                {clientExpenseTotal > 0 && (
                  <span 
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200"
                    title="Total internal company expenses incurred for this client (strictly internal, not added to bill)"
                  >
                    <Receipt className="w-3 h-3 text-orange-600" />
                    <span>Internal Cost: ₹{clientExpenseTotal.toLocaleString('en-IN')}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Workspace Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 px-2 sm:px-3 overflow-x-auto no-scrollbar">
              {[
                { id: 'profile', label: 'Client Profile', icon: Building2 },
                { id: 'quotes', label: 'Quotes Log', icon: FileText },
                { id: 'payments', label: 'Payment Splits', icon: IndianRupee },
                { id: 'expenses', label: 'Internal Expenses', icon: Receipt, badge: clientExpenses.length > 0 ? clientExpenses.length : null },
                { id: 'reminders', label: 'Reminders', icon: Bell },
                { id: 'whatsapp', label: 'WhatsApp Thread', icon: MessageSquare }
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2.5 sm:py-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                      active 
                        ? 'border-orange-500 text-orange-600 bg-white' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        active ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Workspace Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              
              {/* Tab: Profile Overview */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Phone Contact</span>
                        <span className="text-xs font-bold text-slate-900">{activeClient.phone}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Email Address</span>
                        <span className="text-xs font-bold text-slate-900 truncate block">{activeClient.email || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Converted On</span>
                        <span className="text-xs font-bold text-slate-900">{activeClient.convertedDate}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Source Lead Origin</span>
                        <span className="text-xs font-bold text-slate-900">{activeClient.source}</span>
                      </div>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs flex items-center gap-3 sm:col-span-2">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Office / Billing Address</span>
                        <span className="text-xs font-bold text-slate-900">{activeClient.address || 'Nagpur, Maharashtra, India'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2.5">Discovery & Project details</h4>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap shadow-2xs">
                      {activeClient.notes || 'No discovery notes recorded.'}
                    </div>
                  </div>

                  {clientLeadInfo && (
                    <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl">
                      <span className="block text-[10px] uppercase font-bold text-orange-700 mb-1">Lead Pipeline Log Reference</span>
                      <p className="text-xs text-slate-700">
                        Originating Lead ID was <span className="font-mono font-bold text-slate-900">{clientLeadInfo.id}</span>. 
                        Assigned to representative <span className="text-slate-900 font-bold">{clientLeadInfo.assignedTo}</span>.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Quotations History */}
              {activeTab === 'quotes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Quotations History ({clientQuotes.length})</h4>
                    <button
                      onClick={() => addQuoteTrigger(activeClient.id, 'client')}
                      className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 px-3 py-1.5 border border-orange-200 bg-orange-50 rounded-xl hover-scale cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Quote</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {clientQuotes.map(q => (
                      <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                        <div>
                          <h5 className="text-xs font-bold text-slate-900">{q.title}</h5>
                          <p className="text-[10px] text-slate-500 mt-1">ID: <span className="font-mono text-slate-700 font-bold">{q.id}</span> | Date: {q.date}</p>
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold mt-2 uppercase ${
                            q.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {q.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-black text-orange-600">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(q.total)}
                            </p>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">{q.items.length} services</span>
                          </div>
                          <button
                            onClick={() => handleOpenQuotePDF(q)}
                            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                            title="Invoice Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {clientQuotes.length === 0 && (
                      <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-orange-50/20">
                        <FileText className="w-8 h-8 mb-2 text-orange-400" />
                        <span className="text-xs font-bold text-slate-700">No quotations drafted yet</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Payments History */}
              {activeTab === 'payments' && (
                <div className="space-y-6">
                  {/* Aggregation card */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-4 shadow-2xs">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Contract</span>
                        <p className="text-base font-black text-slate-900 mt-1">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalValue)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid</span>
                        <p className="text-base font-black text-emerald-600 mt-1">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(paidAmount)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Balance</span>
                        <p className="text-base font-black text-rose-600 mt-1">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(balanceAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Progress visual */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500">
                        <span>Collections Ratio</span>
                        <span className="text-orange-600">{progressPercent}% Collected</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Linked Invoice Schedules</h4>
                    {clientQuotes.some(q => q.status === 'Accepted' && !clientPayments.some(p => p.quotationId === q.id)) && (
                      <button
                        onClick={() => addPaymentTrigger(activeClient.id)}
                        className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 px-3 py-1.5 border border-orange-200 bg-orange-50 rounded-xl hover-scale cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Schedule</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    {clientPayments.map(p => (
                      <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400">ID: {p.id}</span>
                            <h5 className="text-xs font-bold text-slate-800 mt-0.5">Quote Ref: {p.quotationId}</h5>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                            p.status === 'Paid in Full' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {/* List instalments */}
                        <div className="space-y-2">
                          {p.instalments.map((inst, index) => {
                            const isPaid = inst.status === 'Paid';
                            return (
                              <div key={inst.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-slate-800">Instalment {index+1}</span>
                                  <p className="text-[9px] text-slate-500 mt-0.5">Due date: {inst.dueDate}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-black text-slate-900">
                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inst.amount)}
                                  </span>
                                  {!isPaid ? (
                                    <button
                                      onClick={() => recordPaymentPayment(p.id, inst.id)}
                                      className="px-2.5 py-1 text-[9px] font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg transition-colors cursor-pointer"
                                    >
                                      Collect
                                    </button>
                                  ) : (
                                    <span className="text-[9px] font-bold text-emerald-600">Paid ({inst.paidDate})</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {clientPayments.length === 0 && (
                      <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-orange-50/20 text-center px-4">
                        <IndianRupee className="w-8 h-8 mb-2 text-orange-400" />
                        <span className="text-xs font-bold text-slate-700">No payment schedules drafted</span>
                        <button
                          onClick={() => addPaymentTrigger(activeClient.id, { client: activeClient })}
                          className="mt-3 flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl hover-scale shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Record 1st Payment & Schedule</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: Reminders */}
              {activeTab === 'reminders' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Automated Reminders History</h4>
                  
                  <div className="space-y-2.5">
                    {clientReminders.map(rem => (
                      <div key={rem.id} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs">
                        <div>
                          <p className="font-bold text-slate-800">Trigger: {rem.triggerType.replace('_', ' ')}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Amount: ₹{rem.amount} | Due: {rem.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            rem.status === 'Sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            rem.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {rem.status}
                          </span>
                          {rem.sentDate && <p className="text-[9px] text-slate-500 mt-1">Sent: {rem.sentDate}</p>}
                        </div>
                      </div>
                    ))}

                    {clientReminders.length === 0 && (
                      <div className="py-12 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-orange-50/20">
                        <Bell className="w-8 h-8 mb-2 text-orange-400" />
                        <span className="text-xs font-bold text-slate-700">No reminders scheduled</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab: WhatsApp Live Chat Simulation */}
              {activeTab === 'whatsapp' && (
                <div className="flex flex-col h-[48vh] border border-slate-200 bg-white rounded-2xl overflow-hidden shadow-2xs">
                  
                  {/* Messages log */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col-reverse bg-slate-50/50">
                    <div className="space-y-3 flex flex-col justify-end">
                      {clientChat.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center px-4">
                          <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                          <span className="text-xs font-bold text-slate-600">WhatsApp conversation thread empty</span>
                          <span className="text-[10px] text-slate-400 mt-1">Fired system notifications will appear here.</span>
                        </div>
                      ) : (
                        clientChat.map(msg => {
                          const isOutbound = msg.direction === 'outbound';
                          return (
                            <div 
                              key={msg.id}
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs flex flex-col shadow-2xs ${
                                isOutbound 
                                  ? 'self-end bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-none' 
                                  : 'self-start bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                              }`}
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                              <span className={`text-[8px] self-end mt-1 ${isOutbound ? 'text-orange-100' : 'text-slate-400'}`}>
                                {msg.timestamp.substring(11, 16)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                    <input
                      type="text"
                      placeholder="Type custom message to simulate live chat (auto-reply in 2s)..."
                      className="flex-1 px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl outline-none text-slate-800 placeholder-slate-400"
                      value={chatMsg}
                      onChange={e => setChatMsg(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold transition-all hover-scale cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* Tab: Internal Client Expenses */}
              {activeTab === 'expenses' && (
                <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
                  {/* Notice banner ensuring cost isolation from billing */}
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 text-xs flex items-start gap-3">
                    <Receipt className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-slate-900 block">Internal Cost Tracking Only</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        These expenses (fuel, food, travel, site inspection) reflect internal company operational costs spent on this client. 
                        <strong> They are completely separate and will NEVER be added to the client's quotation, invoice, or billing amount.</strong>
                      </p>
                    </div>
                  </div>

                  {/* Summary & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Approved Incurred</span>
                        <span className="text-xl font-black text-slate-900">₹{clientExpenseTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending Approvals</span>
                        <span className="text-xl font-bold text-amber-600">₹{clientPendingExpenseTotal.toLocaleString('en-IN')}</span>
                        {clientPendingExpenses.length > 0 && (
                          <span className="text-[10px] text-amber-700 ml-1">({clientPendingExpenses.length} awaiting)</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpenseModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-xs transition-all hover-scale cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Expense for Client</span>
                    </button>
                  </div>

                  {/* Expenses List */}
                  {clientExpenses.length === 0 ? (
                    <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
                      <Receipt className="w-10 h-10 text-orange-400 mx-auto mb-2" />
                      <h5 className="text-xs font-bold text-slate-800">No Internal Expenses Recorded</h5>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                        No travel, fuel, or food expenses have been tagged to {activeClient.name} yet.
                      </p>
                      <button
                        type="button"
                        onClick={() => setExpenseModalOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Client Expense</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {clientExpenses.map(exp => (
                        <div 
                          key={exp.id}
                          onClick={() => {
                            setSelectedClientExpense(exp);
                            setDetailsExpenseModalOpen(true);
                          }}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-orange-300 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0">
                              {exp.category === 'Fuel' && <Fuel className="w-4 h-4" />}
                              {exp.category === 'Food' && <UtensilsCrossed className="w-4 h-4" />}
                              {exp.category === 'Travel' && <Plane className="w-4 h-4" />}
                              {exp.category === 'Other' && <Layers className="w-4 h-4" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                                  {exp.title}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                                  {exp.id}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span>{formatDateDMY ? formatDateDMY(exp.date) : exp.date}</span>
                                <span>•</span>
                                <span>Logged by: <strong className="text-slate-700">{exp.createdBy?.name || 'Staff'}</strong> ({exp.createdBy?.position || exp.createdBy?.role || 'Staff'})</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-black text-slate-900">
                                ₹{Number(exp.amount).toLocaleString('en-IN')}
                              </div>
                              <div className="mt-0.5">
                                {exp.status === 'Approved' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" /> Approved
                                  </span>
                                )}
                                {exp.status === 'Pending' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                )}
                                {exp.status === 'Rejected' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                                    <XCircle className="w-3 h-3" /> Rejected
                                  </span>
                                )}
                              </div>
                            </div>

                            <Eye className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FolderOpen className="w-12 h-12 mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No active customer selected</p>
            <p className="text-xs text-slate-400 mt-1">Choose a client from the left pane to open their workspace.</p>
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

      {/* Record Expense Modal with preselected client */}
      <ExpenseFormModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        preselectedClientId={activeClient ? activeClient.id : null}
      />

      {/* Expense Details Review Modal */}
      <ExpenseDetailsModal
        isOpen={detailsExpenseModalOpen}
        onClose={() => setDetailsExpenseModalOpen(false)}
        expense={selectedClientExpense}
      />

    </div>
  );
};

export default Clients;
