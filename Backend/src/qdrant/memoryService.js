const { getQdrantClient, isQdrantConfigured } = require('./client');
const { generateEmbedding } = require('./embeddingService');
const { ensureMemoryCollection, MEMORY_COLLECTION } = require('./collections');

/**
 * Format crisis and resolution details into a searchable narrative for embedding
 */
function buildMemoryText(crisis, resolution) {
  const parts = [
    `Incident: ${crisis.title || 'Crisis'}`,
    `Type: ${crisis.type || 'general'}`,
    `Location: ${crisis.location || 'unspecified'}`,
    `Priority: ${crisis.priority || 'MEDIUM'}`,
    `People Affected: ${crisis.people_affected ?? crisis.peopleAffected ?? 0}`,
    `Outcome: ${resolution.outcome || 'RESOLVED'}`,
    `Resolution Summary: ${resolution.summary || ''}`,
    `Requirements Assessment: ${resolution.requirements_summary || resolution.requirementsSummary || ''}`,
    `Lessons Learned: ${resolution.lessons_learned || resolution.lessonsLearned || ''}`,
  ];

  if (Array.isArray(resolution.recommendations) && resolution.recommendations.length > 0) {
    parts.push(`Recommendations: ${resolution.recommendations.join('; ')}`);
  }

  return parts.join('\n');
}

/**
 * Index a resolved crisis into Qdrant response memory collection
 *
 * @param {object} crisis - Authoritative crisis record
 * @param {object} resolution - Structured resolution assessment
 * @returns {Promise<object>} Status object
 */
async function indexCrisisMemory(crisis, resolution) {
  if (!isQdrantConfigured()) {
    return {
      indexed: false,
      reason: 'Qdrant is not configured (QDRANT_URL missing). Memory stored locally in SQLite.',
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return {
      indexed: false,
      reason: 'OPENAI_API_KEY is not configured for vector embeddings. Memory stored locally in SQLite.',
    };
  }

  try {
    const client = getQdrantClient();
    await ensureMemoryCollection();

    const textToEmbed = buildMemoryText(crisis, resolution);
    const vector = await generateEmbedding(textToEmbed);

    const point = {
      id: Number(crisis.id),
      vector,
      payload: {
        crisis_id: Number(crisis.id),
        title: crisis.title,
        type: crisis.type,
        location: crisis.location,
        priority: crisis.priority,
        people_affected: crisis.people_affected ?? crisis.peopleAffected ?? 0,
        outcome: resolution.outcome,
        summary: resolution.summary,
        requirements_summary: resolution.requirements_summary || resolution.requirementsSummary || '',
        lessons_learned: resolution.lessons_learned || resolution.lessonsLearned || '',
        metrics: resolution.metrics || null,
        resolved_at: crisis.resolved_at || crisis.resolvedAt || new Date().toISOString(),
        indexed_at: new Date().toISOString(),
      },
    };

    await client.upsert(MEMORY_COLLECTION, {
      wait: true,
      points: [point],
    });

    return {
      indexed: true,
      pointId: crisis.id,
      collection: MEMORY_COLLECTION,
    };
  } catch (err) {
    console.warn(`Failed to index crisis #${crisis.id} memory in Qdrant:`, err.message);
    return {
      indexed: false,
      warning: err.message,
    };
  }
}

/**
 * Search past resolved crisis memories in Qdrant by semantic similarity
 *
 * @param {string} queryText - Query text to search for similar past crises
 * @param {number} [limit=5] - Maximum number of memories to return
 * @returns {Promise<Array<object>>} List of matching crisis memory records with similarity scores
 */
async function searchCrisisMemories(queryText, limit = 5) {
  if (!isQdrantConfigured()) {
    const err = new Error('Qdrant configuration unavailable: QDRANT_URL is not configured');
    err.statusCode = 503;
    throw err;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const err = new Error('OpenAI configuration unavailable: OPENAI_API_KEY is not configured');
    err.statusCode = 503;
    throw err;
  }

  const client = getQdrantClient();
  await ensureMemoryCollection();

  const queryVector = await generateEmbedding(queryText);

  const searchResults = await client.search(MEMORY_COLLECTION, {
    vector: queryVector,
    limit: Math.max(1, Math.min(limit, 50)),
    with_payload: true,
  });

  return searchResults.map((hit) => ({
    crisisId: hit.payload?.crisis_id || hit.id,
    score: hit.score,
    title: hit.payload?.title || 'Unknown',
    type: hit.payload?.type || 'Unknown',
    location: hit.payload?.location || 'Unknown',
    outcome: hit.payload?.outcome || 'RESOLVED',
    summary: hit.payload?.summary || '',
    lessonsLearned: hit.payload?.lessons_learned || '',
    resolvedAt: hit.payload?.resolved_at || null,
    metrics: hit.payload?.metrics || null,
  }));
}

module.exports = {
  indexCrisisMemory,
  searchCrisisMemories,
  buildMemoryText,
};
