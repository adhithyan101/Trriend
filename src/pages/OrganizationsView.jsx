import React, { useState } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

// Comprehensive dataset of partner organizations fulfilling Phase 10 requirements
const ORGANIZATIONS = [
  {
    id: 'org-1',
    name: 'National Disaster Relief Network (NDRN)',
    icon: '🏛️',
    description: 'Primary non-governmental emergency response coordination agency operating across coastal and flood-prone districts.',
    capabilities: ['Water Rescue', 'High-Capacity Evacuation', 'Mobile Command', 'Crisis Logistics'],
    operatingArea: 'Kollam, Alappuzha, Pathanamthitta',
    resources: ['12 Rescue Boats', '5 Mobile Medical Vans', '500 Food Kits', '4 Emergency Power Generators'],
    availability: 'Available', // Available (Green) | Fully Deployed (Amber) | Shortage (Red)
    contact: '📞 +91 471 2345678 • 📧 dispatch@ndrn.org',
    pastResponses: [
      { year: '2026', title: 'Kollam Flash Floods Response', impact: '320 rescued' },
      { year: '2025', title: 'Wayanad Landslide Emergency Support', impact: '1,200 food packs distributed' },
      { year: '2024', title: 'Kuttanad Inundation Operation', impact: '45 medical evacuations' }
    ]
  },
  {
    id: 'org-2',
    name: 'Community Health Aid Alliance (CHAA)',
    icon: '🏥',
    description: 'Specialized medical emergency partner deploying mobile clinics, field doctors, and emergency trauma medicine.',
    capabilities: ['Medical Triage', 'Mobile ICUs', 'Epidemic Screening', 'Paramedic Dispatch'],
    operatingArea: 'Kollam, Ernakulam, Wayanad',
    resources: ['6 ALS Ambulances', '25 Field Doctors', '150 Trauma Kits', '2 Mobile Pharmacies'],
    availability: 'Available',
    contact: '📞 +91 484 9876543 • 📧 emergency@chaa.org',
    pastResponses: [
      { year: '2025', title: 'Coastal Dengue & Waterborne Outbreak', impact: '850 patients treated' },
      { year: '2024', title: 'Monsoon Flood Medical Camps', impact: '14 mobile camps' }
    ]
  },
  {
    id: 'org-3',
    name: 'Kerala Coastal Fishermen Cooperative',
    icon: '🚤',
    description: 'Rapid-response maritime rescue coalition equipped with ocean-going motorized trawlers and skilled water rescue navigators.',
    capabilities: ['Rough-Water Navigation', 'Deep Water Rescue', 'Mass Evacuation', 'Supply Transport'],
    operatingArea: 'Kollam Coast, Alappuzha Backwaters, Kochi Harbor',
    resources: ['18 Motorized Boats', '40 Skilled Fishermen Rescuers', '200 Life Vests'],
    availability: 'Fully Deployed', // Amber badge for limited availability / active deployment
    contact: '📞 +91 94470 12345 • 📧 rescue@coastalcoop.org',
    pastResponses: [
      { year: '2026', title: 'Kollam Town Center Evacuation', impact: '140 residents evacuated' },
      { year: '2023', title: 'Cyclone Ockhi Rescue Operations', impact: '68 sea rescues' }
    ]
  },
  {
    id: 'org-4',
    name: 'Red Cross Kerala State Branch',
    icon: '🛡️',
    description: 'International humanitarian relief organization providing emergency shelter, clean water systems, and family reunification.',
    capabilities: ['Emergency Shelter Management', 'Clean Water Filtration', 'First Aid Training', 'Psychosocial Support'],
    operatingArea: 'Statewide (All 14 Districts)',
    resources: ['3 Relief Centers (1,500 Capacity)', '10 Water Purification Units', '2,000 Hygiene Kits'],
    availability: 'Available',
    contact: '📞 +91 471 2334455 • 📧 relief@redcrosskerala.org',
    pastResponses: [
      { year: '2025', title: 'Wayanad Hillside Shelter Setup', impact: '600 displaced families sheltered' },
      { year: '2024', title: 'Statewide Flood Relief', impact: '5,000 kit packages' }
    ]
  }
];

export function OrganizationsView({ onNavigate }) {
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrgs = ORGANIZATIONS.filter(org => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.description.toLowerCase().includes(q) ||
      org.operatingArea.toLowerCase().includes(q) ||
      org.capabilities.some(c => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <PageHeading
        title="Partner Organizations"
        description="Non-governmental organizations, relief agencies, and municipal response teams connected to CO-RESOLVE."
        actions={
          <Button variant="primary" size="sm" onClick={() => onNavigate('offer')}>
            🏛️ Register Organization
          </Button>
        }
      />

      {/* Search Input */}
      <div className="max-w-md">
        <Input
          type="text"
          placeholder="Search organizations by name, capability, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ORGANIZATION PROFILES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrgs.map((org) => {
          const isAvailable = org.availability === 'Available';
          const isDeployed = org.availability === 'Fully Deployed';
          const isShortage = org.availability === 'Shortage';

          return (
            <Card key={org.id} padding="p-6" className="flex flex-col justify-between hover:shadow-md transition">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center text-2xl font-bold shadow-xs">
                      {org.icon}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-stone-900 text-base leading-tight">
                        {org.name}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">📍 {org.operatingArea}</p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  {isAvailable && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 whitespace-nowrap">
                      ● Available
                    </span>
                  )}
                  {isDeployed && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                      ● Fully Deployed
                    </span>
                  )}
                  {isShortage && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 whitespace-nowrap">
                      ● Shortage
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600 mb-4 leading-relaxed">
                  {org.description}
                </p>

                {/* Capabilities & Pledged Resources */}
                <div className="space-y-3 bg-stone-50 p-4 rounded-xl border border-stone-100 text-xs mb-4">
                  <div>
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                      Core Capabilities:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {org.capabilities.map((cap, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-white border border-stone-200 text-stone-800 font-medium rounded-md">
                          ⚡ {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-200/80">
                    <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                      Pledged Resources:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {org.resources.map((res, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-800 font-semibold rounded-md">
                          📦 {res}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Past Responses Log */}
                <div className="text-xs text-stone-700">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                    Recent Past Responses:
                  </span>
                  <div className="space-y-1.5">
                    {org.pastResponses.map((res, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span className="text-stone-800 font-medium">📜 {res.title} ({res.year})</span>
                        <span className="text-teal-700 font-semibold">{res.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-medium">{org.contact}</span>
                <button
                  onClick={() => setSelectedOrg(org)}
                  className="font-bold text-teal-700 hover:text-teal-900 transition flex items-center gap-1"
                >
                  View Full Profile ➔
                </button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* DETAILED ORGANIZATION PROFILE MODAL / DRAWER */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setSelectedOrg(null)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 text-lg font-bold"
            >
              ✕
            </button>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-3xl font-bold">
                {selectedOrg.icon}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-stone-900">{selectedOrg.name}</h2>
                <p className="text-xs text-stone-500 font-medium">📍 Operating Area: {selectedOrg.operatingArea}</p>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100">
              {selectedOrg.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-2">
                <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Capabilities</h4>
                <ul className="space-y-1 text-stone-700">
                  {selectedOrg.capabilities.map((c, i) => (
                    <li key={i}>✓ {c}</li>
                  ))}
                </ul>
              </div>

              <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-2">
                <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Pledged Resources</h4>
                <ul className="space-y-1 text-teal-800 font-medium">
                  {selectedOrg.resources.map((r, i) => (
                    <li key={i}>📦 {r}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">Past Operations</h4>
              <div className="space-y-2">
                {selectedOrg.pastResponses.map((res, i) => (
                  <div key={i} className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                    <div>
                      <p className="font-bold text-stone-900">{res.title}</p>
                      <p className="text-[11px] text-stone-500">{res.year}</p>
                    </div>
                    <Badge variant="teal" size="sm">{res.impact}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-xs font-medium text-stone-600">{selectedOrg.contact}</span>
              <Button variant="primary" size="sm" onClick={() => onNavigate('network')}>
                Connect via Response Network
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationsView;
