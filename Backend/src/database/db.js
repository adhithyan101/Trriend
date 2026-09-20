const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { initSchema } = require('./schema');
const { seedData } = require('./seed');

// Resolved database path (defaults to data/co-resolve.db)
const defaultDbPath = path.resolve(__dirname, '../../data/co-resolve.db');
const DB_PATH = process.env.DB_PATH || defaultDbPath;

let dbInstance = null;

/**
 * Initialize database, directory, schema, and seed data.
 */
function initDb(customPath) {
  const targetPath = customPath || DB_PATH;

  // Ensure data directory exists
  const dbDir = path.dirname(targetPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Open database connection
  const db = new Database(targetPath);

  // Enable foreign keys and WAL mode for performance & safety
  db.pragma('foreign_keys = ON;');
  db.pragma('journal_mode = WAL;');

  // Apply schema definitions
  initSchema(db);

  // Apply idempotent development seed data
  seedData(db);

  dbInstance = db;
  return dbInstance;
}

/**
 * Get active database instance or initialize if not ready.
 */
function getDb() {
  if (!dbInstance) {
    initDb();
  }
  return dbInstance;
}

// ==========================================
// Database Access Layer Functions
// ==========================================

/**
 * Health check: verify SQLite is responding.
 */
function getDbHealth() {
  const db = getDb();
  const row = db.prepare('SELECT 1 AS alive').get();
  if (row && row.alive === 1) {
    return {
      status: 'ok',
      database: 'sqlite',
    };
  }
  throw new Error('Database ping failed');
}

/**
 * Crises operations
 */
function createCrisis({
  title,
  description = null,
  type = null,
  location = null,
  latitude = null,
  longitude = null,
  people_affected = 0,
  peopleAffected,
  priority = 'MEDIUM',
  status = 'REPORTED',
  assistance_needed = null,
  assistanceNeeded = null,
  requirements = null,
  actor_type = 'CITIZEN',
  actor_id = null,
}) {
  const countAffected = peopleAffected !== undefined ? peopleAffected : people_affected;

  // Normalize assistance array
  const rawAssistance = assistance_needed || assistanceNeeded || requirements;
  let assistanceArray = [];
  if (Array.isArray(rawAssistance)) {
    assistanceArray = rawAssistance.filter(item => typeof item === 'string' && item.trim());
  } else if (typeof rawAssistance === 'string' && rawAssistance.trim()) {
    assistanceArray = rawAssistance.split(',').map(s => s.trim()).filter(Boolean);
  }

  const assistanceJson = assistanceArray.length > 0 ? JSON.stringify(assistanceArray) : null;
  const db = getDb();

  const createTx = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO crises (title, description, type, location, latitude, longitude, people_affected, priority, status, assistance_needed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(title, description, type, location, latitude, longitude, countAffected, priority, status, assistanceJson);
    const crisisId = info.lastInsertRowid;

    // Create crisis requirements for each assistance capability if provided
    if (assistanceArray.length > 0) {
      const reqStmt = db.prepare(`
        INSERT INTO crisis_requirements (crisis_id, capability, quantity, priority, fulfilled_quantity, status)
        VALUES (?, ?, ?, ?, 0, 'OPEN')
      `);

      for (const cap of assistanceArray) {
        reqStmt.run(crisisId, cap, 1, priority);
      }
    }

    // Record initial timeline event
    db.prepare(`
      INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
      VALUES (?, 'CRISIS_REPORTED', ?, ?, ?)
    `).run(crisisId, `Crisis reported: ${title}`, actor_type, actor_id);

    return getCrisisById(crisisId);
  });

  return createTx();
}

function getCrisisById(id) {
  const db = getDb();
  const crisis = db.prepare('SELECT * FROM crises WHERE id = ?').get(id);
  return crisis || null;
}

function updateCrisis(id, updates = {}) {
  const db = getDb();
  const allowedFields = {
    title: 'title',
    description: 'description',
    type: 'type',
    location: 'location',
    people_affected: 'people_affected',
    peopleAffected: 'people_affected',
    priority: 'priority',
  };

  const setClauses = [];
  const params = [];

  for (const [key, col] of Object.entries(allowedFields)) {
    if (updates[key] !== undefined) {
      // Avoid duplicate column assignments if both camel and snake case provided
      if (!setClauses.some((clause) => clause.startsWith(`${col} =`))) {
        setClauses.push(`${col} = ?`);
        params.push(updates[key]);
      }
    }
  }

  if (setClauses.length === 0) {
    return getCrisisById(id);
  }

  setClauses.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  const sql = `UPDATE crises SET ${setClauses.join(', ')} WHERE id = ?`;
  db.prepare(sql).run(...params);
  return getCrisisById(id);
}

function updateCrisisStatus(id, status) {
  const db = getDb();
  db.prepare('UPDATE crises SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  return getCrisisById(id);
}

function applyCrisisAnalysis(crisisId, analysis) {
  const db = getDb();
  const applyTx = db.transaction(() => {
    // 1. Update crisis fields from AI analysis
    const updateStmt = db.prepare(`
      UPDATE crises
      SET type = ?, priority = ?, people_affected = ?, status = 'ANALYZING', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    updateStmt.run(
      analysis.crisisType,
      analysis.priority,
      analysis.peopleAffected,
      crisisId
    );

    // 2. Safe requirement replacement (delete old requirements for this crisis)
    db.prepare('DELETE FROM crisis_requirements WHERE crisis_id = ?').run(crisisId);

    // 3. Insert new AI-identified requirements
    const insertReqStmt = db.prepare(`
      INSERT INTO crisis_requirements (crisis_id, capability, quantity, priority, fulfilled_quantity, status)
      VALUES (?, ?, ?, ?, 0, 'OPEN')
    `);

    for (const req of analysis.requirements || []) {
      insertReqStmt.run(crisisId, req.capability, req.quantity, req.priority);
    }

    // 4. Create timeline events
    const eventStmt = db.prepare(`
      INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
      VALUES (?, ?, ?, 'SYSTEM', 0)
    `);

    eventStmt.run(crisisId, 'CRISIS_ANALYSIS_COMPLETED', analysis.summary);

    const reqSummary = (analysis.requirements || [])
      .map((r) => `${r.capability} (${r.quantity})`)
      .join(', ');
    eventStmt.run(
      crisisId,
      'REQUIREMENTS_IDENTIFIED',
      `Requirements identified: ${reqSummary || 'None specified'}`
    );

    return getCrisisById(crisisId);
  });

  return applyTx();
}

function getAllCrises(filters = {}) {
  const db = getDb();
  let query = 'SELECT * FROM crises';
  const conditions = [];
  const params = [];

  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.priority) {
    conditions.push('priority = ?');
    params.push(filters.priority);
  }
  if (filters.type) {
    conditions.push('LOWER(type) = LOWER(?)');
    params.push(filters.type);
  }
  if (filters.location) {
    conditions.push('LOWER(location) = LOWER(?)');
    params.push(filters.location);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';
  return db.prepare(query).all(...params);
}

/**
 * Crisis Requirements operations
 */
function createRequirement({
  crisis_id,
  capability,
  quantity = 1,
  priority = 'MEDIUM',
  fulfilled_quantity = 0,
  status = 'OPEN',
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO crisis_requirements (crisis_id, capability, quantity, priority, fulfilled_quantity, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(crisis_id, capability, quantity, priority, fulfilled_quantity, status);
  return db.prepare('SELECT * FROM crisis_requirements WHERE id = ?').get(info.lastInsertRowid);
}

function getRequirementsByCrisis(crisisId) {
  const db = getDb();
  return db.prepare('SELECT * FROM crisis_requirements WHERE crisis_id = ? ORDER BY id ASC').all(crisisId);
}

/**
 * Volunteers operations
 */
function createVolunteer({
  name,
  description = null,
  availability = 'AVAILABLE',
  location = null,
  experience = null,
  latitude = null,
  longitude = null,
  capabilities = [],
}) {
  const db = getDb();
  const insertVolunteerTx = db.transaction(() => {
    const stmt = db.prepare(`
      INSERT INTO volunteers (name, description, availability, location, experience, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, description, availability, location, experience, latitude, longitude);
    const volunteerId = info.lastInsertRowid;

    if (Array.isArray(capabilities) && capabilities.length > 0) {
      const capStmt = db.prepare(`
        INSERT INTO volunteer_capabilities (volunteer_id, capability, experience)
        VALUES (?, ?, ?)
      `);
      for (const cap of capabilities) {
        if (typeof cap === 'string') {
          capStmt.run(volunteerId, cap, null);
        } else if (cap && cap.capability) {
          capStmt.run(volunteerId, cap.capability, cap.experience || null);
        }
      }
    }
    return volunteerId;
  });

  const id = insertVolunteerTx();
  return getVolunteerById(id);
}

function getVolunteerById(id) {
  const db = getDb();
  const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(id);
  if (!volunteer) return null;

  const capabilities = db.prepare('SELECT * FROM volunteer_capabilities WHERE volunteer_id = ?').all(id);
  return { ...volunteer, capabilities };
}

function getAllVolunteers(filters = {}) {
  const db = getDb();
  let query = 'SELECT * FROM volunteers';
  const conditions = [];
  const params = [];

  if (filters.availability) {
    conditions.push('availability = ?');
    params.push(filters.availability);
  }
  if (filters.location) {
    conditions.push('location = ?');
    params.push(filters.location);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';
  const volunteers = db.prepare(query).all(...params);

  const getCapsStmt = db.prepare('SELECT capability, experience FROM volunteer_capabilities WHERE volunteer_id = ?');
  return volunteers.map((v) => ({
    ...v,
    capabilities: getCapsStmt.all(v.id),
  }));
}

/**
 * Format assignment database row for JSON response
 */
function formatAssignment(row) {
  if (!row) return null;
  return {
    id: row.id,
    crisis_id: row.crisis_id,
    crisisId: row.crisis_id,
    volunteer_id: row.volunteer_id,
    volunteerId: row.volunteer_id,
    organization_id: row.organization_id,
    organizationId: row.organization_id,
    requirement_id: row.requirement_id,
    requirementId: row.requirement_id,
    role: row.role,
    status: row.status,
    created_at: row.created_at,
    createdAt: row.created_at,
    accepted_at: row.accepted_at || null,
    acceptedAt: row.accepted_at || null,
    started_at: row.started_at || null,
    startedAt: row.started_at || null,
    completed_at: row.completed_at || null,
    completedAt: row.completed_at || null,
    volunteer: row.volunteer_id
      ? {
          id: row.volunteer_id,
          name: row.volunteer_name,
          availability: row.volunteer_availability,
          location: row.volunteer_location,
        }
      : null,
    organization: row.organization_id
      ? {
          id: row.organization_id,
          name: row.organization_name,
          contact: row.organization_contact,
        }
      : null,
    requirement: row.requirement_id
      ? {
          id: row.requirement_id,
          capability: row.requirement_capability,
        }
      : null,
  };
}

/**
 * Format resource database row for JSON response
 */
function formatResource(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    quantity: row.quantity,
    available_quantity: row.available_quantity,
    availableQuantity: row.available_quantity,
    location: row.location,
    owner_type: row.owner_type,
    ownerType: row.owner_type,
    owner_id: row.owner_id,
    ownerId: row.owner_id,
    status: row.status,
    created_at: row.created_at,
    createdAt: row.created_at,
    updated_at: row.updated_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Assignments operations
 */
function getAssignmentById(id) {
  const db = getDb();
  const query = `
    SELECT 
      a.id,
      a.crisis_id,
      a.volunteer_id,
      a.organization_id,
      a.requirement_id,
      a.role,
      a.status,
      a.created_at,
      a.accepted_at,
      a.started_at,
      a.completed_at,
      v.name AS volunteer_name,
      v.availability AS volunteer_availability,
      v.location AS volunteer_location,
      o.name AS organization_name,
      o.contact AS organization_contact,
      r.capability AS requirement_capability
    FROM assignments a
    LEFT JOIN volunteers v ON a.volunteer_id = v.id
    LEFT JOIN organizations o ON a.organization_id = o.id
    LEFT JOIN crisis_requirements r ON a.requirement_id = r.id
    WHERE a.id = ?
  `;
  const row = db.prepare(query).get(id);
  if (!row) return null;
  return formatAssignment(row);
}

function getAssignmentsByCrisis(crisisId) {
  const db = getDb();
  const query = `
    SELECT 
      a.id,
      a.crisis_id,
      a.volunteer_id,
      a.organization_id,
      a.requirement_id,
      a.role,
      a.status,
      a.created_at,
      a.accepted_at,
      a.started_at,
      a.completed_at,
      v.name AS volunteer_name,
      v.availability AS volunteer_availability,
      v.location AS volunteer_location,
      o.name AS organization_name,
      o.contact AS organization_contact,
      r.capability AS requirement_capability
    FROM assignments a
    LEFT JOIN volunteers v ON a.volunteer_id = v.id
    LEFT JOIN organizations o ON a.organization_id = o.id
    LEFT JOIN crisis_requirements r ON a.requirement_id = r.id
    WHERE a.crisis_id = ?
    ORDER BY a.created_at ASC, a.id ASC
  `;
  const rows = db.prepare(query).all(crisisId);
  return rows.map(formatAssignment);
}

function createAssignmentWithFulfillment(data = {}) {
  const targetCrisisId = data.crisisId !== undefined ? data.crisisId : data.crisis_id;
  const targetVolunteerId = data.volunteerId !== undefined && data.volunteerId !== null ? data.volunteerId : (data.volunteer_id ?? null);
  const targetOrgId = data.organizationId !== undefined && data.organizationId !== null ? data.organizationId : (data.organization_id ?? null);
  const targetReqId = data.requirementId !== undefined && data.requirementId !== null ? data.requirementId : (data.requirement_id ?? null);
  const role = data.role ?? null;
  const status = data.status ?? 'ASSIGNED';
  const actor_type = data.actor_type ?? 'COORDINATOR';
  const actor_id = data.actor_id ?? null;

  const db = getDb();
  const tx = db.transaction(() => {
    // 1. Verify crisis exists
    const crisis = db.prepare('SELECT * FROM crises WHERE id = ?').get(targetCrisisId);
    if (!crisis) {
      const err = new Error(`Crisis #${targetCrisisId} not found`);
      err.statusCode = 404;
      throw err;
    }

    // 2. Validate assignee
    if (!targetVolunteerId && !targetOrgId && !role) {
      const err = new Error('At least one of volunteer_id, organization_id, or role must be provided');
      err.statusCode = 400;
      throw err;
    }

    let volunteer = null;
    if (targetVolunteerId) {
      volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(targetVolunteerId);
      if (!volunteer) {
        const err = new Error(`Volunteer #${targetVolunteerId} not found`);
        err.statusCode = 404;
        throw err;
      }
    }

    let org = null;
    if (targetOrgId) {
      org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(targetOrgId);
      if (!org) {
        const err = new Error(`Organization #${targetOrgId} not found`);
        err.statusCode = 404;
        throw err;
      }
    }

    let requirement = null;
    if (targetReqId) {
      requirement = db.prepare('SELECT * FROM crisis_requirements WHERE id = ?').get(targetReqId);
      if (!requirement) {
        const err = new Error(`Requirement #${targetReqId} not found`);
        err.statusCode = 404;
        throw err;
      }
      if (requirement.crisis_id !== Number(targetCrisisId)) {
        const err = new Error(`Requirement #${targetReqId} does not belong to crisis #${targetCrisisId}`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Duplicate active assignment check
    if (targetVolunteerId) {
      let dupQuery = `
        SELECT id FROM assignments 
        WHERE crisis_id = ? AND volunteer_id = ? AND status NOT IN ('REJECTED', 'CANCELLED')
      `;
      const dupParams = [targetCrisisId, targetVolunteerId];
      if (targetReqId) {
        dupQuery += ' AND requirement_id = ?';
        dupParams.push(targetReqId);
      }
      const existing = db.prepare(dupQuery).get(...dupParams);
      if (existing) {
        const err = new Error(
          `Active assignment already exists for volunteer #${targetVolunteerId} on this crisis${
            targetReqId ? ` requirement #${targetReqId}` : ''
          }`
        );
        err.statusCode = 409;
        throw err;
      }
    }

    if (targetOrgId) {
      let dupQuery = `
        SELECT id FROM assignments 
        WHERE crisis_id = ? AND organization_id = ? AND status NOT IN ('REJECTED', 'CANCELLED')
      `;
      const dupParams = [targetCrisisId, targetOrgId];
      if (targetReqId) {
        dupQuery += ' AND requirement_id = ?';
        dupParams.push(targetReqId);
      }
      const existing = db.prepare(dupQuery).get(...dupParams);
      if (existing) {
        const err = new Error(
          `Active assignment already exists for organization #${targetOrgId} on this crisis${
            targetReqId ? ` requirement #${targetReqId}` : ''
          }`
        );
        err.statusCode = 409;
        throw err;
      }
    }

    // 4. Insert assignment
    const insertStmt = db.prepare(`
      INSERT INTO assignments (crisis_id, volunteer_id, organization_id, requirement_id, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = insertStmt.run(
      targetCrisisId,
      targetVolunteerId,
      targetOrgId,
      targetReqId,
      role,
      status
    );
    const assignmentId = info.lastInsertRowid;

    // 5. Update requirement fulfillment if applicable
    if (targetReqId && ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(status)) {
      const currentFulfilled = requirement.fulfilled_quantity || 0;
      const newFulfilled = Math.min(requirement.quantity, currentFulfilled + 1);
      const reqStatus = newFulfilled >= requirement.quantity ? 'FULFILLED' : 'PARTIALLY_FULFILLED';
      db.prepare(`
        UPDATE crisis_requirements
        SET fulfilled_quantity = ?, status = ?
        WHERE id = ?
      `).run(newFulfilled, reqStatus, targetReqId);
    }

    // 6. Crisis status transition:
    // If first assignment created for crisis in REPORTED, ANALYZING, or MATCHING -> moves to COORDINATING
    if (['REPORTED', 'ANALYZING', 'MATCHING'].includes(crisis.status)) {
      db.prepare(`
        UPDATE crises
        SET status = 'COORDINATING', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(targetCrisisId);

      db.prepare(`
        INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
        VALUES (?, 'CRISIS_STATUS_UPDATED', 'Crisis status moved to COORDINATING on assignment creation', ?, ?)
      `).run(targetCrisisId, actor_type, actor_id);
    }

    // 7. Record assignment timeline event
    const eventType = status === 'PROPOSED' ? 'ASSIGNMENT_PROPOSED' : 'ASSIGNMENT_CREATED';
    const assigneeName = volunteer
      ? `volunteer "${volunteer.name}"`
      : org
      ? `organization "${org.name}"`
      : `role "${role || 'unassigned'}"`;
    const eventMessage = `Assignment #${assignmentId} created (${status}) for ${assigneeName} - Role: ${
      role || 'General Responder'
    }`;

    db.prepare(`
      INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(targetCrisisId, eventType, eventMessage, actor_type, actor_id);

    return assignmentId;
  });

  const newId = tx();
  return getAssignmentById(newId);
}

function createAssignment(args) {
  return createAssignmentWithFulfillment(args);
}

const VALID_ASSIGNMENT_TRANSITIONS = {
  PROPOSED: ['PENDING', 'ASSIGNED', 'ACCEPTED', 'REJECTED', 'DECLINED', 'CANCELLED'],
  PENDING: ['ACCEPTED', 'REJECTED', 'DECLINED', 'ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS', 'REJECTED', 'DECLINED', 'CANCELLED'],
  ACCEPTED: ['ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS', 'REJECTED', 'DECLINED', 'CANCELLED'],
  EN_ROUTE: ['ON_SCENE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  ON_SCENE: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  REJECTED: [],
  DECLINED: [],
  COMPLETED: [],
  CANCELLED: [],
};

function updateAssignmentStatus(
  id,
  targetStatus,
  { reason = null, notes = null, actor_type = 'SYSTEM', actor_id = null } = {}
) {
  const db = getDb();
  const tx = db.transaction(() => {
    // 1. Fetch assignment
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
    if (!assignment) {
      const err = new Error(`Assignment #${id} not found`);
      err.statusCode = 404;
      throw err;
    }

    const currentStatus = assignment.status;

    // Check transition
    const allowed = VALID_ASSIGNMENT_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      const err = new Error(`Cannot transition assignment #${id} from ${currentStatus} to ${targetStatus}`);
      err.statusCode = 422;
      throw err;
    }

    // 2. Set status and timestamps
    db.prepare(`
      UPDATE assignments
      SET status = ?,
          accepted_at = CASE WHEN ? IN ('ACCEPTED', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS') AND accepted_at IS NULL THEN CURRENT_TIMESTAMP ELSE accepted_at END,
          started_at = CASE WHEN ? IN ('IN_PROGRESS', 'EN_ROUTE', 'ON_SCENE') AND started_at IS NULL THEN CURRENT_TIMESTAMP ELSE started_at END,
          completed_at = CASE WHEN ? = 'COMPLETED' AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE id = ?
    `).run(targetStatus, targetStatus, targetStatus, targetStatus, id);

    // 3. Crisis status impact:
    // When an assignment becomes active -> crisis status moves to RESPONDING (if currently COORDINATING or MATCHING)
    if (['ACCEPTED', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS'].includes(targetStatus)) {
      const crisis = db.prepare('SELECT * FROM crises WHERE id = ?').get(assignment.crisis_id);
      if (crisis && ['REPORTED', 'COORDINATING', 'MATCHING'].includes(crisis.status)) {
        db.prepare(`
          UPDATE crises
          SET status = 'RESPONDING', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(assignment.crisis_id);

        db.prepare(`
          INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
          VALUES (?, 'CRISIS_STATUS_UPDATED', 'Crisis status moved to RESPONDING as assignment state updated to ${targetStatus}', ?, ?)
        `).run(assignment.crisis_id, actor_type, actor_id);
      }
    }

    // 4. Requirement fulfillment adjustments:
    // If transitioning to REJECTED, DECLINED or CANCELLED, rollback if previously counted
    if (['REJECTED', 'DECLINED', 'CANCELLED'].includes(targetStatus) && assignment.requirement_id) {
      if (['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS'].includes(currentStatus)) {
        const req = db.prepare('SELECT * FROM crisis_requirements WHERE id = ?').get(assignment.requirement_id);
        if (req) {
          const currentFulfilled = req.fulfilled_quantity || 0;
          const newFulfilled = Math.max(0, currentFulfilled - 1);
          const reqStatus = newFulfilled === 0 ? 'OPEN' : newFulfilled < req.quantity ? 'PARTIALLY_FULFILLED' : 'FULFILLED';
          db.prepare(`
            UPDATE crisis_requirements
            SET fulfilled_quantity = ?, status = ?
            WHERE id = ?
          `).run(newFulfilled, reqStatus, assignment.requirement_id);
        }
      }
    }

    // If transitioning from PENDING/PROPOSED to an active state (ACCEPTED, ASSIGNED, etc.), increment requirement fulfillment
    if (['PROPOSED', 'PENDING'].includes(currentStatus) && ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS'].includes(targetStatus) && assignment.requirement_id) {
      const req = db.prepare('SELECT * FROM crisis_requirements WHERE id = ?').get(assignment.requirement_id);
      if (req) {
        const currentFulfilled = req.fulfilled_quantity || 0;
        const newFulfilled = Math.min(req.quantity, currentFulfilled + 1);
        const reqStatus = newFulfilled >= req.quantity ? 'FULFILLED' : 'PARTIALLY_FULFILLED';
        db.prepare(`
          UPDATE crisis_requirements
          SET fulfilled_quantity = ?, status = ?
          WHERE id = ?
        `).run(newFulfilled, reqStatus, assignment.requirement_id);
      }
    }

    // 5. Record timeline event
    let eventType = 'ASSIGNMENT_UPDATED';
    if (targetStatus === 'ASSIGNED') eventType = 'ASSIGNMENT_ASSIGNED';
    else if (targetStatus === 'ACCEPTED') eventType = 'ASSIGNMENT_ACCEPTED';
    else if (targetStatus === 'REJECTED') eventType = 'ASSIGNMENT_REJECTED';
    else if (targetStatus === 'IN_PROGRESS') eventType = 'ASSIGNMENT_STARTED';
    else if (targetStatus === 'COMPLETED') eventType = 'ASSIGNMENT_COMPLETED';
    else if (targetStatus === 'CANCELLED') eventType = 'ASSIGNMENT_CANCELLED';

    let extra = '';
    if (notes) extra += ` Notes: ${notes}`;
    if (reason) extra += ` Reason: ${reason}`;
    const eventMessage = `Assignment #${id} transitioned from ${currentStatus} to ${targetStatus}.${extra}`;

    db.prepare(`
      INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(assignment.crisis_id, eventType, eventMessage, actor_type, actor_id);

    return id;
  });

  tx();
  return getAssignmentById(id);
}

/**
 * Organizations operations
 */
function getOrganizationById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
}

function getAllOrganizations() {
  const db = getDb();
  return db.prepare('SELECT * FROM organizations ORDER BY id ASC').all();
}

/**
 * Resources operations
 */
function createResource({
  name,
  type = 'GENERAL',
  quantity = 1,
  available_quantity,
  location = null,
  owner_type = null,
  owner_id = null,
  status = 'AVAILABLE',
}) {
  const availQty = available_quantity !== undefined ? available_quantity : quantity;
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO resources (name, type, quantity, available_quantity, location, owner_type, owner_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(name, type, quantity, availQty, location, owner_type, owner_id, status);
  return getResourceById(info.lastInsertRowid);
}

function getResourceById(id) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(id);
  if (!row) return null;
  return formatResource(row);
}

function getAllResources(filters = {}) {
  const db = getDb();
  let query = 'SELECT * FROM resources';
  const conditions = [];
  const params = [];

  if (filters.type) {
    conditions.push('type = ?');
    params.push(filters.type);
  }
  if (filters.status) {
    conditions.push('status = ?');
    params.push(filters.status);
  }
  if (filters.location) {
    conditions.push('location LIKE ?');
    params.push(`%${filters.location}%`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY id ASC';
  const rows = db.prepare(query).all(...params);
  return rows.map(formatResource);
}

function dispatchResource({ resourceId, crisisId, quantity, actor_type = 'COORDINATOR', actor_id = null }) {
  const db = getDb();
  const tx = db.transaction(() => {
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId);
    if (!resource) {
      const err = new Error(`Resource #${resourceId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const crisis = db.prepare('SELECT * FROM crises WHERE id = ?').get(crisisId);
    if (!crisis) {
      const err = new Error(`Crisis #${crisisId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      const err = new Error('Quantity must be a positive integer');
      err.statusCode = 400;
      throw err;
    }

    if (resource.available_quantity < qty) {
      const err = new Error(
        `Insufficient available quantity: ${resource.available_quantity} available, ${qty} requested`
      );
      err.statusCode = 422;
      throw err;
    }

    const newAvailable = resource.available_quantity - qty;
    const newStatus = newAvailable === 0 ? 'DEPLETED' : 'AVAILABLE';

    db.prepare(`
      UPDATE resources
      SET available_quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newAvailable, newStatus, resourceId);

    db.prepare(`
      INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
      VALUES (?, 'RESOURCE_DISPATCHED', ?, ?, ?)
    `).run(
      crisisId,
      `Dispatched ${qty} unit(s) of resource "${resource.name}" (ID: ${resource.id}) to crisis #${crisisId}`,
      actor_type,
      actor_id
    );

    return resourceId;
  });

  const resId = tx();
  return getResourceById(resId);
}

function releaseResource({ resourceId, crisisId, quantity, actor_type = 'COORDINATOR', actor_id = null }) {
  const db = getDb();
  const tx = db.transaction(() => {
    const resource = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId);
    if (!resource) {
      const err = new Error(`Resource #${resourceId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const crisis = db.prepare('SELECT * FROM crises WHERE id = ?').get(crisisId);
    if (!crisis) {
      const err = new Error(`Crisis #${crisisId} not found`);
      err.statusCode = 404;
      throw err;
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      const err = new Error('Quantity must be a positive integer');
      err.statusCode = 400;
      throw err;
    }

    if (resource.available_quantity + qty > resource.quantity) {
      const err = new Error(
        `Cannot release ${qty} units: available (${resource.available_quantity}) + released (${qty}) exceeds total capacity (${resource.quantity})`
      );
      err.statusCode = 422;
      throw err;
    }

    const newAvailable = resource.available_quantity + qty;
    const newStatus = 'AVAILABLE';

    db.prepare(`
      UPDATE resources
      SET available_quantity = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newAvailable, newStatus, resourceId);

    db.prepare(`
      INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
      VALUES (?, 'RESOURCE_RELEASED', ?, ?, ?)
    `).run(
      crisisId,
      `Released ${qty} unit(s) of resource "${resource.name}" (ID: ${resource.id}) from crisis #${crisisId}`,
      actor_type,
      actor_id
    );

    return resourceId;
  });

  const resId = tx();
  return getResourceById(resId);
}

/**
 * Crisis Events & Timeline operations
 */
function createCrisisEvent({
  crisis_id,
  event_type,
  message,
  actor_type = 'SYSTEM',
  actor_id = null,
}) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(crisis_id, event_type, message, actor_type, actor_id);
  return db.prepare('SELECT * FROM crisis_events WHERE id = ?').get(info.lastInsertRowid);
}

function getCrisisTimeline(crisisId) {
  const db = getDb();
  return db.prepare('SELECT * FROM crisis_events WHERE crisis_id = ? ORDER BY created_at ASC, id ASC').all(crisisId);
}

/**
 * Crisis Resolution operations
 */
function resolveCrisis({
  crisis_id,
  crisisId,
  outcome = 'RESOLVED',
  summary,
  requirements_summary = null,
  requirementsSummary = null,
  lessons_learned = null,
  lessonsLearned = null,
  metrics = null,
  actor_type = 'COORDINATOR',
  actor_id = null,
}) {
  const targetCrisisId = crisisId !== undefined ? crisisId : crisis_id;
  const targetReqSummary = requirementsSummary !== undefined ? requirementsSummary : requirements_summary;
  const targetLessons = lessonsLearned !== undefined ? lessonsLearned : lessons_learned;

  if (!targetCrisisId) {
    const err = new Error('crisis_id is required');
    err.statusCode = 400;
    throw err;
  }

  if (!summary || typeof summary !== 'string' || !summary.trim()) {
    const err = new Error('summary is required and must be a non-empty string');
    err.statusCode = 400;
    throw err;
  }

  const validOutcomes = ['SUCCESS', 'PARTIAL', 'ESCALATED', 'RESOLVED'];
  const normalizedOutcome = outcome && validOutcomes.includes(outcome.toUpperCase())
    ? outcome.toUpperCase()
    : 'RESOLVED';

  const db = getDb();
  const tx = db.transaction(() => {
    // 1. Validate crisis
    const crisis = db.prepare('SELECT * FROM crises WHERE id = ?').get(targetCrisisId);
    if (!crisis) {
      const err = new Error(`Crisis #${targetCrisisId} not found`);
      err.statusCode = 404;
      throw err;
    }

    if (crisis.status === 'RESOLVED') {
      const err = new Error(`Crisis #${targetCrisisId} is already resolved`);
      err.statusCode = 400;
      throw err;
    }

    if (crisis.status === 'CANCELLED') {
      const err = new Error(`Cannot resolve crisis #${targetCrisisId} because it is cancelled`);
      err.statusCode = 400;
      throw err;
    }

    // 2. Update crisis status to RESOLVED
    db.prepare(`
      UPDATE crises
      SET status = 'RESOLVED',
          resolved_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(targetCrisisId);

    // 3. Serialize metrics
    const metricsStr = metrics ? (typeof metrics === 'string' ? metrics : JSON.stringify(metrics)) : null;

    // 4. Upsert crisis resolution record
    const insertResStmt = db.prepare(`
      INSERT INTO crisis_resolutions (
        crisis_id, outcome, summary, requirements_summary, lessons_learned, metrics
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(crisis_id) DO UPDATE SET
        outcome = excluded.outcome,
        summary = excluded.summary,
        requirements_summary = excluded.requirements_summary,
        lessons_learned = excluded.lessons_learned,
        metrics = excluded.metrics,
        created_at = CURRENT_TIMESTAMP
    `);
    insertResStmt.run(
      targetCrisisId,
      normalizedOutcome,
      summary.trim(),
      targetReqSummary ? targetReqSummary.trim() : null,
      targetLessons ? targetLessons.trim() : null,
      metricsStr
    );

    // 5. Record crisis event on timeline
    db.prepare(`
      INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
      VALUES (?, 'CRISIS_RESOLVED', ?, ?, ?)
    `).run(
      targetCrisisId,
      `Crisis resolved with outcome: ${normalizedOutcome}. Summary: ${summary.trim()}`,
      actor_type,
      actor_id
    );

    return targetCrisisId;
  });

  const resolvedId = tx();
  return getCrisisResolution(resolvedId);
}

function getCrisisResolution(crisisId) {
  const db = getDb();
  const query = `
    SELECT 
      cr.id,
      cr.crisis_id,
      cr.outcome,
      cr.summary,
      cr.requirements_summary,
      cr.lessons_learned,
      cr.metrics,
      cr.created_at,
      c.title AS crisis_title,
      c.type AS crisis_type,
      c.location AS crisis_location,
      c.priority AS crisis_priority,
      c.status AS crisis_status,
      c.created_at AS crisis_created_at,
      c.resolved_at AS crisis_resolved_at
    FROM crisis_resolutions cr
    JOIN crises c ON cr.crisis_id = c.id
    WHERE cr.crisis_id = ?
  `;
  const row = db.prepare(query).get(crisisId);
  if (!row) return null;

  let parsedMetrics = null;
  if (row.metrics) {
    try {
      parsedMetrics = JSON.parse(row.metrics);
    } catch {
      parsedMetrics = row.metrics;
    }
  }

  return {
    id: row.id,
    crisis_id: row.crisis_id,
    crisisId: row.crisis_id,
    outcome: row.outcome,
    summary: row.summary,
    requirements_summary: row.requirements_summary,
    requirementsSummary: row.requirements_summary,
    lessons_learned: row.lessons_learned,
    lessonsLearned: row.lessons_learned,
    metrics: parsedMetrics,
    createdAt: row.created_at,
    crisis: {
      id: row.crisis_id,
      title: row.crisis_title,
      type: row.crisis_type,
      location: row.crisis_location,
      priority: row.crisis_priority,
      status: row.crisis_status,
      createdAt: row.crisis_created_at,
      resolvedAt: row.crisis_resolved_at,
    },
  };
}

function getCrisisSummaryContext(crisisId) {
  const db = getDb();
  const crisis = db.prepare('SELECT * FROM crises WHERE id = ?').get(crisisId);
  if (!crisis) return null;

  const requirements = getRequirementsByCrisis(crisisId);
  const assignments = getAssignmentsByCrisis(crisisId);
  const events = getCrisisTimeline(crisisId);

  // Compute operational statistics
  const totalRequirements = requirements.length;
  const fulfilledRequirements = requirements.filter(r => r.status === 'FULFILLED').length;
  const partiallyFulfilled = requirements.filter(r => r.status === 'PARTIALLY_FULFILLED').length;
  const openRequirements = requirements.filter(r => r.status === 'OPEN').length;

  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'COMPLETED').length;
  const activeAssignments = assignments.filter(a => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'].includes(a.status)).length;
  const cancelledAssignments = assignments.filter(a => ['REJECTED', 'CANCELLED'].includes(a.status)).length;

  // Resource dispatch events from timeline
  const dispatchEvents = events.filter(e => e.event_type === 'RESOURCE_DISPATCHED');
  const releaseEvents = events.filter(e => e.event_type === 'RESOURCE_RELEASED');

  return {
    crisis: {
      id: crisis.id,
      title: crisis.title,
      description: crisis.description,
      type: crisis.type,
      location: crisis.location,
      peopleAffected: crisis.people_affected,
      priority: crisis.priority,
      status: crisis.status,
      createdAt: crisis.created_at,
    },
    requirements,
    assignments,
    events,
    metrics: {
      totalRequirements,
      fulfilledRequirements,
      partiallyFulfilled,
      openRequirements,
      totalAssignments,
      completedAssignments,
      activeAssignments,
      cancelledAssignments,
      totalResourceDispatches: dispatchEvents.length,
      totalResourceReleases: releaseEvents.length,
    },
  };
}

function verifyAuthToken(authHeader, requiredRole = null) {
  if (!authHeader) return { authenticated: false, authorized: false, error: 'Authorization token missing' };
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim();
  if (!token) return { authenticated: false, authorized: false, error: 'Authorization token missing' };

  try {
    const db = getDb();
    const row = db.prepare(`
      SELECT u.id, u.email, u.role, u.volunteer_id, u.organization_id, s.expires_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ?
    `).get(token);

    if (!row) {
      return { authenticated: false, authorized: false, error: 'Invalid or expired session token' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (row.expires_at < nowStr) {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return { authenticated: false, authorized: false, error: 'Session expired' };
    }

    if (requiredRole && row.role !== requiredRole) {
      return { authenticated: true, authorized: false, error: `Access denied. Requires ${requiredRole} role.` };
    }

    return { authenticated: true, authorized: true, user: row };
  } catch (err) {
    return { authenticated: false, authorized: false, error: 'Database session lookup failed' };
  }
}

module.exports = {
  initDb,
  getDb,
  getDbHealth,
  verifyAuthToken,
  createCrisis,
  getCrisisById,
  updateCrisis,
  updateCrisisStatus,
  applyCrisisAnalysis,
  getAllCrises,
  createRequirement,
  getRequirementsByCrisis,
  createVolunteer,
  getVolunteerById,
  getAllVolunteers,
  getOrganizationById,
  getAllOrganizations,
  createAssignment,
  createAssignmentWithFulfillment,
  getAssignmentById,
  getAssignmentsByCrisis,
  updateAssignmentStatus,
  createResource,
  getResourceById,
  getAllResources,
  dispatchResource,
  releaseResource,
  createCrisisEvent,
  getCrisisTimeline,
  resolveCrisis,
  getCrisisResolution,
  getCrisisSummaryContext,
};
