import React, { useState } from 'react';
import { useCRM } from '../context/CRMContext';
import ExpenseFormModal from '../components/expense/ExpenseFormModal';
import ExpenseDetailsModal from '../components/expense/ExpenseDetailsModal';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Fuel, 
  UtensilsCrossed, 
  Plane, 
  Layers, 
  IndianRupee, 
  Calendar, 
  Building2, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Check, 
  Ban, 
  Eye, 
  Trash2, 
  AlertCircle,
  Briefcase,
  TrendingDown,
  Sparkles
} from 'lucide-react';

const CATEGORY_META = {
  Fuel: { icon: Fuel, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
  Food: { icon: UtensilsCrossed, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  Travel: { icon: Plane, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
  Other: { icon: Layers, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
};

const Expenses = () => {
  const { 
    expenses, 
    clients, 
    employees, 
    currentUser, 
    approveExpense, 
    rejectExpense, 
    formatDateDMY, 
    getTodayDateString 
  } = useCRM();

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, Pending, Approved, Rejected
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // ALL, Fuel, Food, Travel, Other
  const [typeFilter, setTypeFilter] = useState('ALL'); // ALL, daily, client
  const [userFilter, setUserFilter] = useState('ALL');

  // Modal States
  const [formOpen, setFormOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);

  const isAdmin = 
    currentUser?.role === 'Super Admin' || 
    currentUser?.role === 'Admin' ||
    (currentUser?.position && /admin|director|manager|lead/i.test(currentUser.position));

  // Metrics Calculations
  const approvedExpenses = expenses.filter(e => e.status === 'Approved');
  const pendingExpenses = expenses.filter(e => e.status === 'Pending');
  const totalApprovedAmount = approvedExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  
  const fuelTravelTotal = approvedExpenses
    .filter(e => e.category === 'Fuel' || e.category === 'Travel')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const clientExpensesTotal = approvedExpenses
    .filter(e => e.expenseType === 'client')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Filtered List
  const filteredExpenses = expenses.filter(exp => {
    const q = search.toLowerCase();
    const matchSearch = 
      (exp.title && exp.title.toLowerCase().includes(q)) ||
      (exp.description && exp.description.toLowerCase().includes(q)) ||
      (exp.id && exp.id.toLowerCase().includes(q)) ||
      (exp.clientName && exp.clientName.toLowerCase().includes(q)) ||
      (exp.createdBy?.name && exp.createdBy.name.toLowerCase().includes(q)) ||
      (exp.createdBy?.position && exp.createdBy.position.toLowerCase().includes(q)) ||
      (exp.receiptNo && exp.receiptNo.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'ALL' || exp.status === statusFilter;
    const matchCategory = categoryFilter === 'ALL' || exp.category === categoryFilter;
    const matchType = typeFilter === 'ALL' || exp.expenseType === typeFilter;
    const matchUser = userFilter === 'ALL' || exp.createdBy?.id === userFilter || exp.createdBy?.name === userFilter;

    return matchSearch && matchStatus && matchCategory && matchType && matchUser;
  });

  const handleOpenAdd = () => {
    setExpenseToEdit(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (exp) => {
    setExpenseToEdit(exp);
    setFormOpen(true);
  };

  const handleOpenDetails = (exp) => {
    setSelectedExpense(exp);
    setDetailsOpen(true);
  };

  const handleQuickApprove = async (e, expId) => {
    e.stopPropagation();
    try {
      await approveExpense(expId, 'Quick approved by Admin');
    } catch (err) {
      alert(err.message || 'Failed to approve expense');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-100 text-orange-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-sans">
                Expense Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track fuel, food, travel, and internal client costs with automated approval controls
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover-scale transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Approved Total */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Approved</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalApprovedAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {approvedExpenses.length} approved expense vouchers
          </div>
        </div>

        {/* Pending Approvals */}
        <div className={`p-5 rounded-2xl border transition-all ${
          pendingExpenses.length > 0 
            ? 'bg-amber-50/70 border-amber-300 text-amber-900 shadow-xs' 
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
              <Clock className={`w-4 h-4 ${pendingExpenses.length > 0 ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{totalPendingAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1.5">
            <span>{pendingExpenses.length} awaiting Admin verification</span>
          </div>
        </div>

        {/* Fuel & Travel */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Fuel & Travel Cost</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{fuelTravelTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Vehicle fuel, transit & field commute
          </div>
        </div>

        {/* Client Linked */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Client Incurred</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{clientExpensesTotal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Internal client costs (isolated from bill)
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search description, employee, client, ID..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending Approval ({pendingExpenses.length})</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Fuel">Fuel</option>
              <option value="Food">Food & Meals</option>
              <option value="Travel">Travel</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 cursor-pointer"
            >
              <option value="ALL">All Allocations</option>
              <option value="daily">Daily / General</option>
              <option value="client">Client Specific</option>
            </select>
          </div>

          {/* User Filter */}
          <div className="md:col-span-2">
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/40 cursor-pointer truncate"
            >
              <option value="ALL">All Team Members</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.position || emp.role})
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Quick Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0">Quick Filter:</span>
          {['ALL', 'Fuel', 'Food', 'Travel', 'Other'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Types' : cat}
            </button>
          ))}
          <div className="h-4 w-px bg-slate-200 mx-1 shrink-0" />
          {['ALL', 'Pending', 'Approved', 'Rejected'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses List / Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {/* Empty State */}
        {filteredExpenses.length === 0 ? (
          <div className="py-16 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto mb-3 border border-orange-100">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Expenses Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {expenses.length === 0 
                ? 'No expenses have been recorded yet. Click "Record Expense" to add your first expense entry.' 
                : 'No expense records matched your current search and filter criteria.'}
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Expense</span>
            </button>
          </div>
        ) : (
          <>
            {/* Mobile Card List View (phones below md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredExpenses.map(exp => {
                const CatMeta = CATEGORY_META[exp.category] || CATEGORY_META.Other;
                const CatIcon = CatMeta.icon;

                return (
                  <div
                    key={exp.id}
                    onClick={() => handleOpenDetails(exp)}
                    className="p-4 space-y-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Top Row: Category + Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border bg-slate-50 border-slate-200 text-slate-700">
                        <CatIcon className="w-3.5 h-3.5 text-orange-500" />
                        <span>{exp.category}</span>
                      </div>

                      <div>
                        {exp.status === 'Approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Approved</span>
                          </span>
                        )}
                        {exp.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Pending</span>
                          </span>
                        )}
                        {exp.status === 'Rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Rejected</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Title & Amount */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">
                          {exp.title}
                        </h4>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>{exp.id}</span>
                          {exp.receiptNo && (
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-sans">
                              Ref: {exp.receiptNo}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black text-slate-900 font-mono block">
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDateDMY ? formatDateDMY(exp.date) : exp.date}
                        </span>
                      </div>
                    </div>

                    {/* Details Box: Logged by & Allocation */}
                    <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="truncate max-w-[150px]">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Logged By</span>
                        <span className="font-semibold text-slate-800 truncate block">
                          {exp.createdBy?.name || 'Staff Member'}
                        </span>
                        <span className="text-[10px] text-orange-600 truncate block">
                          {exp.createdBy?.position || exp.createdBy?.role || 'Staff'}
                        </span>
                      </div>

                      <div className="text-right truncate max-w-[140px]">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Allocation</span>
                        {exp.expenseType === 'client' ? (
                          <span className="font-bold text-orange-700 truncate block" title={exp.clientName}>
                            {exp.clientName || 'Assigned Client'}
                          </span>
                        ) : (
                          <span className="font-medium text-slate-500 block">Daily / General</span>
                        )}
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      {exp.status === 'Pending' && isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickApprove(e, exp.id)}
                          className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Expense</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenDetails(exp)}
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (screens md and up) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4">Expense / ID</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Allocation</th>
                    <th className="py-3.5 px-4">Logged By</th>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredExpenses.map(exp => {
                    const CatMeta = CATEGORY_META[exp.category] || CATEGORY_META.Other;
                    const CatIcon = CatMeta.icon;

                    return (
                      <tr 
                        key={exp.id} 
                        onClick={() => handleOpenDetails(exp)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        {/* Title & ID */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors truncate max-w-[200px]">
                            {exp.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                            <span>{exp.id}</span>
                            {exp.receiptNo && (
                              <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                Ref: {exp.receiptNo}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border bg-slate-50 border-slate-200 text-slate-700">
                            <CatIcon className="w-3.5 h-3.5 text-orange-500" />
                            <span>{exp.category}</span>
                          </div>
                        </td>

                        {/* Allocation */}
                        <td className="py-3.5 px-4">
                          {exp.expenseType === 'client' ? (
                            <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                              <span className="truncate max-w-[130px] font-semibold text-orange-700" title={exp.clientName}>
                                {exp.clientName || 'Assigned Client'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px] font-medium">
                              Daily / General
                            </span>
                          )}
                        </td>

                        {/* Logged By (User + Designation) */}
                        <td className="py-3.5 px-4">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 truncate max-w-[150px]">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{exp.createdBy?.name || 'Staff Member'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px]">
                              <span className="font-medium text-orange-600">
                                {exp.createdBy?.position || exp.createdBy?.role || 'Staff'}
                              </span>
                              {exp.createdBy?.department && (
                                <span> • {exp.createdBy.department}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                          {formatDateDMY ? formatDateDMY(exp.date) : exp.date}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-extrabold text-slate-900 text-sm">
                            ₹{Number(exp.amount).toLocaleString('en-IN')}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {exp.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Approved</span>
                            </span>
                          )}
                          {exp.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                          {exp.status === 'Rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {exp.status === 'Pending' && isAdmin && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickApprove(e, exp.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 transition-all"
                                title="One-click Approve"
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenDetails(exp)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                              title="View Full Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>

      {/* Expense Form Modal (Add / Edit) */}
      <ExpenseFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        expenseToEdit={expenseToEdit}
      />

      {/* Expense Details & Approval Drawer/Modal */}
      <ExpenseDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        expense={selectedExpense}
        onEdit={handleOpenEdit}
      />

    </div>
  );
};

export default Expenses;
