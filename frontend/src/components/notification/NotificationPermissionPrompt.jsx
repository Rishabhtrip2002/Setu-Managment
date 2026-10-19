import React, { useState, useEffect } from 'react';
import { 
  BellRing, 
  X, 
  Check, 
  Sparkles, 
  PhoneCall, 
  Volume2, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  isPermissionPromptDismissed, 
  dismissPermissionPrompt, 
  sendBrowserNotification,
  playNotificationChime,
  isNotificationSupported 
} from '../../services/notificationService';

const NotificationPermissionPrompt = () => {
  const [permission, setPermission] = useState('default');
  const [visible, setVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const currentPerm = getNotificationPermission();
    setPermission(currentPerm);

    // If permission is still 'default' and hasn't been dismissed in this session, show prompt after a gentle 2s delay
    if (currentPerm === 'default' && !isPermissionPromptDismissed()) {
      const timer = setTimeout(() => {
        setVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsProcessing(true);
    const result = await requestNotificationPermission();
    setIsProcessing(false);
    setPermission(result.permission);

    if (result.success) {
      setFeedback({
        type: 'success',
        msg: '✓ Push Notifications Activated! You will now receive timely alerts for follow-ups & calls.'
      });
      setTimeout(() => {
        setVisible(false);
      }, 3500);
    } else if (result.permission === 'denied') {
      setFeedback({
        type: 'denied',
        msg: 'Notification permission was blocked in browser settings. You can re-enable anytime from browser address bar.'
      });
      setTimeout(() => {
        setVisible(false);
      }, 5000);
    }
  };

  const handleDismiss = () => {
    dismissPermissionPrompt();
    setVisible(false);
  };

  const handleSendTestNotification = () => {
    playNotificationChime();
    sendBrowserNotification('📞 Test Call & Follow-up Alert', {
      body: 'This is a test notification from SETU CRM. Real reminders will arrive when tasks are due!',
      tag: 'test_alert',
      silent: false
    });
    setFeedback({
      type: 'success',
      msg: 'Test notification sent with sound!'
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-20 sm:top-6 right-3 sm:right-6 z-50 max-w-sm w-[92%] sm:w-96 animate-[slideDown_0.35s_ease-out]">
      <div className="relative overflow-hidden bg-slate-900/95 border border-orange-500/30 text-white rounded-3xl p-4 sm:p-5 shadow-2xl shadow-orange-500/20 backdrop-blur-xl">
        
        {/* Decorative gradient glow accent */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 shrink-0">
              <BellRing className="w-5 h-5 animate-[bounce_1.5s_infinite]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-sm text-white tracking-tight">
                  Follow-up & Call Alerts
                </h4>
                <span className="px-1.5 py-0.2 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">
                  PUSH
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Stay updated even when app is minimized
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Dismiss for this session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback message if any */}
        {feedback ? (
          <div className={`mt-3.5 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border animate-[fadeIn_0.2s_ease-out] ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' 
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            {feedback.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feedback.msg}</span>
          </div>
        ) : (
          <>
            {/* Description Card */}
            <div className="mt-3.5 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 leading-relaxed space-y-2">
              <p className="flex items-center gap-2 text-slate-200 font-medium">
                <PhoneCall className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>Receive push alerts for scheduled telecaller calls</span>
              </p>
              <p className="flex items-center gap-2 text-slate-200 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Instant reminders when lead follow-ups are due</span>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={isProcessing}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Enabling...' : 'Enable Notifications'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-2.5 px-3.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default NotificationPermissionPrompt;
