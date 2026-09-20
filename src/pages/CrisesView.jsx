import React, { useState, useEffect } from 'react';
import PageHeading from '../components/ui/Headings';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { LoadingState, EmptyState, ErrorState } from '../components/ui/States';
import api from '../services/api';

export function CrisesView({ onNavigate }) {
  const [crises, setCrises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterUrgency, setFilterUrgency] = useState('ALL');

  const fetchCrises = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getCrisisReports();
      setCrises(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch active crises.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrises();
  }, []);

  const filtered = crises.filter((item) => {
    if (filterUrgency === 'ALL') return true;
    return (item.urgency || '').toUpperCase() === filterUrgency.toUpperCase();
  });

  return (
    <div className="space-y-6">
      <PageHeading
        title="Active Crises"
        description="Comprehensive directory of community crisis reports indexed in the SQLite and vector database."
        actions={
          <Button variant="primary" size="sm" onClick={() => onNavigate('report')}>
            🆘 Report a Need
          </Button>
        }
      />

      {error && <ErrorState description={error} onRetry={fetchCrises} />}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Filter Urgency:</span>
          {['ALL', 'High', 'Medium', 'Low'].map((level) => (
            <button
              key={level}
              onClick={() => setFilterUrgency(level)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                filterUrgency === level
                  ? 'bg-teal-700 text-white font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <span className="text-xs text-stone-500 font-medium">Showing {filtered.length} of {crises.length} reports</span>
      </div>

      {loading ? (
        <LoadingState title="Retrieving Crises" description="Fetching active crisis reports from the network..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🚨"
          title="No Active Crises Found"
          description="There are currently no active crisis reports matching your selected criteria."
          actionText="Report a Need"
          onAction={() => onNavigate('report')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((crisis, index) => (
            <Card key={crisis.id || index} padding="p-6" className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-stone-900 text-lg leading-tight">{crisis.title}</h3>
                  <StatusBadge status={crisis.urgency || 'Medium'} />
                </div>

                <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-3 font-medium">
                  <span>📍 {crisis.location}</span>
                  <span>•</span>
                  <span>Record #{crisis.id || index + 1}</span>
                </div>

                <p className="text-sm text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100 mb-4">
                  {crisis.description}
                </p>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-stone-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('report')}
                >
                  🤖 Match Helpers
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default CrisesView;
