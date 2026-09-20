import React, { useState, useEffect } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { StatusBadge } from '../components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import api from '../services/api';

export function AICommandView({ onNavigate }) {
  const [crises, setCrises] = useState([]);
  const [selectedCrisisIndex, setSelectedCrisisIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection state for human coordinator review
  const [selectedRecommendations, setSelectedRecommendations] = useState([0, 1, 2, 3]);
  const [assignmentsCreated, setAssignmentsCreated] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const reports = await api.getCrisisReports().catch(() => []);
        setCrises(reports || []);
      } catch (err) {
        setError(err.message || 'Unable to load command intelligence.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentCrisis = crises[selectedCrisisIndex] || {
    id: 1,
    title: 'Flood Rescue — Kollam',
    location: 'Kollam',
    urgency: 'Critical',
    peopleAffected: '30 people affected',
    description: 'Rapid water level rise near coastal lowlands. Immediate evacuation boats and medical aid required.'
  };

  // Structured recommendations data
  const recommendedResponseList = [
    { id: 0, agent: 'Volunteer A (ARJUN)', capability: 'Water Rescue', status: 'Available', type: 'volunteer' },
    { id: 1, agent: 'Volunteer B (Rahul Nair)', capability: 'Water Rescue', status: 'Available', type: 'volunteer' },
    { id: 2, agent: 'Doctor C (Dr. Priya Sharma)', capability: 'Medical', status: 'Available', type: 'volunteer' },
    { id: 3, agent: 'NGO F (Kerala Coastal Rescue)', capability: 'Food Kits & Boats', status: 'Available', type: 'organization' },
  ];

  const handleToggleSelect = (id) => {
    if (selectedRecommendations.includes(id)) {
      setSelectedRecommendations(selectedRecommendations.filter(i => i !== id));
    } else {
      setSelectedRecommendations([...selectedRecommendations, id]);
    }
  };

  const handleCreateAssignments = () => {
    setAssignmentsCreated(true);
    setShowReviewModal(false);
    setTimeout(() => {
      onNavigate('assignments');
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Page Heading */}
      <PageHeading
        title="AI Command Center"
        description="Intelligence & Semantic Alignment Engine. Reviews, triages, and recommends crisis assignments."
        actions={
          <div className="flex gap-2">
            <Badge variant="teal">FastEmbed + Qdrant Node</Badge>
            <Badge variant="success">Human-in-the-Loop Triage</Badge>
          </div>
        }
      />

      {error && <ErrorState description={error} />}

      {assignmentsCreated && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <div>
              <h4 className="font-bold text-green-950 text-sm">Assignments Created Successfully</h4>
              <p className="text-xs text-green-700">Approved response mappings have been dispatched to operational channels.</p>
            </div>
          </div>
          <Badge variant="success">Redirecting to Assignments...</Badge>
        </div>
      )}

      {/* 1. CURRENT CRISIS HEADER & SELECTOR */}
      <Card padding="p-6 md:p-8" className="bg-white border-stone-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4 mb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block mb-1">
              CURRENT CRISIS UNDER ANALYSIS
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                {currentCrisis.title}
              </h2>
              <StatusBadge status={currentCrisis.urgency || 'Critical'} />
            </div>
            <p className="text-xs text-stone-500 font-medium mt-1">
              📍 {currentCrisis.location || 'Kollam'} • 👥 {currentCrisis.peopleAffected || '30 people affected'}
            </p>
          </div>

          {/* Crisis Switcher */}
          {crises.length > 1 && (
            <div className="text-xs">
              <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">Select Crisis</label>
              <select
                value={selectedCrisisIndex}
                onChange={(e) => setSelectedCrisisIndex(Number(e.target.value))}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium text-stone-900 outline-none focus:border-teal-600"
              >
                {crises.map((c, idx) => (
                  <option key={idx} value={idx}>{c.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* 2. NEEDS IDENTIFIED SECTION */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
            NEEDS IDENTIFIED
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Water Rescue', 'Medical', 'Food', 'Boats'].map((need, idx) => (
              <span
                key={idx}
                className="px-3.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-900 text-xs font-bold flex items-center gap-1.5"
              >
                <span className="text-teal-700">✓</span> {need}
              </span>
            ))}
          </div>
        </div>

        {/* 3. CAPABILITIES FOUND SECTION */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
            CAPABILITIES FOUND
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">Responders Available</span>
              <span className="font-bold text-stone-900 text-sm bg-white px-2.5 py-1 rounded border border-stone-200">
                8 responders
              </span>
            </div>
            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">Organizations Active</span>
              <span className="font-bold text-stone-900 text-sm bg-white px-2.5 py-1 rounded border border-stone-200">
                3 organizations
              </span>
            </div>
            <div className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700">Resources Pledged</span>
              <span className="font-bold text-stone-900 text-sm bg-white px-2.5 py-1 rounded border border-stone-200">
                5 resources
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. RECOMMENDED RESPONSE & HUMAN REVIEW */}
      <Card padding="p-6 md:p-8" className="bg-white border-stone-200">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
          <div>
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <span>🤖</span> RECOMMENDED RESPONSE
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Review and select recommendations below before finalizing operational assignments.
            </p>
          </div>
          <Badge variant="teal">Human-in-the-Loop</Badge>
        </div>

        {/* Structured Mappings */}
        <div className="space-y-3 mb-6">
          {recommendedResponseList.map((rec) => {
            const isChecked = selectedRecommendations.includes(rec.id);
            return (
              <div
                key={rec.id}
                onClick={() => handleToggleSelect(rec.id)}
                className={`p-4 rounded-xl border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isChecked
                    ? 'border-teal-600 bg-teal-50/40 text-stone-900'
                    : 'border-stone-200 bg-white text-stone-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 text-teal-600 rounded border-stone-300 focus:ring-teal-600"
                  />
                  <div>
                    <span className="font-bold text-stone-900 text-sm">{rec.agent}</span>
                    <span className="text-xs text-stone-400 mx-2">➔</span>
                    <span className="text-xs font-bold text-teal-800 bg-teal-100/80 px-2.5 py-0.5 rounded border border-teal-200">
                      {rec.capability}
                    </span>
                  </div>
                </div>

                <Badge variant="success" size="sm">
                  {rec.status}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* 5. WHY THESE ARE RECOMMENDED */}
        <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-5 mb-6">
          <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
            WHY THESE ARE RECOMMENDED
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-stone-700">
            <div className="flex items-center gap-1.5">
              <span className="text-teal-700 font-bold">✓</span> Relevant capability
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-teal-700 font-bold">✓</span> Available
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-teal-700 font-bold">✓</span> Appropriate resource
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-teal-700 font-bold">✓</span> Relevant experience
            </div>
          </div>
        </div>

        {/* 6. SIMILAR RESPONSES (Historical Vector Memory) */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
            SIMILAR HISTORICAL RESPONSES (Qdrant Memory)
          </h4>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 bg-stone-100 border border-stone-200 text-stone-700 rounded-lg font-medium">
              📜 Previous flood response (Kollam, 2025)
            </span>
            <span className="px-3 py-1.5 bg-stone-100 border border-stone-200 text-stone-700 rounded-lg font-medium">
              📜 Previous medical + flood response (Ernakulam, 2024)
            </span>
          </div>
        </div>

        {/* ACTION CONTROLS */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-stone-100">
          <Button
            variant="outline"
            size="md"
            onClick={() => setShowReviewModal(true)}
          >
            Review Response ({selectedRecommendations.length})
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleCreateAssignments}
            disabled={selectedRecommendations.length === 0}
          >
            Create Assignments ({selectedRecommendations.length}) →
          </Button>
        </div>
      </Card>

      {/* REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <Card padding="p-6" className="max-w-md w-full bg-white shadow-xl">
            <h3 className="font-bold text-stone-900 text-base mb-2">Review AI Recommendations</h3>
            <p className="text-xs text-stone-500 mb-4">
              Confirm that you have reviewed the selected capability mappings before dispatching operational assignments.
            </p>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {selectedRecommendations.map(id => {
                const item = recommendedResponseList.find(r => r.id === id);
                return (
                  <div key={id} className="p-2.5 bg-stone-50 rounded border border-stone-200 text-xs">
                    <span className="font-bold text-stone-900">{item.agent}</span> ➔ <span className="text-teal-800 font-semibold">{item.capability}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowReviewModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleCreateAssignments}>Approve & Create Assignments</Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}

export default AICommandView;
