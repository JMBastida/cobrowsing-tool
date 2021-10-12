const { newError, errorIfExists, errorIfNotExists } = require('../../../shared/helpers/errors.helper');
const entityRepository = require('./entity.repository');
const { ENTITY_STATUS, DEFAULT_MODULES } = require('./entity.enums');

async function validateCode(code) {
  if (!code) return false;
  const query = { code };
  const entities = await entityRepository.find(query);
  return !entities.length;
}

async function generateCode(length) {
  let code = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  const isValidCode = await validateCode(code);
  if (!isValidCode) code = await generateCode(length);
  return code;
}

async function find(filter = {}, options = {}) {
  const [entities, total] = await Promise.all([
    entityRepository.find(filter, options),
    entityRepository.count(filter),
  ]);

  return { entities, total };
}

async function validateInsertEntity(entity) {
  const { companyEmail } = entity;
  if (!companyEmail) {
    throw newError(400, 'Required fields not given', 'ENTITY.ERROR.INSERT.REQUIRED.DETAIL', 'ENTITY.ERROR.INSERT.REQUIRED.DETAIL');
  }

  const query = { companyEmail };
  const entities = await entityRepository.find(query);
  errorIfExists(entities && entities.length, 'Email in use', 400, 'ENTITY.ERROR.INSERT.EXISTING.EMAIL_SUMMARY', 'ENTITY.ERROR.INSERT.EXISTING.EMAIL_DETAIL');
}

async function validateUpdateEntity(entity) {
  const { _id, code, companyEmail } = entity;
  if (!_id) {
    throw newError(400, 'Required fields not given', 'ENTITY.ERROR.UPDATE.REQUIRED.DETAIL', 'ENTITY.ERROR.UPDATE.REQUIRED.DETAIL');
  }

  const entities = await entityRepository.find({ _id });
  const [current] = entities;
  errorIfNotExists(current, 'Entity doesn\'t exist', 400, 'ENTITY.ERROR.UPDATE.EXISTING.SUMMARY', 'ENTITY.ERROR.UPDATE.EXISTING.DETAIL');
  if (code && current.code !== code) {
    const isValidCode = await validateCode(code);
    errorIfNotExists(isValidCode, 'Invalid code', 400, 'ENTITY.ERROR.UPDATE.INVLAID.SUMMARY', 'ENTITY.ERROR.UPDATE.INVLAID.DETAIL');
  }

  if (companyEmail && current.companyEmail !== companyEmail) {
    const entitiesFound = await entityRepository.find({ companyEmail });
    const [existing] = entitiesFound;
    errorIfExists(existing, `Invalid company email: ${companyEmail}`, 400, 'ENTITY.ERROR.UPDATE.INVLAID.SUMMARY', 'ENTITY.ERROR.UPDATE.INVLAID.DETAIL');
  }
}

async function updateOne(entity) {
  await validateUpdateEntity(entity);
  const entityParsed = { ...entity, modificationDate: new Date() };
  const entityUpdated = await entityRepository.updateOne(entityParsed);
  return entityUpdated;
}

async function insertOne(entity) {
  const code = await generateCode(10);
  const entityParsed = {
    ...entity,
    code,
    status: ENTITY_STATUS.ACTIVE,
    modules: DEFAULT_MODULES,
    creationDate: new Date(),
  };
  await validateInsertEntity(entityParsed);
  const entityCreated = await entityRepository.insertOne(entityParsed);
  return entityCreated;
}

async function deleteMany(filter) {
  await entityRepository.deleteMany(filter);
}

async function dropDatabase(entityId) {
  await entityRepository.dropDatabase(entityId);
}

module.exports = {
  find,
  insertOne,
  updateOne,
  deleteMany,
  dropDatabase,
};
