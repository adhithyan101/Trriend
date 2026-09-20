import React, { useState, useEffect } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import api from '../services/api';

// Comprehensive initial resources covering all required categories
const INITIAL_RESOURCES = [
  {
    id: 'res-1',
    name: 'Inflatable Motorized Rescue Raft #4',
    type: 'Rescue Boats',
    quantity: '4 / 5 Units Available',
    location: 'Kollam Town Center',
    owner: 'Kerala Coastal Volunteer Corps',
    providerType: 'Community',
    availability: 'Available', // Available | Limited | Shortage
    contact: '+91 98765 11111',
    details: 'Heavy-duty 8-person inflatable boat with 15HP outboard engine.'
  },
  {
    id: 'res-2',
    name: 'Advanced Life Support Ambulance (ALS-02)',
    type: 'Ambulances',
    quantity: '1 Unit Available',
    location: 'District Hospital, Kollam',
    owner: 'Community Health Aid Alliance',
    providerType: 'NGO',
    availability: 'Available',
    contact: '+91 98765 22222',
    details: 'Equipped with ventilator, defibrillator, and trained paramedic team.'
  },
  {
    id: 'res-3',
    name: 'Emergency Dry Food Ration Kits (500 Pack)',
    type: 'Food Kits',
    quantity: '450 Kits Ready',
    location: 'Central Supply Depot, Kollam',
    owner: 'National Relief Foundation',
    providerType: 'NGO',
    availability: 'Available',
    contact: '+91 98765 33333',
    details: 'Includes rice, lentils, biscuit packs, and clean drinking water bottles.'
  },
  {
    id: 'res-4',
    name: 'Trauma & First Aid Field Kits (Level 3)',
    type: 'Medical Kits',
    quantity: '15 Kits Available',
    location: 'Town Center Emergency Post',
    owner: 'Red Cross Society Kollam',
    providerType: 'NGO',
    availability: 'Available',
    contact: '+91 98765 44444',
    details: 'Comprehensive trauma dressings, antiseptic solutions, and suture materials.'
  },
  {
    id: 'res-5',
    name: '4x4 High-Clearance Evacuation Truck',
    type: 'Vehicles',
    quantity: '2 Vehicles Available',
    location: 'Alappuzha Depot',
    owner: 'Municipal Disaster Task Force',
    providerType: 'Municipal',
    availability: 'Limited',
    contact: '+91 98765 55555',
    details: 'Capable of wading through 3ft floodwaters for supply transport and evacuation.'
  },
  {
    id: 'res-6',
    name: 'St. Joseph Relief Camp Facility',
    type: 'Shelter Capacity',
    quantity: '320 / 500 Beds Available',
    location: 'Kollam East',
    owner: 'St. Joseph Educational Trust',
    providerType: 'Community',
    availability: 'Available',
    contact: '+91 98765 66666',
    details: 'Equipped with clean drinking water, sanitation facilities, and emergency power generator.'
  },
  {
    id: 'res-7',
    name: 'Fiberglass Rescue Skiff',
    type: 'Rescue Boats',
    quantity: '0 / 2 Available (Deployed)',
    location: 'Kuttanad Waterways',
    owner: 'Alappuzha Fishermen Union',
    providerType: 'Community',
    availability: 'Shortage',
    contact: '+91 98765 77777',
    details: 'Currently deployed in active Kuttanad rescue operations.'
  },
  {
    id: 'res-8',
    name: 'Mobile Medical Care Unit Van',
    type: 'Ambulances',
    quantity: '1 Unit Available (Standby)',
    location: 'Wayanad General Hospital',
    owner: 'State Health Services',
    providerType: 'Municipal',
    availability: 'Limited',
    contact: '+91 98765 88888',
    details: 'Mobile diagnostic clinic for post-flood disease screening.'
  },
  {
    id: 'res-9',
    name: 'Drinking Water Purification Canisters (1000L)',
    type: 'Food Kits',
    quantity: '10 Canisters Available',
    location: 'Kollam Depot',
    owner: 'CleanWater Action NGO',
    providerType: 'NGO',
    availability: 'Available',
    contact: '+91 98765 99999',
    details: 'Solar-powered portable filtration units producing 500L/hr clean water.'
  }
];

export function ResourcesView({ onNavigate }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedType, setSelectedType] = useState('All');
  const [selectedAvailability, setSelectedAvailability] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiData = await api.getAidResources();
      // Combine API fetched resources with initial static catalog for full coverage
      const formattedApiData = (apiData || []).map((item, idx) => ({
        id: `api-res-${item.id || idx}`,
        name: item.name,
        type: item.resource_type ? item.resource_type.charAt(0).toUpperCase() + item.resource_type.slice(1) : 'General',
        quantity: 'Available Unit',
        location: item.location || 'Kollam',
        owner: item.contact || 'Community Provider',
        providerType: 'Community',
        availability: 'Available',
        contact: item.contact || 'N/A',
        details: item.capability || 'Registered aid resource'
      }));

      // Deduplicate by name if needed
      const merged = [...formattedApiData, ...INITIAL_RESOURCES];
      setResources(merged);
    } catch (err) {
      console.warn('Could not fetch from backend, showing fallback resources:', err);
      setResources(INITIAL_RESOURCES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  // Filter logic
  const filteredResources = resources.filter(res => {
    // Type match
    if (selectedType !== 'All' && res.type.toLowerCase() !== selectedType.toLowerCase()) {
      // Handle partial type mapping e.g. "Rescue Boats" vs "Rescue boats"
      if (!res.type.toLowerCase().includes(selectedType.toLowerCase().replace(/s$/, ''))) {
        return false;
      }
    }

    // Availability match
    if (selectedAvailability !== 'All' && res.availability.toLowerCase() !== selectedAvailability.toLowerCase()) {
      return false;
    }

    // Location match
    if (selectedLocation !== 'All' && !res.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
      return false;
    }

    // Provider match
    if (selectedProvider !== 'All' && res.providerType.toLowerCase() !== selectedProvider.toLowerCase()) {
      return false;
    }

    // Search query match
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = res.name.toLowerCase().includes(q);
      const matchLocation = res.location.toLowerCase().includes(q);
      const matchOwner = res.owner.toLowerCase().includes(q);
      const matchDetails = (res.details || '').toLowerCase().includes(q);
      if (!matchName && !matchLocation && !matchOwner && !matchDetails) return false;
    }

    return true;
  });

  // Calculate Quick Stats
  const totalUnits = resources.length;
  const availableCount = resources.filter(r => r.availability === 'Available').length;
  const limitedCount = resources.filter(r => r.availability === 'Limited').length;
  const shortageCount = resources.filter(r => r.availability === 'Shortage').length;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Resource Dashboard"
        description="Monitor emergency equipment, medical supplies, vehicles, and shelter capacity across response networks."
        actions={
          <Button variant="primary" size="sm" onClick={() => onNavigate('offer')}>
            📦 Register / Offer Resource
          </Button>
        }
      />

      {/* QUICK SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Total Resources</span>
          <div className="text-2xl font-extrabold text-stone-900 mt-1">{totalUnits} Types</div>
          <span className="text-[11px] text-teal-700 font-semibold mt-1">✓ Active Directory</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Available</span>
          <div className="text-2xl font-extrabold text-green-700 mt-1">{availableCount} Ready</div>
          <span className="text-[11px] text-green-800 font-semibold mt-1">● Confirmed Ready</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Limited</span>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{limitedCount} Restricted</div>
          <span className="text-[11px] text-amber-800 font-semibold mt-1">● Partial Availability</span>
        </div>

        <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">Shortage / Deployed</span>
          <div className="text-2xl font-extrabold text-red-700 mt-1">{shortageCount} In Use</div>
          <span className="text-[11px] text-red-800 font-semibold mt-1">● Requires Action</span>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <Card padding="p-4" className="space-y-3 bg-white">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Field */}
          <div className="w-full md:w-80">
            <Input
              type="text"
              placeholder="Search resources, location, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Clear Filter */}
          {(selectedType !== 'All' || selectedAvailability !== 'All' || selectedLocation !== 'All' || selectedProvider !== 'All' || searchQuery !== '') && (
            <button
              onClick={() => {
                setSelectedType('All');
                setSelectedAvailability('All');
                setSelectedLocation('All');
                setSelectedProvider('All');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 underline whitespace-nowrap self-end md:self-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Dropdowns / Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-stone-100">
          {/* Type Filter */}
          <div>
            <label className="block font-bold text-stone-600 mb-1">Resource Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-800 bg-white font-medium focus:ring-2 focus:ring-teal-700 focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Rescue Boats">Rescue Boats</option>
              <option value="Ambulances">Ambulances</option>
              <option value="Food Kits">Food Kits</option>
              <option value="Medical Kits">Medical Kits</option>
              <option value="Vehicles">Vehicles</option>
              <option value="Shelter Capacity">Shelter Capacity</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block font-bold text-stone-600 mb-1">Availability</label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-800 bg-white font-medium focus:ring-2 focus:ring-teal-700 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available (Green)</option>
              <option value="Limited">Limited (Amber)</option>
              <option value="Shortage">Shortage / Deployed (Red)</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block font-bold text-stone-600 mb-1">Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-800 bg-white font-medium focus:ring-2 focus:ring-teal-700 focus:outline-none"
            >
              <option value="All">All Locations</option>
              <option value="Kollam">Kollam</option>
              <option value="Alappuzha">Alappuzha</option>
              <option value="Wayanad">Wayanad</option>
            </select>
          </div>

          {/* Provider Filter */}
          <div>
            <label className="block font-bold text-stone-600 mb-1">Provider Type</label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full rounded-lg border border-stone-300 p-2 text-stone-800 bg-white font-medium focus:ring-2 focus:ring-teal-700 focus:outline-none"
            >
              <option value="All">All Providers</option>
              <option value="Community">Community</option>
              <option value="NGO">NGO</option>
              <option value="Municipal">Municipal</option>
            </select>
          </div>
        </div>
      </Card>

      {/* CONTENT LISTING */}
      {error && <ErrorState description={error} onRetry={fetchResources} />}

      {loading ? (
        <LoadingState title="Loading Resources" description="Fetching resource dashboard inventory..." />
      ) : filteredResources.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No Matching Resources Found"
          description="No aid resources match your active filter criteria. Try adjusting filters or search query."
          actionText="Clear Filters"
          onAction={() => {
            setSelectedType('All');
            setSelectedAvailability('All');
            setSelectedLocation('All');
            setSelectedProvider('All');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map((res) => {
            // Determine status styling strictly based on Phase 10 design rules:
            // Green = Available / Confirmed
            // Amber = Limited
            // Red = Shortage / Immediate Action required
            const isAvailable = res.availability === 'Available';
            const isLimited = res.availability === 'Limited';
            const isShortage = res.availability === 'Shortage';

            return (
              <Card key={res.id} padding="p-5" className="flex flex-col justify-between hover:shadow-md transition">
                <div>
                  {/* Card Header & Availability Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                        {res.type}
                      </span>
                      <h3 className="font-bold text-stone-900 text-base leading-snug">
                        {res.name}
                      </h3>
                    </div>

                    {isAvailable && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                        ● Available
                      </span>
                    )}
                    {isLimited && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                        ● Limited
                      </span>
                    )}
                    {isShortage && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
                        ● Shortage
                      </span>
                    )}
                  </div>

                  {/* Resource Metadata Details */}
                  <div className="space-y-2 text-xs text-stone-700 mb-4 bg-stone-50 p-3.5 rounded-xl border border-stone-100">
                    <div className="flex justify-between items-center">
                      <span className="text-stone-500 font-semibold">Available Quantity:</span>
                      <span className="font-extrabold text-stone-900">{res.quantity}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-stone-500 font-semibold">Location:</span>
                      <span className="font-bold text-stone-800">📍 {res.location}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-stone-500 font-semibold">Owner / Provider:</span>
                      <span className="font-medium text-teal-800">{res.owner}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-500 leading-relaxed">
                    {res.details}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-medium">📞 {res.contact}</span>
                  <button
                    onClick={() => onNavigate('network')}
                    className="font-bold text-teal-700 hover:text-teal-900 transition flex items-center gap-1"
                  >
                    Request Item ➔
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ResourcesView;
