import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { 
  X, 
  Receipt, 
  Fuel, 
  UtensilsCrossed, 
  Plane, 
  Layers, 
  IndianRupee, 
  Calendar, 
  Building2, 
  FileText, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User,
  Hash
} from 'lucide-react';

const CATEGORIES = [
  { id: 'Fuel', label: 'Fuel', icon: Fuel, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Food', label: 'Food & Meals', icon: UtensilsCrossed, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Travel', label: 'Travel', icon: Plane, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Other', label: 'Other', icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-200' },
];

const ExpenseFormModal = ({ 
  isOpen, 
  onClose, 
  expenseToEdit = null, 
  preselectedClientId = null 
}) => {
  const { 
    clients, 
    currentUser, 
    addExpense, 
    updateExpense, 
    getTodayDateString, 
    isAutoApproveEligible 
  } = useCRM();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Fuel');
  const [expenseType, setExpenseType] = useState('daily'); // 'daily' | 'client'
  const [clientId, setClientId] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [receiptNo, setReceiptNo] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isAutoApproved = isAutoApproveEligible(currentUser);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title || '');
      setAmount(expenseToEdit.amount ? String(expenseToEdit.amount) : '');
      setCategory(expenseToEdit.category || 'Fuel');
      setExpenseType(expenseToEdit.expenseType || (expenseToEdit.clientId ? 'client' : 'daily'));
      setClientId(expenseToEdit.clientId || '');
      setDate(expenseToEdit.date || getTodayDateString());
      setReceiptNo(expenseToEdit.receiptNo || '');
      setDescription(expenseToEdit.description || '');
    } else {
      setTitle('');
      setAmount('');
      setCategory('Fuel');
      if (preselectedClientId) {
        setExpenseType('client');
        setClientId(preselectedClientId);
      } else {
        setExpenseType('daily');
        setClientId('');
      }
      setDate(getTodayDateString());
      setReceiptNo('');
      setDescription('');
    }
    setErrorMsg('');
  }, [expenseToEdit, isOpen, preselectedClientId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Please provide a brief description / reason for this expense.');
      return;
    }

    if (expenseType === 'client' && !clientId) {
      setErrorMsg('Please select which client this expense is incurred for.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedClient = expenseType === 'client' ? clients.find(c => c.id === clientId) : null;

      const payload = {
        title: title.trim() || `${category} Expense`,
        amount: parsedAmount,
        category,
        expenseType,
        clientId: expenseType === 'client' ? clientId : null,
        clientName: selectedClient ? (selectedClient.companyName || selectedClient.name) : null,
        date,
        receiptNo: receiptNo.trim(),
        description: description.trim()
      };

      if (expenseToEdit) {
        await updateExpense(expenseToEdit.id, payload);
      } else {
        await addExpense(payload);
      }

      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to record expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {expenseToEdit ? 'Edit Expense Record' : 'Record New Expense'}
              </h3>
              <p className="text-xs text-slate-500">
                Track fuel, travel, meals, or client-linked operational costs
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submitter & Approval Notice Banner */}
          <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
            isAutoApproved 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}>
            {isAutoApproved ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">
              <div className="font-semibold flex items-center gap-1.5">
                <span>Logged by:</span>
                <span className="text-slate-900 font-bold">{currentUser?.name || 'User'}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-white border border-slate-200 text-slate-700 font-mono">
                  {currentUser?.position || currentUser?.role || 'Staff'}
                </span>
              </div>
              <p className="mt-1 text-[11px] opacity-90">
                {isAutoApproved 
                  ? '⚡ Automatic Approval: You hold Administrator credentials. This expense will be saved as "Approved" without requiring review.'
                  : '⏳ Requires Admin Approval: This expense will be submitted with "Pending" status and recorded upon approval by an Administrator / Super Admin.'}
              </p>
            </div>
          </div>

          {/* Expense Nature: Daily vs Client-Specific */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Expense Allocation Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExpenseType('daily')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  expenseType === 'daily'
                    ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  expenseType === 'daily' ? 'border-orange-500 bg-orange-500' : 'border-slate-400'
                }`}>
                  {expenseType === 'daily' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Daily / Operational</div>
                  <div className="text-[10px] text-slate-500">General staff routine costs</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExpenseType('client')}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                  expenseType === 'client'
                    ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  expenseType === 'client' ? 'border-orange-500 bg-orange-500' : 'border-slate-400'
                }`}>
                  {expenseType === 'client' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Client-Linked Expense</div>
                  <div className="text-[10px] text-slate-500">Incurred for specific client</div>
                </div>
              </button>
            </div>
          </div>

          {/* Client Selection (If client-linked) */}
          {expenseType === 'client' && (
            <div className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200 space-y-2 animate-[fadeIn_0.2s_ease-out]">
              <label className="block text-xs font-semibold text-slate-700">
                Select Client <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
                >
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName ? `${c.companyName} (${c.name})` : c.name} • {c.phone}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-500">
                💡 Note: This expense is for internal cost tracking only. It is completely isolated from the client's quotation and billing.
              </p>
            </div>
          )}

          {/* Expense Category Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Expense Category <span className="text-orange-600">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected 
                        ? 'bg-orange-50 border-orange-400 text-orange-950 shadow-2xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border ${cat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Amount (₹) <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold">
                  ₹
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 850"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Expense Date <span className="text-orange-600">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:border-orange-500 transition-all cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Title / Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Expense Title / Purpose
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`e.g. ${category} for site visit to client premise`}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:border-orange-500 transition-all"
            />
          </div>

          {/* Receipt / Invoice Number (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Receipt / Bill No. <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                placeholder="e.g. PETROL-78901 / BILL-432"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Description & Justification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes <span className="text-orange-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details (e.g. Travel from office to client site via car, petrol reimbursement for 35 KM roundtrip)."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:bg-white focus:border-orange-500 transition-all resize-none leading-relaxed"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold shadow-xs transition-all hover-scale disabled:opacity-60 cursor-pointer"
          >
            {submitting ? 'Saving...' : expenseToEdit ? 'Update Expense' : isAutoApproved ? 'Record & Approve' : 'Submit for Approval'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExpenseFormModal;
