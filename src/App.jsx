import { useState, useEffect } from 'react'
import Home from './pages/Home'
import ReportRequest from './pages/ReportRequest'
import OfferHelp from './pages/OfferHelp'
import GetStarted from './pages/GetStarted'
import DashboardView from './pages/DashboardView'
import CrisesView from './pages/CrisesView'
import VolunteersView from './pages/VolunteersView'
import ResourcesView from './pages/ResourcesView'
import OrganizationsView from './pages/OrganizationsView'
import NetworkView from './pages/NetworkView'
import AssignmentsView from './pages/AssignmentsView'
import AICommandView from './pages/AICommandView'
import HistoryView from './pages/HistoryView'
import SettingsView from './pages/SettingsView'
import CrisisRoomView from './pages/CrisisRoomView'
import VolunteerPortalView from './pages/VolunteerPortalView'
import AppLayout from './components/layout/AppLayout'

function App() {
  // Helper to resolve route from URL hash or pathname
  const getInitialRoute = () => {
    const hash = window.location.hash.replace('#', '').trim();
    if (hash) return hash;
    const path = window.location.pathname.replace('/', '').trim();
    if (path) return path;
    return 'home';
  };

  const [page, setPageState] = useState(getInitialRoute);
  const [selectedCrisis, setSelectedCrisis] = useState(null);

  // Centralized navigation handler that syncs state and browser URL hash
  const navigate = (newPage, payload = null) => {
    if (payload) setSelectedCrisis(payload);
    setPageState(newPage);
    if (window.location.hash !== `#${newPage}`) {
      window.location.hash = newPage === 'home' ? '' : newPage;
    }
  };

  // Sync route on hashchange (browser back/forward or direct hash entry)
  useEffect(() => {
    const handleHashChange = () => {
      const currentRoute = getInitialRoute();
      setPageState(currentRoute);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Helper for opening crisis room with selected crisis payload
  const handleOpenCrisisRoom = (crisis) => {
    if (crisis) setSelectedCrisis(crisis);
    navigate('crisis-room');
  }

  // Render full Landing page
  if (page === 'home') {
    return (
      <Home
        onReport={() => navigate('report')}
        onOffer={() => navigate('offer')}
        onGetStarted={() => navigate('dashboard')}
      />
    )
  }

  // Render Get Started selection view
  if (page === 'get-started') {
    return (
      <GetStarted
        onBack={() => navigate('home')}
        onNeedHelp={() => navigate('report')}
        onNavigate={navigate}
      />
    )
  }

  // Render Dashboard Application Shell for all inner pages
  const renderContent = () => {
    switch (page) {
      case 'dashboard':
        return <DashboardView onNavigate={(p, payload) => p === 'crisis-room' ? handleOpenCrisisRoom(payload) : navigate(p, payload)} />;
      case 'crises':
        return <CrisesView onNavigate={(p, payload) => p === 'crisis-room' ? handleOpenCrisisRoom(payload) : navigate(p, payload)} />;
      case 'report':
        return <ReportRequest onBack={() => navigate('home')} onNavigate={navigate} />;
      case 'volunteers':
        return <VolunteersView onNavigate={navigate} />;
      case 'volunteer-portal':
        return <VolunteerPortalView onNavigate={navigate} />;
      case 'resources':
        return <ResourcesView onNavigate={navigate} />;
      case 'organizations':
        return <OrganizationsView onNavigate={navigate} />;
      case 'network':
        return <NetworkView onNavigate={navigate} />;
      case 'assignments':
        return <AssignmentsView onNavigate={navigate} />;
      case 'crisis-room':
        return <CrisisRoomView onNavigate={navigate} selectedCrisis={selectedCrisis} />;
      case 'ai-command':
        return <AICommandView onNavigate={navigate} />;
      case 'history':
        return <HistoryView onNavigate={navigate} />;
      case 'offer':
        return <OfferHelp onBack={() => navigate('home')} onNavigate={navigate} />;
      case 'settings':
        return <SettingsView onNavigate={navigate} />;
      default:
        return <DashboardView onNavigate={navigate} />;
    }
  }

  return (
    <AppLayout activePage={page} onNavigate={navigate}>
      {renderContent()}
    </AppLayout>
  )
}

export default App