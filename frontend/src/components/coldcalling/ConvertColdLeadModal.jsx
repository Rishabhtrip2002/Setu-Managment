import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { 
  X, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  User, 
  Phone, 
  Building, 
  Mail, 
  MapPin, 
  FileText, 
  UserCheck,
  Link2
} from 'lucide-react';

const LEAD_STATUS_OPTIONS = ['New', 'Contacted', 'Quoted', 'Negotiation'];

const ConvertColdLeadModal = ({ isOpen, onClose, coldLead, onSuccess }) => {
  const { 
    convertColdLeadToLead, 
    leads, 
    normalizePhoneNumber, 
    employees, 
    currentUser 
  } = useCRM();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    company: '',
    email: '',
    address: '',
    notes: '',
    source: 'Cold Calling',
    assignedTo: '',
    assignedToId: '',
    status: 'Contacted',
    forceLinkToExisting: false
  });

  const [existingLeadMatch, setExistingLeadMatch] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const activeStaff = (employees || []).filter(e => e.status === 'Active');

  useEffect(() => {
    if (coldLead && isOpen) {
      const defaultOwner = coldLead.assignedToName || currentUser?.name || 'Staff';
      const defaultOwnerId = coldLead.assignedToId || currentUser?.employeeId || '';

      setFormData({
        name: coldLead.name || '',
        phone: coldLead.phone || '',
        company: coldLead.company || '',
        email: coldLead.email || '',
        address: coldLead.address || '',
        notes: coldLead.notes ? `Promoted from Cold Calling (${coldLead.id}). Notes: ${coldLead.notes}` : `Promoted from Cold Calling record (${coldLead.id})`,
        source: coldLead.source || 'Cold Calling',
        assignedTo: defaultOwner,
        assignedToId: defaultOwnerId,
        status: 'Contacted',
        forceLinkToExisting: false
      });

      // Check if lead with matching phone already exists
      const norm = coldLead.normalizedPhone || normalizePhoneNumber(coldLead.phone);
      const match = (leads || []).find(l => normalizePhoneNumber(l.phone) === norm);
      setExistingLeadMatch(match || null);
      setErrorMsg('');
    }
  }, [coldLead, isOpen, currentUser, leads]);

  if (!isOpen || !coldLead) return null;

  const handleAssigneeChange = (e) => {
    const empId = e.target.value;
    if (!empId) {
      setFormData(prev => ({ ...prev, assignedToId: '', assignedTo: currentUser?.name || 'Staff' }));
    } else {
      const emp = activeStaff.find(s => s.id === empId);
      setFormData(prev => ({
        ...prev,
        assignedToId: empId,
        assignedTo: emp ? emp.name : 'Staff'
      }));
    }
  };

  const handleExecuteConvert = (mergeIntoExisting = false) => {
    setErrorMsg('');

    if (coldLead.status === 'Converted' && coldLead.convertedLeadId) {
      setErrorMsg('This cold record has already been converted to a Lead.');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMsg('Lead name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = convertColdLeadToLead(coldLead.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        company: formData.company.trim(),
        source: formData.source,
        notes: formData.notes.trim(),
        assignedTo: formData.assignedTo,
        assignedToId: formData.assignedToId,
        status: formData.status,
        forceLinkToExisting: mergeIntoExisting
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Conversion failed.');
        setSubmitting(false);
        return;
      }

      if (onSuccess) {
        onSuccess(res.lead);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred during conversion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-[scaleUp_0.25s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-purple-50 via-white to-orange-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 border border-purple-200 text-purple-600 flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Promote to Regular Lead</h3>
              <p className="text-xs text-slate-500">
                Move prospect into active sales pipeline & preserve calling history
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

        {/* Already Converted Notification */}
        {coldLead.status === 'Converted' && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-purple-50 border border-purple-300 text-xs text-purple-950 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <p className="font-bold text-purple-900">Prospect Already Promoted to Lead</p>
                <p className="text-purple-700 mt-0.5">
                  This cold calling prospect has already been converted into Lead: <strong>#{coldLead.convertedLeadId || 'Linked Lead'}</strong>.
                </p>
              </div>
            </div>
            <p className="text-[11px] text-purple-600">
              Repeated promotions from the same cold prospect are blocked to maintain single lead pipeline integrity.
            </p>
          </div>
        )}

        {/* Existing Lead Conflict Resolution Card */}
        {existingLeadMatch && coldLead.status !== 'Converted' && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-900">
                  Matching Lead Already Exists in CRM!
                </p>
                <p className="text-slate-700 mt-1">
                  A lead with phone <strong>{coldLead.phone}</strong> is already registered:
                </p>
                <div className="mt-2 p-2.5 bg-white rounded-lg border border-amber-200 text-slate-800 font-sans space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>{existingLeadMatch.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-orange-100 text-orange-800">
                      Status: {existingLeadMatch.status}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Assigned: {existingLeadMatch.assignedTo || 'Unassigned'} • Created: {existingLeadMatch.createdDate || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleExecuteConvert(true)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Merge Calling History into Existing Lead</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-semibold"
              >
                Cancel & View Existing
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Cold Lead Source Summary Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 text-[11px]">Source Cold Record:</span>
              <p className="font-mono font-bold text-slate-800">{coldLead.id}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-[11px]">Total Calls Logged:</span>
              <p className="font-bold text-orange-600">{coldLead.callCount || 0} calls recorded</p>
            </div>
          </div>

          {/* Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Lead Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                disabled
                value={formData.phone}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm font-mono cursor-not-allowed"
                title="Phone number preserved from cold lead"
              />
            </div>
          </div>

          {/* Company & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Tech"
                value={formData.company}
                onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. info@acme.com"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all placeholder-slate-400"
              />
            </div>
          </div>

          {/* Initial Lead Status & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Initial Lead Pipeline Status
              </label>
              <select
                value={formData.status}
                onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all"
              >
                {LEAD_STATUS_OPTIONS.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Assigned Sales Rep
              </label>
              <select
                value={formData.assignedToId}
                onChange={handleAssigneeChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-sm outline-none transition-all"
              >
                {currentUser && (
                  <option value={currentUser.employeeId || currentUser.uid}>
                    {currentUser.name} (Current User)
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

          {/* Lead Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Lead Notes & Requirements
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl text-slate-900 text-xs outline-none transition-all resize-none placeholder-slate-400"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={submitting || coldLead.status === 'Converted' || (existingLeadMatch && !formData.forceLinkToExisting)}
              onClick={() => handleExecuteConvert(false)}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Converting...' : (coldLead.status === 'Converted' ? 'Already Converted' : 'Create New Lead')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConvertColdLeadModal;
