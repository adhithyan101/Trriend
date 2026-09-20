import React, { useState, useEffect } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import api from '../services/api';

// Initial realistic assignment seed data
const INITIAL_ASSIGNMENTS = [
  {
    id: 1,
    title: 'Water Rescue Dispatch #101',
    crisis_title: 'FLOOD RESCUE — KOLLAM',
    assignee: 'Arjun Nair (Volunteer)',
    role: 'Water Rescue',
    location: 'Town Center, Kollam',
    priority: 'CRITICAL',
    status: 'PROPOSED' // PROPOSED | ASSIGNED | ACCEPTED | REJECTED | IN PROGRESS | COMPLETED | CANCELLED
  },
  {
    id: 2,
    title: 'Medical Evacuation & Paramedic Unit #102',
    crisis_title: 'FLOOD RESCUE — KOLLAM',
    assignee: 'Dr. Priya Sharma (CHAA)',
    role: 'Medical Triage',
    location: 'Kollam East Hospital Post',
    priority: 'HIGH',
    status: 'ASSIGNED'
  },
  {
    id: 3,
    title: 'Emergency Food Ration Distribution #103',
    crisis_title: 'FLOOD RESCUE — KOLLAM',
    assignee: 'Kerala Relief Network',
    role: 'Food & Supply Dispatch',
    location: 'District Supply Depot',
    priority: 'MEDIUM',
    status: 'ACCEPTED'
  },
  {
    id: 4,
    title: 'Rough-Water Boat Rescue Squad #104',
    crisis_title: 'KUTTANAD INUNDATION',
    assignee: 'Alappuzha Fishermen Union',
    role: 'Deep Water Navigation',
    location: 'Kuttanad Waterways',
    priority: 'CRITICAL',
    status: 'IN PROGRESS'
  },
  {
    id: 5,
    title: 'Shelter Sanitation & Medical Screening #105',
    crisis_title: 'WAYANAD LANDSLIDE EMERGENCY',
    assignee: 'Red Cross Relief Team',
    role: 'Shelter Management',
    location: 'St. Joseph Relief Camp',
    priority: 'MEDIUM',
    status: 'COMPLETED'
  }
];

export function AssignmentsView({ onNavigate }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // User Role Switcher: 'Coordinator' | 'Volunteer'
  const [activeRole, setActiveRole] = useState('Coordinator');
  // Filter by State
  const [statusFilter, setStatusFilter] = useState('All');

  // Fetch assignments from backend or fallback to seed
  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAssignments();
      if (data && data.length > 0) {
        setAssignments(data);
      } else {
        // Seed initial assignments to backend if DB is empty
        const seeded = [];
        for (const seed of INITIAL_ASSIGNMENTS) {
          try {
            const res = await api.createAssignment(seed);
            seeded.push(res);
          } catch (e) {
            seeded.push(seed);
          }
        }
        setAssignments(seeded);
      }
    } catch (err) {
      console.warn('Using seeded assignments fallback:', err);
      setAssignments(INITIAL_ASSIGNMENTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Handle workflow status update via backend
  const handleStatusTransition = async (assignmentId, targetStatus) => {
    setUpdatingId(assignmentId);
    setActionError(null);

    try {
      // Call backend endpoint - backend verifies state machine rules
      const result = await api.updateAssignmentStatus({ id: assignmentId, status: targetStatus });

      // Update local state with backend authoritative state
      setAssignments(prev =>
        prev.map(a => (a.id === assignmentId ? { ...a, status: result.status || targetStatus } : a))
      );
    } catch (err) {
      // If backend rejects transition, show backend error message
      setActionError(`Transition failed: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter assignments
  const filteredAssignments = assignments.filter(a => {
    if (statusFilter === 'All') return true;
    return a.status.toUpperCase() === statusFilter.toUpperCase();
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <PageHeading
        title="Response Assignments"
        description="Monitor field deployments, volunteer dispatch workflow, and resource execution state."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('volunteer-portal')}>
              🧑‍🚒 Volunteer Portal
            </Button>
            <Button variant="primary" size="sm" onClick={() => onNavigate('ai-command')}>
              🤖 AI Command Dispatch
            </Button>
          </div>
        }
      />

      {/* TOP CONTROL BAR: ROLE SWITCHER & STATE FILTERS */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        {/* Role Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Simulate Action Role:
          </span>
          <div className="bg-stone-100 p-1 rounded-lg border border-stone-200 flex items-center gap-1">
            <button
              onClick={() => setActiveRole('Coordinator')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                activeRole === 'Coordinator'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🏛️ Coordinator
            </button>
            <button
              onClick={() => setActiveRole('Volunteer')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${
                activeRole === 'Volunteer'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🧑‍🚒 Volunteer / Responder
            </button>
          </div>
        </div>

        {/* State Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {['All', 'PROPOSED', 'ASSIGNED', 'ACCEPTED', 'IN PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                statusFilter === st
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>⚠️ {actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-600 hover:text-red-900">✕</button>
        </div>
      )}

      {/* CONTENT LISTING */}
      {error && <ErrorState description={error} onRetry={fetchAssignments} />}

      {loading ? (
        <LoadingState title="Loading Assignments" description="Fetching response assignments from backend database..." />
      ) : filteredAssignments.length === 0 ? (
        <EmptyState
          icon="📋"
          title="No Assignments Found"
          description="No assignments match the selected status filter."
          actionText="Show All Assignments"
          onAction={() => setStatusFilter('All')}
        />
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => {
            const st = assignment.status;
            const isProposed = st === 'PROPOSED';
            const isAssigned = st === 'ASSIGNED';
            const isAccepted = st === 'ACCEPTED';
            const isRejected = st === 'REJECTED';
            const isInProgress = st === 'IN PROGRESS';
            const isCompleted = st === 'COMPLETED';
            const isCancelled = st === 'CANCELLED';

            const isUpdating = updatingId === assignment.id;

            return (
              <Card key={assignment.id} padding="p-5" className="bg-white border-stone-200 hover:border-stone-300 transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Column: Assignment Details */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="font-extrabold text-stone-900 text-base">
                        #{assignment.id}: {assignment.title}
                      </h3>

                      {/* Priority Tag */}
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        assignment.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-stone-100 text-stone-700'
                      }`}>
                        {assignment.priority}
                      </span>

                      {/* LOCALIZED STATE BADGES (Design System Rules) */}
                      {isProposed && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                          ● PROPOSED
                        </span>
                      )}
                      {isAssigned && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                          ● ASSIGNED
                        </span>
                      )}
                      {isAccepted && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-900 border border-teal-300">
                          ● ACCEPTED
                        </span>
                      )}
                      {isRejected && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-700 border border-stone-300">
                          ✕ REJECTED
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                          ● IN PROGRESS
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-900 border border-green-300">
                          ✓ COMPLETED
                        </span>
                      )}
                      {isCancelled && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          ✕ CANCELLED
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-stone-600 font-medium pt-1">
                      <p><strong>Crisis:</strong> <span className="text-stone-900 font-semibold">{assignment.crisis_title}</span></p>
                      <p><strong>Assignee:</strong> <span className="text-teal-800 font-semibold">{assignment.assignee}</span> ({assignment.role})</p>
                      <p><strong>Location:</strong> 📍 {assignment.location}</p>
                    </div>
                  </div>

                  {/* Right Column: Workflow Action Buttons based on User Role & Backend State Machine */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                    {activeRole === 'Coordinator' && (
                      <>
                        {/* Coordinator Action 1: Approve Proposed Assignment */}
                        {isProposed && (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={isUpdating}
                            onClick={() => handleStatusTransition(assignment.id, 'ASSIGNED')}
                          >
                            ✓ Approve
                          </Button>
                        )}

                        {/* Coordinator Action 2: Cancel Assignment */}
                        {(isProposed || isAssigned || isAccepted) && (
                          <Button
                            variant="outline"
                            size="sm"
                            loading={isUpdating}
                            onClick={() => handleStatusTransition(assignment.id, 'CANCELLED')}
                          >
                            ✕ Cancel
                          </Button>
                        )}
                      </>
                    )}

                    {activeRole === 'Volunteer' && (
                      <>
                        {/* Volunteer Action 1: Accept or Reject assigned work */}
                        {isAssigned && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              loading={isUpdating}
                              onClick={() => handleStatusTransition(assignment.id, 'ACCEPTED')}
                            >
                              ✓ Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              loading={isUpdating}
                              onClick={() => handleStatusTransition(assignment.id, 'REJECTED')}
                            >
                              ✕ Reject
                            </Button>
                          </>
                        )}

                        {/* Volunteer Action 2: Start Response */}
                        {isAccepted && (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={isUpdating}
                            onClick={() => handleStatusTransition(assignment.id, 'IN PROGRESS')}
                          >
                            🚀 Start Response
                          </Button>
                        )}

                        {/* Volunteer Action 3: Mark Completed */}
                        {isInProgress && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={isUpdating}
                            onClick={() => handleStatusTransition(assignment.id, 'COMPLETED')}
                          >
                            ✓ Mark Completed
                          </Button>
                        )}
                      </>
                    )}

                    {/* Terminal or Inactive States info text */}
                    {(isCompleted || isCancelled || isRejected) && (
                      <span className="text-xs text-stone-400 font-semibold italic px-2 py-1">
                        No actions available ({st})
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AssignmentsView;
