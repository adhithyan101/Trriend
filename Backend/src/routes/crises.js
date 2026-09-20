const express = require('express');
const router = express.Router();
const {
  createCrisis,
  getCrisisById,
  updateCrisis,
  updateCrisisStatus,
  applyCrisisAnalysis,
  getAllCrises,
  getRequirementsByCrisis,
  getCrisisTimeline,
  createCrisisEvent,
  createAssignmentWithFulfillment,
  getAssignmentsByCrisis,
  resolveCrisis,
  getCrisisResolution,
} = require('../database/db');
const { analyzeCrisis } = require('../services/triageService');
const { matchCrisis } = require('../services/matchingService');
const { analyzeCrisisResolution } = require('../services/resolutionService');
const { indexCrisisMemory } = require('../qdrant/memoryService');
const { isQdrantConfigured } = require('../qdrant/client');

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const ALLOWED_INITIAL_STATUS = 'REPORTED';

/**
 * Format crisis database row for JSON response
 */
function formatCrisis(row) {
  if (!row) return null;
  let assistanceNeeded = [];
  if (row.assistance_needed) {
    try {
      assistanceNeeded = typeof row.assistance_needed === 'string' && row.assistance_needed.startsWith('[')
        ? JSON.parse(row.assistance_needed)
        : [row.assistance_needed];
    } catch (e) {
      assistanceNeeded = [row.assistance_needed];
    }
  }

  let crisisTypes = [];
  if (row.type) {
    if (typeof row.type === 'string' && row.type.trim().startsWith('[')) {
      try {
        crisisTypes = JSON.parse(row.type);
      } catch (e) {
        crisisTypes = row.type.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (typeof row.type === 'string') {
      crisisTypes = row.type.split(/•|,/).map(s => s.trim()).filter(Boolean);
    } else if (Array.isArray(row.type)) {
      crisisTypes = row.type;
    }
  }
  if (crisisTypes.length === 0) crisisTypes = ['General Emergency'];

  const typeDisplayString = crisisTypes.join(' • ');

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    type: typeDisplayString,
    crisisType: typeDisplayString,
    types: crisisTypes,
    crisisTypes,
    location: row.location,
    peopleAffected: row.people_affected,
    priority: row.priority,
    status: row.status,
    assistanceNeeded,
    assistance_needed: assistanceNeeded,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at || null,
  };
}

/**
 * Format requirement database row for JSON response
 */
function formatRequirement(row) {
  return {
    id: row.id,
    crisisId: row.crisis_id,
    capability: row.capability,
    quantity: row.quantity,
    priority: row.priority,
    fulfilledQuantity: row.fulfilled_quantity,
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * Format crisis event database row for JSON response
 */
function formatEvent(row) {
  return {
    id: row.id,
    crisisId: row.crisis_id,
    eventType: row.event_type,
    message: row.message,
    actorType: row.actor_type,
    actorId: row.actor_id,
    createdAt: row.created_at,
  };
}

/**
 * POST /api/crises
 * Create a new crisis
 */
router.post('/', (req, res) => {
  try {
    const {
      title,
      description,
      type,
      types,
      crisisTypes,
      location,
      peopleAffected,
      people_affected,
      priority = 'MEDIUM',
      status = 'REPORTED',
      assistance_needed,
      assistanceNeeded,
      requirements,
      latitude,
      longitude,
    } = req.body || {};

    const details = [];

    // Required fields validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      details.push('title is required and must be a non-empty string');
    }
    if (!description || typeof description !== 'string' || !description.trim()) {
      details.push('description is required and must be a non-empty string');
    }

    // Normalize crisis types (supports array or string)
    const rawTypes = crisisTypes || types || type;
    let normalizedTypes = [];
    if (Array.isArray(rawTypes)) {
      normalizedTypes = rawTypes.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof rawTypes === 'string' && rawTypes.trim()) {
      if (rawTypes.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(rawTypes);
          if (Array.isArray(parsed)) {
            normalizedTypes = parsed.map(t => String(t).trim()).filter(Boolean);
          }
        } catch (e) {}
      }
      if (normalizedTypes.length === 0) {
        normalizedTypes = rawTypes.split(/•|,/).map(t => t.trim()).filter(Boolean);
      }
    }

    if (normalizedTypes.length === 0) {
      details.push('at least one crisis type is required');
    }

    if (!location || typeof location !== 'string' || !location.trim()) {
      details.push('location is required and must be a non-empty string');
    }

    // peopleAffected validation
    const rawAffected = peopleAffected !== undefined ? peopleAffected : people_affected;
    let normalizedAffected = 0;
    if (rawAffected !== undefined) {
      const num = Number(rawAffected);
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        details.push('peopleAffected must be a non-negative integer');
      } else {
        normalizedAffected = num;
      }
    }

    // Priority validation
    const upperPriority = typeof priority === 'string' ? priority.toUpperCase() : '';
    if (!VALID_PRIORITIES.includes(upperPriority)) {
      details.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
    }

    // Workflow state validation: client cannot set advanced statuses
    if (status && status !== ALLOWED_INITIAL_STATUS) {
      details.push(
        `Initial status must be '${ALLOWED_INITIAL_STATUS}'. Advanced statuses cannot be set directly by clients.`
      );
    }

    if (details.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details,
      });
    }

    const created = createCrisis({
      title: title.trim(),
      description: description.trim(),
      type: JSON.stringify(normalizedTypes),
      location: location.trim(),
      people_affected: normalizedAffected,
      priority: upperPriority,
      status: ALLOWED_INITIAL_STATUS,
      assistance_needed: assistance_needed || assistanceNeeded || requirements,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      actor_type: 'CITIZEN',
    });

    return res.status(201).json(formatCrisis(created));
  } catch (err) {
    console.error('Error creating crisis:', err.message);
    return res.status(500).json({
      error: 'Failed to create crisis',
    });
  }
});

/**
 * GET /api/crises
 * List all crises with optional filters
 */
router.get('/', (req, res) => {
  try {
    const { status, priority, type, location } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority.toUpperCase();
    if (type) filters.type = type;
    if (location) filters.location = location;

    const crises = getAllCrises(filters);
    return res.status(200).json({
      crises: crises.map(formatCrisis),
      count: crises.length,
    });
  } catch (err) {
    console.error('Error listing crises:', err.message);
    return res.status(500).json({
      error: 'Failed to retrieve crises',
    });
  }
});

/**
 * GET /api/crises/:id
 * Retrieve a single crisis by ID
 */
router.get('/:id', (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    const crisis = getCrisisById(crisisId);
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    return res.status(200).json(formatCrisis(crisis));
  } catch (err) {
    console.error('Error fetching crisis:', err.message);
    return res.status(500).json({
      error: 'Failed to retrieve crisis',
    });
  }
});

/**
 * PATCH /api/crises/:id
 * Update basic crisis fields
 */
router.patch('/:id', (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    const existing = getCrisisById(crisisId);
    if (!existing) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    // Check if crisis is already resolved or cancelled
    if (existing.status === 'RESOLVED' || existing.status === 'CANCELLED') {
      return res.status(400).json({
        error: `Cannot update a crisis that is ${existing.status}`,
      });
    }

    // Reject direct status updates
    if (req.body.status !== undefined) {
      return res.status(400).json({
        error: 'Direct status updates are not allowed. Status transitions are controlled by backend workflow.',
      });
    }

    const {
      title,
      description,
      type,
      location,
      peopleAffected,
      people_affected,
      priority,
    } = req.body || {};

    const details = [];
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        details.push('title must be a non-empty string');
      } else {
        updates.title = title.trim();
      }
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || !description.trim()) {
        details.push('description must be a non-empty string');
      } else {
        updates.description = description.trim();
      }
    }

    if (type !== undefined) {
      if (typeof type !== 'string' || !type.trim()) {
        details.push('type must be a non-empty string');
      } else {
        updates.type = type.trim();
      }
    }

    if (location !== undefined) {
      if (typeof location !== 'string' || !location.trim()) {
        details.push('location must be a non-empty string');
      } else {
        updates.location = location.trim();
      }
    }

    const rawAffected = peopleAffected !== undefined ? peopleAffected : people_affected;
    if (rawAffected !== undefined) {
      const num = Number(rawAffected);
      if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
        details.push('peopleAffected must be a non-negative integer');
      } else {
        updates.people_affected = num;
      }
    }

    if (priority !== undefined) {
      const upperPriority = typeof priority === 'string' ? priority.toUpperCase() : '';
      if (!VALID_PRIORITIES.includes(upperPriority)) {
        details.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
      } else {
        updates.priority = upperPriority;
      }
    }

    if (details.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details,
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid updatable fields provided',
      });
    }

    const updated = updateCrisis(crisisId, updates);

    // Record timeline update event
    createCrisisEvent({
      crisis_id: crisisId,
      event_type: 'CRISIS_UPDATED',
      message: `Crisis details updated: ${Object.keys(updates).join(', ')}`,
      actor_type: 'USER',
    });

    return res.status(200).json(formatCrisis(updated));
  } catch (err) {
    console.error('Error updating crisis:', err.message);
    return res.status(500).json({
      error: 'Failed to update crisis',
    });
  }
});

/**
 * GET /api/crises/:id/requirements
 * Retrieve requirements for a crisis
 */
router.get('/:id/requirements', (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    const crisis = getCrisisById(crisisId);
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    const requirements = getRequirementsByCrisis(crisisId);
    return res.status(200).json({
      crisisId,
      requirements: requirements.map(formatRequirement),
    });
  } catch (err) {
    console.error('Error fetching requirements:', err.message);
    return res.status(500).json({
      error: 'Failed to retrieve requirements',
    });
  }
});

/**
 * GET /api/crises/:id/timeline
 * Retrieve timeline events for a crisis
 */
router.get('/:id/timeline', (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    const crisis = getCrisisById(crisisId);
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    const events = getCrisisTimeline(crisisId);
    return res.status(200).json({
      crisisId,
      events: events.map(formatEvent),
    });
  } catch (err) {
    console.error('Error fetching timeline:', err.message);
    return res.status(500).json({
      error: 'Failed to retrieve timeline',
    });
  }
});

/**
 * POST /api/crises/:id/analyze
 * Run AI Triage Agent on crisis and store structured output
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    // 1. GET crisis from SQLite & validate existence
    const crisis = getCrisisById(crisisId);
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    // 2. Validate crisis state
    if (crisis.status === 'RESOLVED' || crisis.status === 'CANCELLED') {
      return res.status(400).json({
        error: `Cannot analyze a crisis that is already ${crisis.status}`,
      });
    }

    // 3. Verify OpenAI configuration before transitioning status
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return res.status(503).json({
        error: 'OpenAI configuration unavailable',
        message: 'OPENAI_API_KEY is not configured in the environment',
      });
    }

    const previousStatus = crisis.status;

    // 4. Set crisis status to ANALYZING
    updateCrisisStatus(crisisId, 'ANALYZING');

    let analysis;
    try {
      // 5. Run Triage Agent via service
      analysis = await analyzeCrisis(crisis);
    } catch (agentErr) {
      // Revert status to previous valid state if analysis failed
      try {
        updateCrisisStatus(crisisId, previousStatus);
      } catch (revertErr) {
        console.error('Failed to revert crisis status after agent failure:', revertErr.message);
      }

      if (agentErr.statusCode === 503) {
        return res.status(503).json({
          error: 'OpenAI configuration unavailable',
          message: agentErr.message,
        });
      }

      return res.status(502).json({
        error: 'AI analysis failed',
        message: agentErr.message,
      });
    }

    // 6. Update crisis in DB, store requirements, and create timeline events
    const updatedCrisis = applyCrisisAnalysis(crisisId, analysis);

    // 7. Return structured response (without chain-of-thought)
    return res.status(200).json({
      crisis: {
        id: updatedCrisis.id,
        status: updatedCrisis.status,
        type: updatedCrisis.type,
        priority: updatedCrisis.priority,
        location: updatedCrisis.location,
        peopleAffected: updatedCrisis.people_affected,
      },
      analysis: {
        crisisType: analysis.crisisType,
        priority: analysis.priority,
        peopleAffected: analysis.peopleAffected,
        requirements: (analysis.requirements || []).map((req) => ({
          capability: req.capability,
          quantity: req.quantity,
          priority: req.priority,
        })),
        summary: analysis.summary,
      },
    });
  } catch (err) {
    console.error('Unexpected error in crisis analysis route:', err.message);
    return res.status(500).json({
      error: 'Unexpected server error during crisis analysis',
    });
  }
});

/**
 * POST /api/crises/:id/match
 * Perform semantic Qdrant search and Matching Agent evaluation
 */
router.post('/:id/match', async (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    // 1. Load crisis from SQLite
    const crisis = getCrisisById(crisisId);
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    // 2. Validate state
    if (crisis.status === 'RESOLVED' || crisis.status === 'CANCELLED') {
      return res.status(400).json({
        error: `Cannot perform matching on a crisis that is ${crisis.status}`,
      });
    }

    const previousStatus = crisis.status;

    // 3. Transition crisis status to MATCHING
    updateCrisisStatus(crisisId, 'MATCHING');

    let matchingResult;
    try {
      matchingResult = await matchCrisis(crisisId);
    } catch (matchErr) {
      // Revert status if matching fails
      try {
        updateCrisisStatus(crisisId, previousStatus);
      } catch (revErr) {
        console.error('Failed to revert status after matching error:', revErr.message);
      }

      if (matchErr.statusCode === 503) {
        return res.status(503).json({
          error: 'Configuration unavailable',
          message: matchErr.message,
        });
      }
      if (matchErr.statusCode === 400) {
        return res.status(400).json({
          error: matchErr.message,
        });
      }
      return res.status(503).json({
        error: 'Matching service unavailable',
        message: matchErr.message,
      });
    }

    // 6. Record MATCHING_COMPLETED timeline event
    createCrisisEvent({
      crisis_id: crisisId,
      event_type: 'MATCHING_COMPLETED',
      message: `Matching completed: ${matchingResult.recommendations.length} candidate recommendations generated. ${matchingResult.summary}`,
      actor_type: 'SYSTEM',
    });

    const updatedCrisis = getCrisisById(crisisId);

    return res.status(200).json({
      crisis: {
        id: updatedCrisis.id,
        status: updatedCrisis.status,
        type: updatedCrisis.type,
        priority: updatedCrisis.priority,
      },
      recommendations: matchingResult.recommendations || [],
      matched_volunteers: matchingResult.matched_volunteers || [],
      matched_resources: matchingResult.matched_resources || [],
      matched_organizations: matchingResult.matched_organizations || [],
      total_matches: matchingResult.total_matches ?? ((matchingResult.recommendations || []).length),
      summary: matchingResult.summary || 'Matching completed.',
    });
  } catch (err) {
    console.error('Unexpected error in crisis matching route:', err.message);
    return res.status(500).json({
      error: 'Unexpected server error during crisis matching',
    });
  }
});

/**
 * POST /api/crises/:id/assignments
 * Human coordinator creates/approves assignment from candidate or manually
 */
router.post('/:id/assignments', (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(400).json({ error: 'Invalid crisis ID' });
    }

    const crisis = getCrisisById(crisisId);
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    const {
      volunteer_id,
      volunteerId,
      organization_id,
      organizationId,
      requirement_id,
      requirementId,
      role,
      status = 'ASSIGNED',
    } = req.body || {};

    const targetVolunteerId = volunteerId !== undefined ? volunteerId : volunteer_id;
    const targetOrgId = organizationId !== undefined ? organizationId : organization_id;
    const targetReqId = requirementId !== undefined ? requirementId : requirement_id;

    if (!targetVolunteerId && !targetOrgId && !role) {
      return res.status(400).json({
        error: 'At least one of volunteer_id, organization_id, or role must be provided',
      });
    }

    const validStatuses = ['PROPOSED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid initial assignment status: ${status}. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    try {
      const assignment = createAssignmentWithFulfillment({
        crisis_id: crisisId,
        volunteer_id: targetVolunteerId,
        organization_id: targetOrgId,
        requirement_id: targetReqId,
        role: role || null,
        status: status || 'ASSIGNED',
        actor_type: 'COORDINATOR',
      });

      return res.status(201).json(assignment);
    } catch (createErr) {
      if (createErr.statusCode) {
        return res.status(createErr.statusCode).json({ error: createErr.message });
      }
      if (createErr.code === 'SQLITE_CONSTRAINT' || createErr.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return res.status(409).json({
          error: 'Active assignment already exists for this assignee on this crisis requirement',
        });
      }
      throw createErr;
    }
  } catch (err) {
    console.error('Error creating assignment on crisis:', err.message);
    return res.status(500).json({
      error: 'Unexpected server error while creating assignment',
    });
  }
});

/**
 * GET /api/crises/:id/assignments
 * List all assignments for a crisis
 */
router.get('/:id/assignments', (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(400).json({ error: 'Invalid crisis ID' });
    }

    const crisis = getCrisisById(crisisId);
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    const assignments = getAssignmentsByCrisis(crisisId);
    return res.status(200).json(assignments);
  } catch (err) {
    console.error('Error fetching assignments for crisis:', err.message);
    return res.status(500).json({
      error: 'Unexpected server error while retrieving assignments',
    });
  }
});

/**
 * POST /api/crises/:id/resolve
 * Execute Resolution Agent assessment and resolve crisis authoritatively in SQLite
 */
router.post('/:id/resolve', async (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(400).json({ error: 'Invalid crisis ID' });
    }

    const crisis = getCrisisById(crisisId);
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    if (crisis.status === 'RESOLVED') {
      return res.status(400).json({ error: 'Crisis is already resolved' });
    }

    if (crisis.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Cannot resolve a cancelled crisis' });
    }

    // 1. Analyze crisis with Resolution Agent (or deterministic fallback)
    const analysis = await analyzeCrisisResolution(crisisId);

    // 2. Allow coordinator manual overrides from request body if specified
    const { outcome, summary, lessons_learned, lessonsLearned } = req.body || {};
    const finalOutcome = outcome || analysis.outcome || 'RESOLVED';
    const finalSummary = summary || analysis.summary;
    const finalReqSummary = analysis.requirementsSummary;
    const finalLessons = lessonsLearned || lessons_learned || analysis.lessonsLearned;

    // 3. Authoritatively resolve crisis in SQLite transaction
    const resolution = resolveCrisis({
      crisis_id: crisisId,
      outcome: finalOutcome,
      summary: finalSummary,
      requirements_summary: finalReqSummary,
      lessons_learned: finalLessons,
      metrics: analysis.metrics,
      actor_type: 'COORDINATOR',
    });

    const updatedCrisis = getCrisisById(crisisId);

    // 4. Asynchronously index response memory in Qdrant (graceful fallback if unconfigured)
    let memoryResult = { indexed: false };
    try {
      memoryResult = await indexCrisisMemory(updatedCrisis, resolution);
    } catch (memErr) {
      console.warn('Memory indexing error:', memErr.message);
      memoryResult = { indexed: false, error: memErr.message };
    }

    return res.status(200).json({
      crisis: formatCrisis(updatedCrisis),
      resolution,
      memory: memoryResult,
    });
  } catch (err) {
    console.error('Error resolving crisis:', err.message);
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal server error while resolving crisis' });
  }
});

/**
 * GET /api/crises/:id/resolution
 * Retrieve resolution details for a resolved crisis
 */
router.get('/:id/resolution', (req, res) => {
  try {
    const crisisId = parseInt(req.params.id, 10);
    if (isNaN(crisisId)) {
      return res.status(400).json({ error: 'Invalid crisis ID' });
    }

    const crisis = getCrisisById(crisisId);
    if (!crisis) {
      return res.status(404).json({ error: 'Crisis not found' });
    }

    const resolution = getCrisisResolution(crisisId);
    if (!resolution) {
      return res.status(404).json({
        error: `No resolution found for crisis #${crisisId}. Current crisis status is ${crisis.status}.`,
      });
    }

    return res.status(200).json(resolution);
  } catch (err) {
    console.error('Error fetching resolution:', err.message);
    return res.status(500).json({ error: 'Internal server error while retrieving resolution' });
  }
});

module.exports = router;
