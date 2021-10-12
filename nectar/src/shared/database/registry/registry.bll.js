const { newError } = require('../../helpers/errors.helper');
const registryRepository = require('./registry.repository');

async function find(filter = {}, options = {}) {
  const [registries, total] = await Promise.all([
    registryRepository.find(filter, options),
    registryRepository.count(filter),
  ]);

  return { registries, total };
}

async function validateInsertRegistry(registry) {
  const { entityId, userId } = registry;
  if (!entityId || !userId) {
    throw newError(400, 'Required fields not given');
  }
}

async function insertOne(registry) {
  validateInsertRegistry(registry);
  const today = new Date();
  const registryParsed = { ...registry, creationDate: today };
  const registryCreated = await registryRepository.insertOne(registryParsed);
  return registryCreated;
}

async function deleteMany(filter) {
  await registryRepository.deleteMany(filter);
}

module.exports = {
  find,
  insertOne,
  deleteMany,
};
