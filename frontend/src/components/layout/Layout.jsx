import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import FollowUpAlertPopup from '../followup/FollowUpAlertPopup';
import FollowUpModal from '../followup/FollowUpModal';

const Layout = ({ 
  children, 
  activePage, 
  setActivePage, 
  onQuickAction,
  onOpenLeadDrawer
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 bg-grid-pattern text-slate-800 font-sans">
      {/* Sidebar Navigation (Desktop Left & Mobile Bottom Bar) */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        onOpenFollowUpModal={() => setFollowUpModalOpen(true)}
      />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header 
          activePage={activePage} 
          setSidebarOpen={setSidebarOpen} 
          onQuickAction={onQuickAction} 
          onOpenFollowUpModal={() => setFollowUpModalOpen(true)}
        />

        {/* Content Area with extra bottom padding on mobile for the bottom bar */}
        <main className="flex-1 overflow-y-auto bg-slate-100/40 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <div className="mx-auto max-w-7xl animate-[fadeIn_0.4s_ease-out]">
            {children}
          </div>
        </main>
      </div>

      {/* Persistent On-Screen Scheduled Follow-up Reminder Alert */}
      <FollowUpAlertPopup 
        onOpenLeadDrawer={onOpenLeadDrawer} 
      />

      {/* Quick Follow-up Scheduler Modal */}
      <FollowUpModal
        isOpen={followUpModalOpen}
        onClose={() => setFollowUpModalOpen(false)}
        lead={null}
      />
    </div>
  );
};

export default Layout;
