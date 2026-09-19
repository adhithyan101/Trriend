function Home({ onReport, onOffer, onGetStarted }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
        <h1 className="text-2xl font-bold">CO-RESOLVE</h1>

        <button 
          onClick={onGetStarted}
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold hover:bg-blue-700"
        >
          Get Started
        </button>
      </nav>

      <main className="flex min-h-[80vh] items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <p className="mb-4 text-blue-400 font-semibold">
            COOPERATIVE CRISIS RESPONSE
          </p>

          <h2 className="text-5xl font-bold leading-tight">
            Together, we can solve urgent problems.
          </h2>

          <p className="mt-6 text-lg text-slate-300">
            CO-RESOLVE connects people who need help with volunteers,
            resources, and organizations that can help.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <button 
              onClick={onReport}className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
              Report a Need
            </button>

            <button 
              onClick={onOffer}
              className="rounded-lg border border-slate-600 px-6 py-3 font-semibold hover:bg-slate-800"
            >
              Offer Help
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Home