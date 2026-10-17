import React, { useState } from 'react';
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
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  Check, 
  Ban, 
  Trash2, 
  Edit2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const CATEGORY_META = {
  Fuel: { icon: Fuel, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  Food: { icon: UtensilsCrossed, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  Travel: { icon: Plane, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  Other: { icon: Layers, color: 'text-purple-600 bg-purple-50 border-purple-200' },
};

const ExpenseDetailsModal = ({ 
  isOpen, 
  onClose, 
  expense, 
  onEdit 
}) => {
  const { 
    currentUser, 
    approveExpense, 
    rejectExpense, 
    deleteExpense, 
    formatDateDMY 
  } = useCRM();

  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  if (!isOpen || !expense) return null;

  const isAdmin = 
    currentUser?.role === 'Super Admin' || 
    currentUser?.role === 'Admin' ||
    (currentUser?.position && /admin|director|manager|lead/i.test(currentUser.position));

  const isOwner = currentUser?.employeeId === expense.createdBy?.id || currentUser?.uid === expense.createdBy?.id;

  const CatMeta = CATEGORY_META[expense.category] || CATEGORY_META.Other;
  const CatIcon = CatMeta.icon;

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveExpense(expense.id, 'Verified and approved by Admin');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to approve expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Please provide a reason for rejecting this expense.');
      return;
    }

    setLoading(true);
    try {
      await rejectExpense(expense.id, rejectReason.trim());
      setRejecting(false);
      setRejectReason('');
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to reject expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this expense voucher? This action cannot be undone.')) {
      setLoading(true);
      try {
        await deleteExpense(expense.id);
        onClose();
      } catch (err) {
        alert(err.message || 'Failed to delete expense.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease-out]">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${CatMeta.color}`}>
              <CatIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate max-w-[240px]">
                  {expense.title || `${expense.category} Expense`}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  {expense.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {expense.category} • {formatDateDMY ? formatDateDMY(expense.date) : expense.date}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Main Amount Card with Status Badge */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Incurred Amount</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-1 mt-1">
                <span className="text-orange-500 text-xl font-bold">₹</span>
                <span>{Number(expense.amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div>
              {expense.status === 'Approved' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Approved</span>
                </span>
              )}
              {expense.status === 'Pending' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Pending Approval</span>
                </span>
              )}
              {expense.status === 'Rejected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Rejected</span>
                </span>
              )}
            </div>
          </div>

          {/* Allocation & Client Information */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
              <span>Expense Type:</span>
              <span className="font-bold text-slate-900">
                {expense.expenseType === 'client' ? 'Client-Specific Cost' : 'Daily / General Expense'}
              </span>
            </div>

            {expense.expenseType === 'client' && (
              <div className="pt-2 border-t border-slate-200 flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {expense.clientName || 'Assigned Client'}
                  </div>
                  <div className="text-[11px] text-orange-700 font-medium mt-0.5">
                    Internal client expense (Completely isolated from client invoices & billing)
                  </div>
                </div>
              </div>
            )}

            {expense.receiptNo && (
              <div className="pt-2 border-t border-slate-200 text-xs flex items-center justify-between text-slate-700">
                <span className="text-slate-500">Bill / Receipt Ref:</span>
                <span className="font-mono font-bold text-slate-900">{expense.receiptNo}</span>
              </div>
            )}
          </div>

          {/* Submitter Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 border border-orange-200">
              {(expense.createdBy?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-xs truncate">
                  {expense.createdBy?.name || 'Staff Member'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-700">
                  {expense.createdBy?.position || expense.createdBy?.role || 'Staff'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 truncate mt-0.5">
                {expense.createdBy?.department || 'Operations'} • {expense.createdBy?.email}
              </div>
            </div>
          </div>

          {/* Description & Notes */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description / Reason</h4>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {expense.description || 'No description provided.'}
            </div>
          </div>

          {/* Approval Audit Trail */}
          {expense.status === 'Approved' && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1 text-emerald-800">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Approved by: {expense.approvedBy || 'Administrator'}</span>
              </div>
              {expense.approvalNote && (
                <p className="text-[11px] text-emerald-700 pl-5">Note: {expense.approvalNote}</p>
              )}
            </div>
          )}

          {expense.status === 'Rejected' && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-1 text-rose-800">
              <div className="font-bold flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Rejected by: {expense.rejectedBy || 'Administrator'}</span>
              </div>
              {expense.rejectionReason && (
                <p className="text-[11px] text-rose-700 pl-5">Reason: {expense.rejectionReason}</p>
              )}
            </div>
          )}

          {/* Admin Approval Actions (when Pending) */}
          {expense.status === 'Pending' && isAdmin && (
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <span>Admin Approval Control</span>
                </span>
              </div>

              {rejecting ? (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5 animate-[fadeIn_0.2s_ease-out]">
                  <label className="block text-xs font-bold text-rose-800">
                    Reason for Rejection <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Specify why this expense is not approved..."
                    className="w-full p-2.5 bg-white border border-rose-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden resize-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setRejecting(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading || !rejectReason.trim()}
                      onClick={handleReject}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleApprove}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Expense</span>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setRejecting(true)}
                    className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {(isAdmin || isOwner) && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Delete Expense Record"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            {(isAdmin || (isOwner && expense.status === 'Pending')) && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit && onEdit(expense);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                title="Edit Expense"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExpenseDetailsModal;
