function OfferHelp({ onBack }) {
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

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="text-4xl font-bold">
          Offer Help
        </h2>

        <p className="mt-3 text-slate-400">
          Tell the community how you can help during a crisis.
        </p>

        <div className="mt-8 space-y-6">

          <div>
            <label className="mb-2 block font-semibold">
              Your Name
            </label>

            <input
              type="text"
              placeholder="Enter your name"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              How can you help?
            </label>

            <input
              type="text"
              placeholder="Example: Transportation, medicine, food"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Your Location
            </label>

            <input
              type="text"
              placeholder="Example: Kalamassery"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Additional Information
            </label>

            <textarea
              rows="4"
              placeholder="Tell us more about the help you can provide..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
            Offer Help
          </button>

        </div>
      </main>
    </div>
  )
}

export default OfferHelp