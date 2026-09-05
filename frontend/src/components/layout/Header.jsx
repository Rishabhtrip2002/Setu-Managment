import React from 'react';
import { useCRM } from '../../context/CRMContext';
import { Menu, Plus, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

const Header = ({ activePage, setSidebarOpen, onQuickAction }) => {
  const { currentUser, setCurrentUser } = useCRM();

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard Overview';
      case 'leads': return 'Lead Management';
      case 'clients': return 'Unified Clients';
      case 'quotations': return 'Quotation Builder';
      case 'payments': return 'Payment Tracking';
      case 'reports': return 'Reports & Analytics';
      case 'settings': return 'WhatsApp Config & Templates';
      default: return 'CRM Solutions';
    }
  };

  const handleToggleRole = () => {
    const nextRole = currentUser.role === 'Admin' ? 'Staff' : 'Admin';
    const nextName = nextRole === 'Admin' ? 'Siddharth Shah' : 'Sneha Patel';
    setCurrentUser({ name: nextName, role: nextRole });
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      {/* Left side: Hamburger (mobile) & Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1 rounded-lg lg:hidden hover:bg-slate-800 text-slate-400 hover:text-slate-200"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold tracking-tight text-slate-100 font-sans">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right side: Actions, Role Selector & Toggle */}
      <div className="flex items-center gap-4">
        {/* Quick action buttons */}
        {activePage !== 'reports' && activePage !== 'settings' && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => onQuickAction('add_lead')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 rounded-xl transition-all hover-scale"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Lead</span>
            </button>
            <button
              onClick={() => onQuickAction('add_quote')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-brand-950 bg-gradient-to-r from-brand-400 to-emerald-500 hover:from-brand-500 hover:to-emerald-600 rounded-xl transition-all hover-scale shadow-md shadow-brand-500/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Quote</span>
            </button>
          </div>
        )}

        {/* Live Role Switcher (Admin/Staff demo trigger) */}
        <button
          onClick={handleToggleRole}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
            currentUser.role === 'Admin'
              ? 'bg-brand-500/10 hover:bg-brand-500/20 border-brand-500/30 text-brand-400'
              : 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-400'
          }`}
          title="Click to toggle user role for access testing"
        >
          {currentUser.role === 'Admin' ? (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden md:inline">Role: Admin (Full)</span>
              <span className="md:hidden">Admin</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span className="hidden md:inline">Role: Staff (Restricted)</span>
              <span className="md:hidden">Staff</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
