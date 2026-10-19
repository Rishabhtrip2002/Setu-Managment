import React, { useState, useEffect, useRef } from 'react';
import { useCRM } from '../../context/CRMContext';
import { playNotificationChime } from '../../services/notificationService';
import { 
  X, 
  Phone, 
  PhoneCall, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Timer, 
  Play, 
  Square, 
  RotateCcw,
  Sparkles,
  CalendarCheck,
  User,
  ArrowRight,
  Info
} from 'lucide-react';

const CALL_OUTCOMES = [
  {
    id: 'Interested',
    label: 'Interested',
    desc: 'Prospect is keen; pitch or proposal requested',
    color: 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500',
    activeColor: 'border-emerald-500 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500/30',
    defaultFollowUp: true,
    suggestedStatus: 'Interested'
  },
  {
    id: 'Follow-up Required',
    label: 'Follow-up Required',
    desc: 'Further discussion scheduled or details awaited',
    color: 'border-teal-300 bg-teal-50 text-teal-800 hover:border-teal-500',
    activeColor: 'border-teal-500 bg-teal-100 text-teal-900 ring-2 ring-teal-500/30',
    defaultFollowUp: true,
    suggestedStatus: 'Follow-up Due'
  },
  {
    id: 'No Answer',
    label: 'No Answer',
    desc: 'Call rang out or was not picked up',
    color: 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-500',
    activeColor: 'border-amber-500 bg-amber-100 text-amber-900 ring-2 ring-amber-500/30',
    defaultFollowUp: true,
    suggestedStatus: 'Called'
  },
  {
    id: 'Busy / Call Later',
    label: 'Busy / Call Later',
    desc: 'Requested callback at another time',
    color: 'border-blue-300 bg-blue-50 text-blue-800 hover:border-blue-500',
    activeColor: 'border-blue-500 bg-blue-100 text-blue-900 ring-2 ring-blue-500/30',
    defaultFollowUp: true,
    suggestedStatus: 'Called'
  },
  {
    id: 'Not Interested',
    label: 'Not Interested',
    desc: 'Expressed no requirement at this time',
    color: 'border-rose-300 bg-rose-50 text-rose-800 hover:border-rose-500',
    activeColor: 'border-rose-500 bg-rose-100 text-rose-900 ring-2 ring-rose-500/30',
    defaultFollowUp: false,
    suggestedStatus: 'Not Interested'
  },
  {
    id: 'Wrong Number',
    label: 'Wrong Number',
    desc: 'Invalid, disconnected, or incorrect contact',
    color: 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400',
    activeColor: 'border-slate-600 bg-slate-200 text-slate-900 ring-2 ring-slate-400',
    defaultFollowUp: false,
    suggestedStatus: 'Closed'
  },
  {
    id: 'Converted',
    label: 'Converted',
    desc: 'Promote to regular Lead or closed won',
    color: 'border-purple-300 bg-purple-50 text-purple-800 hover:border-purple-500',
    activeColor: 'border-purple-600 bg-purple-100 text-purple-900 ring-2 ring-purple-500/30',
    defaultFollowUp: false,
    suggestedStatus: 'Converted'
  },
  {
    id: 'Do Not Call',
    label: 'Do Not Call (DNC)',
    desc: 'Explicit opt-out / requested to be removed',
    color: 'border-red-400 bg-red-50 text-red-800 hover:border-red-600',
    activeColor: 'border-red-600 bg-red-100 text-red-950 ring-2 ring-red-600/40',
    defaultFollowUp: false,
    suggestedStatus: 'Do Not Call'
  }
];

const QUICK_NOTES = {
  'Interested': ['Requested detailed quotation and pricing', 'Interested in software demo/discussion', 'Asked for company presentation via WhatsApp'],
  'Connected — Interested': ['Requested detailed quotation and pricing', 'Interested in software demo/discussion', 'Asked for company presentation via WhatsApp'],
  'Follow-up Required': ['Requested callback tomorrow morning', 'Need to review with directors and decide', 'Follow-up call scheduled for upcoming week'],
  'Not Interested': ['Already satisfied with current software/vendor', 'Budget constraints this quarter', 'Out of current project scope'],
  'Connected — Not Interested': ['Already satisfied with current software/vendor', 'Budget constraints this quarter', 'Out of current project scope'],
  'No Answer': ['Ringing without response; will retry', 'Phone switched off', 'Call dropped before connecting'],
  'Busy / Call Later': ['Busy in meeting, asked to call in the evening', 'Driving, call tomorrow morning', 'Callback requested after 4 PM'],
  'Wrong Number': ['Person does not match contact name', 'Invalid number format', 'Number belongs to another person'],
  'Converted': ['Prospect agreed to initiate project & demo', 'Promoted to active lead pipeline', 'Proposal accepted'],
  'Converted / Closed': ['Client agreed to advance & contract', 'Order confirmed via call', 'Ready for invoice dispatch'],
  'Do Not Call': ['Explicitly asked not to contact again', 'Number listed on DND registry', 'Requested removal from database']
};

const CallLogModal = ({ isOpen, onClose, lead = null, coldLead = null, onSuccess }) => {
  const { recordCallAttempt, recordColdCallAttempt, followUps, getTodayDateString, currentUser } = useCRM();

  const activeEntity = lead || coldLead;
  const isColdLead = !lead && !!coldLead;

  const [outcome, setOutcome] = useState('Interested');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [leadStage, setLeadStage] = useState(lead?.status || 'Contacted');
  const [dncAcknowledged, setDncAcknowledged] = useState(false);
  
  // Follow-up scheduling
  const [scheduleFollowUp, setScheduleFollowUp] = useState(true);
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState('11:00');
  const [nextFollowUpReason, setNextFollowUpReason] = useState('');

  // Live Stopwatch
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const timerRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const today = getTodayDateString();

  // Find existing pending follow-up for this entity
  const existingPendingFU = followUps.find(f => {
    if (lead) return f.leadId === lead.id && f.status === 'Pending';
    if (coldLead) return (f.coldLeadId === coldLead.id || f.leadPhone === coldLead.phone) && f.status === 'Pending';
    return false;
  });

  useEffect(() => {
    if (isOpen && activeEntity) {
      setOutcome(activeEntity.isDNC ? 'Do Not Call' : 'Interested');
      setNotes('');
      setDuration('');
      setLeadStage(lead?.status || 'Contacted');
      setDncAcknowledged(false);
      setSecondsElapsed(0);
      setTimerRunning(false);
      setErrorMsg('');

      // Auto prefill next follow-up date (tomorrow by default)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultDate = tomorrow.toISOString().split('T')[0];

      if (existingPendingFU) {
        setNextFollowUpDate(existingPendingFU.dueDate || defaultDate);
        setNextFollowUpTime(existingPendingFU.dueTime || '11:00');
        setNextFollowUpReason(existingPendingFU.notes || existingPendingFU.title || 'Follow-up discussion');
        setScheduleFollowUp(true);
      } else {
        setNextFollowUpDate(defaultDate);
        setNextFollowUpTime('11:00');
        setNextFollowUpReason('Follow-up call with ' + activeEntity.name);
        setScheduleFollowUp(!activeEntity.isDNC);
      }
    }
  }, [isOpen, activeEntity, existingPendingFU, lead]);

  // Stopwatch effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => {
          const next = prev + 1;
          const mins = Math.floor(next / 60);
          const secs = next % 60;
          setDuration(`${mins > 0 ? `${mins}m ` : ''}${secs}s`);
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  if (!isOpen || !activeEntity) return null;

  const handleOutcomeSelect = (selectedOutcome) => {
    setOutcome(selectedOutcome.id);
    setScheduleFollowUp(selectedOutcome.defaultFollowUp);
  };

  const handleQuickPresetDate = (days, defaultTime = '11:00') => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setNextFollowUpDate(d.toISOString().split('T')[0]);
    setNextFollowUpTime(defaultTime);
  };

  const handleSetQuickDuration = (dur) => {
    setDuration(dur);
    setTimerRunning(false);
  };

  const handleAppendQuickNote = (noteText) => {
    setNotes(prev => (prev ? `${prev}. ${noteText}` : noteText));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (activeEntity.isDNC && outcome !== 'Do Not Call' && !dncAcknowledged) {
      setErrorMsg('This contact is marked Do Not Call (DNC). Please confirm acknowledgment before logging non-DNC calls.');
      return;
    }

    if (!outcome) {
      setErrorMsg('Please select a call outcome.');
      return;
    }

    if (scheduleFollowUp && !nextFollowUpDate) {
      setErrorMsg('Please select a next follow-up date.');
      return;
    }

    setSubmitting(true);
    try {
      let result;
      if (isColdLead) {
        result = recordColdCallAttempt(coldLead.id, {
          outcome,
          notes,
          duration,
          wasUnassignedWhenOpened: !coldLead.assignedToId,
          nextFollowUpDate: scheduleFollowUp ? nextFollowUpDate : null,
          nextFollowUpTime: scheduleFollowUp ? nextFollowUpTime : null,
          nextFollowUpReason: scheduleFollowUp ? (nextFollowUpReason || notes || `Cold Call Follow-up: ${outcome}`) : null,
          callerName: currentUser?.name || 'Telecaller',
          callerId: currentUser?.employeeId || currentUser?.uid || '',
          callerEmail: currentUser?.email || ''
        });
      } else {
        result = recordCallAttempt(lead.id, {
          outcome,
          notes,
          duration,
          newStage: leadStage,
          nextFollowUpDate: scheduleFollowUp ? nextFollowUpDate : null,
          nextFollowUpTime: scheduleFollowUp ? nextFollowUpTime : null,
          nextFollowUpReason: scheduleFollowUp ? (nextFollowUpReason || notes || `Follow-up on ${outcome}`) : null,
          callerName: currentUser?.name || 'Telecaller',
          callerId: currentUser?.employeeId || currentUser?.uid || '',
          callerEmail: currentUser?.email || ''
        });
      }

      if (!result.success) {
        setErrorMsg(result.error || 'Failed to record call attempt.');
        setSubmitting(false);
        return;
      }

      if (scheduleFollowUp) {
        playNotificationChime();
      }

      if (onSuccess) {
        onSuccess(result.callEntry, result.coldLead || result.updatedColdLead || result.lead);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while saving call attempt.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-[fadeIn_0.2s_ease-out]">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-[slideUp_0.25s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-orange-50 via-white to-amber-50 border-b border-orange-200/90 text-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
              <PhoneCall className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{activeEntity.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-200">
                  {activeEntity.status || (isColdLead ? 'Cold Calling' : 'New')}
                </span>
                {isColdLead && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Cold Lead
                  </span>
                )}
                {activeEntity.isDNC && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 border border-red-300">
                    DNC
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                <span>{activeEntity.phone}</span>
                {activeEntity.company && <span className="text-slate-400 truncate">• {activeEntity.company}</span>}
                {activeEntity.email && <span className="text-slate-400 truncate">• {activeEntity.email}</span>}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DNC Warning Banner */}
        {activeEntity.isDNC && (
          <div className="px-5 py-2.5 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-red-900">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                <strong>Warning (DNC):</strong> This contact requested Do Not Call. {activeEntity.dncReason && `Reason: "${activeEntity.dncReason}".`}
              </span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-red-800 bg-red-100/70 px-2 py-1 rounded-lg border border-red-200">
              <input
                type="checkbox"
                checked={dncAcknowledged}
                onChange={e => setDncAcknowledged(e.target.checked)}
                className="rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span>I confirm explicit permission</span>
            </label>
          </div>
        )}

        {/* Live Call Control & Quick Dial Bar */}
        <div className="px-5 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <a 
              href={`tel:${activeEntity.phone}`}
              onClick={() => {
                if (!timerRunning) setTimerRunning(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-transform active:scale-95"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Dial Call Now</span>
            </a>

            {/* Stopwatch controls */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 font-mono">
              <Timer className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-bold text-xs">{duration || '00:00'}</span>
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className="p-1 hover:bg-slate-100 rounded text-slate-600"
                title={timerRunning ? 'Pause call timer' : 'Start call timer'}
              >
                {timerRunning ? <Square className="w-3 h-3 text-rose-500 fill-rose-500" /> : <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />}
              </button>
              {secondsElapsed > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setSecondsElapsed(0);
                    setDuration('');
                  }}
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700"
                  title="Reset timer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Duration Pills */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 hidden sm:inline">Quick:</span>
            {['30s', '1m', '2m', '5m'].map(d => (
              <button
                key={d}
                type="button"
                onClick={() => handleSetQuickDuration(d)}
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-colors ${
                  duration === d 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Call Outcome Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              1. Select Call Outcome <span className="text-orange-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CALL_OUTCOMES.map((item) => {
                const isSelected = outcome === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOutcomeSelect(item)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isSelected ? item.activeColor : item.color
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold leading-tight">{item.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />}
                    </div>
                    <p className="text-[11px] opacity-80 mt-1 leading-snug">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Call Notes & Quick Tags */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                2. Call Discussion Notes & Key Points
              </label>
              <span className="text-[10px] text-slate-400">Caller: {currentUser?.name || 'You'}</span>
            </div>
            <textarea
              rows="2"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Discussed requirements, asked for product catalog, follow-up scheduled for tomorrow morning..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm outline-none focus:bg-white focus:border-orange-500 transition-all placeholder-slate-400 resize-none"
            />

            {/* Quick helper notes based on current outcome */}
            {QUICK_NOTES[outcome] && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-400 self-center">Suggestions:</span>
                {QUICK_NOTES[outcome].map((qNote, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAppendQuickNote(qNote)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 text-[10px] text-slate-600 transition-colors"
                  >
                    + {qNote}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lead Pipeline Stage Control (Keeps Call Outcome separate from Pipeline Stage) */}
          {!isColdLead && lead && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Lead Pipeline Stage
                </label>
                <span className="text-[10px] text-slate-500">
                  Current: <strong className="text-slate-800">{lead.status}</strong>
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {['New', 'Contacted', 'Quoted', 'Negotiation', 'Won', 'Lost'].map(st => {
                  const isCurrent = leadStage === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setLeadStage(st)}
                      className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                        isCurrent 
                          ? 'bg-orange-500 text-white border-orange-500 font-bold shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500">
                Call outcome is logged in history. The Lead remains in its designated pipeline stage unless changed here.
              </p>
            </div>
          )}

          {/* 3. Follow-up Section (Strictly Reuses Existing Follow-up Module) */}
          <div className="p-4 bg-slate-50/90 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-800">Schedule Next Follow-up</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleFollowUp}
                  onChange={e => setScheduleFollowUp(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {/* Notice if an existing pending follow-up is present */}
            {existingPendingFU && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Existing Follow-up Detected:</span> Scheduled on{' '}
                  <span className="font-mono font-semibold">{existingPendingFU.dueDate}</span> at{' '}
                  <span className="font-mono font-semibold">{existingPendingFU.dueTime || '11:00'}</span>.
                  {scheduleFollowUp 
                    ? ' Saving this form will update/reschedule this existing record without creating duplicates.' 
                    : ' Unchecking will mark the existing follow-up completed upon closing.'}
                </div>
              </div>
            )}

            {scheduleFollowUp && (
              <div className="space-y-3 pt-1">
                {/* Date presets */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-500 self-center">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetDate(0, '16:00')}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Today 4 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetDate(1, '10:30')}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Tomorrow 10:30 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetDate(3, '11:00')}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    In 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPresetDate(7, '11:00')}
                    className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[10px] font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600"
                  >
                    Next Week
                  </button>
                </div>

                {/* Date & Time Input Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Next Follow-up Date <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="date"
                        required={scheduleFollowUp}
                        value={nextFollowUpDate}
                        onChange={e => setNextFollowUpDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Time Slot
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        type="time"
                        value={nextFollowUpTime}
                        onChange={e => setNextFollowUpTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs font-semibold outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Follow-up reason / agenda */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Follow-up Agenda / Reason
                  </label>
                  <input
                    type="text"
                    value={nextFollowUpReason}
                    onChange={e => setNextFollowUpReason(e.target.value)}
                    placeholder="e.g. Call to finalize quotation and discuss advance payment"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 text-xs outline-none focus:border-orange-500 placeholder-slate-400"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl hover-scale shadow-md shadow-orange-500/20 flex items-center gap-2"
            >
              {submitting ? (
                <span>Saving Call...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Call Outcome</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default CallLogModal;
