import React, { useState, useEffect } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import api from '../services/api';

export function VolunteersView({ onNavigate }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchVolunteers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getVolunteers();
      setVolunteers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load volunteer directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Volunteer Directory"
        description="Community members and emergency responders who have offered skills and assistance."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onNavigate('volunteer-portal')}>
              🧑‍🚒 Switch to My Volunteer Portal
            </Button>
            <Button variant="primary" size="sm" onClick={() => onNavigate('offer')}>
              🤝 Offer Your Skills
            </Button>
          </div>
        }
      />

      {error && <ErrorState description={error} onRetry={fetchVolunteers} />}

      {loading ? (
        <LoadingState title="Loading Volunteers" description="Fetching registered volunteer directory..." />
      ) : volunteers.length === 0 ? (
        <EmptyState
          icon="🙋‍♂️"
          title="No Volunteers Registered Yet"
          description="Be the first to offer volunteer assistance during crisis situations."
          actionText="Offer Help"
          onAction={() => onNavigate('offer')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers.map((vol, idx) => (
            <Card key={vol.id || idx} padding="p-5" className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-stone-900 text-base">{vol.name}</h3>
                  <Badge variant="teal" size="sm">{vol.availability || 'Available'}</Badge>
                </div>

                <p className="text-xs text-stone-500 mb-3 font-medium">📍 {vol.location}</p>

                <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 text-xs text-stone-700 space-y-1.5">
                  <p><strong>Skills & Capabilities:</strong></p>
                  <p className="text-stone-800">{vol.skills}</p>
                </div>
              </div>

              {vol.contact && (
                <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-teal-800 font-medium">
                  📞 Contact: {vol.contact}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default VolunteersView;
