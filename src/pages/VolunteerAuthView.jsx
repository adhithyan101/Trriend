import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Textarea, Select } from '../components/ui/Input';
import GoogleLocationPicker from '../components/location/GoogleLocationPicker';
import auth from '../services/auth';

export function VolunteerAuthView({ onBack, onSuccessNavigation }) {
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSkills, setSelectedSkills] = useState(['Water Rescue', 'First Aid']);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [availability, setAvailability] = useState('AVAILABLE');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const SKILL_OPTIONS = [
    'Water Rescue',
    'Medical Assistance',
    'First Aid',
    'Boat Operation',
    'Food Distribution',
    'Search & Rescue',
    'Transportation',
    'Shelter Management',
    'Logistics'
  ];

  const toggleSkill = (skill) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleLocationChange = ({ location: newLoc, latitude: newLat, longitude: newLng }) => {
    setLocation(newLoc);
    setLatitude(newLat);
    setLongitude(newLng);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await auth.login({ email: loginEmail.trim(), password: loginPassword });
      if (res.user && res.user.role !== 'VOLUNTEER') {
        throw new Error('This account is registered as an Organization. Please use Organization Login.');
      }
      if (onSuccessNavigation) onSuccessNavigation('volunteer-portal');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password || !name.trim()) {
      setError('Name, email, and password (min 6 characters) are required.');
      return;
    }
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill/capability.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await auth.registerVolunteer({
        name: name.trim(),
        email: email.trim(),
        password,
        skills: selectedSkills,
        location: location.trim() || 'Kollam',
        latitude,
        longitude,
        availability
      });
      if (onSuccessNavigation) onSuccessNavigation('volunteer-portal');
    } catch (err) {
      setError(err.message || 'Unable to complete volunteer registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-xl space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-stone-600 hover:text-stone-900 font-semibold text-xs flex items-center gap-1 cursor-pointer"
          >
            ← Back to Role Selection
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold">
            <span>🙋‍♂️</span> VOLUNTEER AUTHENTICATION
          </span>
        </div>

        <Card padding="p-6 md:p-8" className="border-stone-200 shadow-sm bg-white">
          <div className="text-center space-y-2 pb-6 border-b border-stone-200/80 mb-6">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-extrabold text-2xl mx-auto shadow-2xs">
              🙋‍♂️
            </div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              {mode === 'LOGIN' ? 'Volunteer Login' : 'Volunteer Registration'}
            </h2>
            <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto">
              {mode === 'LOGIN'
                ? 'Sign in to access your volunteer portal, view assistance requests, and update responder status.'
                : 'Join the community response network to lend your capabilities during crisis emergencies.'}
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-900 mb-6">
              ⚠️ {error}
            </div>
          )}

          {mode === 'LOGIN' ? (
            /* VOLUNTEER LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="volunteer@example.org"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full text-sm py-3"
              >
                {loading ? 'Authenticating...' : 'Sign In as Volunteer →'}
              </Button>

              <div className="text-center pt-3 border-t border-stone-100">
                <p className="text-xs text-stone-600 font-medium">
                  Don't have a volunteer account yet?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('REGISTER'); setError(null); }}
                    className="text-teal-800 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Register as Volunteer
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* VOLUNTEER REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <Input
                label="Full Name *"
                placeholder="Example: Arjun Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="volunteer@example.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Input
                  label="Password (min 6 characters) *"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Skills Multi-Select */}
              <div>
                <label className="block text-xs font-bold uppercase text-stone-700 mb-2">
                  Capabilities & Skills *
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                          isSelected
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Google Location Picker */}
              <GoogleLocationPicker
                location={location}
                latitude={latitude}
                longitude={longitude}
                onChange={handleLocationChange}
              />

              <Select
                label="Availability Status"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="AVAILABLE">AVAILABLE — Ready for immediate dispatch</option>
                <option value="STANDBY">STANDBY — Available within 2 hours</option>
                <option value="UNAVAILABLE">UNAVAILABLE — Temporarily offline</option>
              </Select>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full text-sm py-3"
              >
                {loading ? 'Creating Volunteer Account...' : 'Complete Volunteer Registration →'}
              </Button>

              <div className="text-center pt-3 border-t border-stone-100">
                <p className="text-xs text-stone-600 font-medium">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('LOGIN'); setError(null); }}
                    className="text-teal-800 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Sign In to Existing Account
                  </button>
                </p>
              </div>
            </form>
          )}
        </Card>

      </div>
    </div>
  );
}

export default VolunteerAuthView;
