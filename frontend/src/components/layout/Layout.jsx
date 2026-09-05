import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children, activePage, setActivePage, onQuickAction }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 bg-grid-pattern text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />

      {/* Main Container */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header 
          activePage={activePage} 
          setSidebarOpen={setSidebarOpen} 
          onQuickAction={onQuickAction} 
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950/40 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl animate-[fadeIn_0.4s_ease-out]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
