import React from 'react';
import Logo from './Logo';
import { useCRM } from '../../context/CRMContext';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare2, 
  FileSpreadsheet, 
  CreditCard, 
  Bell, 
  Settings, 
  TrendingUp 
} from 'lucide-react';

const Sidebar = ({ activePage, setActivePage, sidebarOpen, setSidebarOpen }) => {
  const { currentUser } = useCRM();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Staff'] },
    { id: 'leads', label: 'Leads', icon: Users, roles: ['Admin', 'Staff'] },
    { id: 'clients', label: 'Clients', icon: UserSquare2, roles: ['Admin', 'Staff'] },
    { id: 'quotations', label: 'Quotations', icon: FileSpreadsheet, roles: ['Admin', 'Staff'] },
    { id: 'payments', label: 'Payments', icon: CreditCard, roles: ['Admin', 'Staff'] },
    { id: 'reports', label: 'Reports', icon: TrendingUp, roles: ['Admin'] }, // Admin only
    { id: 'settings', label: 'WhatsApp & Settings', icon: Settings, roles: ['Admin', 'Staff'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-slate-800 bg-slate-900/90 backdrop-blur-md transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
          <Logo />
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-lg lg:hidden hover:bg-slate-800 text-slate-400 hover:text-slate-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-all rounded-xl hover-scale group ${
                  isActive 
                    ? 'bg-brand-600/10 text-brand-400 border border-brand-500/20' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 ml-auto rounded-full bg-brand-400 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Role Card Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/40">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 text-brand-400 font-bold text-xs ring-1 ring-slate-700">
              {currentUser.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</p>
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold mt-0.5 uppercase tracking-wide ${
                currentUser.role === 'Admin' 
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/25' 
                  : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25'
              }`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
