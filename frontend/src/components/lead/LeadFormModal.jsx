import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { X } from 'lucide-react';

const LeadFormModal = ({ isOpen, onClose, leadToEdit }) => {
  const { addLead, setLeads, currentUser } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    source: 'Website',
    notes: '',
    assignedTo: currentUser.name,
    status: 'New'
  });

  useEffect(() => {
    if (leadToEdit) {
      setFormData({
        name: leadToEdit.name || '',
        phone: leadToEdit.phone || '',
        email: leadToEdit.email || '',
        address: leadToEdit.address || '',
        source: leadToEdit.source || 'Website',
        notes: leadToEdit.notes || '',
        assignedTo: leadToEdit.assignedTo || currentUser.name,
        status: leadToEdit.status || 'New'
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        source: 'Website',
        notes: '',
        assignedTo: currentUser.name,
        status: 'New'
      });
    }
  }, [leadToEdit, isOpen, currentUser.name]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Name and Phone are required.");
      return;
    }

    if (leadToEdit) {
      // Edit mode
      setLeads(prev => prev.map(l => l.id === leadToEdit.id ? { ...l, ...formData } : l));
    } else {
      // Add mode
      addLead(formData);
    }
    onClose();
  };

  const sources = ['Website', 'Referral', 'Social Media', 'Cold Email', 'Other'];
  const statuses = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];
  const teamMembers = ['Siddharth Shah', 'Sneha Patel', 'Raj Mehta'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden border border-slate-800 bg-slate-900 rounded-2xl shadow-2xl animate-[scaleUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/20">
          <h3 className="text-lg font-bold text-slate-100">
            {leadToEdit ? 'Edit Lead Details' : 'Add New Lead'}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Contact / Company Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all"
              placeholder="e.g. TARANG SOLAR SYSTEMS"
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Phone Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                required
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all"
                placeholder="e.g. +91 8830487351"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all"
                placeholder="e.g. info@tarangsolarsystems.com"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Physical / Business Address
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all"
              placeholder="e.g. Plot no. 69 Sitanagar near Dhawad Polytechnic College Wardha road Nagpur 440025"
              value={formData.address}
              onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
            />
          </div>

          {/* Source & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Lead Source
              </label>
              <select
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all"
                value={formData.source}
                onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
              >
                {sources.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Lead Status
              </label>
              <select
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all"
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                {statuses.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Assigned Representative
            </label>
            <select
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all"
              value={formData.assignedTo}
              onChange={e => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
            >
              {teamMembers.map(member => (
                <option key={member} value={member}>{member}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Discovery Notes
            </label>
            <textarea
              rows="3"
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl text-slate-100 text-sm outline-none transition-all resize-none"
              placeholder="Record brief details about client needs, budget, or key timeline milestones..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

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
              className="px-5 py-2 text-sm font-semibold text-slate-950 bg-gradient-to-r from-brand-400 to-emerald-500 hover:from-brand-500 hover:to-emerald-600 rounded-xl hover-scale shadow-md shadow-brand-500/10"
            >
              {leadToEdit ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;
