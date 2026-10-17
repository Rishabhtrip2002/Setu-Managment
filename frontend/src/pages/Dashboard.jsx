import React from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  Users, 
  IndianRupee, 
  AlertTriangle, 
  FileSpreadsheet, 
  ChevronRight, 
  Calendar, 
  Phone, 
  Plus, 
  TrendingUp, 
  MessageSquare, 
  Receipt, 
  Clock,
  PhoneCall,
  PhoneForwarded
} from 'lucide-react';

const Dashboard = ({ setActivePage, onQuickAction }) => {
  const { leads, clients, quotations, payments, expenses, followUps, coldLeads, getTodayDateString, currentUser } = useCRM();

  const today = getTodayDateString();
  const unassignedColdCount = (coldLeads || []).filter(c => !c.assignedToId && c.status !== 'Converted' && !c.isDNC).length;

  const isAdmin = 
    currentUser?.role === 'Super Admin' || 
    currentUser?.role === 'Admin' ||
    (currentUser?.position && /admin|director|manager|lead/i.test(currentUser.position));

  // 1. Calculations
  // Total Leads
  const totalLeadsCount = leads.length;

  // Monthly Revenue (Revenue collected in current month)
  const currentMonthYear = today ? today.slice(0, 7) : new Date().toISOString().slice(0, 7);
  const monthlyRevenueSum = payments.reduce((sum, p) => {
    const paidThisMonth = (p.instalments || [])
      .filter(inst => inst.status === 'Paid' && inst.paidDate && inst.paidDate.startsWith(currentMonthYear))
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    return sum + paidThisMonth;
  }, 0);

  // Overdue Payments Count
  let overdueInstalmentsCount = 0;
  const overdueItems = [];

  payments.forEach(p => {
    const client = clients.find(c => c.id === p.clientId);
    if (!client) return;

    p.instalments.forEach(inst => {
      if (inst.status === 'Pending' && inst.dueDate < today) {
        overdueInstalmentsCount++;
        overdueItems.push({
          paymentId: p.id,
          clientName: client.name,
          companyName: client.companyName,
          phone: client.phone,
          amount: inst.amount,
          dueDate: inst.dueDate
        });
      }
    });
  });

  // Pending Quotations (Draft + Sent)
  const pendingQuotesCount = quotations.filter(q => q.status === 'Draft' || q.status === 'Sent').length;

  // Recent leads log (Take top 4)
  const recentLeads = leads.slice(0, 4);

  // 2. Metrics Cards definitions
  const metrics = [
    {
      id: 'leads',
      title: 'Total Leads Tracked',
      value: totalLeadsCount,
      change: '+12% this week',
      icon: Users,
      color: 'bg-white border-slate-200 text-blue-600 shadow-sm',
      action: () => setActivePage('leads')
    },
    {
      id: 'revenue',
      title: 'Revenue Collected (June)',
      value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(monthlyRevenueSum),
      change: 'Target ₹5,00,000',
      icon: IndianRupee,
      color: 'bg-white border-orange-200 text-orange-600 shadow-sm',
      action: () => setActivePage('payments')
    },
    {
      id: 'overdue',
      title: 'Overdue Payments',
      value: overdueInstalmentsCount,
      change: `${overdueItems.length} clients outstanding`,
      icon: AlertTriangle,
      color: overdueInstalmentsCount > 0 ? 'bg-white border-rose-300 text-rose-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 shadow-sm',
      action: () => setActivePage('settings') // maps to Reminders log tab
    },
    {
      id: 'quotations',
      title: 'Pending Quotations',
      value: pendingQuotesCount,
      change: 'Draft or Sent status',
      icon: FileSpreadsheet,
      color: 'bg-white border-purple-200 text-purple-600 shadow-sm',
      action: () => setActivePage('quotations')
    }
  ];

  const pendingFollowupsToday = (followUps || []).filter(f => f.status === 'Pending' && f.dueDate <= today).length;

  return (
    <div className="space-y-6">
      
      {/* Welcome banner header */}
      <div className="p-6 bg-gradient-to-r from-orange-50 via-white to-amber-50 border border-orange-200/90 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Welcome back, {currentUser?.name || 'Administrator'}!
          </h2>
          <p className="text-xs text-slate-600 mt-1">Here is what is happening at SETU SOLUTION CRM today. All notifications are active.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActivePage('telecaller')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-md shadow-orange-500/20"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Telecaller {pendingFollowupsToday > 0 ? `(${pendingFollowupsToday} Due)` : ''}</span>
          </button>
          <button
            onClick={() => setActivePage('coldcalling')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl hover-scale shadow-xs"
          >
            <PhoneForwarded className="w-3.5 h-3.5 text-orange-500" />
            <span>Cold Calling {unassignedColdCount > 0 ? `(${unassignedColdCount} Pool)` : ''}</span>
          </button>
          <button
            onClick={() => onQuickAction('add_lead')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl hover-scale shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Lead</span>
          </button>
          <button
            onClick={() => onQuickAction('add_quote')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl hover-scale shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-slate-500" />
            <span>Draft Quote</span>
          </button>
          <button
            onClick={() => setActivePage('expenses')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl hover-scale shadow-xs"
          >
            <Receipt className="w-3.5 h-3.5 text-orange-500" />
            <span>Expenses</span>
          </button>
        </div>
      </div>

      {/* Telecaller Follow-ups Due Banner */}
      {pendingFollowupsToday > 0 && (
        <div 
          onClick={() => setActivePage('telecaller')}
          className="p-3.5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/15 border border-orange-500/30 rounded-2xl flex items-center justify-between gap-3 text-orange-950 cursor-pointer hover:bg-orange-500/20 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-300 flex items-center justify-center text-orange-600">
              <PhoneCall className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {pendingFollowupsToday} Follow-up Call(s) Due or Overdue in Telecaller Queue
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Dial prospects now, record call outcomes, and synchronize CRM history.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-600 flex items-center gap-1 shrink-0">
            Open Queue →
          </span>
        </div>
      )}

      {/* Pending Expense Approvals Banner for Admins */}
      {isAdmin && (expenses || []).filter(e => e.status === 'Pending').length > 0 && (
        <div 
          onClick={() => setActivePage('expenses')}
          className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-amber-900 cursor-pointer hover:bg-amber-500/15 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                {(expenses || []).filter(e => e.status === 'Pending').length} Expense Request(s) Awaiting Approval
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Staff members have submitted new operational / client expenses requiring Admin verification.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
            Review Now →
          </span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map(card => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.action}
              className={`p-5 rounded-2xl border cursor-pointer hover-scale transition-all flex flex-col justify-between h-32 ${card.color}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              
              <div className="mt-2">
                <p className="text-2xl font-black text-slate-900">{card.value}</p>
                <span className="text-[10px] text-slate-500 font-semibold">{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Overdue Payments accounts (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Overdue Payments Ledger</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Collect from outstanding balances below</p>
            </div>
            <button 
              onClick={() => setActivePage('payments')}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-0.5"
            >
              <span>Manage Billing</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {overdueItems.map((item, idx) => (
              <div 
                key={idx} 
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{item.clientName}</h4>
                  <span className="text-[10px] text-slate-500 font-semibold">{item.companyName} | Ref: {item.paymentId}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right sm:text-right">
                    <p className="text-xs font-black text-rose-500">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount)}
                    </p>
                    <span className="text-[9px] text-slate-500 block">Due Date: {item.dueDate}</span>
                  </div>

                  <button
                    onClick={() => {
                      setActivePage('clients');
                    }}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover-scale shadow-xs"
                    title="Open Unified Client Profile"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {overdueItems.length === 0 && (
              <div className="py-16 text-center text-xs text-orange-600 bg-orange-50 rounded-2xl border border-orange-200 font-bold uppercase tracking-wide">
                All collections are up to date! Good job.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity / Leads board (1 Col) */}
        <div className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">New Leads Log</h3>
            <button 
              onClick={() => setActivePage('leads')}
              className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-0.5"
            >
              <span>Pipeline Board</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {recentLeads.map(lead => (
              <div 
                key={lead.id}
                onClick={() => setActivePage('leads')}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-orange-600 font-bold text-xs flex items-center justify-center shadow-xs">
                  {lead.name.charAt(0)}
                </div>
                <div className="overflow-hidden flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{lead.name}</h4>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{lead.createdDate} • {lead.source}</span>
                </div>
                <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
