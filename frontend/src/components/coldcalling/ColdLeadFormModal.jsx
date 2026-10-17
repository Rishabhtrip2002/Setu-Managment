import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { 
  X, 
  Phone, 
  User, 
  Building, 
  Mail, 
  MapPin, 
  Tag, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Sparkles 
} from 'lucide-react';

const CATEGORIES = [
  'General',
  'Retail & Shops',
  'Gym & Fitness',
  'Hospitality / Hotel',
  'Education / Institute',
  'Real Estate & Builders',
  'Healthcare & Clinics',
  'Manufacturing',
  'IT & Services',
  'Other'
];

const SOURCES = [
  'Manual Entry',
  'Cold Calling Campaign',
  'Google Maps / Local Search',
  'JustDial / Indiamart',
  'Exhibition / Directory',
  'Referral / Inbound',
  'Other'
];

const ColdLeadFormModal = ({ isOpen, onClose, coldLeadToEdit = null, onSuccess }) => {
  const { 
    addColdLead, 
    updateColdLead, 
    detectPhoneDuplicate, 
    employees, 
    currentUser,
    normalizePhoneNumber 
  } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    email: '',
    address: '',
    city: '',
    state: '',
    category: 'General',
    notes: '',
    source: 'Manual Entry',
    assignedToId: '',
    assignedToName: '',
    forceAdd: false
  });

  const [dupInfo, setDupInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active employees for optional assignment
  const activeStaff = (employees || []).filter(e => e.status === 'Active');

  useEffect(() => {
    if (coldLeadToEdit) {
      setFormData({
        name: coldLeadToEdit.name || '',
        phone: coldLeadToEdit.phone || '',
        company: coldLeadToEdit.company || '',
        email: coldLeadToEdit.email || '',
        address: coldLeadToEdit.address || '',
        city: coldLeadToEdit.city || '',
        state: coldLeadToEdit.state || '',
        category: coldLeadToEdit.category || 'General',
        notes: coldLeadToEdit.notes || '',
        source: coldLeadToEdit.source || 'Manual Entry',
        assignedToId: coldLeadToEdit.assignedToId || '',
        assignedToName: coldLeadToEdit.assignedToName || '',
        forceAdd: false
      });
      setDupInfo(null);
    } else {
      setFormData({
        name: '',
        phone: '',
        company: '',
        email: '',
        address: '',
        city: '',
        state: '',
        category: 'General',
        notes: '',
        source: 'Manual Entry',
        assignedToId: '',
        assignedToName: '',
        forceAdd: false
      });
      setDupInfo(null);
    }
    setErrorMsg('');
  }, [coldLeadToEdit, isOpen]);

  // Real-time duplicate check when phone changes
  useEffect(() => {
    if (!formData.phone || formData.phone.length < 8) {
      setDupInfo(null);
      return;
    }
    const check = detectPhoneDuplicate(formData.phone, coldLeadToEdit?.id);
    if (check.exists) {
      setDupInfo(check);
    } else {
      setDupInfo(null);
    }
  }, [formData.phone, coldLeadToEdit?.id]);

  if (!isOpen) return null;

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, phone: val, forceAdd: false }));
  };

  const handleAssigneeChange = (e) => {
    const empId = e.target.value;
    if (!empId) {
      setFormData(prev => ({ ...prev, assignedToId: '', assignedToName: '' }));
    } else {
      const emp = activeStaff.find(s => s.id === empId);
      setFormData(prev => ({
        ...prev,
        assignedToId: empId,
        assignedToName: emp ? emp.name : ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Contact name is mandatory.');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMsg('Phone number is mandatory.');
      return;
    }

    const norm = normalizePhoneNumber(formData.phone);
    if (!norm || norm.length < 8) {
      setErrorMsg('Please enter a valid phone number (at least 8-10 digits).');
      return;
    }

    if (dupInfo && !formData.forceAdd && !coldLeadToEdit) {
      setErrorMsg('A record with this phone number already exists. Check the warning below or check "Add anyway" to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      if (coldLeadToEdit) {
        updateColdLead(coldLeadToEdit.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          company: formData.company.trim(),
          email: formData.email.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          category: formData.category,
          notes: formData.notes.trim(),
          source: formData.source,
          assignedToId: formData.assignedToId || null,
          assignedToName: formData.assignedToName || null
        });
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const res = addColdLead({
          ...formData,
          forceAdd: formData.forceAdd
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create cold record.');
          setSubmitting(false);
          return;
        }

        if (onSuccess) onSuccess(res.coldLead);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while saving record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-[scaleUp_0.25s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-orange-50 via-white to-amber-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shadow-xs">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {coldLeadToEdit ? 'Edit Cold Calling Record' : 'Add Cold Calling Record'}
              </h3>
              <p className="text-xs text-slate-500">
                {coldLeadToEdit ? 'Update details of prospect' : 'Add a single prospect to the calling pool'}
              </p>
            </div>
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
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Duplicate Detection Alert */}
          {dupInfo && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">Possible Duplicate Detected ({dupInfo.type})</p>
                  <p className="text-slate-700 mt-0.5">{dupInfo.message}</p>
                </div>
              </div>
              <label className="flex items-center gap-2 pt-1 border-t border-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.forceAdd}
                  onChange={e => setFormData(prev => ({ ...prev, forceAdd: e.target.checked }))}
                  className="rounded border-amber-400 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-[11px] font-semibold text-slate-800">
                  Add anyway (e.g., separate branch, different inquiry, or confirmed non-duplicate)
                </span>
              </label>
            </div>
          )}

          {/* Mandatory Fields Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Contact Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rajesh Sharma"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Phone Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm font-mono outline-none transition-all placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Optional Business Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Company / Organization (Optional)
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Sharma Enterprises"
                  value={formData.company}
                  onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Email Address (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  placeholder="e.g. rajesh@example.com"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Location & Industry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Category / Industry
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                City (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Indore"
                value={formData.city}
                onChange={e => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Lead Source
              </label>
              <select
                value={formData.source}
                onChange={e => setFormData(prev => ({ ...prev, source: e.target.value }))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all"
              >
                {SOURCES.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Address (Optional)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="e.g. Shop 12, Main Market, MG Road"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
              />
            </div>
          </div>

          {/* Initial Assignment (Optional, defaults to Unassigned Pool) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center justify-between">
              <span>Assign To (Optional)</span>
              <span className="text-[10px] text-slate-400 normal-case">Leave blank for Shared Unassigned Pool</span>
            </label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <select
                value={formData.assignedToId}
                onChange={handleAssigneeChange}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all"
              >
                <option value="">— Unassigned (Available in Shared Pool) —</option>
                {currentUser && (
                  <option value={currentUser.employeeId || currentUser.uid}>
                    Assign to Me ({currentUser.name})
                  </option>
                )}
                {activeStaff
                  .filter(e => e.id !== (currentUser?.employeeId || currentUser?.uid))
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position || emp.role})
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Prospect Notes / Background Info (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Lead discovered via local directory; owner runs 2 gym branches"
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all resize-none placeholder-slate-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{coldLeadToEdit ? 'Save Changes' : 'Create Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ColdLeadFormModal;
