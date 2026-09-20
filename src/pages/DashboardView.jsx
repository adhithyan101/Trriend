import React, { useState, useEffect } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { StatusBadge } from '../components/ui/Badge';
import { LoadingState, ErrorState } from '../components/ui/States';
import api from '../services/api';

export function DashboardView({ onNavigate }) {
  const [crises, setCrises] = useState([]);
  const [resources, setResources] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [crisesData, resourcesData, volunteersData, assignmentsData] = await Promise.all([
        api.getCrisisReports().catch(() => []),
        api.getAidResources().catch(() => []),
        api.getVolunteers().catch(() => []),
        api.getAssignments().catch(() => []),
      ]);
      setCrises(crisesData || []);
      setResources(resourcesData || []);
      setVolunteers(volunteersData || []);
      setAssignments(assignmentsData || []);
    } catch (err) {
      console.warn('Dashboard synchronization notice:', err);
      setError('Unable to fetch latest network state.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Operational metrics
  const activeCrises = crises.filter(c => (c.status || '').toUpperCase() !== 'RESOLVED');
  const criticalCount = activeCrises.filter(c => {
    const urg = (c.urgency || c.priority || '').toUpperCase();
    return urg === 'CRITICAL' || urg === 'HIGH';
  }).length;

  const activeResponders = assignments.filter(a => 
    ['ACCEPTED', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS'].includes((a.status || '').toUpperCase())
  ).length;

  const pendingRequests = assignments.filter(a => (a.status || '').toUpperCase() === 'PENDING').length;
  
  const totalAvailableResources = resources.reduce((acc, r) => {
    const qty = r.available_quantity !== undefined ? r.available_quantity : r.availableQuantity !== undefined ? r.availableQuantity : r.quantity;
    return acc + (Number(qty) || 0);
  }, 0);

  // Sort active crises by priority ranking (CRITICAL > HIGH > MEDIUM > LOW)
  const priorityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  const sortedActiveCrises = [...activeCrises].sort((a, b) => {
    const pA = priorityRank[(a.urgency || a.priority || 'MEDIUM').toUpperCase()] || 2;
    const pB = priorityRank[(b.urgency || b.priority || 'MEDIUM').toUpperCase()] || 2;
    return pB - pA;
  });

  // Calculate requirement fulfillment progress for a crisis
  const getCrisisProgress = (crisis) => {
    const reqs = crisis.assistanceNeeded || crisis.assistance_needed || crisis.requirements || [];
    const totalReqs = Array.isArray(reqs) && reqs.length > 0 ? reqs.length : 1;
    const crisisAssignments = assignments.filter(a => String(a.crisis_id) === String(crisis.id));
    const fulfilledCount = crisisAssignments.filter(a => 
      ['ACCEPTED', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS', 'COMPLETED'].includes((a.status || '').toUpperCase())
    ).length;

    const boundedFulfilled = Math.min(fulfilledCount, totalReqs);
    const progressPct = Math.round((boundedFulfilled / totalReqs) * 100);

    let statusLabel = 'PENDING';
    let statusVariant = 'amber';
    if (boundedFulfilled >= totalReqs) {
      statusLabel = 'FULFILLED';
      statusVariant = 'success';
    } else if (boundedFulfilled > 0) {
      statusLabel = 'PARTIALLY FULFILLED';
      statusVariant = 'teal';
    }

    return {
      fulfilledCount: boundedFulfilled,
      totalReqs,
      progressPct,
      statusLabel,
      statusVariant
    };
  };

  // Compile "Needs Attention" items dynamically
  const needsAttentionItems = [];
  
  // 1. Pending assistance requests
  if (pendingRequests > 0) {
    needsAttentionItems.push({
      id: 'pending-requests',
      type: 'HIGH',
      icon: '📩',
      title: `${pendingRequests} assistance request(s) awaiting responder review`,
      subtitle: 'Volunteers have been notified and are pending acceptance',
      targetPage: 'volunteer-portal'
    });
  }

  // 2. Unfulfilled critical crises
  sortedActiveCrises.forEach(crisis => {
    const { fulfilledCount, totalReqs } = getCrisisProgress(crisis);
    const isCritical = (crisis.urgency || crisis.priority || '').toUpperCase() === 'CRITICAL';
    if (fulfilledCount < totalReqs) {
      needsAttentionItems.push({
        id: `crisis-${crisis.id}`,
        type: isCritical ? 'CRITICAL' : 'HIGH',
        icon: isCritical ? '🔴' : '🟠',
        title: `${crisis.title || 'Emergency Incident'} — Needs ${totalReqs - fulfilledCount} more responder(s)`,
        subtitle: `Location: ${crisis.location} • ${crisis.peopleAffected || 'People affected'}`,
        targetPage: 'crisis-room',
        payload: crisis
      });
    }
  });

  // 3. Low resource alert
  const depletedResources = resources.filter(r => (r.available_quantity || 0) === 0);
  if (depletedResources.length > 0) {
    needsAttentionItems.push({
      id: 'depleted-resources',
      type: 'MEDIUM',
      icon: '📦',
      title: `${depletedResources.length} aid resource type(s) currently depleted`,
      subtitle: `Replenishment required: ${depletedResources.map(r => r.name).join(', ')}`,
      targetPage: 'resources'
    });
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* 1. DASHBOARD HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
              CO-RESOLVE — Crisis Response Overview
            </h1>
          </div>
          <p className="text-xs font-medium text-stone-500 mt-1">
            Real-time coordinator command overview for active crises, responder deployments, and network capabilities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active AI Network Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>AI Network Active</span>
          </div>

          {/* Primary Action Button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigate && onNavigate('report')}
            className="shadow-sm font-bold"
          >
            🆘 Report a Need
          </Button>
        </div>
      </div>

      {error && <ErrorState description={error} onRetry={loadDashboardData} />}

      {/* 2. KEY OPERATIONAL STATISTICS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Metric A: Active Crises */}
        <Card padding="p-4.5" className="bg-white border-stone-200/90 shadow-2xs hover:border-stone-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Active Crises
            </span>
            <span className="text-lg">🚨</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 leading-none">
              {loading ? '...' : activeCrises.length}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">Unresolved</span>
          </div>
        </Card>

        {/* Metric B: Critical */}
        <Card padding="p-4.5" className="bg-white border-red-200/80 bg-red-50/10 shadow-2xs hover:border-red-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-800">
              Critical
            </span>
            <span className="text-lg">🔴</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-700 leading-none">
              {loading ? '...' : criticalCount}
            </span>
            <span className="text-[11px] text-red-600 font-semibold">Priority Triage</span>
          </div>
        </Card>

        {/* Metric C: Responding */}
        <Card padding="p-4.5" className="bg-white border-stone-200/90 shadow-2xs hover:border-stone-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Responding
            </span>
            <span className="text-lg">👥</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-800 leading-none">
              {loading ? '...' : activeResponders}
            </span>
            <span className="text-[11px] text-teal-700 font-medium">Active Volunteers</span>
          </div>
        </Card>

        {/* Metric D: Pending Requests */}
        <Card padding="p-4.5" className="bg-white border-stone-200/90 shadow-2xs hover:border-stone-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Pending Requests
            </span>
            <span className="text-lg">📩</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-700 leading-none">
              {loading ? '...' : pendingRequests}
            </span>
            <span className="text-[11px] text-amber-600 font-medium">Awaiting Reply</span>
          </div>
        </Card>

        {/* Metric E: Available Resources */}
        <Card padding="p-4.5" className="bg-white border-stone-200/90 shadow-2xs hover:border-stone-300 transition col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Available Resources
            </span>
            <span className="text-lg">📦</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-stone-900 leading-none">
              {loading ? '...' : totalAvailableResources}
            </span>
            <span className="text-[11px] text-stone-500 font-medium">Ready Inventory</span>
          </div>
        </Card>

      </div>

      {/* 3. ACTIVE CRISES — MAIN DASHBOARD SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-200/70 pb-3">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              ACTIVE CRISES
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Current situations requiring coordination
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate && onNavigate('crises')}
            className="font-bold text-xs"
          >
            View All Crises →
          </Button>
        </div>

        {loading ? (
          <LoadingState description="Loading active network operations..." />
        ) : sortedActiveCrises.length === 0 ? (
          <Card padding="p-8" className="text-center bg-stone-50/50">
            <span className="text-3xl">🟢</span>
            <h3 className="font-bold text-stone-900 text-sm mt-2">All Clear — No Active Crises</h3>
            <p className="text-xs text-stone-500 mt-1">The crisis response network is currently in standby mode.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sortedActiveCrises.slice(0, 6).map((crisis) => {
              const { fulfilledCount, totalReqs, progressPct, statusLabel, statusVariant } = getCrisisProgress(crisis);
              const categories = Array.isArray(crisis.crisisTypes) && crisis.crisisTypes.length > 0
                ? crisis.crisisTypes
                : Array.isArray(crisis.types) && crisis.types.length > 0
                ? crisis.types
                : (crisis.type || crisis.crisisType || 'General Emergency').split(/•|,/);

              const requirements = crisis.assistanceNeeded || crisis.assistance_needed || categories;

              return (
                <Card
                  key={crisis.id}
                  padding="p-5"
                  className="flex flex-col justify-between border-stone-200/90 hover:border-teal-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="space-y-3.5">
                    
                    {/* Header: Urgency & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <StatusBadge status={crisis.urgency || crisis.priority || 'Medium'} />
                      <Badge variant={statusVariant} size="sm">
                        {statusLabel}
                      </Badge>
                    </div>

                    {/* Crisis Title & Location */}
                    <div>
                      <h3 className="font-extrabold text-stone-900 text-base leading-snug">
                        {crisis.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-stone-500 font-medium mt-1">
                        <span>📍 {crisis.location}</span>
                        <span>•</span>
                        <span>👥 {crisis.peopleAffected || crisis.people_affected || 'Multiple'} affected</span>
                      </div>
                    </div>

                    {/* Requirements Tags */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                        Requirements
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {requirements.map((req, rIdx) => (
                          <span
                            key={rIdx}
                            className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px] font-semibold border border-stone-200/80"
                          >
                            {typeof req === 'string' ? req.trim() : 'Assistance'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Response Progress Indicator */}
                    <div className="space-y-1.5 pt-2 border-t border-stone-100">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-stone-500">Response Progress</span>
                        <span className="text-stone-900 font-bold">{fulfilledCount} / {totalReqs} addressed</span>
                      </div>

                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            progressPct >= 100 ? 'bg-emerald-600' : progressPct > 0 ? 'bg-teal-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(progressPct, 5)}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>

                  {/* Open Response Button */}
                  <div className="pt-4 mt-3 border-t border-stone-100">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate && onNavigate('crisis-room', crisis)}
                      className="w-full justify-center font-bold text-xs"
                    >
                      Open Response Workspace →
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. NEEDS ATTENTION & QUICK ACTIONS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Left 2 Cols: NEEDS ATTENTION */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h3 className="text-base font-bold text-stone-900 tracking-tight">
              NEEDS ATTENTION
            </h3>
            <span className="text-xs text-stone-500 font-medium">({needsAttentionItems.length} alerts)</span>
          </div>

          {needsAttentionItems.length === 0 ? (
            <Card padding="p-5" className="bg-emerald-50/40 border-emerald-200 text-emerald-900 text-xs font-medium">
              ✓ All operational requirements and requests are currently addressed.
            </Card>
          ) : (
            <div className="space-y-2.5">
              {needsAttentionItems.slice(0, 4).map((item) => (
                <Card
                  key={item.id}
                  padding="p-4"
                  className={`border transition hover:shadow-xs cursor-pointer ${
                    item.type === 'CRITICAL'
                      ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                      : item.type === 'HIGH'
                      ? 'border-amber-200 bg-amber-50/30 hover:border-amber-300'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                  onClick={() => onNavigate && onNavigate(item.targetPage, item.payload)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">{item.icon}</span>
                      <div>
                        <h4 className="font-bold text-stone-900 text-xs sm:text-sm leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs text-stone-600 mt-0.5 font-medium">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-teal-800 whitespace-nowrap">
                      Review →
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right 1 Col: QUICK ACTIONS */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <span>⚡</span> QUICK ACTIONS
          </h3>

          <Card padding="p-5" className="space-y-3 border-stone-200/90 bg-white">
            <button
              onClick={() => onNavigate && onNavigate('report')}
              className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-teal-600 hover:bg-teal-50/50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🆘</span>
                <div>
                  <span className="font-bold text-stone-900 text-xs block group-hover:text-teal-900">Report New Crisis</span>
                  <span className="text-[11px] text-stone-500 font-medium">Initiate crisis triage & analysis</span>
                </div>
              </div>
              <span className="text-stone-400 group-hover:text-teal-700 font-bold text-xs">→</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('crises')}
              className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-teal-600 hover:bg-teal-50/50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🚨</span>
                <div>
                  <span className="font-bold text-stone-900 text-xs block group-hover:text-teal-900">Crisis Directory</span>
                  <span className="text-[11px] text-stone-500 font-medium">View all ongoing & resolved incidents</span>
                </div>
              </div>
              <span className="text-stone-400 group-hover:text-teal-700 font-bold text-xs">→</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('volunteer-portal')}
              className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-teal-600 hover:bg-teal-50/50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">🙋‍♂️</span>
                <div>
                  <span className="font-bold text-stone-900 text-xs block group-hover:text-teal-900">Volunteer Portal</span>
                  <span className="text-[11px] text-stone-500 font-medium">Check incoming responder requests</span>
                </div>
              </div>
              <span className="text-stone-400 group-hover:text-teal-700 font-bold text-xs">→</span>
            </button>

            <button
              onClick={() => onNavigate && onNavigate('resources')}
              className="w-full text-left p-3 rounded-xl border border-stone-200 hover:border-teal-600 hover:bg-teal-50/50 transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <span className="text-base">📦</span>
                <div>
                  <span className="font-bold text-stone-900 text-xs block group-hover:text-teal-900">Resource Inventory</span>
                  <span className="text-[11px] text-stone-500 font-medium">Pledge and manage aid equipment</span>
                </div>
              </div>
              <span className="text-stone-400 group-hover:text-teal-700 font-bold text-xs">→</span>
            </button>
          </Card>
        </div>

      </div>

    </div>
  );
}

export default DashboardView;
