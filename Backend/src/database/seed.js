/**
 * CO-RESOLVE Development Seed Data
 * Populates realistic demo data for crises, volunteers, organizations, and resources.
 * Ensures seed data is idempotent and never duplicated on restart.
 */

function seedData(db) {
  // Check if demo data already exists to prevent duplication on restart
  const existingCrisis = db.prepare("SELECT COUNT(*) as count FROM crises WHERE title LIKE '%[DEMO]%'").get();
  if (existingCrisis && existingCrisis.count > 0) {
    return { seeded: false, reason: 'Demo data already exists' };
  }

  const seedTransaction = db.transaction(() => {
    // 1. Seed Volunteers
    const insertVolunteer = db.prepare(`
      INSERT INTO volunteers (name, description, availability, location, experience)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertCapability = db.prepare(`
      INSERT INTO volunteer_capabilities (volunteer_id, capability, experience)
      VALUES (?, ?, ?)
    `);

    // Volunteer 1: Flood Rescue
    const v1Result = insertVolunteer.run(
      'Arun Kumar (Flood Rescue Volunteer)',
      '[DEMO] Certified flood and swift-water rescue operator with Zodiac boat handling certification',
      'IMMEDIATE',
      'Kollam',
      '5 years emergency water rescue'
    );
    insertCapability.run(v1Result.lastInsertRowid, 'Water Rescue', '5 years');
    insertCapability.run(v1Result.lastInsertRowid, 'Boat Operation', '4 years');

    // Volunteer 2: Medical Volunteer
    const v2Result = insertVolunteer.run(
      'Dr. Priya Nair (Medical Volunteer)',
      '[DEMO] Trauma physician with disaster field triage and emergency medical response experience',
      'ON_CALL',
      'Kollam',
      '8 years emergency medicine'
    );
    insertCapability.run(v2Result.lastInsertRowid, 'First Aid & Trauma Care', '8 years');
    insertCapability.run(v2Result.lastInsertRowid, 'Triage Management', '5 years');

    // Volunteer 3: Food Distribution Volunteer
    const v3Result = insertVolunteer.run(
      'Rohan Patel (Food Distribution Volunteer)',
      '[DEMO] Community logistics coordinator experienced in large-scale relief supply distribution',
      'AVAILABLE',
      'Kollam',
      '3 years relief logistics'
    );
    insertCapability.run(v3Result.lastInsertRowid, 'Food Distribution & Logistics', '3 years');
    insertCapability.run(v3Result.lastInsertRowid, 'Crowd Management', '2 years');

    // 2. Seed Organization
    const insertOrg = db.prepare(`
      INSERT INTO organizations (name, description, location, availability, contact)
      VALUES (?, ?, ?, ?, ?)
    `);

    const orgResult = insertOrg.run(
      'Local Relief Organization (Kerala Disaster Relief Network)',
      '[DEMO] Community-coordinated non-profit emergency relief and disaster logistics network',
      'Kollam',
      '24/7',
      '+91-9876543210'
    );
    const orgId = orgResult.lastInsertRowid;

    // 3. Seed Resources
    const insertResource = db.prepare(`
      INSERT INTO resources (name, type, quantity, available_quantity, location, owner_type, owner_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertResource.run(
      '[DEMO] Drinking Water (500L packs)',
      'water',
      500,
      500,
      'Kollam Central Warehouse',
      'ORGANIZATION',
      orgId,
      'AVAILABLE'
    );

    insertResource.run(
      '[DEMO] First Aid Kits',
      'medical',
      150,
      150,
      'District Hospital Relief Depot',
      'ORGANIZATION',
      orgId,
      'AVAILABLE'
    );

    insertResource.run(
      '[DEMO] Food Packages (Ready-to-eat)',
      'food',
      1000,
      1000,
      'Community Center Distribution Hub',
      'ORGANIZATION',
      orgId,
      'AVAILABLE'
    );

    // 4. Seed Crisis
    const insertCrisis = db.prepare(`
      INSERT INTO crises (title, description, type, location, people_affected, priority, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const crisisResult = insertCrisis.run(
      '[DEMO] Flooding affecting a local community',
      '[DEMO] Heavy monsoon rainfall causing severe waterlogging and flash floods in riverside settlements. Approximately 350 residents isolated requiring swift evacuation and emergency supplies.',
      'flood',
      'Kollam Riverside District',
      350,
      'HIGH',
      'COORDINATING'
    );
    const crisisId = crisisResult.lastInsertRowid;

    // 5. Seed Crisis Requirements
    const insertRequirement = db.prepare(`
      INSERT INTO crisis_requirements (crisis_id, capability, quantity, priority, fulfilled_quantity, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertRequirement.run(crisisId, 'Water Rescue', 3, 'HIGH', 1, 'IN_PROGRESS');
    insertRequirement.run(crisisId, 'First Aid & Trauma Care', 2, 'HIGH', 0, 'OPEN');
    insertRequirement.run(crisisId, 'Food Distribution & Logistics', 5, 'MEDIUM', 0, 'OPEN');

    // 6. Seed Initial Crisis Events
    const insertEvent = db.prepare(`
      INSERT INTO crisis_events (crisis_id, event_type, message, actor_type, actor_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertEvent.run(crisisId, 'CRISIS_REPORTED', '[DEMO] Crisis reported: Flash flooding in low-lying riverside sector', 'CITIZEN', 1);
    insertEvent.run(crisisId, 'AI_ANALYSIS_COMPLETED', '[DEMO] Automated triage assessment completed: Priority set to HIGH', 'SYSTEM', 0);
    insertEvent.run(crisisId, 'REQUIREMENTS_IDENTIFIED', '[DEMO] Evacuation boat teams, trauma medical personnel, and packaged food requested', 'COORDINATOR', 2);

    return { seeded: true, crisisId, orgId };
  });

  return seedTransaction();
}

module.exports = { seedData };
