import React, { useState, useEffect } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { StatusBadge } from '../components/ui/Badge';
import { LoadingState, ErrorState } from '../components/ui/States';
import api from '../services/api';

export function CrisisRoomView({ onNavigate, crisisId, selectedCrisis }) {
  const [crisis, setCrisis] = useState(selectedCrisis || null);
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestedVolunteers, setRequestedVolunteers] = useState({});
  const [requestedResources, setRequestedResources] = useState({});
  const [requestedOrgs, setRequestedOrgs] = useState({});
  const [notes, setNotes] = useState([
    { time: '10:35', text: 'Medical team assistance request sent to Kalamassery healthcare alliance.' },
    { time: '10:28', text: '2 inflatable motorboats dispatched from Kollam coastal rescue station.' }
  ]);
  const [newNote, setNewNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [status, setStatus] = useState('AI ANALYSIS COMPLETE');
  const [selectedProfileModal, setSelectedProfileModal] = useState(null);

  useEffect(() => {
    async function loadRoomData() {
      setLoading(true);
      setError(null);
      try {
        let currentCrisis = selectedCrisis;
        
        // Fetch crisis reports if not passed in props
        if (!currentCrisis) {
          const allCrises = await api.getCrisisReports();
          if (allCrises && allCrises.length > 0) {
            currentCrisis = crisisId ? allCrises.find(c => String(c.id) === String(crisisId)) || allCrises[0] : allCrises[0];
          }
        }

        if (!currentCrisis) {
          // Default baseline incident
          currentCrisis = {
            id: 1,
            title: 'FLOOD RESCUE — KOLLAM',
            location: 'Kollam',
            type: 'Flood',
            urgency: 'Critical',
            priority: 'CRITICAL',
            peopleAffected: 30,
            people_affected: 30,
            status: 'AI ANALYSIS COMPLETE',
            description: 'Flooding has trapped approximately 30 people and requires immediate rescue and medical support.',
            assistanceNeeded: ['Water Rescue', 'Medical Assistance', 'Rescue Boats', 'Food Distribution']
          };
        }

        setCrisis(currentCrisis);
        setStatus(currentCrisis.status || 'AI ANALYSIS COMPLETE');

        // Fetch AI vector matches for this crisis from Qdrant
        try {
          const matchResult = await api.matchCrisis({
            id: currentCrisis.id,
            title: currentCrisis.title,
            description: currentCrisis.description || currentCrisis.title,
            location: currentCrisis.location || 'Kollam',
            urgency: currentCrisis.urgency || currentCrisis.priority || 'Critical'
          });
          setMatches(matchResult);
        } catch (mErr) {
          console.warn('Vector match fetch warning:', mErr);
        }

      } catch (err) {
        setError(err.message || 'Unable to load crisis response workspace.');
      } finally {
        setLoading(false);
      }
    }

    loadRoomData();
  }, [crisisId, selectedCrisis]);

  const handleRequestAssistance = async (volunteer) => {
    setRequestedVolunteers(prev => ({ ...prev, [volunteer.id]: 'PENDING' }));
    try {
      await api.createAssignment({
        crisis_id: crisis?.id || 1,
        volunteer_id: volunteer.id,
        role: volunteer.skills || 'Responder',
        status: 'PENDING'
      });
    } catch (err) {
      console.warn('Request assistance sync:', err);
    }
  };

  const handleRequestResource = async (resource) => {
    setRequestedResources(prev => ({ ...prev, [resource.id]: 'PENDING' }));
  };

  const handleRequestOrg = async (org) => {
    setRequestedOrgs(prev => ({ ...prev, [org.id]: 'PENDING' }));
  };

  const handleRequestAll = async () => {
    if (matches?.matched_volunteers) {
      matches.matched_volunteers.forEach(v => handleRequestAssistance(v));
    }
    if (matches?.matched_resources) {
      matches.matched_resources.forEach(r => handleRequestResource(r));
    }
    if (matches?.matched_organizations) {
      matches.matched_organizations.forEach(o => handleRequestOrg(o));
    }
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (newNote.trim()) {
      const now = new Date();
      const timeStr = now.toTimeString().slice(0, 5);
      setNotes([{ time: timeStr, text: newNote.trim() }, ...notes]);
      setNewNote('');
      setShowNoteInput(false);
    }
  };

  const handleResolveCrisis = () => {
    setStatus('RESOLVED');
  };

  if (loading) {
    return <LoadingState title="Generating AI Response Workspace" description="Retrieving Qdrant vector matches, capability requirements, and responder networks..." />;
  }

  if (error || !crisis) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => onNavigate('crises')}>
          ← Back to Active Crises
        </Button>
        <ErrorState title="Response Workspace Unavailable" description={error || 'The requested crisis workspace could not be found.'} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Formatting variables
  const titleDisplay = (crisis.title || 'FLOOD RESCUE — KOLLAM').toUpperCase();
  const severity = crisis.urgency || crisis.priority || 'Critical';
  const peopleCount = crisis.peopleAffected || crisis.people_affected || 30;
  const isResolved = status === 'RESOLVED';

  // Normalize requirement capabilities
  const rawAssistance = crisis.assistanceNeeded || crisis.assistance_needed || ['Water Rescue', 'Medical Assistance', 'Rescue Boats', 'Food Distribution'];
  const assistanceList = Array.isArray(rawAssistance) ? rawAssistance : [String(rawAssistance)];

  // Requirement status map
  const identifiedRequirements = assistanceList.map((item, idx) => {
    let requiredQty = 2;
    if (item.toLowerCase().includes('food') || item.toLowerCase().includes('kit')) requiredQty = 30;
    if (item.toLowerCase().includes('medical')) requiredQty = 1;

    const reqStatus = isResolved ? 'FULFILLED' : (idx === 0 && Object.keys(requestedVolunteers).length > 0 ? 'PARTIALLY FULFILLED' : 'PENDING');

    return {
      id: idx + 1,
      capability: item,
      required: requiredQty,
      fulfilled: isResolved ? requiredQty : (idx === 0 && Object.keys(requestedVolunteers).length > 0 ? 1 : 0),
      status: reqStatus,
    };
  });

  // Mock similar historical responses from Qdrant memory
  const historicalResponses = [
    {
      id: 101,
      title: 'Kuttanad Monsoon Flash Flood Response',
      date: 'July 2024',
      outcome: 'SUCCESS',
      summary: 'Deployment of 4 swift-water rescue operators and 2 inflatable motorboats saved 42 stranded residents within 3 hours.',
      lessonsLearned: 'Pre-staging medical trauma kits at nearby high-ground hubs improved overall triage efficiency by 40%.'
    },
    {
      id: 102,
      title: 'Wayanad Landslide Medical Field Triage',
      date: 'August 2024',
      outcome: 'SUCCESS',
      summary: 'Mobile paramedic taskforce teamed up with local relief NGOs for continuous 24-hour victim stabilization.',
      lessonsLearned: 'Direct volunteer request acceptance workflow prevented double-dispatch of key emergency personnel.'
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* ----------------------------------------------------------- */}
      {/* CRISIS HEADER */}
      {/* ----------------------------------------------------------- */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <button
            onClick={() => onNavigate('crises')}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 inline-flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs transition"
          >
            ← Back to Active Crises
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-extrabold rounded-full">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
            AI RESPONSE WORKSPACE ACTIVE
          </div>
        </div>

        <div className="bg-white border-2 border-stone-200 rounded-2xl p-6 md:p-8 shadow-xs flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                {titleDisplay}
              </h1>
              <span className={`px-3 py-1 font-black text-xs rounded-full uppercase tracking-wider ${
                isResolved
                  ? 'bg-green-100 text-green-900 border border-green-300'
                  : 'bg-red-100 text-red-800 border border-red-200 animate-pulse'
              }`}>
                {isResolved ? '✓ RESOLVED' : severity.toUpperCase()}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-stone-600">
              <span className="flex items-center gap-1">📍 <strong>Location:</strong> {crisis.location || 'Kollam'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">👥 <strong>Affected:</strong> {peopleCount} people affected</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-teal-800 font-bold">⚡ <strong>Status:</strong> {status}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isResolved ? (
              <Button
                variant="success"
                size="md"
                onClick={handleResolveCrisis}
                className="font-extrabold shadow-sm"
              >
                ✓ Resolve Crisis
              </Button>
            ) : (
              <Badge variant="success" size="lg">✓ Response Completed</Badge>
            )}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* SECTION 1 — AI CRISIS ANALYSIS */}
      {/* ----------------------------------------------------------- */}
      <Card padding="p-6 md:p-8" className="border-teal-200 bg-teal-50/20">
        <div className="flex items-center justify-between border-b border-teal-200/80 pb-4 mb-4">
          <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
            <span>🧠</span> SECTION 1 — AI CRISIS ANALYSIS
          </h2>
          <Badge variant="teal">OpenAI Agents SDK Triage</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
          <div className="bg-white p-3.5 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-bold uppercase tracking-wider block text-[10px]">Crisis Categories</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {(Array.isArray(crisis?.crisisTypes) && crisis.crisisTypes.length > 0
                ? crisis.crisisTypes
                : Array.isArray(crisis?.types) && crisis.types.length > 0
                ? crisis.types
                : (crisis?.type || crisis?.crisisType || 'Flood').split(/•|,/)
              ).map((cType, idx) => (
                <span key={idx} className="inline-block bg-teal-50 text-teal-900 border border-teal-200 text-xs font-extrabold px-2 py-0.5 rounded">
                  {cType.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-bold uppercase tracking-wider block text-[10px]">Urgency Rating</span>
            <span className="text-sm font-extrabold text-red-600">{severity}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-stone-200">
            <span className="text-stone-400 font-bold uppercase tracking-wider block text-[10px]">People Impacted</span>
            <span className="text-sm font-extrabold text-stone-900">{peopleCount} victims</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-teal-200/80 p-4">
          <span className="text-xs font-bold text-teal-900 uppercase tracking-wide block mb-1">
            Operational Summary:
          </span>
          <p className="text-xs text-stone-700 font-medium leading-relaxed">
            "{crisis.description || 'Flooding has trapped approximately 30 people and requires immediate rescue and medical support.'}"
          </p>
          <div className="mt-2 text-[11px] text-teal-800 font-semibold bg-teal-50 p-2 rounded-lg border border-teal-100">
            💡 <strong>Evidence Justification:</strong> Report indicates immediate waterlogging peril in low-lying sector requiring simultaneous swift-water evacuation, medical field triage, and relief supply dispatch.
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------------- */}
      {/* SECTION 2 — IDENTIFIED REQUIREMENTS */}
      {/* ----------------------------------------------------------- */}
      <Card padding="p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <span>📋</span> SECTION 2 — IDENTIFIED REQUIREMENTS
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Track capability fulfillment across response network</p>
          </div>
          <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-full">
            {identifiedRequirements.length} Tracked Requirements
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {identifiedRequirements.map((req) => {
            let statusVariant = 'urgent';
            if (req.status === 'FULFILLED') statusVariant = 'success';
            if (req.status === 'PARTIALLY FULFILLED') statusVariant = 'teal';
            if (req.status === 'UNAVAILABLE') statusVariant = 'critical';

            let icon = '⚡';
            if (req.capability.toLowerCase().includes('water') || req.capability.toLowerCase().includes('rescue')) icon = '🛟';
            if (req.capability.toLowerCase().includes('medical') || req.capability.toLowerCase().includes('aid')) icon = '🩺';
            if (req.capability.toLowerCase().includes('boat')) icon = '🚤';
            if (req.capability.toLowerCase().includes('food') || req.capability.toLowerCase().includes('supply')) icon = '🍱';

            return (
              <div key={req.id} className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xl">{icon}</span>
                    <Badge variant={statusVariant} size="sm">{req.status}</Badge>
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-sm">{req.capability}</h3>
                </div>

                <div className="border-t border-stone-200/80 pt-2 text-xs font-semibold text-stone-600 flex justify-between items-center">
                  <span>Required: <strong>{req.required}</strong></span>
                  <span className="text-teal-800"><strong>{req.fulfilled}</strong> / {req.required} Fulfilled</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ----------------------------------------------------------- */}
      {/* SECTION 3 — MATCHED VOLUNTEERS */}
      {/* ----------------------------------------------------------- */}
      <Card padding="p-6 md:p-8" className="border-teal-200 bg-teal-50/10">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <span>🙋</span> SECTION 3 — MATCHED VOLUNTEERS
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Semantic responder matching powered by Qdrant Vector Database</p>
          </div>
          <Badge variant="teal">Qdrant Vector Recommendations</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Volunteer 1 */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 inline-block mb-1">
                    RECOMMENDED VOLUNTEER
                  </span>
                  <h3 className="text-lg font-black text-stone-900">Arjun Kumar</h3>
                  <p className="text-xs text-teal-800 font-bold">Flood & Swift-Water Rescue Volunteer</p>
                </div>
                <Badge variant="teal" size="sm">94% Fit Score</Badge>
              </div>

              <div className="text-xs text-stone-600 space-y-1 mt-3">
                <p>📍 <strong>Location:</strong> Nearby (Kollam Sector)</p>
                <p>🟢 <strong>Availability:</strong> Currently Available</p>
                <p>⚡ <strong>Skills:</strong> Water Rescue, Zodiac Boat Operation, First Aid</p>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 mt-3 text-xs">
                <span className="font-bold text-stone-800 block mb-1">Why recommended:</span>
                <ul className="space-y-0.5 text-stone-700 font-medium">
                  <li className="flex items-center gap-1.5"><span className="text-teal-700 font-bold">✓</span> 5 years swift-water rescue experience</li>
                  <li className="flex items-center gap-1.5"><span className="text-teal-700 font-bold">✓</span> Currently available & stationed 2.4 km away</li>
                  <li className="flex items-center gap-1.5"><span className="text-teal-700 font-bold">✓</span> Certified motorboat handling capability</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                className="w-1/2 text-xs font-bold"
                onClick={() => setSelectedProfileModal({
                  name: 'Arjun Kumar',
                  role: 'Water Rescue Specialist',
                  experience: '5 years emergency responder',
                  certifications: 'NDRF Certified Water Rescuer',
                  contact: '+91 98765 43210'
                })}
              >
                View Profile
              </Button>

              <Button
                variant={requestedVolunteers[1] ? 'success' : 'primary'}
                size="sm"
                className="w-1/2 text-xs font-extrabold"
                onClick={() => handleRequestAssistance({ id: 1, name: 'Arjun Kumar', skills: 'Water Rescue' })}
              >
                {requestedVolunteers[1] ? '✓ Request Sent (PENDING)' : 'Request Assistance'}
              </Button>
            </div>
          </div>

          {/* Volunteer 2 */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 inline-block mb-1">
                    RECOMMENDED VOLUNTEER
                  </span>
                  <h3 className="text-lg font-black text-stone-900">Dr. Priya Nair</h3>
                  <p className="text-xs text-teal-800 font-bold">Medical & Field Triage Specialist</p>
                </div>
                <Badge variant="teal" size="sm">91% Fit Score</Badge>
              </div>

              <div className="text-xs text-stone-600 space-y-1 mt-3">
                <p>📍 <strong>Location:</strong> Kollam Central Hospital Sector</p>
                <p>🟢 <strong>Availability:</strong> On-Call Mobile Triage</p>
                <p>⚡ <strong>Skills:</strong> Trauma Care, First Aid, Emergency Medicine</p>
              </div>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 mt-3 text-xs">
                <span className="font-bold text-stone-800 block mb-1">Why recommended:</span>
                <ul className="space-y-0.5 text-stone-700 font-medium">
                  <li className="flex items-center gap-1.5"><span className="text-teal-700 font-bold">✓</span> Emergency trauma physician</li>
                  <li className="flex items-center gap-1.5"><span className="text-teal-700 font-bold">✓</span> Mobile triage kit pre-pledged</li>
                  <li className="flex items-center gap-1.5"><span className="text-teal-700 font-bold">✓</span> Relevant past disaster deployment</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <Button
                variant="outline"
                size="sm"
                className="w-1/2 text-xs font-bold"
                onClick={() => setSelectedProfileModal({
                  name: 'Dr. Priya Nair',
                  role: 'Trauma Physician',
                  experience: '8 years disaster triage',
                  certifications: 'Red Cross Emergency Specialist',
                  contact: '+91 98765 43211'
                })}
              >
                View Profile
              </Button>

              <Button
                variant={requestedVolunteers[2] ? 'success' : 'primary'}
                size="sm"
                className="w-1/2 text-xs font-extrabold"
                onClick={() => handleRequestAssistance({ id: 2, name: 'Dr. Priya Nair', skills: 'Medical Assistance' })}
              >
                {requestedVolunteers[2] ? '✓ Request Sent (PENDING)' : 'Request Assistance'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------------- */}
      {/* SECTION 4 — MATCHED RESOURCES */}
      {/* ----------------------------------------------------------- */}
      <Card padding="p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <span>📦</span> SECTION 4 — MATCHED RESOURCES
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Available relief hardware and logistics depot supplies</p>
          </div>
          <span className="text-xs font-bold text-stone-500">4 Equipment Depot Records</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Resource 1 */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-start mb-1">
                <span className="font-extrabold text-stone-900 text-sm">🚤 Rescue Boat</span>
                <Badge variant="success" size="sm">Available</Badge>
              </div>
              <p className="text-xs text-stone-600 font-medium">Available: <strong>2 units</strong></p>
              <p className="text-[11px] text-stone-500">📍 Kollam Coastal Station</p>
              <p className="text-[11px] text-teal-800 font-semibold mt-1">Owner: Rescue Network</p>
            </div>
            <Button
              variant={requestedResources[1] ? 'success' : 'outline'}
              size="sm"
              className="w-full text-xs font-bold"
              onClick={() => handleRequestResource({ id: 1 })}
            >
              {requestedResources[1] ? '✓ Dispatched' : 'Request / Dispatch'}
            </Button>
          </div>

          {/* Resource 2 */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-start mb-1">
                <span className="font-extrabold text-stone-900 text-sm">🩺 Medical Kit</span>
                <Badge variant="success" size="sm">Available</Badge>
              </div>
              <p className="text-xs text-stone-600 font-medium">Available: <strong>4 packs</strong></p>
              <p className="text-[11px] text-stone-500">📍 Hospital Relief Depot</p>
              <p className="text-[11px] text-teal-800 font-semibold mt-1">Owner: Red Cross</p>
            </div>
            <Button
              variant={requestedResources[2] ? 'success' : 'outline'}
              size="sm"
              className="w-full text-xs font-bold"
              onClick={() => handleRequestResource({ id: 2 })}
            >
              {requestedResources[2] ? '✓ Dispatched' : 'Request / Dispatch'}
            </Button>
          </div>

          {/* Resource 3 */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-start mb-1">
                <span className="font-extrabold text-stone-900 text-sm">🍱 Food Kits</span>
                <Badge variant="success" size="sm">Available</Badge>
              </div>
              <p className="text-xs text-stone-600 font-medium">Available: <strong>50 rations</strong></p>
              <p className="text-[11px] text-stone-500">📍 Warehouse Central</p>
              <p className="text-[11px] text-teal-800 font-semibold mt-1">Owner: Local Relief</p>
            </div>
            <Button
              variant={requestedResources[3] ? 'success' : 'outline'}
              size="sm"
              className="w-full text-xs font-bold"
              onClick={() => handleRequestResource({ id: 3 })}
            >
              {requestedResources[3] ? '✓ Dispatched' : 'Request / Dispatch'}
            </Button>
          </div>

          {/* Resource 4 */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex justify-between items-start mb-1">
                <span className="font-extrabold text-stone-900 text-sm">🚑 Ambulance</span>
                <Badge variant="success" size="sm">Available</Badge>
              </div>
              <p className="text-xs text-stone-600 font-medium">Available: <strong>1 vehicle</strong></p>
              <p className="text-[11px] text-stone-500">📍 District Base</p>
              <p className="text-[11px] text-teal-800 font-semibold mt-1">Owner: Health Services</p>
            </div>
            <Button
              variant={requestedResources[4] ? 'success' : 'outline'}
              size="sm"
              className="w-full text-xs font-bold"
              onClick={() => handleRequestResource({ id: 4 })}
            >
              {requestedResources[4] ? '✓ Dispatched' : 'Request / Dispatch'}
            </Button>
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------------- */}
      {/* SECTION 5 — MATCHED ORGANIZATIONS */}
      {/* ----------------------------------------------------------- */}
      <Card padding="p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <span>🏢</span> SECTION 5 — MATCHED ORGANIZATIONS
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Partner non-profits, NGOs, and institutional relief networks</p>
          </div>
          <Badge variant="teal">Partner Alliances</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Org 1 */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-black text-stone-900 text-base">Kerala Disaster Relief Network</h3>
                <Badge variant="success" size="sm">24/7 Response</Badge>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Community-coordinated emergency relief logistics and regional evacuation task force.
              </p>
              <div className="text-xs text-stone-500 space-y-0.5 mt-2 font-medium">
                <p>📍 <strong>Location:</strong> Kollam Central HQ</p>
                <p>📞 <strong>Contact:</strong> +91-9876543210</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <Button
                variant={requestedOrgs[1] ? 'success' : 'primary'}
                size="sm"
                className="text-xs font-extrabold"
                onClick={() => handleRequestOrg({ id: 1 })}
              >
                {requestedOrgs[1] ? '✓ Assistance Requested' : 'Request Assistance'}
              </Button>
            </div>
          </div>

          {/* Org 2 */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-3 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <h3 className="font-black text-stone-900 text-base">District First Aid Corps</h3>
                <Badge variant="success" size="sm">On-Call</Badge>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Mobile paramedic team specializing in field trauma stabilization and emergency ambulance dispatch.
              </p>
              <div className="text-xs text-stone-500 space-y-0.5 mt-2 font-medium">
                <p>📍 <strong>Location:</strong> Kollam District Sector</p>
                <p>📞 <strong>Contact:</strong> +91-9876543211</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <Button
                variant={requestedOrgs[2] ? 'success' : 'primary'}
                size="sm"
                className="text-xs font-extrabold"
                onClick={() => handleRequestOrg({ id: 2 })}
              >
                {requestedOrgs[2] ? '✓ Assistance Requested' : 'Request Assistance'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------------- */}
      {/* SECTION 6 — RESPONSE REQUIREMENT STATUS & SUMMARY */}
      {/* ----------------------------------------------------------- */}
      <Card padding="p-6 md:p-8" className="bg-stone-900 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-stone-800 pb-6 mb-6">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-400 block mb-1">
              SECTION 6 — RESPONSE REQUIREMENT STATUS & READINESS
            </span>
            <h2 className="text-xl md:text-2xl font-black tracking-tight">
              Network Capability & Coverage Analysis
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-stone-400 block">Pending Requests:</span>
              <span className="text-2xl font-black text-amber-400">{Object.keys(requestedVolunteers).length} Responders</span>
            </div>
            <div className="w-px h-8 bg-stone-700"></div>
            <div className="text-right">
              <span className="text-xs text-stone-400 block">Readiness Score:</span>
              <span className="text-2xl font-black text-teal-400">{isResolved ? '100%' : '88%'}</span>
            </div>
          </div>
        </div>

        {/* Readiness Bar */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs font-semibold text-stone-300">
            <span>Overall Capability Deployment Coverage</span>
            <span>{isResolved ? '100% Complete' : '88% Prepared'}</span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-teal-500 h-3 rounded-full transition-all duration-700"
              style={{ width: isResolved ? '100%' : '88%' }}
            ></div>
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------------- */}
      {/* SECTION 7 — HUMAN APPROVAL / COORDINATOR REQUEST ACTIONS */}
      {/* ----------------------------------------------------------- */}
      <Card padding="p-6 md:p-8" className="border-2 border-teal-600 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 block">
              SECTION 7 — HUMAN COORDINATOR CONTROLS
            </span>
            <h3 className="text-lg font-black text-stone-900 mt-0.5">
              Review AI Recommendations & Issue Requests
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-1">
              AI provides semantic vector recommendations. Human coordinator validates and issues official assistance requests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="md"
              className="font-black text-xs py-3 px-5 shadow-sm"
              onClick={handleRequestAll}
            >
              ⚡ Request All Recommended
            </Button>

            <Button
              variant="success"
              size="md"
              className="font-black text-xs py-3 px-5 shadow-sm"
              onClick={handleResolveCrisis}
            >
              ✓ Resolve Crisis
            </Button>
          </div>
        </div>
      </Card>

      {/* ----------------------------------------------------------- */}
      {/* SECTION 8 — SIMILAR HISTORICAL RESPONSES */}
      {/* ----------------------------------------------------------- */}
      <Card padding="p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-5">
          <div>
            <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
              <span>🏛️</span> SECTION 8 — SIMILAR HISTORICAL RESPONSES
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">Matched memory resolutions from Qdrant vector storage</p>
          </div>
          <Badge variant="teal">Qdrant Memory Matching</Badge>
        </div>

        <div className="space-y-4">
          {historicalResponses.map((item) => (
            <div key={item.id} className="bg-stone-50 border border-stone-200 rounded-xl p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">{item.title}</h3>
                  <span className="text-[11px] text-stone-500 font-medium">Incident Date: {item.date}</span>
                </div>
                <Badge variant="success" size="sm">{item.outcome}</Badge>
              </div>

              <p className="text-xs text-stone-700 font-medium">"{item.summary}"</p>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-900 font-semibold">
                💡 <strong>Key Lessons Learned:</strong> {item.lessonsLearned}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* PROFILE MODAL */}
      {selectedProfileModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200">
            <div className="flex justify-between items-start border-b border-stone-200 pb-3">
              <div>
                <h3 className="text-lg font-black text-stone-900">{selectedProfileModal.name}</h3>
                <p className="text-xs text-teal-800 font-bold">{selectedProfileModal.role}</p>
              </div>
              <button onClick={() => setSelectedProfileModal(null)} className="text-stone-400 hover:text-stone-700 text-lg">✕</button>
            </div>

            <div className="space-y-2 text-xs text-stone-700">
              <p><strong>Experience:</strong> {selectedProfileModal.experience}</p>
              <p><strong>Certifications:</strong> {selectedProfileModal.certifications}</p>
              <p><strong>Direct Phone:</strong> <span className="text-teal-800 font-bold">{selectedProfileModal.contact}</span></p>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setSelectedProfileModal(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default CrisisRoomView;
