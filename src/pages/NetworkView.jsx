import React, { useState } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

// Hierarchical relationship graph dataset matching Phase 13 exact structure
const CRISIS_NETWORK_DATA = {
  id: 'crisis-root',
  title: 'FLOOD RESCUE — KOLLAM',
  urgency: 'CRITICAL',
  location: 'Town Center, Kollam',
  peopleAffected: 30,
  description: 'Severe flash flooding stranded 30 residents. High water rescue & medical triage required.',
  capabilities: [
    {
      id: 'cap-water',
      name: 'Water Rescue',
      icon: '🌊',
      status: '2 Required • 2 Assigned',
      people: [
        {
          id: 'person-arjun',
          name: 'Volunteer A (Arjun Nair)',
          role: 'Water Rescuer',
          skills: 'Water Rescue, First Aid, Flood Response',
          location: 'Kollam Town Center',
          contact: '+91 98765 43210',
          availability: 'Available',
          organization: {
            id: 'org-coastal',
            name: 'Kerala Coastal Volunteer Corps',
            type: 'NGO',
            operatingArea: 'Kollam Coast',
            contact: '+91 471 2345678'
          },
          resources: [
            {
              id: 'res-boat-1',
              name: 'Inflatable Rescue Boat #4',
              type: 'Rescue Boat',
              quantity: '1 Unit (Active)',
              location: 'Kollam Town Center',
              owner: 'Arjun Nair / Coastal Corps'
            }
          ]
        },
        {
          id: 'person-rahul',
          name: 'Volunteer B (Rahul Nair)',
          role: 'Boat Pilot',
          skills: 'Motorboat Pilot, Search & Rescue',
          location: 'Kollam',
          contact: '+91 98765 43212',
          availability: 'Available',
          organization: {
            id: 'org-fishermen',
            name: 'Kollam Fishermen Rescue Guild',
            type: 'Community',
            operatingArea: 'Kollam Waterways',
            contact: '+91 94470 12345'
          },
          resources: [
            {
              id: 'res-boat-2',
              name: 'Motorized Fiberglass Skiff',
              type: 'Rescue Boat',
              quantity: '1 Unit (Standby)',
              location: 'Kollam Harbor',
              owner: 'Rahul Nair'
            }
          ]
        }
      ]
    },
    {
      id: 'cap-medical',
      name: 'Medical Triage',
      icon: '🏥',
      status: '1 Required • 1 Assigned',
      people: [
        {
          id: 'person-priya',
          name: 'Doctor C (Dr. Priya Sharma)',
          role: 'Field Paramedic Lead',
          skills: 'Emergency Medicine, Triage, CPR',
          location: 'Kollam East Hospital',
          contact: '+91 98765 43211',
          availability: 'Available',
          organization: {
            id: 'org-chaa',
            name: 'Community Health Aid Alliance (CHAA)',
            type: 'Medical NGO',
            operatingArea: 'Kollam & Kochi',
            contact: '0484-9876543'
          },
          resources: [
            {
              id: 'res-amb-1',
              name: 'ALS Paramedic Ambulance (ALS-02)',
              type: 'Ambulance',
              quantity: '1 Unit (Deployed)',
              location: 'Kollam Field Post',
              owner: 'CHAA Emergency Unit'
            },
            {
              id: 'res-med-kit',
              name: 'Trauma & Suture Field Kit',
              type: 'Medical Kits',
              quantity: '5 Kits Ready',
              location: 'Kollam Field Post',
              owner: 'Dr. Priya Sharma'
            }
          ]
        }
      ]
    },
    {
      id: 'cap-food',
      name: 'Food & Relief Kits',
      icon: '📦',
      status: '30 Required • 30 Dispatched',
      people: [
        {
          id: 'person-ngof',
          name: 'Relief Lead (NGO F - Relief Corps)',
          role: 'Supply Coordinator',
          skills: 'Logistics, Ration Packing, Distribution',
          location: 'Central Depot, Kollam',
          contact: '+91 98765 33333',
          availability: 'Available',
          organization: {
            id: 'org-ngof',
            name: 'NGO F Emergency Relief Corps',
            type: 'Relief NGO',
            operatingArea: 'Kollam & Alappuzha',
            contact: '+91 471 999888'
          },
          resources: [
            {
              id: 'res-food-1',
              name: 'Dry Ration Kits (30 Packs)',
              type: 'Food Kits',
              quantity: '30 Packs Dispatched',
              location: 'Town Center Relief Post',
              owner: 'NGO F Emergency Relief Corps'
            }
          ]
        }
      ]
    }
  ]
};

export function NetworkView({ onNavigate }) {
  // Navigation tab view inside NetworkView: 'Visual Network' | 'Directory Search'
  const [viewMode, setViewMode] = useState('Visual Network');

  // Interactive selected node for modal display
  const [selectedNode, setSelectedNode] = useState(null);

  // Selected Capability filter for visual highlighting
  const [highlightCapability, setHighlightCapability] = useState(null);

  // Directory Search state
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Heading & View Switcher */}
      <PageHeading
        title="Crisis Network"
        description="Semantic capability graph illustrating real-time cooperative relationships during active crisis response."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'Visual Network' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('Visual Network')}
            >
              📊 Visual Relationship Graph
            </Button>
            <Button
              variant={viewMode === 'Directory Search' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('Directory Search')}
            >
              🔍 Directory Search
            </Button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* VIEW 1: VISUAL RELATIONSHIP GRAPH (PURE REACT + TAILWIND CSS)            */}
      {/* Hierarchy: CRISIS ➔ REQUIRED CAPABILITIES ➔ PEOPLE ➔ ORGANIZATIONS ➔ RESOURCES */}
      {/* ========================================================================= */}
      {viewMode === 'Visual Network' && (
        <div className="space-y-8">
          {/* Instructions Banner */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-xs text-teal-900 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <span>
                <strong>Interactive Graph:</strong> Click any <strong className="text-stone-900 font-bold">Person</strong>, <strong className="text-stone-900 font-bold">Organization</strong>, or <strong className="text-stone-900 font-bold">Resource node</strong> to view full operational profile details.
              </span>
            </div>
            {highlightCapability && (
              <button
                onClick={() => setHighlightCapability(null)}
                className="text-teal-700 hover:text-teal-950 font-bold underline whitespace-nowrap"
              >
                Clear Subtree Filter
              </button>
            )}
          </div>

          {/* MAIN GRAPH CONTAINER */}
          <div className="bg-white border border-stone-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-10">
            
            {/* LEVEL 1: ROOT CRISIS NODE (Urgency colors used ONLY here!) */}
            <div className="flex flex-col items-center text-center relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 border border-red-200 text-red-700 font-extrabold text-[11px] rounded-full uppercase tracking-wider mb-2 animate-pulse">
                <span>🚨</span>
                <span>{CRISIS_NETWORK_DATA.urgency} CRISIS ROOT</span>
              </div>

              {/* Crisis Card Node */}
              <div className="bg-stone-50 border-2 border-red-500 rounded-2xl p-5 max-w-md w-full shadow-sm text-center relative z-10">
                <h2 className="text-xl font-black text-stone-900 tracking-tight">
                  {CRISIS_NETWORK_DATA.title}
                </h2>
                <p className="text-xs text-stone-600 mt-1 font-medium">
                  📍 {CRISIS_NETWORK_DATA.location} • 👥 {CRISIS_NETWORK_DATA.peopleAffected} Stranded Residents
                </p>
                <p className="text-[11px] text-stone-500 mt-2 bg-white p-2 rounded-lg border border-stone-200 italic">
                  "{CRISIS_NETWORK_DATA.description}"
                </p>
              </div>

              {/* Vertical Teal Connector Line down to Capabilities */}
              <div className="w-0.5 h-10 bg-teal-400 my-0"></div>
              <div className="w-3 h-3 rounded-full bg-teal-600 ring-4 ring-teal-100"></div>
            </div>

            {/* LEVEL 2: REQUIRED CAPABILITY NODES */}
            <div className="space-y-2">
              <div className="text-center text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                REQUIRED CAPABILITIES
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 relative">
                {CRISIS_NETWORK_DATA.capabilities.map((cap) => {
                  const isFilteredOut = highlightCapability && highlightCapability !== cap.id;

                  return (
                    <div
                      key={cap.id}
                      className={`flex flex-col items-center transition-all duration-200 ${
                        isFilteredOut ? 'opacity-30 blur-[0.5px]' : 'opacity-100'
                      }`}
                    >
                      {/* Capability Node Box */}
                      <button
                        onClick={() => setHighlightCapability(highlightCapability === cap.id ? null : cap.id)}
                        className={`w-full bg-teal-50 border-2 border-teal-300 hover:border-teal-600 rounded-xl p-4 text-center transition shadow-xs group ${
                          highlightCapability === cap.id ? 'ring-2 ring-teal-600 bg-teal-100' : ''
                        }`}
                      >
                        <div className="text-2xl mb-1">{cap.icon}</div>
                        <h3 className="font-extrabold text-teal-900 text-sm group-hover:text-teal-950">
                          {cap.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-teal-700 block mt-0.5">
                          {cap.status}
                        </span>
                      </button>

                      {/* Teal Connector Line down to People Nodes */}
                      <div className="w-0.5 h-8 bg-teal-400"></div>

                      {/* LEVEL 3 & 4 & 5: PEOPLE ➔ ORGANIZATIONS ➔ RESOURCES SUBTREE */}
                      <div className="w-full space-y-4">
                        {cap.people.map((person) => (
                          <div
                            key={person.id}
                            className="bg-white border-2 border-teal-200 hover:border-teal-500 rounded-xl p-4 space-y-3 transition shadow-2xs"
                          >
                            {/* LEVEL 3: PERSON NODE */}
                            <div
                              onClick={() => setSelectedNode({ type: 'Person', data: person })}
                              className="cursor-pointer group hover:bg-teal-50/50 p-2 rounded-lg transition border border-transparent hover:border-teal-200"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                                  PEOPLE NODE
                                </span>
                                <span className="text-[10px] text-stone-400 group-hover:text-teal-700 font-bold underline">
                                  View Profile ➔
                                </span>
                              </div>
                              <h4 className="font-extrabold text-stone-900 text-sm group-hover:text-teal-900">
                                🙋‍♂️ {person.name}
                              </h4>
                              <p className="text-xs text-stone-500 font-medium">{person.role}</p>
                            </div>

                            {/* Connector Line down to Organization */}
                            <div className="flex justify-center">
                              <div className="w-0.5 h-4 bg-teal-300"></div>
                            </div>

                            {/* LEVEL 4: ORGANIZATION NODE */}
                            <div
                              onClick={() => setSelectedNode({ type: 'Organization', data: person.organization })}
                              className="cursor-pointer bg-stone-50 border border-teal-200 hover:border-teal-400 p-2.5 rounded-lg text-xs space-y-0.5 transition group"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-teal-800 uppercase">ORGANIZATION</span>
                                <span className="text-[10px] text-teal-700 font-bold">Inspect ➔</span>
                              </div>
                              <p className="font-bold text-stone-900 group-hover:text-teal-900">
                                🏛️ {person.organization.name}
                              </p>
                              <p className="text-[11px] text-stone-500">{person.organization.type}</p>
                            </div>

                            {/* Connector Line down to Resources */}
                            <div className="flex justify-center">
                              <div className="w-0.5 h-4 bg-teal-300"></div>
                            </div>

                            {/* LEVEL 5: RESOURCE NODES */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block text-center">
                                PLEDGED RESOURCES
                              </span>
                              {person.resources.map((res) => (
                                <div
                                  key={res.id}
                                  onClick={() => setSelectedNode({ type: 'Resource', data: res })}
                                  className="cursor-pointer bg-teal-50/70 border border-teal-300 hover:border-teal-600 p-2.5 rounded-lg text-xs transition group flex items-center justify-between"
                                >
                                  <div>
                                    <p className="font-bold text-teal-950 group-hover:text-teal-900">
                                      📦 {res.name}
                                    </p>
                                    <p className="text-[11px] text-teal-700 font-medium">{res.quantity}</p>
                                  </div>
                                  <span className="text-[10px] font-bold text-teal-700 underline whitespace-nowrap">
                                    Details ➔
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DIRECTORY SEARCH VIEW                                           */}
      {/* ========================================================================= */}
      {viewMode === 'Directory Search' && (
        <Card padding="p-6" className="space-y-4 bg-white border-stone-200">
          <Input
            type="text"
            placeholder="Search network capabilities, volunteers, resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="p-8 text-center text-stone-500 text-xs font-medium bg-stone-50 rounded-xl border border-stone-100">
            Showing response network directory search. Use the <strong className="text-teal-700 font-bold">Visual Relationship Graph</strong> tab above to view interactive graph connections.
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE NODE INSPECTOR MODAL / DRAWER                               */}
      {/* Triggered by clicking Person, Organization, or Resource node             */}
      {/* ========================================================================= */}
      {selectedNode && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl relative animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 text-lg font-bold"
            >
              ✕
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center text-2xl font-bold">
                {selectedNode.type === 'Person' ? '🙋‍♂️' : selectedNode.type === 'Organization' ? '🏛️' : '📦'}
              </div>
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  {selectedNode.type} Node Details
                </span>
                <h3 className="text-lg font-extrabold text-stone-900">
                  {selectedNode.data.name}
                </h3>
              </div>
            </div>

            {/* Modal Content Details based on Node Type */}
            {selectedNode.type === 'Person' && (
              <div className="space-y-3 text-xs bg-stone-50 p-4 rounded-xl border border-stone-100">
                <p><strong>Role:</strong> {selectedNode.data.role}</p>
                <p><strong>Skills & Capabilities:</strong> {selectedNode.data.skills}</p>
                <p><strong>Location:</strong> 📍 {selectedNode.data.location}</p>
                <p><strong>Contact:</strong> 📞 {selectedNode.data.contact}</p>
                <p><strong>Status:</strong> <span className="text-green-700 font-bold">● {selectedNode.data.availability}</span></p>
              </div>
            )}

            {selectedNode.type === 'Organization' && (
              <div className="space-y-3 text-xs bg-stone-50 p-4 rounded-xl border border-stone-100">
                <p><strong>Organization Type:</strong> {selectedNode.data.type}</p>
                <p><strong>Operating Area:</strong> 📍 {selectedNode.data.operatingArea}</p>
                <p><strong>Contact:</strong> 📞 {selectedNode.data.contact}</p>
              </div>
            )}

            {selectedNode.type === 'Resource' && (
              <div className="space-y-3 text-xs bg-stone-50 p-4 rounded-xl border border-stone-100">
                <p><strong>Resource Type:</strong> {selectedNode.data.type}</p>
                <p><strong>Pledged Quantity:</strong> <span className="font-bold text-teal-800">{selectedNode.data.quantity}</span></p>
                <p><strong>Location:</strong> 📍 {selectedNode.data.location}</p>
                <p><strong>Pledged Owner:</strong> {selectedNode.data.owner}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedNode(null)}>
                Close Node
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedNode(null);
                  onNavigate('assignments');
                }}
              >
                Dispatch / Assign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkView;
