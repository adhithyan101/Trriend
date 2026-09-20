import { useState } from 'react'
import api from '../services/api'
import PageHeading from '../components/ui/Headings'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ErrorState } from '../components/ui/States'
import GoogleLocationPicker from '../components/location/GoogleLocationPicker'

function OfferHelp({ onBack }) {
  const [name, setName] = useState('')
  const [help, setHelp] = useState('')
  const [location, setLocation] = useState('')
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [contact, setContact] = useState('')
  const [offerType, setOfferType] = useState('volunteer') // 'volunteer' | 'resource'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !help.trim() || !location.trim()) {
      setError('Please fill in all required fields.')
      return
    }

    setLoading(true)
    setError(null)
    setSubmitted(false)

    try {
      if (offerType === 'volunteer') {
        await api.createVolunteer({
          name: name.trim(),
          skills: help.trim(),
          location: location.trim(),
          latitude,
          longitude,
          availability: 'Available',
          contact: contact.trim()
        })
      } else {
        await api.createAidResource({
          name: name.trim(),
          capability: help.trim(),
          location: location.trim(),
          resource_type: 'General Aid',
          contact: contact.trim()
        })
      }

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'Failed to submit help offer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeading
        title="Offer Help & Resources"
        description="Tell the community how you can contribute during a crisis. Your skills and resources will be indexed into the AI match network."
        actions={
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back
          </Button>
        }
      />

      {error && <ErrorState title="Submission Error" description={error} />}

      <Card padding="p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="mb-2 block text-sm font-semibold text-stone-900">
              Select Offer Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOfferType('volunteer')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-semibold transition ${
                  offerType === 'volunteer'
                    ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-600/30'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>🙋‍♂️</span> Volunteer Skills
              </button>
              <button
                type="button"
                onClick={() => setOfferType('resource')}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-semibold transition ${
                  offerType === 'resource'
                    ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-600/30'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <span>📦</span> Aid Supplies & Equipment
              </button>
            </div>
          </div>

          <Input
            label="Your Name or Organization"
            placeholder="Enter your name or organization"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label={offerType === 'volunteer' ? 'Skills & Capabilities' : 'Resource Details & Capability'}
            placeholder={
              offerType === 'volunteer'
                ? 'Example: First Aid, Medical Support, Search & Rescue, Emergency Driving'
                : 'Example: Emergency ambulance, 500L drinking water, generator'
            }
            value={help}
            onChange={(e) => setHelp(e.target.value)}
            required
          />

          {/* Shared Google Location Picker */}
          <GoogleLocationPicker
            location={location}
            latitude={latitude}
            longitude={longitude}
            onChange={({ location: loc, latitude: lat, longitude: lng }) => {
              setLocation(loc)
              setLatitude(lat)
              setLongitude(lng)
            }}
            label="Location"
            required={true}
          />

          <Input
            label="Contact Information (Phone / Email)"
            placeholder="Example: +91 9876543210 or contact@rescue.org"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Submitting Offer...' : 'Offer Help'}
          </Button>
        </form>
      </Card>

      {submitted && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-green-900">
          <p className="text-base font-bold flex items-center gap-2">
            <span>✓</span> Offer submitted successfully!
          </p>
          <p className="mt-1 text-xs text-green-700">
            Thank you for offering your support! Your profile has been recorded in the database and indexed for AI matching.
          </p>
        </div>
      )}
    </div>
  )
}

export default OfferHelp
