import React from 'react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';

function Home({ onReport, onOffer, onGetStarted }) {
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      
      {/* 1. NAVIGATION BAR */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-4 bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        {/* Brand Header */}
        <div 
          onClick={onGetStarted}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center font-black text-lg shadow-xs group-hover:bg-teal-800 transition">
            CR
          </div>
          <div>
            <h1 className="text-lg font-bold text-stone-900 tracking-tight leading-none">CO-RESOLVE</h1>
            <span className="text-[10px] font-semibold text-teal-700 uppercase tracking-wider">Response Platform</span>
          </div>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
          <button 
            onClick={() => scrollToSection('how-it-works')} 
            className="hover:text-teal-700 transition"
          >
            How it works
          </button>
          <button 
            onClick={() => scrollToSection('response-network')} 
            className="hover:text-teal-700 transition"
          >
            Response Network
          </button>
          <button 
            onClick={() => scrollToSection('features')} 
            className="hover:text-teal-700 transition"
          >
            Platform Features
          </button>
        </div>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOffer}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-white border border-stone-300 text-teal-800 hover:bg-stone-50 transition focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          >
            🤝 Offer Help
          </button>

          <Button 
            variant="primary"
            size="md"
            onClick={onReport}
          >
            <span>🆘</span> Report a Need
          </Button>

          <Button 
            variant="outline"
            size="md"
            onClick={onGetStarted}
            className="hidden lg:inline-flex"
          >
            Dashboard →
          </Button>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="px-6 sm:px-10 py-16 md:py-24 max-w-4xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-6">
          <span>🌐</span> CO-RESOLVE
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-stone-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Connect capabilities.<br />
          <span className="text-teal-700">Coordinate response.</span><br />
          Resolve crises.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
          Tell us what is happening. We'll help connect you with the right capabilities.
        </p>

        {/* CENTERED CTA STACK: "REPORT A NEED" is primary, large, and visually dominant */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 w-full">
          <button
            onClick={onReport}
            className="w-full sm:w-auto px-10 py-4 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-lg sm:text-xl rounded-xl shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 flex items-center justify-center gap-3 cursor-pointer"
          >
            <span>🆘</span> REPORT A NEED
          </button>

          <button
            onClick={onOffer}
            className="text-stone-600 hover:text-teal-800 font-semibold text-sm sm:text-base py-2 px-4 transition-colors flex items-center gap-2 cursor-pointer hover:underline"
          >
            <span>🤝</span> Offer Help
          </button>
        </div>
      </section>

      {/* 3. COOPERATIVE RESPONSE VISUAL SECTION */}
      <section id="response-network" className="px-6 sm:px-10 py-12 max-w-6xl mx-auto w-full">
        <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-12 shadow-xs">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">THE COOPERATION ENGINE</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-stone-900 mt-1 tracking-tight">
              Bridging Community Assets in Real Time
            </h3>
            <p className="text-stone-500 text-sm mt-2">
              CO-RESOLVE synthesizes structured community inputs into unified AI vector representations to match urgent needs with exact helpers.
            </p>
          </div>

          {/* Node Converging Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            
            {/* Input Node 1: People */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center transition hover:border-teal-400">
              <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-2xl mx-auto mb-3 shadow-2xs">
                👥
              </div>
              <h4 className="font-bold text-stone-900 text-sm">People in Need</h4>
              <p className="text-xs text-stone-500 mt-1">Victims, families, and neighborhood leaders reporting urgent situations.</p>
            </div>

            {/* Input Node 2: Skills */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center transition hover:border-teal-400">
              <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-2xl mx-auto mb-3 shadow-2xs">
                🙋‍♂️
              </div>
              <h4 className="font-bold text-stone-900 text-sm">Volunteer Skills</h4>
              <p className="text-xs text-stone-500 mt-1">First aid specialists, drivers, search & rescue, and community helpers.</p>
            </div>

            {/* Input Node 3: Resources */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center transition hover:border-teal-400">
              <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-2xl mx-auto mb-3 shadow-2xs">
                📦
              </div>
              <h4 className="font-bold text-stone-900 text-sm">Aid Resources</h4>
              <p className="text-xs text-stone-500 mt-1">Oxygen cylinders, medical supplies, food kits, boats, and generators.</p>
            </div>

            {/* Input Node 4: Organizations */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center transition hover:border-teal-400">
              <div className="w-12 h-12 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-2xl mx-auto mb-3 shadow-2xs">
                🏛️
              </div>
              <h4 className="font-bold text-stone-900 text-sm">Organizations</h4>
              <p className="text-xs text-stone-500 mt-1">NGOs, relief agencies, municipal units, and emergency services.</p>
            </div>
          </div>

          {/* Converging Arrow Divider */}
          <div className="my-6 flex items-center justify-center">
            <div className="w-px h-8 bg-stone-200"></div>
            <div className="px-4 text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 rounded-full py-1">
              ↓ Vector Semantic Alignment (Qdrant & BGE) ↓
            </div>
            <div className="w-px h-8 bg-stone-200"></div>
          </div>

          {/* Result Hub */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-6 text-center max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-700 text-white text-xs font-bold rounded-full mb-2">
              <span>⚡</span> CO-RESOLVED RESPONSE
            </div>
            <h4 className="font-bold text-stone-900 text-base">Coordinated Emergency Dispatch</h4>
            <p className="text-xs text-stone-600 mt-1">
              AI Agents evaluate proximity, capability, and urgency to pair victims with immediate, verified community assistance.
            </p>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS WORKFLOW */}
      <section id="how-it-works" className="px-6 sm:px-10 py-16 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            6-STAGE LIFECYCLE
          </span>
          <h2 className="text-3xl font-bold text-stone-900 mt-3 tracking-tight">
            How CO-RESOLVE Works
          </h2>
          <p className="text-stone-600 text-sm mt-2">
            A calm, structured 6-step workflow guiding crisis incidents from initial report to verified resolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Step 1 */}
          <Card padding="p-6" className="relative border-teal-100 hover:border-teal-300 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center">
                1
              </span>
              <Badge variant="teal">Intake Stage</Badge>
            </div>
            <h3 className="font-bold text-stone-900 text-lg mb-2">REPORT</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              People in distress or community monitors submit crisis situations, required help items, location, and urgency levels.
            </p>
          </Card>

          {/* Step 2 */}
          <Card padding="p-6" className="relative border-teal-100 hover:border-teal-300 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center">
                2
              </span>
              <Badge variant="teal">Analysis Stage</Badge>
            </div>
            <h3 className="font-bold text-stone-900 text-lg mb-2">UNDERSTAND</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              AI Crisis Triage Agents analyze incoming requests, extract required skill sets, evaluate risk, and classify urgency priorities.
            </p>
          </Card>

          {/* Step 3 */}
          <Card padding="p-6" className="relative border-teal-100 hover:border-teal-300 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center">
                3
              </span>
              <Badge variant="teal">Inventory Stage</Badge>
            </div>
            <h3 className="font-bold text-stone-900 text-lg mb-2">DISCOVER</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Continuously scans registered community volunteers, pledged equipment, vehicles, medical supplies, and relief agencies.
            </p>
          </Card>

          {/* Step 4 */}
          <Card padding="p-6" className="relative border-teal-100 hover:border-teal-300 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center">
                4
              </span>
              <Badge variant="teal">Matching Stage</Badge>
            </div>
            <h3 className="font-bold text-stone-900 text-lg mb-2">MATCH</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              FastEmbed + Qdrant vector similarity engines calculate semantic similarity scores between crisis needs and helper capabilities.
            </p>
          </Card>

          {/* Step 5 */}
          <Card padding="p-6" className="relative border-teal-100 hover:border-teal-300 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center">
                5
              </span>
              <Badge variant="teal">Execution Stage</Badge>
            </div>
            <h3 className="font-bold text-stone-900 text-lg mb-2">COORDINATE</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Dispatches matched helpers, creates dedicated response channels, and tracks real-time progress from dispatch to arrival.
            </p>
          </Card>

          {/* Step 6 */}
          <Card padding="p-6" className="relative border-teal-100 hover:border-teal-300 transition">
            <div className="flex items-center justify-between mb-4">
              <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center">
                6
              </span>
              <Badge variant="success">Resolution Stage</Badge>
            </div>
            <h3 className="font-bold text-stone-900 text-lg mb-2">RESOLVE</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Verifies incident resolution, collects community feedback, and archives post-crisis learnings for continuous AI model enhancement.
            </p>
          </Card>

        </div>
      </section>

      {/* 5. PLATFORM FEATURES GRID */}
      <section id="features" className="px-6 sm:px-10 py-16 max-w-6xl mx-auto w-full border-t border-stone-200">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            PLATFORM CAPABILITIES
          </span>
          <h2 className="text-3xl font-bold text-stone-900 mt-3 tracking-tight">
            Built for Calm, Reliable Crisis Response
          </h2>
          <p className="text-stone-600 text-sm mt-2">
            Every feature is designed to reduce chaos and foster trust when every second counts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <Card padding="p-6" className="hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center text-xl mb-4 font-bold">
              📋
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">AI Crisis Triage</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Instant analysis of unstructured crisis reports, extracting location context, skill requirements, and urgency rankings.
            </p>
          </Card>

          <Card padding="p-6" className="hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center text-xl mb-4 font-bold">
              🧠
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">Semantic Capability Matching</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              BGE 384-dimensional vector embeddings map natural language crisis descriptions directly to volunteer skills and equipment capabilities.
            </p>
          </Card>

          <Card padding="p-6" className="hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center text-xl mb-4 font-bold">
              📦
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">Resource Coordination</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Real-time directory and inventory tracking for medical supplies, food kits, generators, ambulances, and rescue boats.
            </p>
          </Card>

          <Card padding="p-6" className="hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center text-xl mb-4 font-bold">
              🏢
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">Crisis Rooms</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Dedicated coordination spaces bringing together victims, assigned community volunteers, and municipal relief agencies.
            </p>
          </Card>

          <Card padding="p-6" className="hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center text-xl mb-4 font-bold">
              💡
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">Explainable Recommendations</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Transparent match scores and justification summaries ensuring humans retain full decision-making control.
            </p>
          </Card>

          <Card padding="p-6" className="hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center text-xl mb-4 font-bold">
              📜
            </div>
            <h3 className="font-bold text-stone-900 text-base mb-2">Response Knowledge</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Post-crisis learning cycles that continuously index resolution outcomes into Qdrant memory for future emergency optimization.
            </p>
          </Card>

        </div>
      </section>

      {/* 6. CALL TO ACTION BANNER */}
      <section className="px-6 sm:px-10 py-16 bg-white border-t border-stone-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-stone-900 tracking-tight">
            Ready to contribute to community crisis response?
          </h2>
          <p className="mt-3 text-stone-600 text-sm max-w-xl mx-auto">
            Whether you need urgent help or have skills and equipment to share, CO-RESOLVE connects community assets instantly.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button 
              variant="primary"
              size="lg"
              onClick={onReport}
            >
              <span>🆘</span> Report a Need
            </Button>
            <button
              onClick={onOffer}
              className="inline-flex items-center justify-center px-6 py-3 text-base font-semibold rounded-lg bg-white border border-stone-300 text-teal-800 hover:bg-stone-50 transition shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-600/30 gap-2"
            >
              <span>🤝</span> Offer Help
            </button>
            <Button 
              variant="outline"
              size="lg"
              onClick={onGetStarted}
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-stone-100 border-t border-stone-200 px-6 sm:px-10 py-10 mt-auto text-stone-500 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-700 text-white flex items-center justify-center font-bold text-xs">
              CR
            </div>
            <span className="font-bold text-stone-900 text-sm">CO-RESOLVE</span>
            <span className="text-stone-400">•</span>
            <span>Cooperative Crisis Response Network</span>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={onReport} className="hover:text-stone-900 transition">Report Need</button>
            <button onClick={onOffer} className="hover:text-stone-900 transition">Offer Help</button>
            <button onClick={onGetStarted} className="hover:text-stone-900 transition">Dashboard</button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default Home;