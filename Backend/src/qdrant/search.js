const { getQdrantClient, DEFAULT_COLLECTION } = require('./client');

/**
 * Execute semantic vector search against Qdrant collection
 *
 * @param {object} params
 * @param {number[]} params.vector - Query embedding vector
 * @param {number} [params.limit=10] - Maximum candidate points to return
 * @param {object} [params.filter] - Optional Qdrant filter object
 * @param {string} [params.collectionName] - Target collection
 * @returns {Promise<Array<{ id: string|number, score: number, payload: object }>>}
 */
async function searchCandidates({ vector, limit = 10, filter = null, collectionName = DEFAULT_COLLECTION }) {
  const client = getQdrantClient();

  try {
    const searchParams = {
      vector,
      limit,
      with_payload: true,
    };

    if (filter) {
      searchParams.filter = filter;
    }

    const results = await client.search(collectionName, searchParams);

    return (results || []).map((item) => ({
      id: item.id,
      score: item.score,
      payload: item.payload,
    }));
  } catch (err) {
    const error = new Error(`Qdrant search error: ${err.message}`);
    error.statusCode = 502;
    error.code = 'QDRANT_SEARCH_ERROR';
    throw error;
  }
}

module.exports = {
  searchCandidates,
};
