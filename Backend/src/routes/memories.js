const express = require('express');
const router = express.Router();
const { searchCrisisMemories } = require('../qdrant/memoryService');

/**
 * GET /api/memories/search
 * Semantic similarity search over past crisis resolutions in Qdrant
 */
router.get('/search', async (req, res) => {
  try {
    const { q, query, limit = 5 } = req.query || {};
    const queryText = (q || query || '').trim();

    if (!queryText) {
      return res.status(400).json({
        error: 'Search query parameter (q or query) is required and must not be empty',
      });
    }

    const parsedLimit = parseInt(limit, 10);
    const validLimit = isNaN(parsedLimit) || parsedLimit <= 0 ? 5 : parsedLimit;

    try {
      const memories = await searchCrisisMemories(queryText, validLimit);
      return res.status(200).json({
        query: queryText,
        count: memories.length,
        memories,
      });
    } catch (searchErr) {
      if (searchErr.statusCode === 503) {
        return res.status(503).json({
          error: 'Memory search unavailable',
          message: searchErr.message,
        });
      }
      throw searchErr;
    }
  } catch (err) {
    console.error('Error searching crisis memories:', err.message);
    return res.status(500).json({
      error: 'Internal server error while searching crisis memories',
    });
  }
});

module.exports = router;
