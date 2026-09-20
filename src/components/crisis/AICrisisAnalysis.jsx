import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge, { StatusBadge } from '../ui/Badge';

const parseTypes = (analysisObj) => {
  if (Array.isArray(analysisObj?.crisisTypes) && analysisObj.crisisTypes.length > 0) {
    return analysisObj.crisisTypes;
  }
  if (Array.isArray(analysisObj?.types) && analysisObj.types.length > 0) {
    return analysisObj.types;
  }
  const rawStr = analysisObj?.crisisType || analysisObj?.type || '';
  if (typeof rawStr === 'string' && rawStr.trim()) {
    return rawStr.split(/•|,/).map(s => s.trim()).filter(Boolean);
  }
  return ['Medical Emergency'];
};

export function AICrisisAnalysis({
  analysis,
  onUpdateAnalysis,
  onProceedToMatching,
  onReset,
  isLoading = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTypes, setEditedTypes] = useState(() => parseTypes(analysis));
  const [editedPriority, setEditedPriority] = useState(analysis.urgency || 'High');
  const [editedPeople, setEditedPeople] = useState(analysis.peopleAffected || 'Unspecified');
  const [editedNeeds, setEditedNeeds] = useState(analysis.identifiedNeeds || []);
  const [newNeedInput, setNewNeedInput] = useState('');

  const crisisTypesList = parseTypes(analysis);

  const toggleEditedType = (typeVal) => {
    setEditedTypes(prev => {
      const exists = prev.includes(typeVal);
      if (exists) {
        return prev.length > 1 ? prev.filter(t => t !== typeVal) : prev;
      }
      return [...prev, typeVal];
    });
  };

  const handleAddNeed = () => {
    if (newNeedInput.trim() && !editedNeeds.includes(newNeedInput.trim())) {
      setEditedNeeds([...editedNeeds, newNeedInput.trim()]);
      setNewNeedInput('');
    }
  };

  const handleRemoveNeed = (indexToRemove) => {
    setEditedNeeds(editedNeeds.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveEdits = () => {
    setIsEditing(false);
    if (onUpdateAnalysis) {
      onUpdateAnalysis({
        ...analysis,
        crisisType: editedTypes.join(' • '),
        crisisTypes: editedTypes,
        types: editedTypes,
        urgency: editedPriority,
        peopleAffected: editedPeople,
        identifiedNeeds: editedNeeds
      });
    }
  };

  return (
    <Card padding="p-6 md:p-8" className="border-teal-200 shadow-sm bg-white">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold text-lg shadow-2xs">
            🤖
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900 tracking-tight leading-none">
              AI CRISIS ANALYSIS
            </h3>
            <span className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider">
              Triage & Requirements Analysis
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority indicator ONLY gets red/amber status badge */}
          <StatusBadge status={isEditing ? editedPriority : analysis.urgency} />
          {onReset && (
            <button
              onClick={onReset}
              className="text-xs text-stone-400 hover:text-stone-700 underline ml-2"
            >
              New Report
            </button>
          )}
        </div>
      </div>

      {!isEditing ? (
        /* READ MODE */
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Crisis Categories
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {crisisTypesList.map((tItem, idx) => (
                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-teal-50 text-teal-900 text-xs font-bold border border-teal-200/80">
                    {tItem}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                Priority Ranking
              </span>
              <div className="mt-0.5">
                <StatusBadge status={analysis.urgency} />
              </div>
            </div>

            <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                People Affected
              </span>
              <span className="text-base font-bold text-stone-900">
                {analysis.peopleAffected}
              </span>
            </div>
          </div>

          {/* Identified Needs */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Identified Needs
            </h4>
            <div className="flex flex-wrap gap-2">
              {(analysis.identifiedNeeds || []).map((need, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200/80 text-teal-900 text-xs font-semibold"
                >
                  <span className="text-teal-700">✓</span> {need}
                </span>
              ))}
            </div>
          </div>

          {/* Explanation Section */}
          <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-4 space-y-1.5">
            <h4 className="text-xs font-bold text-stone-900 tracking-tight flex items-center gap-1.5">
              <span>💡</span> Why this was identified
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              {analysis.explanation || 'Extracted from situation details indicating urgent need for specialized rescue and medical aid in the affected area.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              ✏️ Edit Requirements
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={onProceedToMatching}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Connecting to Matching...</span>
                </span>
              ) : (
                'Continue to Matching →'
              )}
            </Button>
          </div>
        </div>
      ) : (
        /* EDIT MODE FOR COORDINATOR */
        <div className="space-y-6">
          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl text-xs text-teal-900 font-medium">
            ✏️ Coordinator Mode: Review and refine extracted requirements before triggering vector semantic matching.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                Crisis Categories (Multi-Select)
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Flood', 'Fire', 'Medical Emergency', 'Evacuation', 'Food Shortage', 'Water Shortage', 'Search & Rescue', 'Shelter', 'Other'].map((tOpt) => {
                  const isSel = editedTypes.includes(tOpt);
                  return (
                    <button
                      key={tOpt}
                      type="button"
                      onClick={() => toggleEditedType(tOpt)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition ${
                        isSel
                          ? 'bg-teal-700 text-white border-teal-700'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {isSel ? '✓ ' : ''}{tOpt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                Priority
              </label>
              <select
                value={editedPriority}
                onChange={(e) => setEditedPriority(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white p-2.5 text-xs font-semibold text-stone-900 outline-none focus:border-teal-600"
              >
                <option value="Critical">Critical (Red)</option>
                <option value="High">High (Amber)</option>
                <option value="Medium">Medium (Teal)</option>
                <option value="Low">Low (Neutral)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-700 mb-1">
                People Affected
              </label>
              <input
                type="text"
                value={editedPeople}
                onChange={(e) => setEditedPeople(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white p-2 text-xs font-semibold text-stone-900 outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Edit Identified Needs List */}
          <div>
            <label className="block text-xs font-bold uppercase text-stone-700 mb-2">
              Edit Identified Needs
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {editedNeeds.map((need, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold"
                >
                  {need}
                  <button
                    onClick={() => handleRemoveNeed(idx)}
                    className="text-stone-400 hover:text-red-600 font-bold ml-1 text-sm"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                placeholder="Add custom need (e.g. First Aid)..."
                value={newNeedInput}
                onChange={(e) => setNewNeedInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNeed())}
                className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 outline-none focus:border-teal-600"
              />
              <Button variant="secondary" size="sm" onClick={handleAddNeed}>
                + Add
              </Button>
            </div>
          </div>

          {/* Save / Cancel buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleSaveEdits}
            >
              Save Changes
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default AICrisisAnalysis;
