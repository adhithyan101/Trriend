/**
 * CO-RESOLVE Database Schema Definition
 * SQLite schema with foreign-key relationships and indices.
 */

function initSchema(db) {
  // Execute schema within a transaction
  db.exec(`
    -- Enable foreign key enforcement
    PRAGMA foreign_keys = ON;

    -- 1. Crises Table
    CREATE TABLE IF NOT EXISTS crises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      people_affected INTEGER DEFAULT 0,
      priority TEXT CHECK(priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
      status TEXT CHECK(status IN ('REPORTED', 'ANALYZING', 'MATCHING', 'COORDINATING', 'RESPONDING', 'RESOLVED', 'CANCELLED')) DEFAULT 'REPORTED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME
    );

    -- 2. Crisis Requirements Table
    CREATE TABLE IF NOT EXISTS crisis_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crisis_id INTEGER NOT NULL,
      capability TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      priority TEXT DEFAULT 'MEDIUM',
      fulfilled_quantity INTEGER DEFAULT 0,
      status TEXT DEFAULT 'OPEN',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (crisis_id) REFERENCES crises(id) ON DELETE CASCADE
    );

    -- 3. Volunteers Table
    CREATE TABLE IF NOT EXISTS volunteers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      availability TEXT,
      location TEXT,
      experience TEXT,
      latitude REAL,
      longitude REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. Volunteer Capabilities Table
    CREATE TABLE IF NOT EXISTS volunteer_capabilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volunteer_id INTEGER NOT NULL,
      capability TEXT NOT NULL,
      experience TEXT,
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE CASCADE
    );

    -- 5. Organizations Table
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      availability TEXT,
      contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Resources Table
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      quantity INTEGER DEFAULT 1,
      available_quantity INTEGER DEFAULT 1,
      location TEXT,
      owner_type TEXT,
      owner_id INTEGER,
      status TEXT DEFAULT 'AVAILABLE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 7. Assignments Table
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crisis_id INTEGER NOT NULL,
      volunteer_id INTEGER,
      organization_id INTEGER,
      requirement_id INTEGER,
      role TEXT,
      status TEXT CHECK(status IN ('PROPOSED', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'REJECTED', 'DECLINED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'PROPOSED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      accepted_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (crisis_id) REFERENCES crises(id) ON DELETE CASCADE,
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
      FOREIGN KEY (requirement_id) REFERENCES crisis_requirements(id) ON DELETE SET NULL
    );

    -- 8. Crisis Events Table (Audit / Timeline)
    CREATE TABLE IF NOT EXISTS crisis_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crisis_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      actor_type TEXT,
      actor_id INTEGER,
      FOREIGN KEY (crisis_id) REFERENCES crises(id) ON DELETE CASCADE
    );

    -- Indices for foreign keys and query performance
    CREATE INDEX IF NOT EXISTS idx_crisis_requirements_crisis_id ON crisis_requirements(crisis_id);
    CREATE INDEX IF NOT EXISTS idx_volunteer_capabilities_volunteer_id ON volunteer_capabilities(volunteer_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_crisis_id ON assignments(crisis_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_volunteer_id ON assignments(volunteer_id);
    CREATE INDEX IF NOT EXISTS idx_assignments_organization_id ON assignments(organization_id);
    CREATE INDEX IF NOT EXISTS idx_crisis_events_crisis_id ON crisis_events(crisis_id);

    -- Unique partial indices for duplicate protection on active assignments
    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment_volunteer 
      ON assignments(crisis_id, requirement_id, volunteer_id) 
      WHERE status NOT IN ('REJECTED', 'DECLINED', 'CANCELLED') AND volunteer_id IS NOT NULL;

    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assignment_org 
      ON assignments(crisis_id, requirement_id, organization_id) 
      WHERE status NOT IN ('REJECTED', 'DECLINED', 'CANCELLED') AND organization_id IS NOT NULL;

    -- 9. Crisis Resolutions Table
    CREATE TABLE IF NOT EXISTS crisis_resolutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      crisis_id INTEGER NOT NULL UNIQUE,
      outcome TEXT CHECK(outcome IN ('SUCCESS', 'PARTIAL', 'ESCALATED', 'RESOLVED')) DEFAULT 'RESOLVED',
      summary TEXT NOT NULL,
      requirements_summary TEXT,
      lessons_learned TEXT,
      metrics TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (crisis_id) REFERENCES crises(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_crisis_resolutions_crisis_id ON crisis_resolutions(crisis_id);
  `);

  // Ensure latitude & longitude & assistance_needed columns exist on pre-existing database tables
  const alterColumns = [
    'ALTER TABLE crises ADD COLUMN latitude REAL',
    'ALTER TABLE crises ADD COLUMN longitude REAL',
    'ALTER TABLE crises ADD COLUMN assistance_needed TEXT',
    'ALTER TABLE volunteers ADD COLUMN latitude REAL',
    'ALTER TABLE volunteers ADD COLUMN longitude REAL',
  ];
  for (const sql of alterColumns) {
    try {
      db.exec(sql);
    } catch (e) {
      // Column already exists or duplicate column error, safe to ignore
    }
  }

  // Seamless migration for assignments CHECK constraint on existing database files
  try {
    const checkStmt = db.prepare("INSERT INTO assignments (crisis_id, status) VALUES (-1, 'PENDING')");
    checkStmt.run();
    db.prepare("DELETE FROM assignments WHERE crisis_id = -1").run();
  } catch (migErr) {
    if (migErr.message && migErr.message.includes('CHECK constraint failed')) {
      try {
        db.exec(`
          PRAGMA foreign_keys = OFF;
          CREATE TABLE assignments_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            crisis_id INTEGER NOT NULL,
            volunteer_id INTEGER,
            organization_id INTEGER,
            requirement_id INTEGER,
            role TEXT,
            status TEXT CHECK(status IN ('PROPOSED', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'REJECTED', 'DECLINED', 'EN_ROUTE', 'ON_SCENE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'PROPOSED',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            accepted_at DATETIME,
            started_at DATETIME,
            completed_at DATETIME,
            FOREIGN KEY (crisis_id) REFERENCES crises(id) ON DELETE CASCADE,
            FOREIGN KEY (volunteer_id) REFERENCES volunteers(id) ON DELETE SET NULL,
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL,
            FOREIGN KEY (requirement_id) REFERENCES crisis_requirements(id) ON DELETE SET NULL
          );
          INSERT INTO assignments_new (id, crisis_id, volunteer_id, organization_id, requirement_id, role, status, created_at, accepted_at, started_at, completed_at)
          SELECT id, crisis_id, volunteer_id, organization_id, requirement_id, role, status, created_at, accepted_at, started_at, completed_at FROM assignments;
          DROP TABLE assignments;
          ALTER TABLE assignments_new RENAME TO assignments;
          PRAGMA foreign_keys = ON;
        `);
      } catch (e) {
        console.warn('Assignments schema migration warning:', e.message);
      }
    }
  }
}

module.exports = { initSchema };
