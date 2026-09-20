const crypto = require('crypto');
const { getDb, getAllVolunteers } = require('../database/db');
const { getQdrantClient, DEFAULT_COLLECTION } = require('./client');
const { ensureCollection } = require('./collections');
const { generateEmbeddings } = require('./embeddingService');

/**
 * Generate a deterministic RFC 4122 compliant UUID v4 format string
 * from entity type and ID to guarantee idempotent indexing.
 */
function generatePointId(entityType, entityId) {
  const hash = crypto.createHash('md5').update(`${entityType}:${entityId}`).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
}

/**
 * Build semantic capability text for a volunteer
 */
function buildVolunteerSemanticText(v) {
  const caps = (v.capabilities || []).map((c) => c.capability).join(', ');
  const exp = (v.capabilities || []).map((c) => `${c.capability} (${c.experience || 'experienced'})`).join('; ');
  return `Volunteer responder: ${v.name}.
Description: ${v.description || 'Emergency crisis volunteer'}.
Capabilities: ${caps || 'General disaster relief'}.
Experience: ${v.experience || exp || 'Field experience'}.
Location: ${v.location || 'Unspecified'}.
Availability: ${v.availability || 'Available'}.`;
}

/**
 * Build semantic capability text for an organization
 */
function buildOrganizationSemanticText(o) {
  return `Relief Organization: ${o.name}.
Description: ${o.description || 'Emergency relief coordination and aid delivery'}.
Location: ${o.location || 'Regional hub'}.
Availability: ${o.availability || '24/7'}.
Contact: ${o.contact || 'Emergency dispatch'}.`;
}

/**
 * Build semantic capability text for a resource
 */
function buildResourceSemanticText(r) {
  return `Emergency Resource: ${r.name}.
Resource Type: ${r.type}.
Quantity: ${r.quantity}, Available Units: ${r.available_quantity}.
Location: ${r.location || 'Central warehouse'}.
Status: ${r.status || 'AVAILABLE'}.`;
}

/**
 * Read structured data from SQLite and index it into Qdrant idempotently
 *
 * @param {string} [collectionName] - Target collection
 * @returns {Promise<object>} Summary of indexed points
 */
async function indexCapabilities(collectionName = DEFAULT_COLLECTION) {
  // 1. Ensure collection exists
  await ensureCollection(collectionName);
  const client = getQdrantClient();
  const db = getDb();

  // 2. Fetch records from SQLite
  const volunteers = getAllVolunteers();
  const organizations = db.prepare('SELECT * FROM organizations').all();
  const resources = db.prepare('SELECT * FROM resources').all();

  const items = [];

  // Build volunteer semantic items
  for (const v of volunteers) {
    items.push({
      id: generatePointId('volunteer', v.id),
      text: buildVolunteerSemanticText(v),
      payload: {
        entity_type: 'volunteer',
        entity_id: v.id,
        name: v.name,
        location: v.location,
        availability: v.availability,
        capabilities: (v.capabilities || []).map((c) => c.capability),
      },
    });
  }

  // Build organization semantic items
  for (const o of organizations) {
    items.push({
      id: generatePointId('organization', o.id),
      text: buildOrganizationSemanticText(o),
      payload: {
        entity_type: 'organization',
        entity_id: o.id,
        name: o.name,
        location: o.location,
        availability: o.availability,
        capabilities: ['disaster_relief', 'aid_distribution', 'crisis_logistics'],
      },
    });
  }

  // Build resource semantic items
  for (const r of resources) {
    items.push({
      id: generatePointId('resource', r.id),
      text: buildResourceSemanticText(r),
      payload: {
        entity_type: 'resource',
        entity_id: r.id,
        name: r.name,
        type: r.type,
        location: r.location,
        quantity: r.quantity,
        available_quantity: r.available_quantity,
        status: r.status,
      },
    });
  }

  if (items.length === 0) {
    return { indexedCount: 0, volunteers: 0, organizations: 0, resources: 0 };
  }

  // 3. Generate embeddings for all items in batch
  const texts = items.map((i) => i.text);
  const embeddings = await generateEmbeddings(texts);

  // 4. Assemble Qdrant points
  const points = items.map((item, idx) => ({
    id: item.id,
    vector: embeddings[idx],
    payload: item.payload,
  }));

  // 5. Upsert points into Qdrant (deterministic IDs make this idempotent)
  await client.upsert(collectionName, {
    wait: true,
    points,
  });

  return {
    indexedCount: points.length,
    volunteers: volunteers.length,
    organizations: organizations.length,
    resources: resources.length,
  };
}

module.exports = {
  indexCapabilities,
  generatePointId,
  buildVolunteerSemanticText,
  buildOrganizationSemanticText,
  buildResourceSemanticText,
};
