import React, { useState } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export function SettingsView() {
  const [apiUrl, setApiUrl] = useState(import.meta.env.VITE_API_URL || 'http://localhost:8000');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="Platform Settings"
        description="Configure backend API endpoints, notification preferences, and AI vector parameters."
      />

      <Card padding="p-6">
        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <Input
            label="Backend API Endpoint URL"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            helperText="Central Python backend base URL for HTTP/JSON requests."
          />

          <Button type="submit" variant="primary">
            Save Settings
          </Button>

          {saved && (
            <p className="text-xs font-semibold text-green-700">✓ Settings saved successfully.</p>
          )}
        </form>
      </Card>
    </div>
  );
}

export default SettingsView;
