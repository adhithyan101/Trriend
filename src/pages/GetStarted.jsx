function GetStarted({ onBack, onNeedHelp, onOfferHelp }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-8 py-5">
        <h1 className="text-2xl font-bold">CO-RESOLVE</h1>

        <button
          onClick={onBack}
          className="mt-4 text-blue-400 hover:text-blue-300"
        >
          ← Back to Home
        </button>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="font-semibold text-blue-400">
          GET STARTED
        </p>

        <h2 className="mt-3 text-4xl font-bold">
          How would you like to contribute?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          Whether you need help or have resources to offer,
          CO-RESOLVE helps connect people and communities.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">

          <button
            onClick={onNeedHelp}
            className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-left transition hover:border-blue-500 hover:bg-slate-800"
          >
            <div className="text-4xl">🆘</div>

            <h3 className="mt-5 text-2xl font-bold">
              I Need Help
            </h3>

            <p className="mt-3 text-slate-400">
              Report an urgent need and find people or
              resources that can help.
            </p>

            <span className="mt-6 inline-block font-semibold text-blue-400">
              Report a Need →
            </span>
          </button>

          <button
            onClick={onOfferHelp}
            className="rounded-2xl border border-slate-700 bg-slate-900 p-8 text-left transition hover:border-green-500 hover:bg-slate-800"
          >
            <div className="text-4xl">🤝</div>

            <h3 className="mt-5 text-2xl font-bold">
              I Can Help
            </h3>

            <p className="mt-3 text-slate-400">
              Offer your skills, resources, transportation,
              or other forms of support.
            </p>

            <span className="mt-6 inline-block font-semibold text-green-400">
              Offer Help →
            </span>
          </button>

        </div>
      </main>
    </div>
  )
}

export default GetStarted