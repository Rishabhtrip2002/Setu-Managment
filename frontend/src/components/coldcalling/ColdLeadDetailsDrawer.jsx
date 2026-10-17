import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { 
  X, 
  Phone, 
  PhoneCall, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  Mail, 
  MapPin, 
  Tag, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  Edit, 
  Trash2, 
  ShieldAlert, 
  CalendarClock, 
  ArrowUpRight,
  History,
  Timer
} from 'lucide-react';

const OUTCOME_BADGES = {
  'Interested': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Connected — Interested': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'Follow-up Required': 'bg-teal-50 text-teal-800 border-teal-200',
  'No Answer': 'bg-amber-50 text-amber-800 border-amber-200',
  'Busy / Call Later': 'bg-blue-50 text-blue-800 border-blue-200',
  'Not Interested': 'bg-rose-50 text-rose-800 border-rose-200',
  'Connected — Not Interested': 'bg-rose-50 text-rose-800 border-rose-200',
  'Wrong Number': 'bg-slate-100 text-slate-700 border-slate-300',
  'Converted': 'bg-purple-50 text-purple-800 border-purple-200',
  'Converted / Closed': 'bg-purple-50 text-purple-800 border-purple-200',
  'Do Not Call': 'bg-red-100 text-red-900 border-red-300'
};

const ColdLeadDetailsDrawer = ({ 
  isOpen, 
  onClose, 
  coldLead, 
  onOpenCallModal, 
  onOpenConvertModal, 
  onOpenEditModal 
}) => {
  const { 
    currentUser, 
    followUps, 
    toggleColdLeadDNC, 
    deleteColdLead, 
    completeFollowUp,
    formatDateDMY 
  } = useCRM();

  const [dncReasonInput, setDncReasonInput] = useState('');
  const [showDncPrompt, setShowDncPrompt] = useState(false);

  if (!isOpen || !coldLead) return null;

  const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const isOwner = coldLead.assignedToId === (currentUser?.employeeId || currentUser?.uid);
  const canEdit = isAdmin || isOwner || !coldLead.assignedToId;

  // Find active pending follow-up in CRM
  const activeFollowUp = (followUps || []).find(f => 
    (f.coldLeadId === coldLead.id || f.leadPhone === coldLead.phone) && 
    f.status === 'Pending'
  );

  const handleToggleDNC = () => {
    if (coldLead.isDNC) {
      toggleColdLeadDNC(coldLead.id, '', false);
      setShowDncPrompt(false);
    } else {
      toggleColdLeadDNC(coldLead.id, dncReasonInput || 'Marked as Do Not Call by user', true);
      setShowDncPrompt(false);
      setDncReasonInput('');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete cold record "${coldLead.name}"?`)) {
      deleteColdLead(coldLead.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-[slideLeft_0.25s_ease-out]">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{coldLead.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    OUTCOME_BADGES[coldLead.status] || 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {coldLead.status}
                  </span>
                  {coldLead.isDNC && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-800 border border-red-300">
                      DNC
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {coldLead.id} • Added {formatDateDMY(coldLead.createdDate) || 'Recently'}
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

            {/* Quick Action Dial & Promote Toolbar */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenCallModal(coldLead)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs shadow-xs transition-transform active:scale-95 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{coldLead.assignedToId ? 'Call Prospect' : 'Claim & Log Call'}</span>
              </button>

              {coldLead.status !== 'Converted' ? (
                <button
                  type="button"
                  onClick={() => onOpenConvertModal(coldLead)}
                  className="flex items-center gap-1.5 px-3 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                  title="Promote this contact to an active Lead in CRM"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>To Lead</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-800 text-xs font-bold border border-purple-200 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Converted → #{coldLead.convertedLeadId || 'Lead'}</span>
                </div>
              )}

              {canEdit && (
                <button
                  type="button"
                  onClick={() => onOpenEditModal(coldLead)}
                  className="p-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
                  title="Edit record details"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* DNC Warning Bar if active */}
          {coldLead.isDNC && (
            <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 flex items-center justify-between text-xs text-red-900">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span><strong>Do Not Call:</strong> {coldLead.dncReason || 'Opted out'}</span>
              </div>
              <button
                type="button"
                onClick={handleToggleDNC}
                className="text-[11px] text-red-700 font-bold hover:underline"
              >
                Revoke DNC
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
            
            {/* Ownership Card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Ownership State
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  coldLead.assignedToId ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {coldLead.assignedToId ? 'Assigned' : 'Shared Pool (Unassigned)'}
                </span>
              </div>
              {coldLead.assignedToId ? (
                <div className="flex items-center gap-2 pt-1 text-slate-800">
                  <UserCheck className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold">{coldLead.assignedToName || 'Employee'}</span>
                  {coldLead.assignedAt && (
                    <span className="text-slate-400 text-[10px]">
                      • Claimed on {formatDateDMY(coldLead.assignedAt)}
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-slate-600 text-[11px]">
                  This lead is in the open pool. Logging a call with notes will automatically assign it to you.
                </p>
              )}
            </div>

            {/* Active CRM Follow-up Card (Reusing existing Follow-up system) */}
            {activeFollowUp && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-teal-900">
                    <CalendarClock className="w-4 h-4 text-teal-600" />
                    <span>CRM Follow-up Scheduled</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                    {formatDateDMY(activeFollowUp.dueDate)} @ {activeFollowUp.dueTime || '11:00 AM'}
                  </span>
                </div>
                {activeFollowUp.notes && (
                  <p className="text-slate-700 text-[11px] bg-white/80 p-2 rounded-lg border border-teal-100">
                    "{activeFollowUp.notes}"
                  </p>
                )}
                <div className="pt-1 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => completeFollowUp(activeFollowUp.id, 'Completed from Cold Calling drawer', false)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-[11px] font-bold transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Mark Done</span>
                  </button>
                </div>
              </div>
            )}

            {/* Contact Details Grid */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Contact & Business Details
              </h4>
              <div className="grid grid-cols-1 gap-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-orange-500" />
                    <span className="font-mono font-bold text-slate-900">{coldLead.phone}</span>
                  </div>
                  <a
                    href={`tel:${coldLead.phone}`}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] transition-colors"
                  >
                    Dial tel:
                  </a>
                </div>

                {coldLead.company && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white">
                    <Building className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-800 font-semibold">{coldLead.company}</span>
                  </div>
                )}

                {coldLead.email && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white">
                    <div className="flex items-center gap-2 text-slate-600 truncate">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">{coldLead.email}</span>
                    </div>
                    <a
                      href={`mailto:${coldLead.email}`}
                      className="text-orange-600 font-semibold hover:underline shrink-0"
                    >
                      Email
                    </a>
                  </div>
                )}

                {(coldLead.address || coldLead.city || coldLead.state) && (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl border border-slate-200 bg-white">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-700">
                      {[coldLead.address, coldLead.city, coldLead.state].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <span>Industry / Category</span>
                  </div>
                  <span className="font-semibold text-slate-800">{coldLead.category || 'General'}</span>
                </div>

                {coldLead.notes && (
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-700 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Prospect Notes:
                    </span>
                    <p className="whitespace-pre-wrap">{coldLead.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Call History Timeline */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <History className="w-4 h-4 text-orange-600" />
                  <span>Call & Activity History ({coldLead.callLogs?.length || 0})</span>
                </div>
                {coldLead.lastCallDate && (
                  <span className="text-[10px] text-slate-400">
                    Last called {formatDateDMY(coldLead.lastCallDate)}
                  </span>
                )}
              </div>

              {(!coldLead.callLogs || coldLead.callLogs.length === 0) ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                  <Phone className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p className="font-medium text-[11px]">No calls logged yet.</p>
                  <p className="text-[10px] mt-0.5">Click "Call Prospect" above to start calling.</p>
                </div>
              ) : (
                <div className="space-y-2.5 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {coldLead.callLogs.map((log, idx) => (
                    <div key={log.id || idx} className="relative pl-7 space-y-1">
                      <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                      <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            OUTCOME_BADGES[log.outcome] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {log.outcome}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.timestamp || log.date}
                          </span>
                        </div>
                        {log.notes && (
                          <p className="text-slate-800 font-medium text-[11px] leading-relaxed">
                            "{log.notes}"
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>Caller: <strong>{log.callerName || 'Telecaller'}</strong></span>
                          {log.duration && (
                            <span className="font-mono text-slate-600 flex items-center gap-1">
                              <Timer className="w-3 h-3 text-orange-500" />
                              {log.duration}
                            </span>
                          )}
                        </div>
                        {log.nextFollowUpDate && (
                          <div className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-1 rounded-md">
                            Next Follow-up: {formatDateDMY(log.nextFollowUpDate)} {log.nextFollowUpTime && `@ ${log.nextFollowUpTime}`}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* DNC Toggle Section */}
            <div className="pt-3 border-t border-slate-200">
              {!showDncPrompt ? (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowDncPrompt(true)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>{coldLead.isDNC ? 'Manage Do Not Call status' : 'Mark as Do Not Call (DNC)'}</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete cold calling record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <p className="font-bold text-red-900 text-xs">
                    {coldLead.isDNC ? 'Remove from Do Not Call list?' : 'Add contact to Do Not Call (DNC) list?'}
                  </p>
                  {!coldLead.isDNC && (
                    <input
                      type="text"
                      placeholder="Reason (e.g. customer requested no calls)"
                      value={dncReasonInput}
                      onChange={e => setDncReasonInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-red-300 rounded-lg text-xs outline-none"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleDNC}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs"
                    >
                      {coldLead.isDNC ? 'Revoke DNC' : 'Confirm DNC'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDncPrompt(false)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-lg text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ColdLeadDetailsDrawer;
