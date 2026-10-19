import React, { useState } from 'react';
import { useCRM } from '../../context/CRMContext';
import { 
  BellRing, 
  X, 
  Check, 
  Clock, 
  Phone, 
  Users, 
  MessageSquare, 
  Mail, 
  ArrowRight, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
  RotateCw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import FollowUpModal from './FollowUpModal';
import { 
  checkAndNotifyDueFollowUps, 
  playNotificationChime, 
  getNotificationPermission 
} from '../../services/notificationService';

const FollowUpAlertPopup = ({ onOpenLeadDrawer }) => {
  const { 
    followUps, 
    dismissedAlertIds, 
    completeFollowUp, 
    rescheduleFollowUp, 
    dismissFollowUpAlert,
    getTodayDateString,
    leads
  } = useCRM();

  const today = getTodayDateString();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  // Filter tasks due today or overdue and not dismissed in this session
  const dueTasks = followUps.filter(f => 
    f.status === 'Pending' && 
    f.dueDate <= today && 
    !dismissedAlertIds.includes(f.id)
  );

  // Trigger push notification and chime for due follow-ups / calls
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

  if (dueTasks.length === 0) return null;

  const currentTask = dueTasks[Math.min(currentIndex, dueTasks.length - 1)];
  const matchingLead = leads.find(l => l.id === currentTask?.leadId);

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % dueTasks.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + dueTasks.length) % dueTasks.length);
  };

  const handleMarkDone = (taskId) => {
    completeFollowUp(taskId);
    setSuccessToast(`✓ Marked Done! Lead "${currentTask.leadName}" moved to New status.`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleQuickReschedule = (days) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const newDate = target.toISOString().split('T')[0];
    rescheduleFollowUp(currentTask.id, newDate, currentTask.dueTime, `Postponed +${days} days`);
    setIsRescheduling(false);
    setSuccessToast(`Rescheduled to ${newDate}`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Call': return <Phone className="w-4 h-4 text-orange-500" />;
      case 'Meeting': return <Users className="w-4 h-4 text-purple-500" />;
      case 'WhatsApp': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'Email': return <Mail className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  // Minimized Pill view
  if (minimized) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-35 animate-[slideUp_0.3s_ease-out]">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-xl shadow-orange-500/25 hover-scale font-bold text-xs"
        >
          <BellRing className="w-4 h-4 animate-bounce" />
          <span>{dueTasks.length} Follow-up{dueTasks.length > 1 ? 's' : ''} Due Today</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Toast confirmation */}
      {successToast && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-2xl shadow-xl shadow-emerald-500/10 animate-[fadeIn_0.3s_ease-out]">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Main Alert Card */}
      <div className="fixed bottom-20 sm:bottom-6 right-2 sm:right-6 z-50 w-[95%] sm:w-96 max-w-sm bg-white/98 backdrop-blur-md border border-orange-200 rounded-3xl sm:rounded-2xl shadow-2xl shadow-orange-500/15 overflow-hidden animate-[slideUp_0.35s_ease-out]">
        
        {/* Glow accent top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-orange-50/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-orange-700 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5 text-orange-500" />
              Follow-up Due Today ({currentIndex + 1}/{dueTasks.length})
            </span>
          </div>

          <div className="flex items-center gap-1">
            {dueTasks.length > 1 && (
              <div className="flex items-center mr-1">
                <button 
                  onClick={handlePrev}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white"
                  title="Previous task"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={handleNext}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-white"
                  title="Next task"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              onClick={() => setMinimized(true)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
              title="Minimize Alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          
          {/* Lead Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="p-1 rounded-lg bg-orange-50 border border-orange-100">
                  {getTypeIcon(currentTask.type)}
                </span>
                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                  {currentTask.leadName}
                </h4>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 pl-6">
                {currentTask.leadPhone}
              </p>
            </div>

            <div className="flex flex-col items-end">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                {currentTask.dueTime || '11:00 AM'}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 mt-0.5">
                {currentTask.priority || 'High'} Priority
              </span>
            </div>
          </div>

          {/* Agenda & Notes Box */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
            <p className="font-semibold text-slate-900 mb-0.5 flex items-center gap-1">
              <span>{currentTask.title}</span>
            </p>
            {currentTask.notes && (
              <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5">
                "{currentTask.notes}"
              </p>
            )}
          </div>

          {/* Reschedule Presets Dropdown */}
          {isRescheduling && (
            <div className="p-2.5 bg-orange-50/70 border border-orange-200 rounded-xl space-y-2 animate-[fadeIn_0.2s_ease-out]">
              <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wide block">
                Quick Reschedule:
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => handleQuickReschedule(1)}
                  className="py-1 px-2 rounded-lg bg-white hover:bg-orange-100/70 border border-orange-200 text-orange-700 shadow-xs"
                >
                  +1 Day
                </button>
                <button
                  onClick={() => handleQuickReschedule(3)}
                  className="py-1 px-2 rounded-lg bg-white hover:bg-orange-100/70 border border-orange-200 text-orange-700 shadow-xs"
                >
                  +3 Days
                </button>
                <button
                  onClick={() => {
                    setIsRescheduling(false);
                    setRescheduleModalOpen(true);
                  }}
                  className="py-1 px-2 rounded-lg bg-white hover:bg-orange-100/70 border border-orange-200 text-orange-700 shadow-xs"
                >
                  Pick Date
                </button>
              </div>
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-1">
            <div className="flex gap-2">
              {/* Mark as Done & Move to New */}
              <button
                onClick={() => handleMarkDone(currentTask.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 hover-scale"
                title="Mark Done & set lead status to New"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Done (Move to New)</span>
              </button>

              {/* Reschedule Toggle */}
              <button
                onClick={() => setIsRescheduling(!isRescheduling)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isRescheduling 
                    ? 'bg-orange-100 text-orange-700 border-orange-300' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                }`}
                title="Reschedule Follow-up"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              {/* Dismiss for session */}
              <button
                onClick={() => dismissFollowUpAlert(currentTask.id)}
                className="py-2 px-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200"
                title="Snooze for this session"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Direct Connect Links (Call / WhatsApp) */}
            <div className="flex items-center justify-between text-[11px] pt-1 px-1">
              <a
                href={`tel:${currentTask.leadPhone}`}
                className="flex items-center gap-1 font-semibold text-orange-600 hover:underline"
              >
                <Phone className="w-3 h-3" />
                <span>Call Directly</span>
              </a>

              <a
                href={`https://wa.me/${currentTask.leadPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-semibold text-emerald-600 hover:underline"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Open WhatsApp</span>
              </a>

              {matchingLead && onOpenLeadDrawer && (
                <button
                  onClick={() => onOpenLeadDrawer(matchingLead)}
                  className="flex items-center gap-0.5 text-slate-500 hover:text-slate-800 font-medium"
                >
                  <span>Details</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule custom date modal */}
      {rescheduleModalOpen && (
        <FollowUpModal
          isOpen={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          lead={matchingLead}
          initialFollowUp={currentTask}
        />
      )}
    </>
  );
};

export default FollowUpAlertPopup;
