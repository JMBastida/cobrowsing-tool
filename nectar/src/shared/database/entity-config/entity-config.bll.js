const { newError, errorIfExists, errorIfNotExists } = require('../../helpers/errors.helper');
const entityConfigRepository = require('./entity-config.repository');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');

async function find(entityId, filter = {}, options = {}) {
  const query = buildFilterQuery(filter);
  const queryOptions = parseOptions(options);

  const [entityConfigs, total] = await Promise.all([
    entityConfigRepository.find(entityId, query, queryOptions),
    entityConfigRepository.count(entityId, query),
  ]);

  return { entityConfigs, total };
}

async function validateInsertEntityConfig(entityId, entityConfig) {
  const { companyEmail } = entityConfig;
  if (!companyEmail) {
    throw newError(400, 'Required fields not given', 'ENTITY.ERROR.INSERT.REQUIRED.DETAIL', 'ENTITY.ERROR.INSERT.REQUIRED.DETAIL');
  }

  let query = { companyEmail };
  let response = await entityConfigRepository.find(entityId, query);
  errorIfExists(response.entityConfigs && response.entityConfigs.length, 'Email in use', 400, 'ENTITY.ERROR.INSERT.EXISTING.EMAIL_SUMMARY', 'ENTITY.ERROR.INSERT.EXISTING.EMAIL_DETAIL');
}

async function validateUpdateEntityConfig(entityId, _id) {
  if (!_id) {
    throw newError(400, 'Required fields not given', 'ENTITY.ERROR.UPDATE.REQUIRED.DETAIL', 'ENTITY.ERROR.UPDATE.REQUIRED.DETAIL');
  }

  const query = { _id };
  const entityConfigs = await entityConfigRepository.find(entityId, query);
  errorIfNotExists(entityConfigs && entityConfigs.length, 'Entity doesn\'t exist', 400, 'ENTITY.ERROR.UPDATE.EXISTING.DETAIL', 'ENTITY.ERROR.UPDATE.EXISTING.DETAIL');
}

async function updateOne(entityId, entityConfig) {
  await validateUpdateEntityConfig(entityId, entityConfig._id);
  const entityConfigParsed = { ...entityConfig, modificationDate: new Date() };
  const entityConfigUpdated = await entityConfigRepository.updateOne(entityId, entityConfigParsed);
  return entityConfigUpdated;
}

async function insertOne(entityId, entityConfig) {
  const entityConfigParsed = { ...entityConfig, creationDate: new Date() };
  await validateInsertEntityConfig(entityId, entityConfigParsed);
  const entityConfigCreated = await entityConfigRepository.insertOne(entityId, entityConfigParsed);
  return entityConfigCreated;
}

module.exports = {
  find,
  insertOne,
  updateOne,
};
