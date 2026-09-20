import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import VolunteerAuthView from './VolunteerAuthView';
import OrganizationAuthView from './OrganizationAuthView';

function GetStarted({ onBack, onNeedHelp, onNavigate }) {
  const [selectedFlow, setSelectedFlow] = useState('LANDING'); // 'LANDING' | 'ROLE_SELECTION' | 'VOLUNTEER_AUTH' | 'ORGANIZATION_AUTH'

  if (selectedFlow === 'VOLUNTEER_AUTH') {
    return (
      <VolunteerAuthView
        onBack={() => setSelectedFlow('ROLE_SELECTION')}
        onSuccessNavigation={(page) => onNavigate && onNavigate(page)}
      />
    );
  }

  if (selectedFlow === 'ORGANIZATION_AUTH') {
    return (
      <OrganizationAuthView
        onBack={() => setSelectedFlow('ROLE_SELECTION')}
        onSuccessNavigation={(page) => onNavigate && onNavigate(page)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans">
      
      {/* Navigation Bar */}
      <nav className="border-b border-stone-200 bg-white px-6 sm:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center font-black text-lg shadow-xs">
            CR
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">CO-RESOLVE</h1>
        </div>

        <button
          onClick={() => {
            if (selectedFlow === 'ROLE_SELECTION') {
              setSelectedFlow('LANDING');
            } else if (onBack) {
              onBack();
            }
          }}
          className="text-stone-600 hover:text-stone-900 font-medium text-sm flex items-center gap-1 cursor-pointer"
        >
          ← {selectedFlow === 'ROLE_SELECTION' ? 'Back to Selection' : 'Back to Home'}
        </button>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-6 py-16 text-center">
        {selectedFlow === 'LANDING' ? (
          /* STEP 1: INITIAL DECISION */
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 mb-3">
              GET STARTED
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              How can you help today?
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-stone-600 text-base font-medium">
              Whether you need urgent emergency help or want to contribute capabilities, CO-RESOLVE connects people and communities instantly.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2 text-left max-w-3xl mx-auto">

              {/* OPTION A: I NEED HELP (ANONYMOUS & NO AUTH) */}
              <div
                onClick={onNeedHelp}
                className="group cursor-pointer rounded-2xl border-2 border-amber-200 bg-white p-8 transition-all duration-200 shadow-xs hover:border-amber-500 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="w-14 h-14 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-3xl font-bold mb-4 shadow-2xs">
                  🆘
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-stone-900 group-hover:text-amber-800 transition">
                    I Need Help
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-950 border border-emerald-300">
                    No Login Required
                  </span>
                </div>

                <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                  Report an emergency incident, request medical aid, supplies, transport, or rescue assistance from community responders without creating an account.
                </p>

                <span className="mt-6 inline-flex items-center gap-1 font-bold text-sm text-amber-700 group-hover:text-amber-900">
                  Report a Need Immediately →
                </span>
              </div>

              {/* OPTION B: VOLUNTEER / ORGANIZATION (ROLE AUTHENTICATION) */}
              <div
                onClick={() => setSelectedFlow('ROLE_SELECTION')}
                className="group cursor-pointer rounded-2xl border-2 border-teal-200 bg-white p-8 transition-all duration-200 shadow-xs hover:border-teal-600 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center text-3xl font-bold mb-4 shadow-2xs">
                  🤝
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-stone-900 group-hover:text-teal-800 transition">
                    Volunteer / Organization
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-100 text-teal-950 border border-teal-300">
                    Auth Required
                  </span>
                </div>

                <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                  Sign in or register as an individual community volunteer or partner alliance to manage responder requests and pledge relief equipment.
                </p>

                <span className="mt-6 inline-flex items-center gap-1 font-bold text-sm text-teal-700 group-hover:text-teal-900">
                  Continue to Role Login / Registration →
                </span>
              </div>

            </div>
          </div>
        ) : (
          /* STEP 2: WHO ARE YOU? (VOLUNTEER VS ORGANIZATION) */
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 mb-3">
              ROLE SELECTION
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
              Who are you?
            </h2>

            <p className="mx-auto mt-3 max-w-xl text-stone-600 text-base font-medium">
              Select your account type to access the dedicated login and registration workflow.
            </p>

            <div className="mt-12 grid gap-6 md:grid-cols-2 text-left max-w-3xl mx-auto">

              {/* VOLUNTEER ROLE */}
              <div
                onClick={() => setSelectedFlow('VOLUNTEER_AUTH')}
                className="group cursor-pointer rounded-2xl border border-stone-200 bg-white p-8 transition-all duration-200 shadow-xs hover:border-teal-600 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-3xl font-bold mb-4 shadow-2xs">
                  🙋‍♂️
                </div>

                <h3 className="text-2xl font-bold text-stone-900 group-hover:text-teal-900 transition">
                  Volunteer
                </h3>

                <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                  Individual community members, medical personnel, boat operators, and first-responders offering skills.
                </p>

                <span className="mt-6 inline-flex items-center gap-1 font-bold text-sm text-teal-800 group-hover:text-teal-950">
                  Volunteer Sign In / Register →
                </span>
              </div>

              {/* ORGANIZATION ROLE */}
              <div
                onClick={() => setSelectedFlow('ORGANIZATION_AUTH')}
                className="group cursor-pointer rounded-2xl border border-stone-200 bg-white p-8 transition-all duration-200 shadow-xs hover:border-teal-600 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-3xl font-bold mb-4 shadow-2xs">
                  🏛️
                </div>

                <h3 className="text-2xl font-bold text-stone-900 group-hover:text-teal-900 transition">
                  Organization
                </h3>

                <p className="mt-3 text-sm text-stone-600 leading-relaxed">
                  NGOs, non-profits, municipal emergency services, healthcare alliances, and relief supply organizations.
                </p>

                <span className="mt-6 inline-flex items-center gap-1 font-bold text-sm text-teal-800 group-hover:text-teal-950">
                  Organization Sign In / Register →
                </span>
              </div>

            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default GetStarted;