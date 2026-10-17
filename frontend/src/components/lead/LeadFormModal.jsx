import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { X, AlertTriangle, Building, Phone, User, Mail, MapPin, CheckCircle2, ShieldAlert } from 'lucide-react';

const LeadFormModal = ({ isOpen, onClose, leadToEdit }) => {
  const { 
    addLead, 
    updateLead, 
    currentUser, 
    employees, 
    detectPhoneDuplicate, 
    normalizePhoneNumber,
    formatPhoneForDisplay 
  } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    email: '',
    address: '',
    source: 'Website',
    notes: '',
    assignedTo: currentUser?.name || 'Staff',
    assignedToId: currentUser?.employeeId || '',
    status: 'New'
  });

  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [forceAdd, setForceAdd] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (leadToEdit) {
      setFormData({
        name: leadToEdit.name || '',
        phone: leadToEdit.phone || '',
        company: leadToEdit.company || '',
        email: leadToEdit.email || '',
        address: leadToEdit.address || '',
        source: leadToEdit.source || 'Website',
        notes: leadToEdit.notes || '',
        assignedTo: leadToEdit.assignedTo || currentUser?.name || 'Staff',
        assignedToId: leadToEdit.assignedToId || '',
        status: leadToEdit.status || 'New'
      });
      setDuplicateWarning(null);
      setForceAdd(false);
      setErrorMessage('');
    } else {
      setFormData({
        name: '',
        phone: '',
        company: '',
        email: '',
        address: '',
        source: 'Website',
        notes: '',
        assignedTo: currentUser?.name || 'Staff',
        assignedToId: currentUser?.employeeId || '',
        status: 'New'
      });
      setDuplicateWarning(null);
      setForceAdd(false);
      setErrorMessage('');
    }
  }, [leadToEdit, isOpen, currentUser?.name, currentUser?.employeeId]);

  if (!isOpen) return null;

  // Real-time phone check on change or blur
  const handlePhoneChange = (val) => {
    setFormData(prev => ({ ...prev, phone: val }));
    setErrorMessage('');
    const norm = normalizePhoneNumber(val);
    if (norm.length >= 8) {
      const dup = detectPhoneDuplicate(norm, leadToEdit?.id, leadToEdit ? 'lead' : null);
      if (dup && dup.exists) {
        setDuplicateWarning(dup);
      } else {
        setDuplicateWarning(null);
        setForceAdd(false);
      }
    } else {
      setDuplicateWarning(null);
      setForceAdd(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMessage('Contact Name and Phone Number are required.');
      return;
    }

    const normPhone = normalizePhoneNumber(formData.phone);
    if (!normPhone || normPhone.length < 8) {
      setErrorMessage('Please enter a valid phone number (at least 8 digits).');
      return;
    }

    // Verify duplicate state
    const dup = detectPhoneDuplicate(normPhone, leadToEdit?.id, leadToEdit ? 'lead' : null);
    if (dup && dup.exists && !leadToEdit && !forceAdd) {
      setDuplicateWarning(dup);
      setErrorMessage(`Duplicate match found: ${dup.message}. Check "Proceed anyway" to force create.`);
      return;
    }

    const matchedEmp = (employees || []).find(emp => emp.name === formData.assignedTo);
    const payload = {
      ...formData,
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      notes: formData.notes.trim(),
      assignedToId: matchedEmp ? matchedEmp.id : formData.assignedToId || '',
      forceAdd
    };

    setIsSubmitting(true);
    try {
      if (leadToEdit) {
        // Edit mode
        updateLead(leadToEdit.id, payload);
        onClose();
      } else {
        // Add mode
        const res = addLead(payload);
        if (res && !res.success) {
          if (res.isDuplicate) {
            setDuplicateWarning(res.duplicateInfo);
            setErrorMessage(res.error || 'Duplicate detected. Confirm bypass if intentional.');
          } else {
            setErrorMessage(res.error || 'Failed to create lead.');
          }
          setIsSubmitting(false);
          return;
        }
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sources = ['Website', 'Referral', 'Social Media', 'Cold Email', 'Inbound Call', 'Other'];
  const statuses = ['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'];
  const activeStaffNames = (employees || []).filter(e => e.status === 'Active').map(e => e.name);
  const teamMembers = Array.from(new Set([
    currentUser?.name || 'Super Admin',
    ...activeStaffNames,
    'Sales Team',
    'Technical Support'
  ]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/40 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-lg overflow-hidden border border-slate-200 bg-white rounded-2xl shadow-2xl animate-[scaleUp_0.25s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {leadToEdit ? 'Edit Lead Details' : 'Add New Direct Lead'}
            </h3>
            <p className="text-xs text-slate-500">
              {leadToEdit ? 'Update lead profile and pipeline information' : 'Direct pipeline entry with cross-entity duplicate protection'}
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* Duplicate Warning Card */}
        {duplicateWarning && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-amber-900">
                  Potential Duplicate Match in {duplicateWarning.type || 'CRM'}!
                </span>
                <p className="text-amber-800 mt-0.5">{duplicateWarning.message}</p>
              </div>
            </div>

            {!leadToEdit && (
              <div className="pt-2 border-t border-amber-200 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer text-amber-900 font-semibold select-none">
                  <input
                    type="checkbox"
                    checked={forceAdd}
                    onChange={(e) => setForceAdd(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-amber-300"
                  />
                  <span>Proceed anyway (create distinct lead)</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Name & Company Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Contact Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400 font-medium"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Company / Organization
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
                  placeholder="e.g. Sharma Enterprises"
                  value={formData.company}
                  onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="tel"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400 font-mono"
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={e => handlePhoneChange(e.target.value)}
                />
              </div>
              {formData.phone && (
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Normalized: {formatPhoneForDisplay(formData.phone) || 'Invalid format'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="email"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
                  placeholder="e.g. client@company.com"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Physical / Business Address
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
                placeholder="e.g. Plot no. 69, Sitanagar, Wardha Road, Nagpur 440025"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          {/* Source & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Lead Source
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-800 text-sm outline-none transition-all"
                value={formData.source}
                onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
              >
                {sources.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Lead Pipeline Status
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-800 text-sm outline-none transition-all font-semibold"
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
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Assigned Representative
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-800 text-sm outline-none transition-all"
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
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Discovery Notes & Requirements
            </label>
            <textarea
              rows="3"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all resize-none placeholder-slate-400"
              placeholder="Record brief details about client needs, budget, or key timeline milestones..."
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 bg-slate-50/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (duplicateWarning && !leadToEdit && !forceAdd)}
              className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : (leadToEdit ? 'Save Changes' : 'Create Lead')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeadFormModal;

