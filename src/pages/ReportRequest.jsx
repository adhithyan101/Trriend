import { useState } from 'react'

function ReportRequest({ onBack })  {
  const [need, setNeed] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [submitted, setSubmitted] = useState(false)

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
          Report a Need
        </h2>

        <p className="mt-3 text-slate-400">
          Tell the community what help is needed.
        </p>

        <div className="mt-8 space-y-6">

          <div>
            <label className="mb-2 block font-semibold">
              What help is needed?
            </label>

            <input
              type="text"
              placeholder="Example: Medicine and transportation"
              value={need}
              onChsnge={(e) => setNeed(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Describe the situation
            </label>

            <textarea
              rows="5"
              placeholder="Describe what is happening and what kind of help is required..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Location
            </label>

            <input
              type="text"
              placeholder="Example: Kalamassery"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <button 
            onClick={() => setSubmitted(true)}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700">
            Submit Request
          </button>
          {submitted && (
            <div className="rounded-lg border border-green-700 bg-green-950 p-4 text-green-300">
              <p className="font-semibold">Request submitted successfully!</p>
              <p className="mt-1 text-sm">
                We will now look for relevant people and resources.
              </p>
            </div>
         )}
          

        </div>
      </main>
    </div>
  )
}

export default ReportRequest