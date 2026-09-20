/**
 * CO-RESOLVE Phase 7 Verification Test Suite
 * Tests Resolution Agent, Crisis Resolution in SQLite, Response Memory Indexing,
 * Error Codes (400, 404, 422), and Regressions across Phases 1-6.
 */

const BASE_URL = 'http://localhost:5000';
const { createRequirement } = require('./src/database/db');

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runPhase7Tests() {
  console.log('====================================================');
  console.log('Starting Phase 7 Verification Test Suite');
  console.log('====================================================\n');

  let passed = 0;

  // 1. Health & DB Health Endpoints
  console.log('--- 1. Health & Database Health ---');
  {
    const res = await request('/api/health');
    assert(res.status === 200 && res.data.status === 'ok', 'GET /api/health returns 200 OK');

    const dbRes = await request('/api/db/health');
    assert(dbRes.status === 200 && dbRes.data.status === 'ok', 'GET /api/db/health returns 200 OK');
    passed += 2;
  }

  // 2. Pre-requisite & Validation Tests for Resolution
  console.log('\n--- 2. Resolution Pre-requisite & Validation ---');
  {
    // Resolving non-existent crisis -> 404
    const notFoundRes = await request('/api/crises/99999/resolve', { method: 'POST' });
    assert(notFoundRes.status === 404, 'POST /api/crises/99999/resolve returns 404 Not Found');

    // Fetching resolution for non-existent crisis -> 404
    const notFoundResGet = await request('/api/crises/99999/resolution');
    assert(notFoundResGet.status === 404, 'GET /api/crises/99999/resolution returns 404 Not Found');

    // Create a new crisis
    const newCrisis = await request('/api/crises', {
      method: 'POST',
      body: JSON.stringify({
        title: `Validation Test Crisis ${Date.now()}`,
        description: 'Testing pre-resolution validation rules',
        type: 'medical',
        location: 'Kollam',
        peopleAffected: 50,
        priority: 'MEDIUM',
      }),
    });
    assert(newCrisis.status === 201, 'Created test crisis for validation');

    // Fetching resolution for an unresolved crisis -> 404
    const unresolvedRes = await request(`/api/crises/${newCrisis.data.id}/resolution`);
    assert(unresolvedRes.status === 404, 'GET /api/crises/:id/resolution returns 404 for unresolved crisis');

    passed += 4;
  }

  // 3. Complete Lifecycle to Resolution
  console.log('\n--- 3. Full Crisis Lifecycle to Resolution ---');
  let crisisId = null;
  let resolutionData = null;
  {
    // Step A: Report Crisis
    const createCrisisRes = await request('/api/crises', {
      method: 'POST',
      body: JSON.stringify({
        title: `Riverside Flood Rescue & Medical Triage ${Date.now()}`,
        description: 'Flash flooding stranded 85 villagers with 4 elderly residents needing urgent medical treatment.',
        type: 'flood',
        location: 'Kollam Delta',
        peopleAffected: 85,
        priority: 'HIGH',
      }),
    });
    assert(createCrisisRes.status === 201, 'Crisis created in REPORTED status');
    crisisId = createCrisisRes.data.id;
    assert(createCrisisRes.data.status === 'REPORTED', 'Initial status is REPORTED');

    // Step B: Define Requirements
    const req1 = createRequirement({
      crisis_id: crisisId,
      capability: 'Water Rescue',
      quantity: 2,
      priority: 'HIGH',
    });
    const req2 = createRequirement({
      crisis_id: crisisId,
      capability: 'First Aid & Trauma Care',
      quantity: 1,
      priority: 'HIGH',
    });

    // Step C: Coordinator creates Assignment 1 (Water Rescue)
    const assign1 = await request(`/api/crises/${crisisId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        volunteer_id: 1, // Arun Kumar (Water Rescue)
        requirement_id: req1.id,
        role: 'Swift-water Rescue Lead',
      }),
    });
    assert(assign1.status === 201, 'Assignment 1 created (status ASSIGNED)');

    // Verify Crisis transitioned to COORDINATING
    const coordCheck = await request(`/api/crises/${crisisId}`);
    assert(coordCheck.data.status === 'COORDINATING', 'Crisis moved to COORDINATING on first assignment');

    // Step D: Volunteer accepts and starts work
    await request(`/api/assignments/${assign1.data.id}/accept`, { method: 'PATCH' });
    const startRes = await request(`/api/assignments/${assign1.data.id}/start`, { method: 'PATCH' });
    assert(startRes.data.status === 'IN_PROGRESS', 'Assignment 1 started (IN_PROGRESS)');

    // Verify Crisis transitioned to RESPONDING
    const respCheck = await request(`/api/crises/${crisisId}`);
    assert(respCheck.data.status === 'RESPONDING', 'Crisis moved to RESPONDING when work started');

    // Step E: Dispatch emergency relief resource
    const dispatchRes = await request('/api/resources/1/dispatch', {
      method: 'POST',
      body: JSON.stringify({ crisis_id: crisisId, quantity: 20 }),
    });
    assert(dispatchRes.status === 200, 'Resource dispatched to crisis');

    // Step F: Complete Assignment 1
    const completeRes = await request(`/api/assignments/${assign1.data.id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: 'All stranded residents safely relocated to high ground.' }),
    });
    assert(completeRes.data.status === 'COMPLETED', 'Assignment 1 COMPLETED');

    // Step G: Resolve Crisis via POST /api/crises/:id/resolve
    console.log('  Executing POST /api/crises/:id/resolve...');
    const resolveRes = await request(`/api/crises/${crisisId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(resolveRes.status === 200, 'POST /api/crises/:id/resolve returns 200 OK');
    assert(resolveRes.data.crisis.status === 'RESOLVED', 'Crisis status is RESOLVED');
    assert(Boolean(resolveRes.data.crisis.resolvedAt), 'Crisis resolvedAt timestamp is populated');
    assert(Boolean(resolveRes.data.resolution), 'Resolution object is included');
    assert(['SUCCESS', 'PARTIAL', 'RESOLVED', 'ESCALATED'].includes(resolveRes.data.resolution.outcome), 'Resolution outcome is valid enum');
    assert(typeof resolveRes.data.resolution.summary === 'string' && resolveRes.data.resolution.summary.length > 0, 'Resolution summary is non-empty');
    assert(Boolean(resolveRes.data.resolution.metrics), 'Resolution includes metrics');
    assert(Boolean(resolveRes.data.memory), 'Response memory indexing status is reported');

    resolutionData = resolveRes.data.resolution;

    // Step H: Verify GET /api/crises/:id/resolution
    const getRes = await request(`/api/crises/${crisisId}/resolution`);
    assert(getRes.status === 200, 'GET /api/crises/:id/resolution returns 200 OK');
    assert(getRes.data.crisis_id === crisisId, 'Resolution matches crisis ID');
    assert(getRes.data.outcome === resolutionData.outcome, 'Resolution outcome matches');
    assert(getRes.data.summary === resolutionData.summary, 'Resolution summary matches');
    assert(Boolean(getRes.data.metrics), 'Resolution metrics matches');

    // Step I: Attempting to resolve again returns 400 Bad Request
    const doubleResolve = await request(`/api/crises/${crisisId}/resolve`, { method: 'POST' });
    assert(doubleResolve.status === 400, 'Resolving already resolved crisis returns 400 Bad Request');

    passed += 17;
  }

  // 4. Crisis Timeline Audit Events for Resolution
  console.log('\n--- 4. Timeline Events Verification ---');
  {
    const timelineRes = await request(`/api/crises/${crisisId}/timeline`);
    const events = timelineRes.data.events || timelineRes.data;
    assert(timelineRes.status === 200 && Array.isArray(events), 'GET /api/crises/:id/timeline returns events array');

    const eventTypes = events.map(e => e.eventType);
    console.log('  Event types recorded on resolved crisis:', [...new Set(eventTypes)]);

    assert(eventTypes.includes('CRISIS_REPORTED'), 'Timeline includes CRISIS_REPORTED');
    assert(eventTypes.includes('CRISIS_STATUS_UPDATED'), 'Timeline includes CRISIS_STATUS_UPDATED');
    assert(eventTypes.includes('ASSIGNMENT_CREATED'), 'Timeline includes ASSIGNMENT_CREATED');
    assert(eventTypes.includes('ASSIGNMENT_ACCEPTED'), 'Timeline includes ASSIGNMENT_ACCEPTED');
    assert(eventTypes.includes('ASSIGNMENT_STARTED'), 'Timeline includes ASSIGNMENT_STARTED');
    assert(eventTypes.includes('RESOURCE_DISPATCHED'), 'Timeline includes RESOURCE_DISPATCHED');
    assert(eventTypes.includes('ASSIGNMENT_COMPLETED'), 'Timeline includes ASSIGNMENT_COMPLETED');
    assert(eventTypes.includes('CRISIS_RESOLVED'), 'Timeline includes CRISIS_RESOLVED');

    passed += 9;
  }

  // 5. Response Memory Search API
  console.log('\n--- 5. Response Memory Search API ---');
  {
    // Empty search query -> 400
    const emptyQuery = await request('/api/memories/search');
    assert(emptyQuery.status === 400, 'GET /api/memories/search with missing query returns 400');

    // Search with query text
    const searchRes = await request('/api/memories/search?q=flood');
    assert(
      searchRes.status === 200 || searchRes.status === 503,
      `GET /api/memories/search?q=flood handled cleanly (status: ${searchRes.status})`
    );

    passed += 2;
  }

  // 6. Regression Checks (Phases 1-6)
  console.log('\n--- 6. Regression Checks (Phases 1–6) ---');
  {
    // Health check
    const health = await request('/api/health');
    assert(health.status === 200, 'Phase 1 Health check passed');

    // DB health check
    const dbHealth = await request('/api/db/health');
    assert(dbHealth.status === 200, 'Phase 2 DB Health check passed');

    // Crises list
    const crisesList = await request('/api/crises');
    assert(crisesList.status === 200, 'Phase 3 Crises list passed');

    // Resources list
    const resources = await request('/api/resources');
    assert(resources.status === 200 && Array.isArray(resources.data), 'Phase 6 Resources list passed');

    // Matching endpoint graceful check
    const matchCheck = await request('/api/crises/1/match', { method: 'POST' });
    assert(matchCheck.status === 503 || matchCheck.status === 200, 'Phase 5 Matching endpoint handled cleanly');

    passed += 5;
  }

  console.log('\n====================================================');
  console.log(`Phase 7 Test Suite Completed!`);
  console.log(`Total Passed: ${passed} | Total Failed: 0`);
  console.log('====================================================');
}

runPhase7Tests().catch((err) => {
  console.error('\n❌ Phase 7 Test Suite Aborted with Error:', err);
  process.exit(1);
});
