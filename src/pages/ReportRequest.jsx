import { useState } from 'react'
import api from '../services/api'
import PageHeading from '../components/ui/Headings'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Textarea, Select } from '../components/ui/Input'
import Badge, { StatusBadge } from '../components/ui/Badge'
import { ErrorState } from '../components/ui/States'
import AICrisisAnalysis from '../components/crisis/AICrisisAnalysis'
import GoogleLocationPicker from '../components/location/GoogleLocationPicker'

function ReportRequest({ onBack, onNavigate }) {
  // Form fields
  const [description, setDescription] = useState('')
  const [crisisType, setCrisisType] = useState('Medical Emergency')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [peopleAffected, setPeopleAffected] = useState('')
  const [immediateDanger, setImmediateDanger] = useState('No')
  const [requiredHelp, setRequiredHelp] = useState('')
  const [requiredResources, setRequiredResources] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Validation errors per field
  const [fieldErrors, setFieldErrors] = useState({})

  // Workflow steps: 'FORM' | 'ANALYZING' | 'ANALYSIS_READY' | 'MATCHING' | 'MATCHES_READY'
  const [stage, setStage] = useState('FORM')

  // Async states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [matches, setMatches] = useState(null)

  const handleLocationChange = ({ location: newLoc, latitude: newLat, longitude: newLng }) => {
    setLocation(newLoc)
    setLatitude(newLat)
    setLongitude(newLng)
    if (fieldErrors.location && newLoc.trim()) {
      setFieldErrors(prev => ({ ...prev, location: undefined }))
    }
  }

  const handleBackToHome = () => {
    if (onBack) {
      onBack()
    } else if (onNavigate) {
      onNavigate('home')
    } else {
      window.location.hash = ''
    }
  }

  const CRISIS_TYPE_OPTIONS = [
    { id: 'Flood', label: 'Flood', icon: '🌊' },
    { id: 'Fire', label: 'Fire', icon: '🔥' },
    { id: 'Medical Emergency', label: 'Medical Emergency', icon: '🚑' },
    { id: 'Evacuation', label: 'Evacuation', icon: '🏃' },
    { id: 'Food Shortage', label: 'Food Shortage', icon: '🍲' },
    { id: 'Water Shortage', label: 'Water Shortage', icon: '🚰' },
    { id: 'Search & Rescue', label: 'Search & Rescue', icon: '🛟' },
    { id: 'Shelter', label: 'Shelter', icon: '⛺' },
    { id: 'Other', label: 'Other', icon: '⚠️' }
  ];

  const ASSISTANCE_OPTIONS = [
    { id: 'Water Rescue', label: 'Water Rescue', icon: '🚤' },
    { id: 'Medical Assistance', label: 'Medical Assistance', icon: '⚕️' },
    { id: 'Food & Water', label: 'Food & Water', icon: '🍞' },
    { id: 'Transportation', label: 'Transportation', icon: '🚑' },
    { id: 'Shelter', label: 'Shelter', icon: '⛺' },
    { id: 'Search & Rescue', label: 'Search & Rescue', icon: '🔍' },
    { id: 'First Aid', label: 'First Aid', icon: '🩹' },
    { id: 'Logistics', label: 'Logistics', icon: '📦' },
  ];

  const [selectedCrisisTypes, setSelectedCrisisTypes] = useState(['Medical Emergency']);
  const [otherCrisisType, setOtherCrisisType] = useState('');
  const [selectedAssistance, setSelectedAssistance] = useState(['Medical Assistance', 'Water Rescue']);

  const toggleCrisisType = (id) => {
    setSelectedCrisisTypes(prev => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter(item => item !== id) : [...prev, id];
      if (fieldErrors.crisisTypes && updated.length > 0) {
        setFieldErrors(p => ({ ...p, crisisTypes: undefined }));
      }
      return updated;
    });
  };

  const toggleAssistance = (id) => {
    setSelectedAssistance(prev => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter(item => item !== id) : [...prev, id];
      if (fieldErrors.assistance && updated.length > 0) {
        setFieldErrors(p => ({ ...p, assistance: undefined }));
      }
      return updated;
    });
  };

  const validateForm = () => {
    const errors = {}
    if (!description.trim()) {
      errors.description = 'Please describe what is happening.'
    }
    if (!selectedCrisisTypes || selectedCrisisTypes.length === 0) {
      errors.crisisTypes = 'Select at least one crisis type.'
    }
    if (selectedCrisisTypes.includes('Other') && !otherCrisisType.trim()) {
      errors.otherCrisisType = 'Please describe the custom crisis type.'
    }
    if (!location.trim()) {
      errors.location = 'Please specify the location.'
    }
    if (selectedAssistance.length === 0) {
      errors.assistance = 'At least ONE assistance requirement must be selected before submitting.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Helper to extract identified needs list from form inputs
  const extractIdentifiedNeeds = () => {
    if (selectedAssistance.length > 0) {
      return [...selectedAssistance];
    }
    const list = []
    if (requiredHelp.trim()) {
      requiredHelp.split(',').forEach(item => item.trim() && list.push(item.trim()))
    }
    if (requiredResources.trim()) {
      requiredResources.split(',').forEach(item => item.trim() && list.push(item.trim()))
    }
    return list.length > 0 ? Array.from(new Set(list)) : ['Medical Assistance', 'Water Rescue'];
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setStage('ANALYZING')
    setError(null)
    setAnalysisResult(null)
    setMatches(null)

    const effectiveCrisisTypes = selectedCrisisTypes.map(t => (t === 'Other' && otherCrisisType.trim()) ? `Other: ${otherCrisisType.trim()}` : t);
    const computedUrgency = immediateDanger === 'Yes' ? 'Critical' : 'High'
    const crisisTypesString = effectiveCrisisTypes.join(' • ')
    const reportTitle = `${effectiveCrisisTypes.join(', ')}: ${description.trim().slice(0, 40)}${description.length > 40 ? '...' : ''}`

    const fullDescription = [
      `Crisis Categories: ${effectiveCrisisTypes.join(', ')}`,
      otherCrisisType.trim() ? `Custom Crisis Type: ${otherCrisisType.trim()}` : null,
      `Immediate Danger: ${immediateDanger}`,
      `People Affected: ${peopleAffected || 'Unspecified'}`,
      `Situation Details: ${description.trim()}`,
      `Selected Requirements: ${selectedAssistance.join(', ')}`,
      additionalNotes.trim() ? `Additional Notes: ${additionalNotes.trim()}` : null,
    ].filter(Boolean).join('\n')

    try {
      // 1. Submit crisis report to backend database with crisisTypes array and assistance_needed array
      const created = await api.createCrisisReport({
        title: reportTitle,
        description: fullDescription,
        location: location.trim(),
        urgency: computedUrgency,
        peopleAffected: peopleAffected ? parseInt(peopleAffected, 10) : 1,
        type: crisisTypesString,
        types: effectiveCrisisTypes,
        crisisTypes: effectiveCrisisTypes,
        otherCrisisType: otherCrisisType.trim(),
        other_crisis_type: otherCrisisType.trim(),
        assistance_needed: selectedAssistance,
        latitude,
        longitude,
      })

      const crisisId = created ? created.id : null

      // Generate evidence-based explanation
      const explanation = immediateDanger === 'Yes'
        ? `Immediate danger flagged for ${selectedCrisisTypes.join(', ')} with ${peopleAffected || 'multiple'} people impacted in ${location.trim()}. Urgent triage priority assigned.`
        : `Extracted from report details specifying ${selectedCrisisTypes.join(', ')} and ${selectedAssistance.join(', ')} in ${location.trim()}.`

      setAnalysisResult({
        id: crisisId,
        title: reportTitle,
        crisisType: crisisTypesString,
        crisisTypes: selectedCrisisTypes,
        types: selectedCrisisTypes,
        location: location.trim(),
        latitude,
        longitude,
        peopleAffected: peopleAffected || 'Unspecified',
        immediateDanger,
        urgency: computedUrgency,
        identifiedNeeds: selectedAssistance,
        assistanceNeeded: selectedAssistance,
        explanation,
        fullDescription
      })

      setStage('ANALYSIS_READY')
    } catch (err) {
      setError(err.message || 'Unable to analyze this request.')
      setStage('FORM')
    } finally {
      setLoading(false)
    }
  }

  const handleProceedToMatching = async () => {
    if (!analysisResult) return
    setLoading(true)
    setError(null)

    try {
      if (!analysisResult.id) {
        throw new Error('Missing Crisis ID from report submission.')
      }

      // Fetch AI vector matches using existing backend endpoint
      let matchData = null
      try {
        matchData = await api.matchCrisis({
          id: analysisResult.id,
          title: analysisResult.title,
          description: analysisResult.fullDescription || analysisResult.explanation || analysisResult.title,
          location: analysisResult.location,
          urgency: analysisResult.urgency
        })
      } catch (mErr) {
        console.warn('Vector match fetch warning:', mErr)
        matchData = { recommendations: [], matched_volunteers: [], matched_resources: [], total_matches: 0 }
      }

      // Preserve active crisis ID, title, location, crisisTypes, urgency, identified needs, and matches payload
      const crisisPayload = {
        id: analysisResult.id,
        title: analysisResult.title,
        location: analysisResult.location,
        type: analysisResult.crisisType || selectedCrisisTypes.join(' • '),
        crisisType: analysisResult.crisisType || selectedCrisisTypes.join(' • '),
        types: analysisResult.crisisTypes || selectedCrisisTypes,
        crisisTypes: analysisResult.crisisTypes || selectedCrisisTypes,
        urgency: analysisResult.urgency,
        priority: analysisResult.urgency,
        peopleAffected: analysisResult.peopleAffected,
        people_affected: analysisResult.peopleAffected,
        description: analysisResult.fullDescription || analysisResult.explanation,
        assistanceNeeded: analysisResult.identifiedNeeds || analysisResult.assistanceNeeded || selectedAssistance,
        identifiedNeeds: analysisResult.identifiedNeeds || selectedAssistance,
        matches: matchData
      }

      // Directly navigate to existing matching page / AI Response Workspace ('crisis-room')
      if (onNavigate) {
        onNavigate('crisis-room', crisisPayload)
      } else {
        setMatches(matchData)
        setStage('MATCHES_READY')
      }
    } catch (err) {
      console.error('Error proceeding to matching:', err)
      setError(err.message || 'Unable to continue to matching. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Page Heading */}
      <PageHeading
        title="Report a Need"
        description="Tell us what is happening. CO-RESOLVE will help identify the capabilities and resources that may be needed."
        actions={
          <Button variant="outline" size="sm" onClick={handleBackToHome}>
            ← Back to Home
          </Button>
        }
      />

      {/* ERROR STATE */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-900">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold text-red-950 text-sm">Unable to analyze this request.</h4>
              <p className="text-xs text-red-700 mt-1">Please check your network connection and try again.</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleSubmit}>
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* 1. INTAKE FORM */}
      {stage === 'FORM' && (
        <Card padding="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Field 1: What is happening? */}
            <Textarea
              label="1. What is happening?"
              rows={4}
              placeholder="Describe what is happening..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                if (fieldErrors.description) {
                  setFieldErrors(prev => ({ ...prev, description: undefined }))
                }
              }}
              error={fieldErrors.description}
            />

            {/* Field 2: CRISIS TYPE (Multi-Select) */}
            <div className="space-y-3 bg-stone-50 border border-stone-200/80 p-5 rounded-xl">
              <div>
                <label className="block text-sm font-bold text-stone-900 uppercase tracking-wide">
                  2. CRISIS TYPE <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-stone-500 mt-0.5 font-medium">
                  Select all crisis categories that apply to this emergency.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {CRISIS_TYPE_OPTIONS.map((opt) => {
                  const isSelected = selectedCrisisTypes.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleCrisisType(opt.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/90 text-teal-950 ring-2 ring-teal-600/30 shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100/70 hover:border-stone-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition ${
                        isSelected ? 'border-teal-700 bg-teal-700 text-white font-extrabold' : 'border-stone-300 bg-white'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <span className="text-base">{opt.icon}</span>
                      <span className="flex-1 font-bold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedCrisisTypes.includes('Other') && (
                <div className="mt-3">
                  <Input
                    label="Other crisis type *"
                    placeholder="Describe the crisis type (e.g. Road collapse blocking access to the village)"
                    value={otherCrisisType}
                    onChange={(e) => setOtherCrisisType(e.target.value)}
                    error={fieldErrors.otherCrisisType}
                    required
                  />
                </div>
              )}

              {fieldErrors.crisisTypes && (
                <p className="text-xs text-red-600 font-bold pt-1">⚠️ {fieldErrors.crisisTypes}</p>
              )}
            </div>

            {/* Field 3: Enhanced Google Maps Location Picker */}
            <GoogleLocationPicker
              location={location}
              latitude={latitude}
              longitude={longitude}
              onChange={handleLocationChange}
              error={fieldErrors.location}
            />

            {/* Field 4: Number of people affected */}
            <Input
              label="4. Number of people affected"
              placeholder="Example: 30"
              value={peopleAffected}
              onChange={(e) => setPeopleAffected(e.target.value)}
            />

            {/* Field 5: Immediate danger */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                5. Immediate danger
              </label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer font-medium text-sm transition ${
                  immediateDanger === 'No'
                    ? 'border-teal-600 bg-teal-50 text-teal-800 ring-1 ring-teal-600'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}>
                  <input
                    type="radio"
                    name="immediateDanger"
                    value="No"
                    checked={immediateDanger === 'No'}
                    onChange={() => setImmediateDanger('No')}
                    className="hidden"
                  />
                  <span>🟢 No</span>
                </label>

                <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer font-medium text-sm transition ${
                  immediateDanger === 'Yes'
                    ? 'border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}>
                  <input
                    type="radio"
                    name="immediateDanger"
                    value="Yes"
                    checked={immediateDanger === 'Yes'}
                    onChange={() => setImmediateDanger('Yes')}
                    className="hidden"
                  />
                  <span>⚡ Yes</span>
                </label>
              </div>
            </div>

            {/* Field 6: WHAT ASSISTANCE DO YOU NEED? (Multi-Select) */}
            <div className="space-y-3 bg-stone-50 border border-stone-200/80 p-5 rounded-xl">
              <div>
                <label className="block text-sm font-bold text-stone-900 uppercase tracking-wide">
                  6. WHAT ASSISTANCE DO YOU NEED? <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-stone-500 mt-0.5 font-medium">
                  Select multiple assistance requirements for this crisis response request.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {ASSISTANCE_OPTIONS.map((opt) => {
                  const isSelected = selectedAssistance.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleAssistance(opt.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'border-teal-700 bg-teal-50/90 text-teal-950 ring-2 ring-teal-600/30 shadow-xs'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-100/70 hover:border-stone-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs transition ${
                        isSelected ? 'border-teal-700 bg-teal-700 text-white font-extrabold' : 'border-stone-300 bg-white'
                      }`}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <span className="text-base">{opt.icon}</span>
                      <span className="flex-1 font-bold">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {fieldErrors.assistance && (
                <p className="text-xs text-red-600 font-bold pt-1">⚠️ {fieldErrors.assistance}</p>
              )}
            </div>

            {/* Field 8: Additional notes */}
            <Textarea
              label="8. Additional notes"
              rows={3}
              placeholder="Any extra notes or contact details..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full text-base py-3.5"
            >
              Analyze Need
            </Button>
          </form>
        </Card>
      )}

      {/* 2. LOADING STATE */}
      {(stage === 'ANALYZING' || stage === 'MATCHING') && (
        <Card padding="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4 py-6">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-700 rounded-full animate-spin"></div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                {stage === 'ANALYZING' ? 'Analyzing the request...' : 'Querying vector match network...'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">Evaluating capability requirements & community availability.</p>
            </div>
          </div>
        </Card>
      )}

      {/* 3. PHASE 4 AI CRISIS ANALYSIS SCREEN */}
      {(stage === 'ANALYSIS_READY' || stage === 'MATCHES_READY') && analysisResult && (
        <div className="space-y-6">
          <AICrisisAnalysis
            analysis={analysisResult}
            onUpdateAnalysis={(updated) => setAnalysisResult(updated)}
            onProceedToMatching={handleProceedToMatching}
            onReset={() => setStage('FORM')}
            isLoading={loading}
          />

          {/* 4. MATCH RESULTS SCREEN */}
          {stage === 'MATCHES_READY' && matches && (
            <Card padding="p-6 md:p-8" className="space-y-5 border-teal-200 bg-teal-50/10">
              <div className="flex items-center justify-between border-b border-stone-200/60 pb-3">
                <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                  <span>🤖</span> AI Matched Assistance ({matches.total_matches || 0})
                </h3>
                <Badge variant="teal">FastEmbed + Qdrant Similarity</Badge>
              </div>

              {matches.total_matches === 0 ? (
                <div className="text-xs text-stone-500 text-center py-6">
                  No immediate vector similarity matches found above the 25% threshold. Helpers will be notified as they register.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Matched Volunteers */}
                  {matches.matched_volunteers?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                        Matched Community Volunteers
                      </h4>
                      {matches.matched_volunteers.map((vol, idx) => (
                        <div key={idx} className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-stone-900 text-sm">{vol.name}</span>
                            <Badge variant="teal" size="sm">
                              {Math.round((vol.similarity_score || 0) * 100)}% Match
                            </Badge>
                          </div>
                          <p className="text-xs text-stone-700 mt-1"><strong>Skills:</strong> {vol.skills}</p>
                          <p className="text-[11px] text-stone-500 mt-1">📍 {vol.location} • {vol.availability}</p>
                          {vol.contact && (
                            <p className="text-xs text-teal-800 font-semibold mt-1">📞 Contact: {vol.contact}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Matched Resources */}
                  {matches.matched_resources?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-stone-500">
                        Matched Aid Resources
                      </h4>
                      {matches.matched_resources.map((res, idx) => (
                        <div key={idx} className="rounded-lg border border-stone-200 bg-white p-4 shadow-xs">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-stone-900 text-sm">{res.name}</span>
                            <Badge variant="success" size="sm">
                              {Math.round((res.similarity_score || 0) * 100)}% Match
                            </Badge>
                          </div>
                          <p className="text-xs text-stone-700 mt-1"><strong>Capability:</strong> {res.capability}</p>
                          <p className="text-[11px] text-stone-500 mt-1">📍 {res.location} • Type: {res.resource_type}</p>
                          {res.contact && (
                            <p className="text-xs text-teal-800 font-semibold mt-1">📞 Contact: {res.contact}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Action to Crisis Room */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/60 pt-4 mt-2">
                <p className="text-xs text-stone-600 font-medium">
                  Crisis #{analysisResult?.id} registered in database. Proceed to Crisis Command Room to manage active response.
                </p>
                {onNavigate && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onNavigate('crisis-room', {
                      id: analysisResult?.id,
                      title: analysisResult?.title,
                      location: analysisResult?.location,
                      urgency: analysisResult?.urgency,
                      description: analysisResult?.fullDescription
                    })}
                  >
                    Open Crisis Room →
                  </Button>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

    </div>
  )
}

export default ReportRequest