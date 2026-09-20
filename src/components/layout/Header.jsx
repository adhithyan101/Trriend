import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import auth from '../../services/auth';

export function Header({ activePage, onNavigate, onToggleMobileNav, backendStatus = 'online' }) {
  const [currentUser, setCurrentUser] = useState(auth.getUser());

  useEffect(() => {
    setCurrentUser(auth.getUser());
  }, [activePage]);

  const handleLogout = async () => {
    await auth.logout();
    setCurrentUser(null);
    if (onNavigate) onNavigate('get-started');
  };

  const getPageTitle = (page) => {
    switch (page) {
      case 'dashboard': return 'Dashboard Overview';
      case 'crises': return 'Active Crises';
      case 'report': return 'Report a Need';
      case 'volunteers': return 'Volunteer Directory';
      case 'volunteer-portal': return 'Volunteer Response Portal';
      case 'resources': return 'Aid Resource Directory';
      case 'organizations': return 'Partner Organizations';
      case 'network': return 'Crisis Network Map';
      case 'assignments': return 'Response Assignments';
      case 'ai-command': return 'AI Command Center';
      case 'history': return 'Response History';
      case 'offer': return 'Offer Help & Resources';
      case 'get-started': return 'Get Started & Authentication';
      case 'settings': return 'Platform Settings';
      case 'home': return 'Home';
      default: return 'CO-RESOLVE Platform';
    }
  };

  return (
    <header className="bg-white border-b border-stone-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileNav}
          className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200 cursor-pointer"
          aria-label="Open navigation menu"
        >
          ☰
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-500 hidden sm:inline">CO-RESOLVE</span>
            <span className="text-xs text-stone-300 hidden sm:inline">/</span>
            <h2 className="text-base font-bold text-stone-900 tracking-tight">
              {getPageTitle(activePage)}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* System status pill */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700">
          <span className={`w-2 h-2 rounded-full ${backendStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="font-medium">{backendStatus === 'online' ? 'AI Network Active' : 'Connecting...'}</span>
        </div>

        {/* User Auth State Pill / Controls */}
        {currentUser ? (
          <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-1.5 pl-3">
            <div className="text-left hidden sm:block">
              <p className="text-[11px] font-bold text-stone-900 leading-tight">
                {currentUser.profile?.name || currentUser.email}
              </p>
              <span className="text-[9px] font-extrabold text-teal-800 tracking-wider uppercase">
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-stone-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 border border-stone-200 cursor-pointer transition"
              title="Sign Out"
            >
              Logout 🚪
            </button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('get-started')}
            className="text-xs font-bold"
          >
            <span>🔐</span> Sign In / Register
          </Button>
        )}

        {/* Quick navigation actions */}
        {activePage !== 'report' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('report')}
          >
            <span>🆘</span> Report Need
          </Button>
        )}
      </div>
    </header>
  );
}

export default Header;
