import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export function AppLayout({ children, activePage, onNavigate, backendStatus = 'online' }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      <div className="flex flex-1 relative min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:block fixed inset-y-0 left-0 z-30 w-64">
          <Sidebar activePage={activePage} onNavigate={onNavigate} />
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative flex-1 max-w-xs w-full bg-white z-10">
              <Sidebar 
                activePage={activePage} 
                onNavigate={onNavigate} 
                onCloseMobile={() => setMobileOpen(false)} 
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <Header
            activePage={activePage}
            onNavigate={onNavigate}
            onToggleMobileNav={() => setMobileOpen(true)}
            backendStatus={backendStatus}
          />

          <main className="flex-1 px-4 sm:px-6 md:px-8 py-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
