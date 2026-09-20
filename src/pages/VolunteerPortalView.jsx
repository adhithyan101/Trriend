import React, { useState } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import api from '../services/api';
import GoogleLocationPicker from '../components/location/GoogleLocationPicker';

export function VolunteerPortalView({ onNavigate }) {
  // Volunteer Profile State
  const [profile, setProfile] = useState({
    name: 'Arjun Nair',
    status: 'Available', // Available | Busy | Unavailable
    capabilities: ['Water Rescue', 'First Aid', 'Flood Response'],
    equipment: ['Rescue Boat', 'First Aid Kit', 'Life Vests (x4)'],
    experience: '5 years emergency first responder, 3 flood rescue deployments',
    certifications: 'NDRF Certified Water Rescuer, Red Cross First Aid Level 2',
    location: 'Kollam, Kerala',
    latitude: null,
    longitude: null,
    contact: '+91 98765 43210',
    pastResponses: [
      { id: 1, title: 'Wayanad Landslide Support', date: 'Aug 2024', role: 'First Aid Support', status: 'Completed' },
      { id: 2, title: 'Kuttanad Evacuation', date: 'Jul 2023', role: 'Boat Rescue', status: 'Completed' },
    ]
  });

  // Assignment Workflow State: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  const [assignmentState, setAssignmentState] = useState('PENDING');

  // Interactive editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Form input bindings
  const [formCapabilities, setFormCapabilities] = useState(profile.capabilities.join(', '));
  const [formEquipment, setFormEquipment] = useState(profile.equipment.join(', '));
  const [formExperience, setFormExperience] = useState(profile.experience);
  const [formCertifications, setFormCertifications] = useState(profile.certifications);
  const [formLocation, setFormLocation] = useState(profile.location);
  const [formLatitude, setFormLatitude] = useState(profile.latitude);
  const [formLongitude, setFormLongitude] = useState(profile.longitude);
  const [formContact, setFormContact] = useState(profile.contact);

  // Handle status quick toggle
  const handleStatusChange = async (newStatus) => {
    setProfile(prev => ({ ...prev, status: newStatus }));
    try {
      await api.createVolunteer({
        name: profile.name,
        skills: profile.capabilities.join(', '),
        location: profile.location,
        latitude: profile.latitude,
        longitude: profile.longitude,
        availability: newStatus,
        contact: profile.contact
      });
    } catch (err) {
      console.warn('Backend sync failed, updated local status:', err);
    }
  };

  // Handle profile save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    const updatedCapabilities = formCapabilities.split(',').map(s => s.trim()).filter(Boolean);
    const updatedEquipment = formEquipment.split(',').map(e => e.trim()).filter(Boolean);

    const updatedProfile = {
      ...profile,
      capabilities: updatedCapabilities.length ? updatedCapabilities : profile.capabilities,
      equipment: updatedEquipment.length ? updatedEquipment : profile.equipment,
      experience: formExperience,
      certifications: formCertifications,
      location: formLocation,
      latitude: formLatitude,
      longitude: formLongitude,
      contact: formContact
    };

    try {
      await api.createVolunteer({
        name: updatedProfile.name,
        skills: updatedProfile.capabilities.join(', '),
        location: updatedProfile.location,
        latitude: updatedProfile.latitude,
        longitude: updatedProfile.longitude,
        availability: updatedProfile.status,
        contact: updatedProfile.contact
      });
      setProfile(updatedProfile);
      setSaveSuccess(true);
      setIsEditingProfile(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setError(err.message || 'Failed to sync profile with server');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
            Volunteer Portal
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-stone-900 tracking-tight">
            Welcome, {profile.name}
          </h1>
          <p className="text-sm text-stone-500 mt-1 font-medium">
            Direct responder view. Monitor assignments and manage your capability profile.
          </p>
        </div>

        {/* Status Selector */}
        <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
            Current Status:
          </span>
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-stone-200">
            <button
              onClick={() => handleStatusChange('Available')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                profile.status === 'Available'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-teal-300"></span>
              AVAILABLE
            </button>
            <button
              onClick={() => handleStatusChange('Busy')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                profile.status === 'Busy'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-300"></span>
              BUSY
            </button>
            <button
              onClick={() => handleStatusChange('Unavailable')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                profile.status === 'Unavailable'
                  ? 'bg-stone-700 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-stone-400"></span>
              UNAVAILABLE
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-xl text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>Capability profile successfully updated and synchronized with backend registry.</span>
          </div>
          <button onClick={() => setSaveSuccess(false)} className="text-teal-600 hover:text-teal-900">✕</button>
        </div>
      )}

      {/* Grid Layout: Left Column (Dashboard Summary & Profile), Right Column (Assignments Workflow) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Overview & Capabilities */}
        <div className="lg:col-span-5 space-y-6">
          {/* Capabilities Card */}
          <Card title="Your Capabilities" icon="⚡" padding="p-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.capabilities.map((cap, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-lg"
                >
                  ✓ {cap}
                </span>
              ))}
            </div>
            <p className="text-xs text-stone-500">
              Verified skills used by AI Command Center to match incoming emergency assignments.
            </p>
          </Card>

          {/* Equipment Card */}
          <Card title="Pledged Equipment" icon="🚤" padding="p-6">
            <div className="space-y-2 mb-4">
              {profile.equipment.map((eq, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-stone-800 bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                  <span className="text-teal-700">📦</span>
                  <span>{eq}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-500">
              Equipment ready for immediate dispatch upon assignment acceptance.
            </p>
          </Card>

          {/* Capability Profile Detail */}
          <Card
            title="Capability Profile"
            icon="📋"
            padding="p-6"
            action={
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-xs font-bold text-teal-700 hover:text-teal-900 underline"
              >
                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
              </button>
            }
          >
            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Capabilities (comma separated)</label>
                  <Input
                    value={formCapabilities}
                    onChange={(e) => setFormCapabilities(e.target.value)}
                    placeholder="Water Rescue, First Aid, Flood Response"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Equipment (comma separated)</label>
                  <Input
                    value={formEquipment}
                    onChange={(e) => setFormEquipment(e.target.value)}
                    placeholder="Rescue Boat, First Aid Kit"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Experience</label>
                  <textarea
                    rows={2}
                    value={formExperience}
                    onChange={(e) => setFormExperience(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 p-2.5 text-xs text-stone-900 focus:ring-2 focus:ring-teal-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Certifications</label>
                  <Input
                    value={formCertifications}
                    onChange={(e) => setFormCertifications(e.target.value)}
                    placeholder="NDRF Certified, Red Cross First Aid"
                  />
                </div>

                <div>
                  <Input
                    label="Contact Phone / Email"
                    value={formContact}
                    onChange={(e) => setFormContact(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>

                {/* Shared Google Location Picker */}
                <GoogleLocationPicker
                  location={formLocation}
                  latitude={formLatitude}
                  longitude={formLongitude}
                  onChange={({ location: loc, latitude: lat, longitude: lng }) => {
                    setFormLocation(loc)
                    setFormLatitude(lat)
                    setFormLongitude(lng)
                  }}
                  label="Location"
                  required={true}
                />

                {error && <p className="text-red-600 font-semibold">{error}</p>}

                <div className="pt-2 flex items-center gap-2">
                  <Button type="submit" variant="primary" size="sm" loading={saving}>
                    Save Profile
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingProfile(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-0.5">Experience:</span>
                  <p className="text-stone-800 font-medium">{profile.experience}</p>
                </div>

                <div>
                  <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-0.5">Certifications:</span>
                  <p className="text-stone-800 font-medium">{profile.certifications}</p>
                </div>

                <div>
                  <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-0.5">Location & Contact:</span>
                  <p className="text-stone-800 font-medium">📍 {profile.location} • 📞 {profile.contact}</p>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-2">Past Responses:</span>
                  <div className="space-y-2">
                    {profile.pastResponses.map((res) => (
                      <div key={res.id} className="flex items-center justify-between bg-stone-50 p-2 rounded-lg border border-stone-100">
                        <div>
                          <p className="font-bold text-stone-900">{res.title}</p>
                          <p className="text-[11px] text-stone-500">{res.role} • {res.date}</p>
                        </div>
                        <Badge variant="green" size="sm">COMPLETED</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN: Incoming Assistance Request & Interactive Status Workflow */}
        <div className="lg:col-span-7 space-y-6">
          <Card title="Incoming Response Assignment" icon="🚨" padding="p-6">
            {assignmentState === 'DECLINED' || assignmentState === 'REJECTED' ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 mx-auto flex items-center justify-center text-xl">
                  ↩️
                </div>
                <h3 className="font-bold text-stone-800 text-base">Assistance Request Declined</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto font-medium">
                  You declined this assistance request. The CO-RESOLVE Command Center has been notified to re-route the request to another available responder.
                </p>
                <Button variant="outline" size="sm" onClick={() => setAssignmentState('PENDING')}>
                  Reset Assistance Request Demo
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 🚨 NEW ASSISTANCE REQUEST CARD */}
                <div className="bg-stone-50 border-2 border-stone-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚨</span>
                      <span className="text-xs font-black uppercase tracking-wider text-red-600">
                        NEW ASSISTANCE REQUEST
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-red-100 text-red-800 border border-red-200 font-extrabold text-[11px] rounded-full uppercase tracking-wider animate-pulse">
                      URGENT
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-stone-900 tracking-tight">
                      Flood Rescue — Kollam
                    </h2>
                    <p className="text-xs text-stone-600 mt-1">
                      Rapid water level rise near Kollam lowlands requiring immediate swift-water evacuation support.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                      <span className="text-stone-400 font-bold block text-[10px] uppercase">Required Capability:</span>
                      <span className="font-extrabold text-teal-800 text-sm">Water Rescue</span>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-stone-200">
                      <span className="text-stone-400 font-bold block text-[10px] uppercase">Location & Distance:</span>
                      <span className="font-bold text-stone-900 text-sm">📍 Kollam Town Center</span>
                      <span className="ml-2 px-2 py-0.5 bg-teal-100 border border-teal-200 text-teal-900 text-[10px] font-extrabold rounded-full">
                        2.4 km away
                      </span>
                    </div>
                  </div>

                  {/* Why Selected Box */}
                  <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-3 text-xs">
                    <span className="font-extrabold text-teal-900 block mb-1">Why you were selected:</span>
                    <ul className="space-y-0.5 text-teal-800 font-medium">
                      <li className="flex items-center gap-1.5">
                        <span className="text-teal-600 font-bold">✓</span> Water rescue experience & boat operator certification
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-teal-600 font-bold">✓</span> Currently available & nearby Kollam sector
                      </li>
                      <li className="flex items-center gap-1.5">
                        <span className="text-teal-600 font-bold">✓</span> Relevant past deployment experience
                      </li>
                    </ul>
                  </div>
                </div>

                {/* WORKFLOW STATE STEP INDICATOR */}
                <div className="bg-white border border-stone-200 rounded-xl p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-3">
                    Response Workflow Pipeline
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
                    <div className={`p-2 rounded-lg border font-bold ${
                      assignmentState === 'PENDING'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}>
                      1. PENDING
                    </div>

                    <div className={`p-2 rounded-lg border font-bold ${
                      assignmentState === 'ACCEPTED' || assignmentState === 'ASSIGNED'
                        ? 'bg-teal-50 border-teal-300 text-teal-900 ring-2 ring-teal-600'
                        : ['EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS', 'COMPLETED'].includes(assignmentState)
                        ? 'bg-teal-50 border-teal-200 text-teal-800'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}>
                      2. ACCEPTED
                    </div>

                    <div className={`p-2 rounded-lg border font-bold ${
                      assignmentState === 'EN_ROUTE'
                        ? 'bg-sky-50 border-sky-300 text-sky-900 ring-2 ring-sky-500'
                        : ['ON_SCENE', 'IN_PROGRESS', 'COMPLETED'].includes(assignmentState)
                        ? 'bg-sky-50 border-sky-200 text-sky-800'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}>
                      3. EN ROUTE
                    </div>

                    <div className={`p-2 rounded-lg border font-bold ${
                      assignmentState === 'ON_SCENE' || assignmentState === 'IN_PROGRESS'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-500'
                        : assignmentState === 'COMPLETED'
                        ? 'bg-stone-50 border-stone-200 text-stone-700'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}>
                      4. ON SCENE
                    </div>

                    <div className={`p-2 rounded-lg border font-bold ${
                      assignmentState === 'COMPLETED'
                        ? 'bg-green-50 border-green-300 text-green-900 ring-2 ring-green-600'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}>
                      5. FULFILLED
                    </div>
                  </div>
                </div>

                {/* WORKFLOW ACTION CONTROLS */}
                <div className="pt-1">
                  {/* Competitive Conflict Alert Banner */}
                  {(assignmentState === 'ALREADY_ACCEPTED' || error) && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 flex items-start gap-2">
                      <span className="text-base">🔔</span>
                      <div>
                        <p className="font-extrabold text-sm">Request Update</p>
                        <p>{error || 'This crisis request was already accepted by another volunteer.'}</p>
                      </div>
                    </div>
                  )}

                  {/* Step 1: PENDING -> ACCEPT / DECLINE */}
                  {assignmentState === 'PENDING' && (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <button
                        disabled={saving}
                        onClick={async () => {
                          setSaving(true);
                          setError(null);
                          try {
                            const res = await api.updateAssignmentStatus({ id: 1, status: 'accept' });
                            if (res && (res.status === 'ALREADY_ACCEPTED' || res.error)) {
                              setAssignmentState('ALREADY_ACCEPTED');
                              setError(res.error || 'This request has already been accepted by another volunteer.');
                            } else {
                              setAssignmentState('ACCEPTED');
                            }
                          } catch (e) {
                            setAssignmentState('ALREADY_ACCEPTED');
                            setError('This request has already been accepted by another volunteer.');
                          } finally {
                            setSaving(false);
                          }
                        }}
                        className="w-full sm:w-1/2 py-3.5 px-6 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{saving ? '⏳' : '✓'}</span> {saving ? 'Accepting...' : 'ACCEPT REQUEST'}
                      </button>
                      <button
                        disabled={saving}
                        onClick={async () => {
                          setAssignmentState('DECLINED');
                          try { await api.updateAssignmentStatus({ id: 1, status: 'decline' }); } catch (e) { console.warn(e); }
                        }}
                        className="w-full sm:w-1/2 py-3.5 px-6 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-extrabold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>✕</span> DECLINE
                      </button>
                    </div>
                  )}

                  {/* Step 1-B: ALREADY ACCEPTED BY ANOTHER VOLUNTEER */}
                  {assignmentState === 'ALREADY_ACCEPTED' && (
                    <div className="space-y-3">
                      <button
                        disabled={true}
                        className="w-full py-3.5 px-6 bg-stone-200 border border-stone-300 text-stone-500 font-extrabold text-sm rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <span>🔒</span> Request No Longer Available
                      </button>
                      <p className="text-center text-xs font-bold text-amber-800">
                        This request has already been accepted by another volunteer.
                      </p>
                    </div>
                  )}

                  {/* Step 2: ACCEPTED / ASSIGNED -> EN ROUTE */}
                  {(assignmentState === 'ACCEPTED' || assignmentState === 'ASSIGNED') && (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <span className="text-base">🤝</span>
                        <span>Request Accepted! Assignment is now active. Please signal when you depart.</span>
                      </div>
                      <button
                        onClick={async () => {
                          setAssignmentState('EN_ROUTE');
                          try { await api.updateAssignmentStatus({ id: 1, status: 'en-route' }); } catch (e) { console.warn(e); }
                        }}
                        className="w-full py-3.5 px-6 bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>🚗</span> Mark EN ROUTE to Scene
                      </button>
                    </div>
                  )}

                  {/* Step 3: EN_ROUTE -> ON SCENE */}
                  {assignmentState === 'EN_ROUTE' && (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping"></span>
                        <span>Status: En Route to Kollam Flood Rescue Sector.</span>
                      </div>
                      <button
                        onClick={async () => {
                          setAssignmentState('ON_SCENE');
                          try { await api.updateAssignmentStatus({ id: 1, status: 'on-scene' }); } catch (e) { console.warn(e); }
                        }}
                        className="w-full py-3.5 px-6 bg-sky-700 hover:bg-sky-800 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>📍</span> Mark ON SCENE (Arrived)
                      </button>
                    </div>
                  )}

                  {/* Step 4: ON SCENE -> IN PROGRESS -> MARK COMPLETED */}
                  {(assignmentState === 'ON_SCENE' || assignmentState === 'IN_PROGRESS') && (
                    <div className="space-y-3">
                      <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>Rescuers on scene performing active water rescue operation.</span>
                      </div>
                      <button
                        onClick={async () => {
                          setAssignmentState('COMPLETED');
                          try { await api.updateAssignmentStatus({ id: 1, status: 'complete' }); } catch (e) { console.warn(e); }
                        }}
                        className="w-full py-3.5 px-6 bg-green-600 hover:bg-green-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>✓</span> Mark Requirement COMPLETED
                      </button>
                    </div>
                  )}

                  {/* Step 5: COMPLETED */}
                  {assignmentState === 'COMPLETED' && (
                    <div className="p-6 bg-green-50 border border-green-200 rounded-xl text-center space-y-3">
                      <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-xs">
                        ✓
                      </div>
                      <h3 className="font-black text-green-950 text-lg">Requirement Fulfilled</h3>
                      <p className="text-xs text-green-800 max-w-md mx-auto font-medium">
                        Thank you for your response! Water Rescue capability requirement recorded as FULFILLED in the CO-RESOLVE Response Workspace.
                      </p>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAssignmentState('PENDING')}
                        >
                          Reset Assistance Request Demo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Quick Guidance Box */}
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-4 text-xs text-stone-600 space-y-1">
            <p className="font-bold text-stone-800">📌 Volunteer Protocol:</p>
            <p>1. Always verify safety conditions before starting water response operations.</p>
            <p>2. Keep status set to <strong className="text-stone-800">BUSY</strong> while actively deployed.</p>
            <p>3. Contact Command Center immediately if additional medical or boat support is needed.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolunteerPortalView;
