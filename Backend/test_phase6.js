/**
 * CO-RESOLVE Phase 6 Verification Test Suite
 * Tests Assignments Lifecycle, Resource Coordination, Requirement Fulfillment,
 * Error Codes (400, 404, 409, 422), and Regressions across Phases 1-5.
 */

const BASE_URL = 'http://localhost:5000';

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

async function runTests() {
  console.log('====================================================');
  console.log('Starting Phase 6 Verification Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Health Endpoints (Phase 1 & Phase 2)
  console.log('--- 1. Health & DB Health Endpoints ---');
  {
    const res = await request('/api/health');
    assert(res.status === 200 && res.data.status === 'ok', 'GET /api/health returns 200 OK');

    const dbRes = await request('/api/db/health');
    assert(dbRes.status === 200 && dbRes.data.status === 'ok', 'GET /api/db/health returns 200 OK');
    passed += 2;
  }

  // 2. Resources Management & Dispatch / Release
  console.log('\n--- 2. Resources API (List, Get, Dispatch, Release) ---');
  let initialWaterQty = 0;
  {
    const listRes = await request('/api/resources');
    assert(listRes.status === 200 && Array.isArray(listRes.data), 'GET /api/resources returns array');
    assert(listRes.data.length >= 3, 'Seeded resources exist (at least 3)');

    const filterRes = await request('/api/resources?type=water');
    assert(filterRes.status === 200 && filterRes.data.every(r => r.type === 'water'), 'GET /api/resources?type=water filters correctly');

    const waterRes = await request('/api/resources/1');
    assert(waterRes.status === 200 && waterRes.data.id === 1, 'GET /api/resources/1 returns resource #1');
    initialWaterQty = waterRes.data.available_quantity;

    const notFound = await request('/api/resources/99999');
    assert(notFound.status === 404, 'GET /api/resources/99999 returns 404 Not Found');

    // Dispatch 50 units to Crisis 1
    const dispatchRes = await request('/api/resources/1/dispatch', {
      method: 'POST',
      body: JSON.stringify({ crisis_id: 1, quantity: 50 }),
    });
    assert(dispatchRes.status === 200, 'POST /api/resources/1/dispatch 50 units returns 200 OK');
    assert(dispatchRes.data.available_quantity === initialWaterQty - 50, `Available quantity decremented to ${initialWaterQty - 50}`);

    // Over-dispatch test
    const overDispatch = await request('/api/resources/1/dispatch', {
      method: 'POST',
      body: JSON.stringify({ crisis_id: 1, quantity: 99999 }),
    });
    assert(overDispatch.status === 422 || overDispatch.status === 400, 'Over-dispatch returns 422 or 400 for insufficient quantity');

    // Release 50 units back
    const releaseRes = await request('/api/resources/1/release', {
      method: 'POST',
      body: JSON.stringify({ crisis_id: 1, quantity: 50 }),
    });
    assert(releaseRes.status === 200, 'POST /api/resources/1/release 50 units returns 200 OK');
    assert(releaseRes.data.available_quantity === initialWaterQty, `Available quantity restored to ${initialWaterQty}`);

    // Over-release test (exceeding total capacity)
    const overRelease = await request('/api/resources/1/release', {
      method: 'POST',
      body: JSON.stringify({ crisis_id: 1, quantity: 100 }),
    });
    assert(overRelease.status === 422 || overRelease.status === 400, 'Over-release returns 422 or 400 exceeding total capacity');

    // Missing fields validation
    const missingDispatch = await request('/api/resources/1/dispatch', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    assert(missingDispatch.status === 400, 'Missing dispatch parameters returns 400 Bad Request');
    passed += 8;
  }

  // 3. Crisis Creation & Assignment Lifecycle
  console.log('\n--- 3. Assignment Lifecycle & Crisis State Transitions ---');
  let testCrisisId = null;
  let medicalReq = null;
  let foodReq = null;
  let assignmentId = null;
  {
    // Create a new crisis in REPORTED state
    const createCrisisRes = await request('/api/crises', {
      method: 'POST',
      body: JSON.stringify({
        title: `Flash Flood Test Suite ${Date.now()}`,
        description: 'River embankment breached inundating residential homes. Rapid water rescue required.',
        type: 'flood',
        location: 'Alappuzha',
        peopleAffected: 120,
        priority: 'HIGH',
      }),
    });
    assert(createCrisisRes.status === 201, 'POST /api/crises created test crisis');
    testCrisisId = createCrisisRes.data.id;
    assert(createCrisisRes.data.status === 'REPORTED', 'Test crisis initial status is REPORTED');

    // Add requirements for this test crisis using database helper
    const { createRequirement } = require('./src/database/db');
    medicalReq = createRequirement({
      crisis_id: testCrisisId,
      capability: 'First Aid & Trauma Care',
      quantity: 2,
      priority: 'HIGH',
    });
    foodReq = createRequirement({
      crisis_id: testCrisisId,
      capability: 'Food Distribution & Logistics',
      quantity: 5,
      priority: 'MEDIUM',
    });

    const reqRes = await request(`/api/crises/${testCrisisId}/requirements`);
    const reqList = reqRes.data.requirements || reqRes.data;
    assert(reqRes.status === 200 && Array.isArray(reqList) && reqList.length === 2, `GET /api/crises/${testCrisisId}/requirements returns requirements`);
    const prevFulfilled = medicalReq.fulfilled_quantity || 0;

    // Create assignment: Volunteer 2 (Dr. Priya Nair) on Requirement 1 of Test Crisis
    const createAssignRes = await request(`/api/crises/${testCrisisId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        volunteer_id: 2,
        requirement_id: medicalReq.id,
        role: 'Lead Trauma Physician',
      }),
    });
    assert(createAssignRes.status === 201, `POST /api/crises/${testCrisisId}/assignments returns 201 Created`);
    assignmentId = createAssignRes.data.id;
    assert(createAssignRes.data.status === 'ASSIGNED', 'New assignment defaults to ASSIGNED');
    assert(createAssignRes.data.volunteer && createAssignRes.data.volunteer.id === 2, 'Assignment includes joined volunteer details');

    // Verify crisis status transitioned to COORDINATING
    const crisisCoordCheck = await request(`/api/crises/${testCrisisId}`);
    assert(crisisCoordCheck.data.status === 'COORDINATING', 'Crisis status moved to COORDINATING on assignment creation');

    // Verify requirement fulfilled quantity incremented
    const reqAfter = await request(`/api/crises/${testCrisisId}/requirements`);
    const reqListAfter = reqAfter.data.requirements || reqAfter.data;
    const updatedMedicalReq = reqListAfter.find(r => r.id === medicalReq.id);
    assert(updatedMedicalReq.fulfilledQuantity === prevFulfilled + 1, `Requirement fulfilled quantity incremented to ${prevFulfilled + 1}`);

    // Test Duplicate Assignment Prevention (409 Conflict)
    const dupRes = await request(`/api/crises/${testCrisisId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        volunteer_id: 2,
        requirement_id: medicalReq.id,
        role: 'Duplicate Doctor',
      }),
    });
    assert(dupRes.status === 409, 'Duplicate active assignment for same volunteer returns 409 Conflict');

    // GET /api/crises/:id/assignments
    const listAssignRes = await request(`/api/crises/${testCrisisId}/assignments`);
    assert(listAssignRes.status === 200 && Array.isArray(listAssignRes.data), `GET /api/crises/${testCrisisId}/assignments returns list`);
    assert(listAssignRes.data.some(a => a.id === assignmentId), 'New assignment present in crisis assignments list');

    // GET /api/assignments/:id
    const singleAssign = await request(`/api/assignments/${assignmentId}`);
    assert(singleAssign.status === 200 && singleAssign.data.id === assignmentId, `GET /api/assignments/${assignmentId} returns 200`);

    const notFoundAssign = await request('/api/assignments/99999');
    assert(notFoundAssign.status === 404, 'GET /api/assignments/99999 returns 404 Not Found');

    // PATCH /api/assignments/:id/accept
    const acceptRes = await request(`/api/assignments/${assignmentId}/accept`, {
      method: 'PATCH',
    });
    assert(acceptRes.status === 200 && acceptRes.data.status === 'ACCEPTED', 'PATCH /api/assignments/:id/accept transitions to ACCEPTED');
    assert(Boolean(acceptRes.data.acceptedAt || acceptRes.data.accepted_at), 'acceptedAt timestamp is set');

    // Invalid transition: cannot transition directly from ACCEPTED to COMPLETED without IN_PROGRESS
    const invalidTrans = await request(`/api/assignments/${assignmentId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: 'Skipping work' }),
    });
    assert(invalidTrans.status === 422 || invalidTrans.status === 400, 'Invalid transition ACCEPTED -> COMPLETED rejected with 422/400');

    // PATCH /api/assignments/:id/start -> IN_PROGRESS
    const startRes = await request(`/api/assignments/${assignmentId}/start`, {
      method: 'PATCH',
    });
    assert(startRes.status === 200 && startRes.data.status === 'IN_PROGRESS', 'PATCH /api/assignments/:id/start transitions to IN_PROGRESS');
    assert(Boolean(startRes.data.startedAt || startRes.data.started_at), 'startedAt timestamp is set');

    // Check crisis status transitioned to RESPONDING
    const crisisCheck = await request(`/api/crises/${testCrisisId}`);
    assert(crisisCheck.status === 200 && crisisCheck.data.status === 'RESPONDING', 'Crisis status moved to RESPONDING when assignment started');

    // PATCH /api/assignments/:id/complete -> COMPLETED
    const completeRes = await request(`/api/assignments/${assignmentId}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ notes: 'Field medical triage and treatment completed for 15 patients' }),
    });
    assert(completeRes.status === 200 && completeRes.data.status === 'COMPLETED', 'PATCH /api/assignments/:id/complete transitions to COMPLETED');
    assert(Boolean(completeRes.data.completedAt || completeRes.data.completed_at), 'completedAt timestamp is set');

    // Verify Crisis is NOT marked RESOLVED on assignment completion
    const crisisAfterComplete = await request(`/api/crises/${testCrisisId}`);
    assert(crisisAfterComplete.data.status === 'RESPONDING', 'Crisis remains RESPONDING after assignment completion (resolution is Phase 7)');

    // Verify Terminal status cannot be changed
    const cancelTerminal = await request(`/api/assignments/${assignmentId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Try cancelling completed' }),
    });
    assert(cancelTerminal.status === 422 || cancelTerminal.status === 400, 'Cannot transition out of COMPLETED terminal state (422/400)');

    passed += 15;
  }

  // 4. Requirement Rollback on REJECT and CANCEL
  console.log('\n--- 4. Requirement Rollback on REJECT / CANCEL ---');
  {
    const foodInitialFulfilled = 0;

    // Create assignment for Volunteer 3 (Food Logistics)
    const assign3Res = await request(`/api/crises/${testCrisisId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        volunteer_id: 3,
        requirement_id: foodReq.id,
        role: 'Food Supply Coordinator',
      }),
    });
    assert(assign3Res.status === 201, 'Created assignment for Volunteer 3');
    const assign3Id = assign3Res.data.id;

    // Check requirement fulfilled count incremented
    const reqAfterAssign = await request(`/api/crises/${testCrisisId}/requirements`);
    const reqListAfter = reqAfterAssign.data.requirements || reqAfterAssign.data;
    const foodReqAfter = reqListAfter.find(r => r.id === foodReq.id);
    assert(foodReqAfter.fulfilledQuantity === foodInitialFulfilled + 1, 'Requirement fulfilledQuantity incremented by 1');

    // Cancel assignment
    const cancelRes = await request(`/api/assignments/${assign3Id}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Relief site inaccessible by road' }),
    });
    assert(cancelRes.status === 200 && cancelRes.data.status === 'CANCELLED', 'PATCH /api/assignments/:id/cancel returns CANCELLED');

    // Check requirement fulfilled count rolled back
    const reqAfterCancel = await request(`/api/crises/${testCrisisId}/requirements`);
    const reqListCancel = reqAfterCancel.data.requirements || reqAfterCancel.data;
    const foodReqRolledBack = reqListCancel.find(r => r.id === foodReq.id);
    assert(foodReqRolledBack.fulfilledQuantity === foodInitialFulfilled, 'Requirement fulfilledQuantity successfully rolled back');

    // Verify Volunteer 3 can now be assigned again (cancelled assignment does not block)
    const reassignRes = await request(`/api/crises/${testCrisisId}/assignments`, {
      method: 'POST',
      body: JSON.stringify({
        volunteer_id: 3,
        requirement_id: foodReq.id,
        role: 'Food Supply Coordinator - Reassigned',
      }),
    });
    assert(reassignRes.status === 201, 'Volunteer 3 re-assigned successfully after previous cancellation');

    // Test REJECT flow on the reassigned assignment
    const rejectRes = await request(`/api/assignments/${reassignRes.data.id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason: 'Vehicle mechanical breakdown' }),
    });
    assert(rejectRes.status === 200 && rejectRes.data.status === 'REJECTED', 'PATCH /api/assignments/:id/reject returns REJECTED');

    // Verify rollback after reject
    const reqAfterReject = await request(`/api/crises/${testCrisisId}/requirements`);
    const reqListReject = reqAfterReject.data.requirements || reqAfterReject.data;
    const foodReqAfterReject = reqListReject.find(r => r.id === foodReq.id);
    assert(foodReqAfterReject.fulfilledQuantity === foodInitialFulfilled, 'Requirement fulfilledQuantity rolled back after rejection');

    passed += 7;
  }

  // 5. Crisis Timeline Audit Events
  console.log('\n--- 5. Crisis Timeline Audit Events ---');
  {
    // Dispatch a resource to testCrisisId so it has RESOURCE_DISPATCHED and RESOURCE_RELEASED
    await request('/api/resources/1/dispatch', {
      method: 'POST',
      body: JSON.stringify({ crisis_id: testCrisisId, quantity: 10 }),
    });
    await request('/api/resources/1/release', {
      method: 'POST',
      body: JSON.stringify({ crisis_id: testCrisisId, quantity: 10 }),
    });

    const timelineRes = await request(`/api/crises/${testCrisisId}/timeline`);
    const eventsList = timelineRes.data.events || timelineRes.data;
    assert(timelineRes.status === 200 && Array.isArray(eventsList), `GET /api/crises/${testCrisisId}/timeline returns array`);

    const eventTypes = eventsList.map(e => e.eventType);
    console.log('  Event types recorded in timeline:', [...new Set(eventTypes)]);

    assert(eventTypes.includes('RESOURCE_DISPATCHED'), 'Timeline includes RESOURCE_DISPATCHED');
    assert(eventTypes.includes('RESOURCE_RELEASED'), 'Timeline includes RESOURCE_RELEASED');
    assert(eventTypes.includes('ASSIGNMENT_CREATED'), 'Timeline includes ASSIGNMENT_CREATED');
    assert(eventTypes.includes('ASSIGNMENT_ACCEPTED'), 'Timeline includes ASSIGNMENT_ACCEPTED');
    assert(eventTypes.includes('ASSIGNMENT_STARTED'), 'Timeline includes ASSIGNMENT_STARTED');
    assert(eventTypes.includes('ASSIGNMENT_COMPLETED'), 'Timeline includes ASSIGNMENT_COMPLETED');
    assert(eventTypes.includes('ASSIGNMENT_CANCELLED'), 'Timeline includes ASSIGNMENT_CANCELLED');
    assert(eventTypes.includes('ASSIGNMENT_REJECTED'), 'Timeline includes ASSIGNMENT_REJECTED');

    passed += 9;
  }

  // 6. Regression Check: Phase 3, 4, 5 endpoints
  console.log('\n--- 6. Regression Checks (Phases 3, 4, 5) ---');
  {
    const listCrises = await request('/api/crises');
    const crisesList = listCrises.data.crises || listCrises.data;
    assert(listCrises.status === 200 && Array.isArray(crisesList), 'GET /api/crises returns array of crises');

    const singleCrisis = await request('/api/crises/1');
    assert(singleCrisis.status === 200 && singleCrisis.data.id === 1, 'GET /api/crises/1 returns crisis');

    // Matching endpoint test (should return 503 without crashing if live credentials are not set)
    const matchRes = await request('/api/crises/1/match', { method: 'POST' });
    assert(matchRes.status === 503 || matchRes.status === 200, `POST /api/crises/1/match handled cleanly (status: ${matchRes.status})`);

    passed += 3;
  }

  console.log('\n====================================================');
  console.log(`Phase 6 Test Suite Completed!`);
  console.log(`Total Passed: ${passed} | Total Failed: ${failed}`);
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Aborted with Error:', err);
  process.exit(1);
});
