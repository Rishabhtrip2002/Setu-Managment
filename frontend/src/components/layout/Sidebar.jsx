import React, { useState } from 'react';
import Logo from './Logo';
import { useCRM } from '../../context/CRMContext';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  FileSpreadsheet, 
  CreditCard, 
  Settings, 
  TrendingUp,
  UserCog,
  MoreHorizontal,
  X,
  ShieldCheck,
  KeyRound,
  BellRing,
  CalendarCheck,
  LogOut,
  Receipt,
  PhoneCall,
  PhoneForwarded
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, sidebarOpen, setSidebarOpen, onOpenFollowUpModal }) => {
  const { currentUser, followUps, expenses, coldLeads, getTodayDateString, logout } = useCRM();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Today's pending follow-ups count for badges
  const today = getTodayDateString();
  const pendingTodayCount = followUps.filter(f => f.status === 'Pending' && f.dueDate <= today).length;

  // Unassigned Cold Pool count for cold calling badge
  const unassignedColdCount = (coldLeads || []).filter(c => !c.assignedToId && c.status !== 'Converted' && !c.isDNC).length;

  // Pending Expense approvals count for admin badge
  const pendingExpenseCount = (expenses || []).filter(e => e.status === 'Pending').length;
  const isAdmin = 
    currentUser?.role === 'Super Admin' || 
    currentUser?.role === 'Admin' ||
    (currentUser?.position && /admin|director|manager|lead/i.test(currentUser.position));

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Staff'] },
    { id: 'coldcalling', label: 'Cold Calling', icon: PhoneForwarded, roles: ['Admin', 'Staff'], badge: unassignedColdCount > 0 ? unassignedColdCount : null },
    { id: 'telecaller', label: 'Telecaller & Calls', icon: PhoneCall, roles: ['Admin', 'Staff'], badge: pendingTodayCount > 0 ? pendingTodayCount : null },
    { id: 'leads', label: 'Leads', icon: Users, roles: ['Admin', 'Staff'], badge: pendingTodayCount > 0 ? pendingTodayCount : null },
    { id: 'clients', label: 'Clients', icon: UserSquare2, roles: ['Admin', 'Staff'] },
    { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet, roles: ['Admin', 'Staff'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['Admin', 'Staff'] },
    { id: 'expenses', label: 'Expenses', icon: Receipt, roles: ['Admin', 'Staff'], badge: (isAdmin && pendingExpenseCount > 0) ? pendingExpenseCount : null },
    { id: 'employees', label: 'Employees', icon: UserCog, roles: ['Super Admin'] },
    { id: 'reports', label: 'Reports', icon: TrendingUp, roles: ['Admin'] },
    { id: 'settings', label: 'WhatsApp & Settings', icon: Settings, roles: ['Admin', 'Staff'] },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (currentUser?.role === 'Super Admin') return true;
    if (item.id === 'telecaller' || item.id === 'coldcalling') return true; // Accessible to all authenticated CRM staff/telecallers/admins
    if (item.id === 'employees') return false; // Strict isolation: only Super Admin can manage employees
    if (currentUser?.permissions && Array.isArray(currentUser.permissions)) {
      return currentUser.permissions.includes(item.id);
    }
    return !item.roles || item.roles.includes(currentUser?.role);
  });

  // Primary bottom navigation items (top 4 items)
  const bottomBarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'telecaller', label: 'Calling', icon: PhoneCall, badge: pendingTodayCount > 0 ? pendingTodayCount : null },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'quotations', label: 'Quotes', icon: FileSpreadsheet },
  ];

  const isMoreActive = ['telecaller', 'clients', 'payments', 'expenses', 'reports', 'settings'].includes(activePage);

  const isDrawerOpen = sidebarOpen || mobileMenuOpen;
  const closeMobileDrawer = () => {
    setSidebarOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* ============================================================== */}
      {/* 1. DESKTOP SIDEBAR (lg:flex)                                   */}
      {/* ============================================================== */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white/95 backdrop-blur-md shadow-sm h-screen sticky top-0 shrink-0">
        {/* Header Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200 bg-white">
          <Logo />
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            const isLeads = item.id === 'leads';
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-all rounded-xl group ${
                  isActive 
                    ? 'bg-orange-50 text-orange-600 border border-orange-200/90 font-semibold shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-orange-500' : 'text-slate-400 group-hover:text-slate-700'
                }`} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs ${
                    item.id === 'expenses' ? 'bg-amber-500 animate-pulse' : 'bg-orange-500'
                  }`} title={`${item.badge} pending items`}>
                    {item.badge}
                  </span>
                )}
                {isActive && !item.badge && (
                  <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Super Admin Profile Card Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/80">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-xs ring-1 ring-orange-200 shrink-0">
                {(currentUser?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">{currentUser?.name || 'Super Admin'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-wide">
                    {currentUser?.role || 'Super Admin'}
                  </span>
                  {currentUser?.position && currentUser?.role !== 'Super Admin' && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[90px]" title={currentUser?.position}>
                      • {currentUser?.position}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE BOTTOM NAVIGATION BAR (lg:hidden)                    */}
      {/* ============================================================== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 safe-area-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {bottomBarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  closeMobileDrawer();
                }}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive 
                    ? 'text-orange-600 font-bold' 
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-orange-100/80 text-orange-600 scale-110 shadow-xs' : ''
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-0.5 right-2 w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-1 w-5 h-0.5 bg-orange-500 rounded-full"></span>
                )}
              </button>
            );
          })}

          {/* More Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isMoreActive || isDrawerOpen
                ? 'text-orange-600 font-bold' 
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              isMoreActive || isDrawerOpen ? 'bg-orange-100/80 text-orange-600 scale-110 shadow-xs' : ''
            }`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
            {isMoreActive && (
              <span className="absolute -bottom-1 w-5 h-0.5 bg-orange-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. MOBILE MENU BOTTOM SHEET / DRAWER (lg:hidden)               */}
      {/* ============================================================== */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={closeMobileDrawer}
          />

          {/* Bottom Sheet Modal */}
          <div className="relative w-full bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 pb-20 safe-area-bottom max-h-[85vh] overflow-y-auto animate-[slideUp_0.3s_ease-out]">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4"></div>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Logo />
              </div>
              <button 
                onClick={closeMobileDrawer}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Secondary Pages Links Grid */}
            <div className="mb-5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">
                Management Modules
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {filteredMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        closeMobileDrawer();
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                        isActive 
                          ? 'bg-orange-50 border-orange-300 text-orange-700 font-bold shadow-xs' 
                          : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-700 font-medium'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${
                        isActive ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 border border-slate-200 shadow-xs'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs truncate flex-1">{item.label}</span>
                      {item.badge && (
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold text-white shrink-0 ${
                          item.id === 'expenses' ? 'bg-amber-500 animate-pulse' : 'bg-orange-500'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Follow-up Action in Mobile Drawer */}
            {onOpenFollowUpModal && (
              <div className="mb-5">
                <button
                  onClick={() => {
                    closeMobileDrawer();
                    onOpenFollowUpModal();
                  }}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs shadow-lg shadow-orange-500/20 hover-scale"
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarCheck className="w-4 h-4" />
                    <span>Schedule New Follow-up</span>
                  </div>
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px]">
                    + Set Reminder
                  </span>
                </button>
              </div>
            )}

            {/* Mobile Super Admin Profile & Logout */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 font-bold text-sm flex items-center justify-center ring-1 ring-orange-200 shrink-0">
                    {(currentUser?.name || 'S').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{currentUser?.name || 'Super Admin'}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="inline-flex px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-200 uppercase tracking-wide">
                        {currentUser?.role || 'Super Admin'}
                      </span>
                      {currentUser?.position && currentUser?.role !== 'Super Admin' && (
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          • {currentUser?.position}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    closeMobileDrawer();
                    logout();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 font-bold text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
