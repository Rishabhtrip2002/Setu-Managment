import React from 'react';
import { useCRM } from '../context/CRMContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  Lock,
  ArrowRightLeft
} from 'lucide-react';

const Reports = () => {
  const { leads, clients, payments, getTodayDateString, currentUser } = useCRM();

  // Role Access check
  if (currentUser.role !== 'Admin') {
    return (
      <div className="h-[60vh] border border-slate-800 bg-slate-900/30 rounded-2xl flex flex-col items-center justify-center text-center p-6">
        <Lock className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-base font-extrabold text-slate-200">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-md">
          You are logged in as a Staff member. The Reports & Analytics interface is restricted to Admin roles only. Contact your system director for details.
        </p>
      </div>
    );
  }

  const today = getTodayDateString();

  // 1. Lead Funnel calculation
  const getStageCount = (stage) => leads.filter(l => l.status === stage).length;
  const stages = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];
  const funnelData = stages.map(st => ({
    stage: st,
    count: getStageCount(st)
  }));

  const wonCount = getStageCount('Won');
  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  // 2. Monthly Revenue collected chart data (Grouping instalments by paid month)
  // Let's analyze April, May, June 2026
  const monthlyRevenueMap = {
    '2026-04': 0,
    '2026-05': 0,
    '2026-06': 0
  };

  payments.forEach(p => {
    p.instalments.forEach(inst => {
      if (inst.status === 'Paid' && inst.paidDate) {
        const month = inst.paidDate.substring(0, 7); // YYYY-MM
        if (monthlyRevenueMap[month] !== undefined) {
          monthlyRevenueMap[month] += inst.amount;
        } else {
          monthlyRevenueMap[month] = inst.amount;
        }
      }
    });
  });

  const chartData = [
    { name: 'Apr 2026', Amount: monthlyRevenueMap['2026-04'] },
    { name: 'May 2026', Amount: monthlyRevenueMap['2026-05'] },
    { name: 'Jun 2026', Amount: monthlyRevenueMap['2026-06'] }
  ];

  // 3. Overdue Ageing Table calculation
  // Brackets: 0-30 Days, 30-60 Days, 60+ Days
  const ageingAccountsMap = {};

  payments.forEach(p => {
    const client = clients.find(c => c.id === p.clientId);
    if (!client) return;

    p.instalments.forEach(inst => {
      if (inst.status === 'Pending' && inst.dueDate < today) {
        // Calculate days overdue
        const due = new Date(inst.dueDate);
        const curr = new Date(today);
        const diffTime = Math.abs(curr - due);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (!ageingAccountsMap[client.id]) {
          ageingAccountsMap[client.id] = {
            name: client.name,
            companyName: client.companyName,
            bracket1: 0, // 0-30 days
            bracket2: 0, // 30-60 days
            bracket3: 0, // 60+ days
            totalOverdue: 0
          };
        }

        const account = ageingAccountsMap[client.id];
        if (diffDays <= 30) {
          account.bracket1 += inst.amount;
        } else if (diffDays <= 60) {
          account.bracket2 += inst.amount;
        } else {
          account.bracket3 += inst.amount;
        }
        account.totalOverdue += inst.amount;
      }
    });
  });

  const ageingAccountsList = Object.values(ageingAccountsMap);

  return (
    <div className="space-y-6">
      
      {/* Funnel & Revenue grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Lead Conversion Funnel */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Conversion Funnel</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Analysis of deals along stages</p>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full">
              {conversionRate}% Won Rate
            </span>
          </div>

          {/* Graphical Funnel bars */}
          <div className="space-y-3 pt-2">
            {funnelData.map((stage, idx) => {
              const maxCount = Math.max(...funnelData.map(d => d.count), 1);
              const percent = Math.round((stage.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-400">
                    <span className="text-slate-300">{stage.stage}</span>
                    <span>{stage.count} leads</span>
                  </div>
                  <div className="w-full bg-slate-950 h-6 rounded-lg overflow-hidden border border-slate-850 flex items-center p-[2px]">
                    <div 
                      className={`h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2 text-[9px] font-black text-slate-950 ${
                        stage.stage === 'Won' ? 'bg-gradient-to-r from-emerald-500 to-brand-500' :
                        stage.stage === 'Lost' ? 'bg-rose-500/40 text-slate-400' :
                        'bg-gradient-to-r from-slate-800 to-indigo-600'
                      }`}
                      style={{ width: `${percent || 5}%` }}
                    >
                      {percent > 10 && `${percent}%`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly collected Revenue chart */}
        <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-850">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Revenue Collections</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Total funds collected monthly</p>
            </div>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>

          {/* Area Chart */}
          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                <YAxis stroke="#94a3b8" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', color: '#f8fafc' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="Amount" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Ageing Table Section */}
      <div className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-850">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Overdue Ageing Table</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Classification of outstanding receivables by overdue duration</p>
          </div>
          <Clock className="w-4 h-4 text-rose-400" />
        </div>

        <div className="overflow-hidden border border-slate-850 bg-slate-950/30 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-850 bg-slate-950/60 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Client Company</th>
                  <th className="px-5 py-3.5">0-30 Days Overdue</th>
                  <th className="px-5 py-3.5">30-60 Days Overdue</th>
                  <th className="px-5 py-3.5">60+ Days Overdue</th>
                  <th className="px-5 py-3.5 text-right">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-slate-300">
                {ageingAccountsList.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/10">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-slate-200">{acc.name}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{acc.companyName}</p>
                    </td>
                    <td className={`px-5 py-3 font-semibold ${acc.bracket1 > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {acc.bracket1 > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.bracket1) : '—'}
                    </td>
                    <td className={`px-5 py-3 font-semibold ${acc.bracket2 > 0 ? 'text-orange-400 font-bold' : 'text-slate-500'}`}>
                      {acc.bracket2 > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.bracket2) : '—'}
                    </td>
                    <td className={`px-5 py-3 font-black ${acc.bracket3 > 0 ? 'text-rose-500 font-black animate-pulse' : 'text-slate-500'}`}>
                      {acc.bracket3 > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.bracket3) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-100">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.totalOverdue)}
                    </td>
                  </tr>
                ))}

                {ageingAccountsList.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-brand-400 bg-brand-500/5 font-semibold">
                      Perfect. All client bills are cleared. Zero receivables are ageing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Reports;
