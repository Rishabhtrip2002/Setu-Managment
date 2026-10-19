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
  ArrowRightLeft,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

const Reports = () => {
  const { leads, clients, payments, getTodayDateString, currentUser } = useCRM();

  // Role Access check
  if (currentUser?.role !== 'Admin' && currentUser?.role !== 'Super Admin') {
    return (
      <div className="h-[60vh] border border-slate-200 bg-white rounded-2xl flex flex-col items-center justify-center text-center p-6 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900">Access Restricted</h3>
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

  // 2. Monthly Revenue collected chart data (Grouping instalments dynamically by rolling last 6 months)
  const rollingMonths = [];
  const baseDate = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - i, 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const key = `${yyyy}-${mm}`;
    const label = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    rollingMonths.push({ key, label });
  }

  const monthlyRevenueMap = {};
  rollingMonths.forEach(m => { monthlyRevenueMap[m.key] = 0; });

  payments.forEach(p => {
    (p.instalments || []).forEach(inst => {
      if (inst.status === 'Paid' && inst.paidDate) {
        const month = String(inst.paidDate).substring(0, 7); // YYYY-MM
        if (monthlyRevenueMap[month] !== undefined) {
          monthlyRevenueMap[month] += (Number(inst.amount) || 0);
        } else {
          monthlyRevenueMap[month] = (Number(inst.amount) || 0);
        }
      }
    });
  });

  const chartData = rollingMonths.map(m => ({
    name: m.label,
    Amount: monthlyRevenueMap[m.key] || 0
  }));

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
          account.bracket1 += Number(inst.amount) || 0;
        } else if (diffDays <= 60) {
          account.bracket2 += Number(inst.amount) || 0;
        } else {
          account.bracket3 += Number(inst.amount) || 0;
        }
        account.totalOverdue += Number(inst.amount) || 0;
      }
    });
  });

  const ageingAccountsList = Object.values(ageingAccountsMap);

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Matches Light CRM Theme) */}
      <div className="p-6 bg-gradient-to-r from-orange-50 via-white to-amber-50 border border-orange-200/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-600 border border-orange-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                Reports & Performance Analytics
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pipeline conversion funnel, monthly collections trajectory, and outstanding ageing schedules.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Lead Conversion: <strong className="text-orange-600 font-extrabold">{conversionRate}%</strong></span>
          </div>
        </div>
      </div>

      {/* Funnel & Revenue grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Lead Conversion Funnel */}
        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Conversion Funnel</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Analysis of deals along stages</p>
            </div>
            <span className="px-2.5 py-0.5 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-full">
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
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span className="text-slate-800 font-bold">{stage.stage}</span>
                    <span className="font-mono text-slate-500">{stage.count} leads</span>
                  </div>
                  <div className="w-full bg-slate-100 h-6 rounded-xl overflow-hidden border border-slate-200/80 flex items-center p-0.5">
                    <div 
                      className={`h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-[10px] font-bold ${
                        stage.stage === 'Won' ? 'bg-gradient-to-r from-emerald-500 to-amber-500 text-white shadow-xs' :
                        stage.stage === 'Lost' ? 'bg-rose-400 text-white' :
                        'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-xs'
                      }`}
                      style={{ width: `${Math.max(percent, stage.count > 0 ? 12 : 3)}%` }}
                    >
                      {stage.count > 0 && `${stage.count}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly collected Revenue chart */}
        <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Revenue Collections</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Total funds collected monthly</p>
            </div>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          {/* Area Chart */}
          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '16px', 
                    fontSize: '12px', 
                    color: '#0f172a',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
                  }}
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="Amount" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Ageing Table Section */}
      <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Overdue Ageing Table</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Classification of outstanding receivables by overdue duration</p>
          </div>
          <div className="p-2 rounded-xl bg-rose-50 text-rose-500 border border-rose-200">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="overflow-hidden border border-slate-200 bg-white rounded-2xl">
          {/* Mobile Card List View (Phones) */}
          <div className="md:hidden divide-y divide-slate-100">
            {ageingAccountsList.map((acc, idx) => (
              <div key={idx} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{acc.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{acc.companyName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Due</span>
                    <span className="font-black text-rose-600 font-mono text-sm">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.totalOverdue)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">0-30 Days</span>
                    <span className={`text-xs font-bold ${acc.bracket1 > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                      {acc.bracket1 > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.bracket1) : '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">30-60 Days</span>
                    <span className={`text-xs font-bold ${acc.bracket2 > 0 ? 'text-orange-600' : 'text-slate-400'}`}>
                      {acc.bracket2 > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.bracket2) : '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">60+ Days</span>
                    <span className={`text-xs font-black ${acc.bracket3 > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                      {acc.bracket3 > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.bracket3) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {ageingAccountsList.length === 0 && (
              <div className="text-center py-10 px-4 text-orange-600 bg-orange-50 font-bold text-xs uppercase tracking-wide">
                ALL COLLECTIONS ARE UP TO DATE! ZERO RECEIVABLES ARE AGEING.
              </div>
            )}
          </div>

          {/* Desktop Table View (tablets & up) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-5 py-3.5">Client Company</th>
                  <th className="px-5 py-3.5">0-30 Days Overdue</th>
                  <th className="px-5 py-3.5">30-60 Days Overdue</th>
                  <th className="px-5 py-3.5">60+ Days Overdue</th>
                  <th className="px-5 py-3.5 text-right">Total Outstanding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {ageingAccountsList.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900">{acc.name}</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">{acc.companyName}</p>
                    </td>
                    <td className={`px-5 py-3.5 font-semibold ${acc.bracket1 > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                      {acc.bracket1 > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.bracket1) : '—'}
                    </td>
                    <td className={`px-5 py-3.5 font-semibold ${acc.bracket2 > 0 ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                      {acc.bracket2 > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.bracket2) : '—'}
                    </td>
                    <td className={`px-5 py-3.5 font-black ${acc.bracket3 > 0 ? 'text-rose-600 font-black animate-pulse' : 'text-slate-400'}`}>
                      {acc.bracket3 > 0 ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.bracket3) : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-slate-900 font-mono">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(acc.totalOverdue)}
                    </td>
                  </tr>
                ))}

                {ageingAccountsList.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-orange-600 bg-orange-50 font-bold uppercase tracking-wide">
                      ALL COLLECTIONS ARE UP TO DATE! ZERO RECEIVABLES ARE AGEING.
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
