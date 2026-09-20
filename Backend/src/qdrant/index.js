const client = require('./client');
const collections = require('./collections');
const search = require('./search');
const embeddingService = require('./embeddingService');
const indexer = require('./indexer');

module.exports = {
  ...client,
  ...collections,
  ...search,
  ...embeddingService,
  ...indexer,
};
