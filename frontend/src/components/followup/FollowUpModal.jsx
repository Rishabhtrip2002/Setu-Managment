import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { 
  X, 
  Calendar, 
  Clock, 
  Phone, 
  Users, 
  MessageSquare, 
  Mail, 
  AlertCircle,
  CalendarCheck
} from 'lucide-react';

const FollowUpModal = ({ isOpen, onClose, lead, initialFollowUp = null }) => {
  const { leads, addFollowUp, rescheduleFollowUp, getTodayDateString } = useCRM();

  const [leadId, setLeadId] = useState(lead ? lead.id : (leads[0]?.id || ''));
  const [type, setType] = useState('Call');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(getTodayDateString());
  const [dueTime, setDueTime] = useState('11:00');
  const [priority, setPriority] = useState('High');

  useEffect(() => {
    if (lead) {
      setLeadId(lead.id);
    } else if (leads.length > 0 && !leadId) {
      setLeadId(leads[0].id);
    }

    if (initialFollowUp) {
      setLeadId(initialFollowUp.leadId);
      setType(initialFollowUp.type || 'Call');
      setTitle(initialFollowUp.title || '');
      setNotes(initialFollowUp.notes || '');
      setDueDate(initialFollowUp.dueDate || getTodayDateString());
      setDueTime(initialFollowUp.dueTime || '11:00');
      setPriority(initialFollowUp.priority || 'High');
    } else {
      setTitle(lead ? `Follow-up with ${lead.name}` : 'Discovery & Demo Follow-up');
    }
  }, [isOpen, lead, initialFollowUp, leads]);

  if (!isOpen) return null;

  const selectedLeadObj = leads.find(l => l.id === leadId) || lead;

  // Preset Date Handlers
  const handleSetPreset = (daysToAdd, defaultTime = '11:00') => {
    const target = new Date();
    target.setDate(target.getDate() + daysToAdd);
    setDueDate(target.toISOString().split('T')[0]);
    setDueTime(defaultTime);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedLeadObj) {
      alert("Please select a lead.");
      return;
    }

    if (initialFollowUp) {
      // Reschedule or edit
      rescheduleFollowUp(initialFollowUp.id, dueDate, dueTime, notes);
    } else {
      // Add new follow-up
      addFollowUp({
        leadId: selectedLeadObj.id,
        leadName: selectedLeadObj.name,
        leadPhone: selectedLeadObj.phone,
        type,
        title: title || `Follow-up with ${selectedLeadObj.name}`,
        notes,
        dueDate,
        dueTime,
        priority
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[85vh] flex flex-col animate-[slideUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {initialFollowUp ? 'Reschedule Follow-up' : 'Set Follow-up Reminder'}
              </h3>
              <p className="text-[11px] text-slate-500">
                Schedule on-screen tasks and client reminders
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Select Lead if not prefilled */}
          {!lead && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Target Lead <span className="text-red-500">*</span>
              </label>
              <select
                value={leadId}
                onChange={e => setLeadId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:bg-white focus:border-orange-500 transition-all font-medium"
                required
              >
                {leads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.phone}) - [{l.status}]
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Task Subject / Agenda <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Call to finalize quote & advance payment"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm outline-none focus:bg-white focus:border-orange-500 transition-all placeholder-slate-400"
            />
          </div>

          {/* Type Selector (Pills) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Follow-up Channel
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'Call', icon: Phone, label: 'Call' },
                { id: 'Meeting', icon: Users, label: 'Meeting' },
                { id: 'WhatsApp', icon: MessageSquare, label: 'WhatsApp' },
                { id: 'Email', icon: Mail, label: 'Email' }
              ].map(item => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setType(item.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-semibold ${
                      isSelected 
                        ? 'bg-orange-50 border-orange-400 text-orange-600 shadow-xs' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Schedule Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Quick Timing Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSetPreset(0, '16:00')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 transition-colors"
              >
                Today 4 PM
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(1, '10:30')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 transition-colors"
              >
                Tomorrow 10:30 AM
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(3, '11:00')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 transition-colors"
              >
                In 3 Days
              </button>
              <button
                type="button"
                onClick={() => handleSetPreset(7, '11:00')}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 transition-colors"
              >
                Next Week
              </button>
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:bg-white focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Due Time
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={dueTime}
                  onChange={e => setDueTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:bg-white focus:border-orange-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Priority
            </label>
            <div className="flex gap-2">
              {['High', 'Medium', 'Low'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    priority === p 
                      ? p === 'High' 
                        ? 'bg-rose-50 text-rose-600 border-rose-300 shadow-xs' 
                        : p === 'Medium' 
                          ? 'bg-amber-50 text-amber-600 border-amber-300 shadow-xs'
                          : 'bg-blue-50 text-blue-600 border-blue-300 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {p} Priority
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Agenda & Discussion Points
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add key notes, budget discussion context or specific questions to ask..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm outline-none focus:bg-white focus:border-orange-500 transition-all placeholder-slate-400 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-md shadow-orange-500/20"
            >
              {initialFollowUp ? 'Save Reschedule' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FollowUpModal;
