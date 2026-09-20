const express = require('express');
const router = express.Router();
const {
  createVolunteer,
  getVolunteerById,
  getAllVolunteers,
} = require('../database/db');

/**
 * Format volunteer database row for JSON response
 */
function formatVolunteer(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || null,
    availability: row.availability || 'AVAILABLE',
    location: row.location || null,
    experience: row.experience || null,
    latitude: row.latitude !== undefined ? row.latitude : null,
    longitude: row.longitude !== undefined ? row.longitude : null,
    capabilities: row.capabilities || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * POST /api/volunteers
 * Register a new volunteer
 */
router.post('/', (req, res) => {
  try {
    const {
      name,
      description,
      skills,
      capabilities,
      availability = 'AVAILABLE',
      location,
      experience,
      latitude,
      longitude,
    } = req.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: ['name is required and must be a non-empty string'],
      });
    }

    // Convert skills string (comma separated) into capabilities array if needed
    let parsedCaps = capabilities;
    if (!parsedCaps && typeof skills === 'string' && skills.trim()) {
      parsedCaps = skills.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (typeof skills === 'string' && skills.trim() && Array.isArray(parsedCaps)) {
      const extra = skills.split(',').map((s) => s.trim()).filter(Boolean);
      parsedCaps = Array.from(new Set([...parsedCaps, ...extra]));
    }

    const newVolunteer = createVolunteer({
      name: name.trim(),
      description: description ? description.trim() : null,
      availability: typeof availability === 'string' ? availability.toUpperCase() : 'AVAILABLE',
      location: location ? location.trim() : null,
      experience: experience ? experience.trim() : null,
      latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
      capabilities: parsedCaps || [],
    });

    return res.status(201).json(formatVolunteer(newVolunteer));
  } catch (err) {
    console.error('Error creating volunteer:', err.message);
    return res.status(500).json({
      error: 'Failed to create volunteer',
    });
  }
});

/**
 * GET /api/volunteers
 * List volunteers with optional filters
 */
router.get('/', (req, res) => {
  try {
    const { availability, location } = req.query || {};
    const filters = {};
    if (availability) filters.availability = availability.toUpperCase();
    if (location) filters.location = location;

    const volunteers = getAllVolunteers(filters);
    return res.status(200).json({
      volunteers: volunteers.map(formatVolunteer),
      count: volunteers.length,
    });
  } catch (err) {
    console.error('Error listing volunteers:', err.message);
    return res.status(500).json({
      error: 'Failed to retrieve volunteers',
    });
  }
});

/**
 * GET /api/volunteers/:id
 * Retrieve single volunteer by ID
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    const volunteer = getVolunteerById(id);
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }

    return res.status(200).json(formatVolunteer(volunteer));
  } catch (err) {
    console.error('Error fetching volunteer:', err.message);
    return res.status(500).json({
      error: 'Failed to retrieve volunteer',
    });
  }
});

module.exports = router;
