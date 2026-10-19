import React, { useState, useEffect } from 'react';
import { useCRM } from '../../context/CRMContext';
import { Menu, Plus, ShieldCheck, BellRing, CalendarClock, LogOut, Sparkles } from 'lucide-react';
import { 
  getNotificationPermission, 
  requestNotificationPermission, 
  sendBrowserNotification,
  playNotificationChime,
  isNotificationSupported 
} from '../../services/notificationService';

const Header = ({ activePage, setSidebarOpen, onQuickAction, onOpenFollowUpAlert, onOpenFollowUpModal }) => {
  const { currentUser, followUps, getTodayDateString, cloudSyncStatus, logout } = useCRM();
  const [pushPerm, setPushPerm] = useState(() => getNotificationPermission());

  useEffect(() => {
    if (!isNotificationSupported()) return;
    setPushPerm(getNotificationPermission());
  }, []);

  const handlePushClick = async () => {
    if (pushPerm === 'granted') {
      playNotificationChime();
      sendBrowserNotification('🔔 Push Notifications Active', {
        body: 'You are subscribed to instant call and follow-up alerts in SETU CRM!',
        tag: 'header_test_notification'
      });
    } else {
      const res = await requestNotificationPermission();
      setPushPerm(res.permission);
    }
  };

  const today = getTodayDateString();
  const dueTodayTasks = followUps.filter(f => f.status === 'Pending' && f.dueDate <= today);
  const dueCount = dueTodayTasks.length;

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard Overview';
      case 'leads': return 'Lead Management';
      case 'clients': return 'Unified Clients';
      case 'quotations': return 'Quotation Builder';
      case 'payments': return 'Payment Tracking';
      case 'expenses': return 'Expense Tracker';
      case 'employees': return 'Employee Management';
      case 'reports': return 'Reports & Analytics';
      case 'settings': return 'WhatsApp Config & Templates';
      default: return 'CRM Solutions';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 sm:h-16 px-2.5 sm:px-4 lg:px-6 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs gap-2 overflow-hidden">
      {/* Left side: Hamburger (mobile) & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg lg:hidden hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 font-sans truncate max-w-[120px] sm:max-w-none">
            {getPageTitle()}
          </h1>
          <div 
            className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
              cloudSyncStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                : cloudSyncStatus === 'offline'
                ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                : 'bg-amber-50 text-amber-700 border-amber-200/80'
            }`}
            title={
              cloudSyncStatus === 'connected'
                ? 'Connected to Firebase Firestore Database in Real-Time'
                : cloudSyncStatus === 'offline'
                ? 'Running offline with local storage fallback'
                : 'Connecting to Cloud Firestore...'
            }
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              cloudSyncStatus === 'connected' 
                ? 'bg-emerald-500 animate-pulse' 
                : cloudSyncStatus === 'offline'
                ? 'bg-rose-500'
                : 'bg-amber-500 animate-ping'
            }`} />
            <span>{cloudSyncStatus === 'connected' ? 'Firestore Live' : cloudSyncStatus === 'offline' ? 'Offline' : 'Connecting'}</span>
          </div>
        </div>
      </div>

      {/* Right side: Actions, Role Selector & Follow-up Bell */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
        {/* Follow-up Reminder Bell Icon */}
        <button
          onClick={() => onOpenFollowUpModal ? onOpenFollowUpModal() : (onOpenFollowUpAlert && onOpenFollowUpAlert())}
          className={`relative p-2 rounded-xl border transition-all ${
            dueCount > 0 
              ? 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100/80 shadow-xs' 
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
          }`}
          title={`${dueCount} Follow-ups due today. Click to schedule or view.`}
        >
          <BellRing className={`w-4 h-4 ${dueCount > 0 ? 'text-orange-600 animate-wiggle' : ''}`} />
          {dueCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center ring-2 ring-white">
              {dueCount}
            </span>
          )}
        </button>

        {/* Push Notification Status & Test Button */}
        <button
          type="button"
          onClick={handlePushClick}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
            pushPerm === 'granted'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-2xs'
              : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 shadow-2xs'
          }`}
          title={
            pushPerm === 'granted' 
              ? 'Push Notifications Active: Click to send test alert' 
              : 'Click to enable Browser Push Notifications for calls & follow-up reminders'
          }
        >
          {pushPerm === 'granted' ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold">Push On</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span className="text-[11px] font-bold">Enable Push</span>
            </>
          )}
        </button>

        {/* Quick Follow-up schedule button (sm+ screens) */}
        <button
          onClick={() => onOpenFollowUpModal && onOpenFollowUpModal()}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all hover-scale"
          title="Schedule Follow-up"
        >
          <CalendarClock className="w-3.5 h-3.5 text-orange-500" />
          <span>Follow-up</span>
        </button>

        {/* Quick action buttons */}
        {activePage !== 'reports' && activePage !== 'settings' && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onQuickAction('add_lead')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl transition-all hover-scale"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>New Lead</span>
            </button>
            <button
              onClick={() => onQuickAction('add_quote')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl transition-all hover-scale shadow-md shadow-orange-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Quote</span>
            </button>
          </div>
        )}

        {/* Authenticated Super Admin Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border bg-orange-50/80 border-orange-200/90 text-orange-700 shadow-xs text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 shrink-0" />
          <span className="hidden lg:inline truncate max-w-[140px]">{currentUser?.name || 'User'}</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500 text-white font-bold uppercase tracking-wider">
            {currentUser?.role || 'Staff'}
          </span>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 transition-all text-xs font-semibold shadow-xs"
          title="Sign Out from Super Admin"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
