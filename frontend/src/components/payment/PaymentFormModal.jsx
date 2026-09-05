import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { X, Plus, Trash2, Calendar } from 'lucide-react';

const PaymentFormModal = ({ isOpen, onClose, preselectedClientId }) => {
  const { clients, quotations, addCustomPayment, getTodayDateString } = useCRM();

  const [clientId, setClientId] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [instalments, setInstalments] = useState([{ amount: '', dueDate: getTodayDateString() }]);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    if (preselectedClientId) {
      setClientId(preselectedClientId);
    } else {
      setClientId('');
    }
    setQuoteId('');
    setInstalments([{ amount: '', dueDate: getTodayDateString() }]);
    setTotalAmount(0);
  }, [isOpen, preselectedClientId]);

  if (!isOpen) return null;

  // Filter accepted quotations for the selected client
  const clientQuotes = quotations.filter(q => q.clientOrLeadId === clientId && q.type === 'client' && q.status === 'Accepted');

  const handleClientChange = (cId) => {
    setClientId(cId);
    setQuoteId('');
    setInstalments([{ amount: '', dueDate: getTodayDateString() }]);
    setTotalAmount(0);
  };

  const handleQuoteChange = (qId) => {
    setQuoteId(qId);
    const quote = quotations.find(q => q.id === qId);
    if (quote) {
      setTotalAmount(quote.total);
      // Auto pre-fill with half-payment split as standard default
      const half = Math.round(quote.total / 2);
      const due2 = new Date();
      due2.setDate(due2.getDate() + 30);
      const due2Str = due2.toISOString().split('T')[0];

      setInstalments([
        { amount: half, dueDate: getTodayDateString() },
        { amount: quote.total - half, dueDate: due2Str }
      ]);
    } else {
      setTotalAmount(0);
      setInstalments([{ amount: '', dueDate: getTodayDateString() }]);
    }
  };

  const handleAddInstalment = () => {
    setInstalments(prev => [...prev, { amount: '', dueDate: getTodayDateString() }]);
  };

  const handleRemoveInstalment = (index) => {
    if (instalments.length === 1) return;
    setInstalments(prev => prev.filter((_, i) => i !== index));
  };

  const handleInstalmentChange = (index, field, value) => {
    setInstalments(prev => prev.map((inst, i) => {
      if (i === index) {
        return {
          ...inst,
          [field]: field === 'amount' ? Number(value) : value
        };
      }
      return inst;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientId) {
      alert("Please select a client.");
      return;
    }
    if (!quoteId) {
      alert("Please select a quotation.");
      return;
    }

    const instalmentsSum = instalments.reduce((sum, inst) => sum + Number(inst.amount), 0);
    if (Math.abs(instalmentsSum - totalAmount) > 1) {
      alert(`Error: The sum of instalments (₹${instalmentsSum}) must match the quotation total (₹${totalAmount}).`);
      return;
    }

    if (instalments.some(inst => !inst.dueDate || inst.amount <= 0)) {
      alert("Please enter a valid amount and due date for all instalments.");
      return;
    }

    addCustomPayment(clientId, quoteId, totalAmount, instalments);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden border border-slate-800 bg-slate-900 rounded-2xl shadow-2xl animate-[scaleUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/20">
          <h3 className="text-base font-bold text-slate-100">Set Instalment Schedule</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Client Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Select Client <span className="text-red-400">*</span>
            </label>
            <select
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all"
              value={clientId}
              onChange={e => handleClientChange(e.target.value)}
            >
              <option value="">-- Choose Client --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.companyName})</option>
              ))}
            </select>
          </div>

          {/* Quotation Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Linked Quotation (Accepted Only) <span className="text-red-400">*</span>
            </label>
            <select
              required
              disabled={!clientId}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all disabled:opacity-50"
              value={quoteId}
              onChange={e => handleQuoteChange(e.target.value)}
            >
              <option value="">-- Choose Quote --</option>
              {clientQuotes.map(q => (
                <option key={q.id} value={q.id}>{q.id} - {q.title} (₹{q.total})</option>
              ))}
            </select>
          </div>

          {/* Quotation Total Indicator */}
          {totalAmount > 0 && (
            <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex justify-between text-xs">
              <span className="text-slate-400 font-semibold">Quotation Total Amount:</span>
              <span className="font-bold text-brand-400">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount)}
              </span>
            </div>
          )}

          {/* Instalment builder */}
          {quoteId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Configure Instalment Splits
                </label>
                <button
                  type="button"
                  onClick={handleAddInstalment}
                  className="flex items-center gap-1 text-[11px] font-bold text-brand-400 hover:text-brand-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Split Instalment</span>
                </button>
              </div>

              <div className="space-y-3">
                {instalments.map((inst, index) => (
                  <div key={index} className="flex gap-3 items-center p-3 bg-slate-950/30 border border-slate-800/80 rounded-2xl">
                    <span className="text-xs font-bold text-slate-400 min-w-[50px]">#{index+1}</span>
                    
                    {/* Amount */}
                    <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-xs text-slate-500">₹</span>
                      <input
                        type="number"
                        required
                        className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-brand-500"
                        placeholder="Amount"
                        value={inst.amount}
                        onChange={e => handleInstalmentChange(index, 'amount', e.target.value)}
                      />
                    </div>

                    {/* Due Date */}
                    <div className="flex-1">
                      <input
                        type="date"
                        required
                        className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 outline-none focus:border-brand-500"
                        value={inst.dueDate}
                        onChange={e => handleInstalmentChange(index, 'dueDate', e.target.value)}
                      />
                    </div>

                    {/* Delete item button */}
                    {instalments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstalment(index)}
                        className="p-1.5 text-slate-500 hover:text-red-400 border border-slate-850 hover:border-slate-800 rounded-lg bg-slate-950"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 bg-slate-950/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!quoteId}
              className="px-5 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-brand-400 to-emerald-500 hover:from-brand-500 hover:to-emerald-600 rounded-xl hover-scale shadow-md shadow-brand-500/10 disabled:opacity-50"
            >
              Save Schedule
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default PaymentFormModal;
