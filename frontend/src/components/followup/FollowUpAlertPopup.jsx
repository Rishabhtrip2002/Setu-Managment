import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import {
  BellRing, X, Check, Phone, MessageSquare,
  ChevronRight, ChevronLeft, RotateCw, ExternalLink, ChevronUp
} from 'lucide-react';
import FollowUpModal from './FollowUpModal';
import { checkAndNotifyDueFollowUps } from '../../services/notificationService';

const FollowUpAlertPopup = ({ onOpenLeadDrawer }) => {
  const {
    followUps, dismissedAlertIds, completeFollowUp,
    rescheduleFollowUp, dismissFollowUpAlert, getTodayDateString, leads
  } = useCRM();

  const today = getTodayDateString();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [toast, setToast] = useState(null);

  const dueTasks = followUps.filter(f =>
    f.status === 'Pending' && f.dueDate <= today && !dismissedAlertIds.includes(f.id)
  );

  React.useEffect(() => {
    if (dueTasks.length > 0) {
      checkAndNotifyDueFollowUps(dueTasks, today, (task) => {
        if (onOpenLeadDrawer && task?.leadId) {
          const lead = leads.find(l => l.id === task.leadId);
          if (lead) onOpenLeadDrawer(lead);
        }
      });
    }
  }, [dueTasks.length, today]);

  if (dueTasks.length === 0 || hidden) return null;

  const idx = Math.min(currentIndex, dueTasks.length - 1);
  const task = dueTasks[idx];
  const matchingLead = leads.find(l => l.id === task?.leadId);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDone = () => {
    completeFollowUp(task.id);
    showToast(`Done — "${task.leadName}" moved to New`);
    if (currentIndex >= dueTasks.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  const handleReschedule = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    rescheduleFollowUp(task.id, d.toISOString().split('T')[0], task.dueTime, `+${days}d`);
    setShowReschedule(false);
    showToast(`Rescheduled +${days} day${days > 1 ? 's' : ''}`);
  };

  const handleOpenDetails = () => {
    if (matchingLead && onOpenLeadDrawer) {
      setExpanded(false);
      setHidden(true);
      onOpenLeadDrawer(matchingLead);
      setTimeout(() => setHidden(false), 500);
    }
  };

  const handleDismiss = () => {
    dismissFollowUpAlert(task.id);
    if (currentIndex >= dueTasks.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1));
  };

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 z-[60] flex items-center gap-2 px-3.5 py-2 bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl shadow-lg animate-[fadeIn_0.2s]">
          <Check className="w-3.5 h-3.5" />
          <span>{toast}</span>
        </div>
      )}

      {/* Compact Alert Bar */}
      <div className="fixed bottom-20 lg:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:w-[380px] z-40 animate-[slideUp_0.3s_ease-out]">

        {/* Collapsed bar — always visible */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/95 backdrop-blur-md border border-orange-200 rounded-2xl shadow-lg shadow-orange-500/10 cursor-pointer select-none"
          onClick={() => { setExpanded(!expanded); setShowReschedule(false); }}
        >
          {/* Ping dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
          </span>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 truncate">{task.leadName}</span>
              <span className="text-[10px] text-orange-600 font-semibold shrink-0">{task.dueTime || '11:00'}</span>
            </div>
            <p className="text-[10px] text-slate-500 truncate">{task.title || 'Follow-up due'}</p>
          </div>

          {/* Nav + Count */}
          <div className="flex items-center gap-0.5 shrink-0">
            {dueTasks.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setCurrentIndex((idx - 1 + dueTasks.length) % dueTasks.length); }} className="p-0.5 text-slate-400 hover:text-slate-700">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold text-orange-600 tabular-nums">{idx + 1}/{dueTasks.length}</span>
                <button onClick={(e) => { e.stopPropagation(); setCurrentIndex((idx + 1) % dueTasks.length); }} className="p-0.5 text-slate-400 hover:text-slate-700">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            {dueTasks.length <= 1 && (
              <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5">
                <BellRing className="w-3 h-3" /> 1
              </span>
            )}
          </div>

          {/* Expand chevron */}
          <ChevronUp className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${expanded ? '' : 'rotate-180'}`} />
        </div>

        {/* Expanded panel — actions */}
        {expanded && (
          <div className="mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-[fadeIn_0.15s]">

            {/* Quick actions row */}
            <div className="flex items-stretch border-b border-slate-100">
              <button
                onClick={handleDone}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-colors"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                Done
              </button>
              <button
                onClick={() => setShowReschedule(!showReschedule)}
                className={`px-4 py-2.5 text-xs font-semibold border-l border-r transition-colors ${
                  showReschedule ? 'bg-orange-50 text-orange-700 border-orange-200' : 'text-slate-600 hover:bg-slate-50 border-slate-100'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reschedule options */}
            {showReschedule && (
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 bg-slate-50">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mr-1">Postpone:</span>
                {[1, 3, 7].map(d => (
                  <button
                    key={d}
                    onClick={() => handleReschedule(d)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-700 transition-colors"
                  >
                    +{d}d
                  </button>
                ))}
                <button
                  onClick={() => { setShowReschedule(false); setRescheduleModalOpen(true); }}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-orange-300 hover:text-orange-700 transition-colors"
                >
                  Pick
                </button>
              </div>
            )}

            {/* Links row */}
            <div className="flex items-center justify-between px-3.5 py-2">
              <a
                href={`tel:${task.leadPhone}`}
                className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:underline"
              >
                <Phone className="w-3 h-3" /> Call
              </a>
              <a
                href={`https://wa.me/${(task.leadPhone || '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
              >
                <MessageSquare className="w-3 h-3" /> WhatsApp
              </a>
              {matchingLead && onOpenLeadDrawer && (
                <button
                  onClick={handleOpenDetails}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" /> Details
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule custom date modal */}
      {rescheduleModalOpen && (
        <FollowUpModal
          isOpen={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          lead={matchingLead}
          initialFollowUp={task}
        />
      )}
    </>
  );
};

export default FollowUpAlertPopup;
