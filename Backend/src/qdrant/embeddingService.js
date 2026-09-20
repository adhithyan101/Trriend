const { OpenAI } = require('openai');

const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const VECTOR_DIMENSION = 1536;

let openaiClient = null;

/**
 * Get or create OpenAI client instance for embeddings
 */
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    const error = new Error('OPENAI_API_KEY is not configured in the environment');
    error.statusCode = 503;
    error.code = 'CONFIG_UNAVAILABLE';
    throw error;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey.trim(),
    });
  }

  return openaiClient;
}

/**
 * Get active embedding model name
 */
function getEmbeddingModel() {
  return process.env.OPENAI_EMBEDDING_MODEL ? process.env.OPENAI_EMBEDDING_MODEL.trim() : DEFAULT_EMBEDDING_MODEL;
}

/**
 * Determine vector dimension based on model
 */
function getVectorDimension(model = getEmbeddingModel()) {
  if (model === 'text-embedding-3-large') {
    return 3072;
  }
  return VECTOR_DIMENSION;
}

/**
 * Generate a single vector embedding from text
 *
 * @param {string} text - Natural language description to embed
 * @returns {Promise<number[]>} Float vector of length 1536
 */
async function generateEmbedding(text) {
  const client = getOpenAIClient();
  const model = getEmbeddingModel();

  try {
    const response = await client.embeddings.create({
      model,
      input: text.trim(),
    });
    return response.data[0].embedding;
  } catch (err) {
    let safeMessage = err.message || 'Failed to generate embedding';
    safeMessage = safeMessage.replace(/sk-[a-zA-Z0-9*_-]+/g, '[REDACTED]');

    const error = new Error(safeMessage);
    error.statusCode = err.status === 401 || err.status === 403 ? 503 : 502;
    error.code = 'EMBEDDING_PROVIDER_ERROR';
    throw error;
  }
}

/**
 * Generate batch embeddings for multiple texts
 *
 * @param {string[]} texts - Array of natural language descriptions
 * @returns {Promise<number[][]>} Array of float vectors
 */
async function generateEmbeddings(texts) {
  if (!texts || texts.length === 0) return [];

  const client = getOpenAIClient();
  const model = getEmbeddingModel();

  try {
    const response = await client.embeddings.create({
      model,
      input: texts.map((t) => t.trim()),
    });
    return response.data.map((item) => item.embedding);
  } catch (err) {
    let safeMessage = err.message || 'Failed to generate batch embeddings';
    safeMessage = safeMessage.replace(/sk-[a-zA-Z0-9*_-]+/g, '[REDACTED]');

    const error = new Error(safeMessage);
    error.statusCode = err.status === 401 || err.status === 403 ? 503 : 502;
    error.code = 'EMBEDDING_PROVIDER_ERROR';
    throw error;
  }
}

module.exports = {
  generateEmbedding,
  generateEmbeddings,
  getEmbeddingModel,
  getVectorDimension,
  DEFAULT_EMBEDDING_MODEL,
  VECTOR_DIMENSION,
};
