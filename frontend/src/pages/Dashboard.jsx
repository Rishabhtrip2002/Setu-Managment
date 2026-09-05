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
  MessageSquare
} from 'lucide-react';

const Dashboard = ({ setActivePage, onQuickAction }) => {
  const { leads, clients, quotations, payments, getTodayDateString } = useCRM();

  const today = getTodayDateString();

  // 1. Calculations
  // Total Leads
  const totalLeadsCount = leads.length;

  // Monthly Revenue (Revenue collected in June 2026)
  const currentMonthYear = '2026-06';
  const monthlyRevenueSum = payments.reduce((sum, p) => {
    const paidThisMonth = p.instalments
      .filter(inst => inst.status === 'Paid' && inst.paidDate && inst.paidDate.startsWith(currentMonthYear))
      .reduce((s, i) => s + i.amount, 0);
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
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      action: () => setActivePage('leads')
    },
    {
      id: 'revenue',
      title: 'Revenue Collected (June)',
      value: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(monthlyRevenueSum),
      change: 'Target ₹5,00,000',
      icon: IndianRupee,
      color: 'bg-brand-500/10 text-brand-400 border-brand-500/20',
      action: () => setActivePage('payments')
    },
    {
      id: 'overdue',
      title: 'Overdue Payments',
      value: overdueInstalmentsCount,
      change: `${overdueItems.length} clients outstanding`,
      icon: AlertTriangle,
      color: overdueInstalmentsCount > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' : 'bg-slate-900/30 text-slate-400 border-slate-800',
      action: () => setActivePage('settings') // maps to Reminders log tab
    },
    {
      id: 'quotations',
      title: 'Pending Quotations',
      value: pendingQuotesCount,
      change: 'Draft or Sent status',
      icon: FileSpreadsheet,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      action: () => setActivePage('quotations')
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome banner header */}
      <div className="p-6 bg-gradient-to-r from-brand-950 via-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-200">Welcome back, Siddharth!</h2>
          <p className="text-xs text-slate-400 mt-1">Here is what is happening at SETU SOLUTION CRM today. All notifications are active.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onQuickAction('add_lead')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-905 border border-slate-800 hover:bg-slate-800 rounded-xl hover-scale"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
          <button
            onClick={() => onQuickAction('add_quote')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-brand-400 hover:bg-brand-500 rounded-xl hover-scale shadow-md shadow-brand-500/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Draft Quote</span>
          </button>
        </div>
      </div>

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
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className="w-8 h-8 rounded-lg bg-slate-950/40 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              
              <div className="mt-2">
                <p className="text-2xl font-black text-slate-100">{card.value}</p>
                <span className="text-[10px] text-slate-500 font-semibold">{card.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Middle widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Overdue Payments accounts (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Overdue Payments Ledger</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Collect from outstanding balances below</p>
            </div>
            <button 
              onClick={() => setActivePage('payments')}
              className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-0.5"
            >
              <span>Manage Billing</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {overdueItems.map((item, idx) => (
              <div 
                key={idx} 
                className="p-3.5 bg-slate-950/40 border border-slate-850 rounded-xl hover:border-slate-800 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{item.clientName}</h4>
                  <span className="text-[10px] text-slate-500 font-semibold">{item.companyName} | Ref: {item.paymentId}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right sm:text-right">
                    <p className="text-xs font-black text-rose-400">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.amount)}
                    </p>
                    <span className="text-[9px] text-slate-500 block">Due Date: {item.dueDate}</span>
                  </div>

                  <button
                    onClick={() => {
                      setActivePage('clients');
                    }}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-850 text-slate-400 hover:text-slate-200 hover-scale"
                    title="Open Unified Client Profile"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {overdueItems.length === 0 && (
              <div className="py-16 text-center text-xs text-brand-400 bg-brand-500/5 rounded-2xl border border-brand-500/10 font-bold uppercase tracking-wide">
                All collections are up to date! Good job.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity / Leads board (1 Col) */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">New Leads Log</h3>
            <button 
              onClick={() => setActivePage('leads')}
              className="text-xs text-brand-400 hover:text-brand-300 font-bold flex items-center gap-0.5"
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
                className="p-3 bg-slate-950/20 hover:bg-slate-950/40 border border-slate-850/80 rounded-xl cursor-pointer transition-all flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-bold text-xs flex items-center justify-center">
                  {lead.name.charAt(0)}
                </div>
                <div className="overflow-hidden flex-1">
                  <h4 className="text-xs font-bold text-slate-200 truncate">{lead.name}</h4>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{lead.createdDate} • {lead.source}</span>
                </div>
                <span className="text-[9px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-1.5 py-0.5 rounded">
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
