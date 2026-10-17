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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
      <div className="relative w-full max-w-xl overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-2xl animate-[scaleUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <h3 className="text-base font-bold text-slate-900">Set Instalment Schedule</h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Client Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Select Client <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-xs outline-none transition-all cursor-pointer"
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
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Linked Quotation (Accepted Only) <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={!clientId}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-xs outline-none transition-all disabled:opacity-50 cursor-pointer"
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
            <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl flex justify-between text-xs">
              <span className="text-slate-700 font-semibold">Quotation Total Amount:</span>
              <span className="font-black text-orange-600">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount)}
              </span>
            </div>
          )}

          {/* Instalment builder */}
          {quoteId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Configure Instalment Splits
                </label>
                <button
                  type="button"
                  onClick={handleAddInstalment}
                  className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Split Instalment</span>
                </button>
              </div>

              <div className="space-y-3">
                {instalments.map((inst, index) => (
                  <div key={index} className="flex gap-3 items-center p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <span className="text-xs font-bold text-slate-500 min-w-[50px]">Part #{index+1}</span>
                    
                    {/* Amount */}
                    <div className="flex-1 flex items-center gap-1.5">
                      <span className="text-xs text-slate-500 font-bold">₹</span>
                      <input
                        type="number"
                        required
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-orange-500"
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
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-orange-500"
                        value={inst.dueDate}
                        onChange={e => handleInstalmentChange(index, 'dueDate', e.target.value)}
                      />
                    </div>

                    {/* Delete item button */}
                    {instalments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveInstalment(index)}
                        className="p-2 text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg bg-white transition-colors cursor-pointer"
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!quoteId}
              className="px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-xs disabled:opacity-50 cursor-pointer"
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
