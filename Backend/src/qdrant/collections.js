const { getQdrantClient, DEFAULT_COLLECTION } = require('./client');
const { getVectorDimension } = require('./embeddingService');

const MEMORY_COLLECTION = process.env.QDRANT_MEMORY_COLLECTION || 'co_resolve_memories';

/**
 * Ensure the required capabilities collection exists in Qdrant.
 * Safe to execute repeatedly (idempotent).
 *
 * @param {string} [collectionName] - Optional custom collection name
 * @returns {Promise<object>} Status object
 */
async function ensureCollection(collectionName = DEFAULT_COLLECTION) {
  const client = getQdrantClient();
  const vectorSize = getVectorDimension();

  try {
    const collectionsResult = await client.getCollections();
    const exists = collectionsResult.collections.some((c) => c.name === collectionName);

    if (!exists) {
      await client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: 'Cosine',
        },
      });
      return { collection: collectionName, status: 'created', vectorSize };
    }

    return { collection: collectionName, status: 'exists', vectorSize };
  } catch (err) {
    const error = new Error(`Failed to initialize Qdrant collection '${collectionName}': ${err.message}`);
    error.statusCode = 502;
    error.code = 'QDRANT_COLLECTION_ERROR';
    throw error;
  }
}

/**
 * Ensure the memory collection exists in Qdrant for storing crisis resolutions
 */
async function ensureMemoryCollection(collectionName = MEMORY_COLLECTION) {
  return ensureCollection(collectionName);
}

module.exports = {
  ensureCollection,
  ensureMemoryCollection,
  MEMORY_COLLECTION,
};
