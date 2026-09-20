const express = require('express');
const router = express.Router();
const {
  createResource,
  getAllResources,
  getResourceById,
  dispatchResource,
  releaseResource,
} = require('../database/db');

/**
 * POST /api/resources
 * Register a new aid resource
 */
router.post('/', (req, res) => {
  try {
    const { name, capability, type, resource_type, quantity = 1, location, contact } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const resType = (type || resource_type || capability || 'GENERAL').toString().trim();
    const qty = parseInt(quantity, 10);
    const validQty = isNaN(qty) || qty <= 0 ? 1 : qty;

    const resource = createResource({
      name: name.trim(),
      type: resType,
      quantity: validQty,
      available_quantity: validQty,
      location: location ? location.trim() : null,
      status: 'AVAILABLE',
    });

    return res.status(201).json(resource);
  } catch (err) {
    console.error('Error creating resource:', err.message);
    return res.status(500).json({ error: 'Failed to create resource' });
  }
});

/**
 * GET /api/resources
 * List resources with optional query filters (type, status, location)
 */
router.get('/', (req, res) => {
  try {
    const { type, status, location } = req.query || {};
    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (location) filters.location = location;

    const resources = getAllResources(filters);
    return res.status(200).json(resources);
  } catch (err) {
    console.error('Error fetching resources:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/resources/:id
 * Retrieve a single resource by ID
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    const resource = getResourceById(id);
    if (!resource) {
      return res.status(404).json({ error: `Resource #${id} not found` });
    }

    return res.status(200).json(resource);
  } catch (err) {
    console.error('Error fetching resource:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/resources/:id/dispatch
 * Dispatch resource to a crisis
 */
router.post('/:id/dispatch', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    const { crisis_id, crisisId, quantity } = req.body || {};
    const targetCrisisId = crisisId !== undefined ? crisisId : crisis_id;

    if (!targetCrisisId) {
      return res.status(400).json({ error: 'crisis_id is required' });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    try {
      const updatedResource = dispatchResource({
        resourceId: id,
        crisisId: targetCrisisId,
        quantity: parsedQty,
        actor_type: 'COORDINATOR',
      });
      return res.status(200).json(updatedResource);
    } catch (dispatchErr) {
      if (dispatchErr.statusCode) {
        return res.status(dispatchErr.statusCode).json({ error: dispatchErr.message });
      }
      throw dispatchErr;
    }
  } catch (err) {
    console.error('Error dispatching resource:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/resources/:id/release
 * Release/return resource from a crisis back to available inventory
 */
router.post('/:id/release', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid resource ID' });
    }

    const { crisis_id, crisisId, quantity } = req.body || {};
    const targetCrisisId = crisisId !== undefined ? crisisId : crisis_id;

    if (!targetCrisisId) {
      return res.status(400).json({ error: 'crisis_id is required' });
    }

    const parsedQty = parseInt(quantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      return res.status(400).json({ error: 'quantity must be a positive integer' });
    }

    try {
      const updatedResource = releaseResource({
        resourceId: id,
        crisisId: targetCrisisId,
        quantity: parsedQty,
        actor_type: 'COORDINATOR',
      });
      return res.status(200).json(updatedResource);
    } catch (releaseErr) {
      if (releaseErr.statusCode) {
        return res.status(releaseErr.statusCode).json({ error: releaseErr.message });
      }
      throw releaseErr;
    }
  } catch (err) {
    console.error('Error releasing resource:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
