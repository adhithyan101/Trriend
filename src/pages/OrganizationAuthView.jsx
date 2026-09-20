import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Textarea, Select } from '../components/ui/Input';
import auth from '../services/auth';

export function OrganizationAuthView({ onBack, onSuccessNavigation }) {
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER'
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgType, setOrgType] = useState('NGO');
  const [capability, setCapability] = useState('Water Rescue & Medical Aid');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      if (res.user && res.user.role !== 'ORGANIZATION') {
        throw new Error('This account is registered as a Volunteer. Please use Volunteer Login.');
      }
      if (onSuccessNavigation) onSuccessNavigation('organizations');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password || !name.trim()) {
      setError('Organization name, email, and password (min 6 characters) are required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await auth.registerOrganization({
        name: name.trim(),
        email: email.trim(),
        password,
        type: orgType,
        capability: capability.trim(),
        location: location.trim() || 'Kollam Coastal Zone',
        contact: contact.trim() || email.trim()
      });
      if (onSuccessNavigation) onSuccessNavigation('organizations');
    } catch (err) {
      setError(err.message || 'Unable to complete organization registration.');
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
            <span>🏛️</span> ORGANIZATION AUTHENTICATION
          </span>
        </div>

        <Card padding="p-6 md:p-8" className="border-stone-200 shadow-sm bg-white">
          <div className="text-center space-y-2 pb-6 border-b border-stone-200/80 mb-6">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-extrabold text-2xl mx-auto shadow-2xs">
              🏛️
            </div>
            <h2 className="text-xl font-bold text-stone-900 tracking-tight">
              {mode === 'LOGIN' ? 'Organization Login' : 'Organization Registration'}
            </h2>
            <p className="text-xs text-stone-500 font-medium max-w-sm mx-auto">
              {mode === 'LOGIN'
                ? 'Sign in to access your organization dashboard, manage relief equipment, and coordinate partner alliances.'
                : 'Register your alliance or non-profit organization to pledge capabilities to the crisis response network.'}
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-900 mb-6">
              ⚠️ {error}
            </div>
          )}

          {mode === 'LOGIN' ? (
            /* ORGANIZATION LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <Input
                label="Organization Email Address"
                type="email"
                placeholder="contact@kollamrescue.org"
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
                {loading ? 'Authenticating...' : 'Sign In as Organization →'}
              </Button>

              <div className="text-center pt-3 border-t border-stone-100">
                <p className="text-xs text-stone-600 font-medium">
                  Don't have an organization account yet?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('REGISTER'); setError(null); }}
                    className="text-teal-800 font-bold hover:underline cursor-pointer ml-1"
                  >
                    Register Organization Account
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* ORGANIZATION REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              <Input
                label="Organization Name *"
                placeholder="Example: Kollam Coastal Marine Alliance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Email Address *"
                  type="email"
                  placeholder="contact@kollamrescue.org"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Organization Type"
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                >
                  <option value="NGO">NGO / Non-Profit</option>
                  <option value="Government Agency">Government / Municipal Agency</option>
                  <option value="Healthcare Alliance">Healthcare & Emergency Alliance</option>
                  <option value="Community Response Unit">Community Response Unit</option>
                </Select>

                <Input
                  label="Primary Contact Phone"
                  placeholder="+91 9876543210"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                />
              </div>

              <Input
                label="Core Capability & Resources *"
                placeholder="Example: Water Rescue, Emergency Ambulances, Relief Equipment"
                value={capability}
                onChange={(e) => setCapability(e.target.value)}
                required
              />

              <Input
                label="Operating Base Location *"
                placeholder="Example: Kollam Coastal Zone, Kerala"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full text-sm py-3"
              >
                {loading ? 'Creating Organization Account...' : 'Complete Organization Registration →'}
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

export default OrganizationAuthView;
