import React from 'react';

export function Sidebar({ activePage, onNavigate, onCloseMobile }) {
  const navSections = [
    {
      title: null,
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      ],
    },
    {
      title: 'CRISIS',
      items: [
        { id: 'crises', label: 'Active Crises', icon: '🚨' },
        { id: 'report', label: 'Report a Need', icon: '🆘' },
      ],
    },
    {
      title: 'NETWORK',
      items: [
        { id: 'volunteers', label: 'Volunteers', icon: '🙋‍♂️' },
        { id: 'resources', label: 'Resources', icon: '📦' },
        { id: 'organizations', label: 'Organizations', icon: '🏛️' },
        { id: 'network', label: 'Crisis Network', icon: '🌐' },
      ],
    },
    {
      title: 'RESPONSE',
      items: [
        { id: 'assignments', label: 'Assignments', icon: '📋' },
        { id: 'volunteer-portal', label: 'Volunteer Portal', icon: '🧑‍🚒' },
      ],
    },
    {
      title: 'INTELLIGENCE',
      items: [
        { id: 'ai-command', label: 'AI Command Center', icon: '🤖' },
        { id: 'history', label: 'Response History', icon: '📜' },
      ],
    },
  ];

  const handleSelect = (id) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <aside className="w-64 bg-white border-r border-stone-200 flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-stone-100 flex items-center justify-between">
        <div 
          onClick={() => handleSelect('home')} 
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center font-black text-lg shadow-xs group-hover:bg-teal-800 transition">
            CR
          </div>
          <div>
            <h1 className="font-bold text-stone-900 tracking-tight text-base leading-tight">
              CO-RESOLVE
            </h1>
            <p className="text-[10px] font-semibold tracking-wider text-teal-700 uppercase">
              Crisis Platform
            </p>
          </div>
        </div>

        {onCloseMobile && (
          <button 
            onClick={onCloseMobile} 
            className="md:hidden p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {section.title && (
              <h3 className="px-3 text-[11px] font-bold tracking-wider text-stone-400 uppercase mb-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 font-semibold border-l-4 border-teal-700 rounded-l-none'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer & Settings */}
      <div className="p-3 border-t border-stone-100 space-y-2 bg-stone-50/50">
        <button
          onClick={() => handleSelect('offer')}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border border-teal-600 text-teal-800 bg-teal-50 hover:bg-teal-100 transition ${
            activePage === 'offer' ? 'ring-2 ring-teal-600' : ''
          }`}
        >
          <span>🤝</span> Offer Help / Skills
        </button>

        <button
          onClick={() => handleSelect('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            activePage === 'settings'
              ? 'bg-teal-50 text-teal-800 font-semibold border-l-4 border-teal-700 rounded-l-none'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
          }`}
        >
          <span className="text-base">⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
