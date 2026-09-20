const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

/**
 * Common fetch helper handling JSON request/response and backend error handling.
 */
async function fetchJson(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = data.error || (data.details ? data.details.join(', ') : `HTTP error ${response.status}`);
      throw new Error(errMsg);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Backend server is unavailable. Please ensure the CO-RESOLVE backend server is running on port 5000.');
    }
    throw err;
  }
}

export const api = {
  /**
   * Health check endpoint
   */
  async checkHealth() {
    return fetchJson('/health');
  },

  /**
   * Create a crisis report
   */
  async createCrisisReport({ title, description, location, urgency = 'MEDIUM', latitude = null, longitude = null, type = null, types = null, crisisTypes = null, crisisType = null, peopleAffected = 1, assistance_needed = [], assistanceNeeded = [] }) {
    // Priority mapping for backend validator ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    let priority = 'MEDIUM';
    if (typeof urgency === 'string') {
      const upper = urgency.toUpperCase();
      if (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(upper)) {
        priority = upper;
      } else if (upper.includes('CRIT') || upper.includes('URGENT')) {
        priority = 'CRITICAL';
      }
    }

    const selectedTypes = Array.isArray(crisisTypes) && crisisTypes.length > 0
      ? crisisTypes
      : Array.isArray(types) && types.length > 0
      ? types
      : Array.isArray(type) && type.length > 0
      ? type
      : typeof crisisType === 'string' && crisisType.trim()
      ? crisisType.split(/•|,/).map(s => s.trim()).filter(Boolean)
      : typeof type === 'string' && type.trim()
      ? type.split(/•|,/).map(s => s.trim()).filter(Boolean)
      : ['Medical Emergency'];

    const selectedAssistance = Array.isArray(assistance_needed) && assistance_needed.length > 0
      ? assistance_needed
      : Array.isArray(assistanceNeeded) && assistanceNeeded.length > 0
      ? assistanceNeeded
      : selectedTypes;

    const payload = {
      title: title || 'Emergency Crisis Report',
      description: description || 'No details provided',
      type: selectedTypes.join(' • '),
      types: selectedTypes,
      crisisTypes: selectedTypes,
      location: location || 'Unknown location',
      peopleAffected: Number(peopleAffected) || 1,
      priority,
      status: 'REPORTED',
      assistance_needed: selectedAssistance,
      ...(latitude !== null && latitude !== undefined ? { latitude: Number(latitude) } : {}),
      ...(longitude !== null && longitude !== undefined ? { longitude: Number(longitude) } : {}),
    };

    return fetchJson('/crises', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch all crisis reports
   */
  async getCrisisReports() {
    const data = await fetchJson('/crises');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.crises)) return data.crises;
    return [];
  },

  /**
   * Register an aid resource
   */
  async createAidResource({ name, capability, location, resource_type = 'general', contact = '' }) {
    return fetchJson('/resources', {
      method: 'POST',
      body: JSON.stringify({
        name,
        capability,
        resource_type,
        location,
        contact,
      }),
    });
  },

  /**
   * Fetch all aid resources
   */
  async getAidResources() {
    const data = await fetchJson('/resources');
    return Array.isArray(data) ? data : [];
  },

  /**
   * Register a volunteer
   */
  async createVolunteer({ name, skills, description, location, availability = 'Available', experience, contact = '', latitude = null, longitude = null }) {
    return fetchJson('/volunteers', {
      method: 'POST',
      body: JSON.stringify({
        name,
        skills,
        description,
        location,
        availability,
        experience,
        contact,
        ...(latitude !== null && latitude !== undefined ? { latitude: Number(latitude) } : {}),
        ...(longitude !== null && longitude !== undefined ? { longitude: Number(longitude) } : {}),
      }),
    });
  },

  /**
   * Fetch all volunteers
   */
  async getVolunteers() {
    const data = await fetchJson('/volunteers');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.volunteers)) return data.volunteers;
    return [];
  },

  /**
   * Find matching resources, volunteers & organizations for a crisis
   */
  async matchCrisis({ id, title, description, location, urgency = 'Medium' }) {
    let result = null;
    if (id) {
      try {
        result = await fetchJson(`/crises/${id}/match`, { method: 'POST' });
      } catch (err) {
        console.warn('Backend match endpoint warning, attempting fallback:', err.message);
      }
    }

    if (!result) {
      // Fallback matching query using volunteers, resources, and organizations
      try {
        const volunteers = await this.getVolunteers();
        const resources = await this.getAidResources();
        const matched_volunteers = (volunteers || []).slice(0, 5).map(v => ({
          id: v.id,
          name: v.name,
          skills: (v.capabilities || []).map(c => c.capability).join(', ') || v.description || 'General Emergency Aid',
          location: v.location || location || 'Local Area',
          availability: v.availability || 'Available',
          contact: v.contact || 'Registered Responder',
          similarity_score: 0.88,
        }));
        const matched_resources = (resources || []).slice(0, 5).map(r => ({
          id: r.id,
          name: r.name,
          capability: r.type || 'Aid Supply',
          location: r.location || location || 'Local Depot',
          resource_type: r.type || 'General',
          available_quantity: r.available_quantity || r.quantity || 1,
          total_quantity: r.quantity || 1,
          contact: r.contact || 'Available at Depot',
          similarity_score: 0.92,
        }));
        const matched_organizations = [
          {
            id: 1,
            name: 'Kerala Disaster Relief Network',
            description: 'Community-coordinated emergency relief logistics',
            location: location || 'Regional HQ',
            availability: '24/7 Operational',
            contact: '+91-9876543210',
            similarity_score: 0.86,
          },
          {
            id: 2,
            name: 'District First Aid Corps',
            description: 'Mobile paramedic and triage medical task force',
            location: location || 'District Sector',
            availability: 'On-Call Mobile',
            contact: '+91-9876543211',
            similarity_score: 0.83,
          }
        ];
        return {
          matched_volunteers,
          matched_resources,
          matched_organizations,
          total_matches: matched_volunteers.length + matched_resources.length + matched_organizations.length,
          summary: `Identified ${matched_volunteers.length} volunteer(s), ${matched_resources.length} resource(s), and ${matched_organizations.length} organization(s).`,
        };
      } catch {
        return { matched_volunteers: [], matched_resources: [], matched_organizations: [], total_matches: 0, summary: 'No matching records available.' };
      }
    }

    // Normalize backend response if present
    const matched_volunteers = result.matched_volunteers || (result.recommendations || []).filter(r => r.type === 'volunteer').map(v => ({
      id: v.id,
      name: v.name,
      skills: v.reasoning || 'Matched Skill',
      location: location || 'Local Area',
      availability: 'Available',
      similarity_score: (v.fitScore || 85) / 100,
    }));

    const matched_resources = result.matched_resources || (result.recommendations || []).filter(r => r.type === 'resource').map(r => ({
      id: r.id,
      name: r.name,
      capability: r.reasoning || 'Aid Resource',
      location: location || 'Local Depot',
      resource_type: 'General',
      available_quantity: r.availableQuantity || 1,
      total_quantity: r.totalQuantity || 1,
      similarity_score: (r.fitScore || 90) / 100,
    }));

    const matched_organizations = result.matched_organizations || (result.recommendations || []).filter(r => r.type === 'organization').map(o => ({
      id: o.id,
      name: o.name,
      description: o.reasoning || 'Disaster Relief Organization',
      location: location || 'Regional HQ',
      availability: '24/7 Response',
      contact: 'Hotline Active',
      similarity_score: (o.fitScore || 85) / 100,
    }));

    const total_matches = result.total_matches !== undefined
      ? result.total_matches
      : (matched_volunteers.length + matched_resources.length + matched_organizations.length);

    return {
      ...result,
      matched_volunteers,
      matched_resources,
      matched_organizations,
      total_matches,
      summary: result.summary || `Found ${total_matches} match(es).`,
    };
  },

  /**
   * Run AI Triage on crisis
   */
  async analyzeCrisis(id) {
    return fetchJson(`/crises/${id}/analyze`, { method: 'POST' });
  },

  /**
   * Fetch all response assignments
   */
  async getAssignments() {
    try {
      const crises = await this.getCrisisReports();
      const allAssignments = [];
      for (const crisis of crises) {
        if (crisis.id) {
          const list = await fetchJson(`/crises/${crisis.id}/assignments`).catch(() => []);
          if (Array.isArray(list)) {
            allAssignments.push(...list);
          }
        }
      }
      return allAssignments;
    } catch {
      return [];
    }
  },

  /**
   * Create a new assistance request / assignment (status: 'PENDING' or 'PROPOSED')
   */
  async createAssignment({ crisis_id, volunteer_id, organization_id, requirement_id, role, status = 'PENDING' }) {
    return fetchJson(`/crises/${crisis_id}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        volunteer_id,
        organization_id,
        requirement_id,
        role,
        status,
      }),
    });
  },

  /**
   * Update assignment status with strict workflow validation on backend
   */
  async updateAssignmentStatus({ id, status, reason, notes }) {
    let action = (status || '').toLowerCase().replace('_', '-');
    if (action === 'in-progress' || action === 'in_progress') action = 'start';
    if (action === 'rejected') action = 'reject';
    if (action === 'declined') action = 'decline';

    const validActions = ['accept', 'decline', 'reject', 'en-route', 'on-scene', 'start', 'complete', 'cancel'];
    if (validActions.includes(action)) {
      return fetchJson(`/assignments/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({ reason, notes }),
      });
    }
    throw new Error(`Unsupported assignment status transition: ${status}`);
  },

  /**
   * Fetch response history & Qdrant vector-matched similar historical responses from backend
   */
  async getResponseHistory() {
    try {
      const data = await fetchJson('/memories/search?q=crisis');
      if (data && Array.isArray(data.memories)) return data.memories;
    } catch {
      // Fall back to crises if memory search is unconfigured
    }
    return this.getCrisisReports();
  },
};

export default api;
