const { QdrantClient } = require('@qdrant/js-client-rest');

const DEFAULT_COLLECTION = process.env.QDRANT_COLLECTION || 'co_resolve_capabilities';

let clientInstance = null;

/**
 * Check if Qdrant environment variables are configured
 */
function isQdrantConfigured() {
  const url = process.env.QDRANT_URL;
  return Boolean(url && url.trim());
}

/**
 * Get or create singleton QdrantClient instance
 * Throws 503 configuration error if QDRANT_URL is not set
 */
function getQdrantClient() {
  if (!isQdrantConfigured()) {
    const error = new Error('Qdrant configuration unavailable: QDRANT_URL is not configured');
    error.statusCode = 503;
    error.code = 'CONFIG_UNAVAILABLE';
    throw error;
  }

  if (!clientInstance) {
    const url = process.env.QDRANT_URL.trim();
    const apiKey = process.env.QDRANT_API_KEY ? process.env.QDRANT_API_KEY.trim() : undefined;

    clientInstance = new QdrantClient({
      url,
      ...(apiKey ? { apiKey } : {}),
    });
  }

  return clientInstance;
}

module.exports = {
  getQdrantClient,
  isQdrantConfigured,
  DEFAULT_COLLECTION,
};
