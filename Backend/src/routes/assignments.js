const express = require('express');
const router = express.Router();
const {
  getAssignmentById,
  updateAssignmentStatus,
} = require('../database/db');

/**
 * GET /api/assignments/:id
 * Retrieve a single assignment by ID
 */
router.get('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const assignment = getAssignmentById(id);
    if (!assignment) {
      return res.status(404).json({ error: `Assignment #${id} not found` });
    }

    return res.status(200).json(assignment);
  } catch (err) {
    console.error('Error fetching assignment:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/assignments/:id/accept
 * Volunteer or organization accepts the assignment
 */
router.patch('/:id/accept', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    try {
      const updated = updateAssignmentStatus(id, 'ACCEPTED', {
        actor_type: 'VOLUNTEER',
      });
      return res.status(200).json(updated);
    } catch (updateErr) {
      if (updateErr.statusCode) {
        return res.status(updateErr.statusCode).json({ error: updateErr.message });
      }
      throw updateErr;
    }
  } catch (err) {
    console.error('Error accepting assignment:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/assignments/:id/reject
 * Volunteer or organization rejects the assignment
 */
router.patch('/:id/reject', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const { reason } = req.body || {};

    try {
      const updated = updateAssignmentStatus(id, 'REJECTED', {
        reason: reason || null,
        actor_type: 'VOLUNTEER',
      });
      return res.status(200).json(updated);
    } catch (updateErr) {
      if (updateErr.statusCode) {
        return res.status(updateErr.statusCode).json({ error: updateErr.message });
      }
      throw updateErr;
    }
  } catch (err) {
    console.error('Error rejecting assignment:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/assignments/:id/decline
 * Volunteer declines the requested assignment
 */
router.patch('/:id/decline', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const { reason } = req.body || {};

    try {
      const updated = updateAssignmentStatus(id, 'DECLINED', {
        reason: reason || null,
        actor_type: 'VOLUNTEER',
      });
      return res.status(200).json(updated);
    } catch (updateErr) {
      if (updateErr.statusCode) {
        return res.status(updateErr.statusCode).json({ error: updateErr.message });
      }
      throw updateErr;
    }
  } catch (err) {
    console.error('Error declining assignment:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/assignments/:id/en-route
 * Volunteer is en route to scene
 */
router.patch('/:id/en-route', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    try {
      const updated = updateAssignmentStatus(id, 'EN_ROUTE', {
        actor_type: 'VOLUNTEER',
      });
      return res.status(200).json(updated);
    } catch (updateErr) {
      if (updateErr.statusCode) {
        return res.status(updateErr.statusCode).json({ error: updateErr.message });
      }
      throw updateErr;
    }
  } catch (err) {
    console.error('Error setting en-route status:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/assignments/:id/on-scene
 * Volunteer arrived on scene
 */
router.patch('/:id/on-scene', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    try {
      const updated = updateAssignmentStatus(id, 'ON_SCENE', {
        actor_type: 'VOLUNTEER',
      });
      return res.status(200).json(updated);
    } catch (updateErr) {
      if (updateErr.statusCode) {
        return res.status(updateErr.statusCode).json({ error: updateErr.message });
      }
      throw updateErr;
    }
  } catch (err) {
    console.error('Error setting on-scene status:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/assignments/:id/start
 * Work started by volunteer or organization
 */
router.patch('/:id/start', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    try {
      const updated = updateAssignmentStatus(id, 'IN_PROGRESS', {
        actor_type: 'VOLUNTEER',
      });
      return res.status(200).json(updated);
    } catch (updateErr) {
      if (updateErr.statusCode) {
        return res.status(updateErr.statusCode).json({ error: updateErr.message });
      }
      throw updateErr;
    }
  } catch (err) {
    console.error('Error starting assignment:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/assignments/:id/complete
 * Work completed by volunteer or organization
 */
router.patch('/:id/complete', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const { notes } = req.body || {};

    try {
      const updated = updateAssignmentStatus(id, 'COMPLETED', {
        notes: notes || null,
        actor_type: 'VOLUNTEER',
      });
      return res.status(200).json(updated);
    } catch (updateErr) {
      if (updateErr.statusCode) {
        return res.status(updateErr.statusCode).json({ error: updateErr.message });
      }
      throw updateErr;
    }
  } catch (err) {
    console.error('Error completing assignment:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/assignments/:id/cancel
 * Assignment cancelled by coordinator
 */
router.patch('/:id/cancel', (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid assignment ID' });
    }

    const { reason } = req.body || {};

    try {
      const updated = updateAssignmentStatus(id, 'CANCELLED', {
        reason: reason || null,
        actor_type: 'COORDINATOR',
      });
      return res.status(200).json(updated);
    } catch (updateErr) {
      if (updateErr.statusCode) {
        return res.status(updateErr.statusCode).json({ error: updateErr.message });
      }
      throw updateErr;
    }
  } catch (err) {
    console.error('Error cancelling assignment:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
