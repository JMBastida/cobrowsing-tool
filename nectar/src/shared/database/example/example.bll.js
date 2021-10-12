const exampleRepository = require('./example.repository');
const { newError, errorIfNotExists } = require('../../helpers/errors.helper');

async function validateCode(entityId, code) {
  if (!code) return false;
  const query = { code };
  const examples = await exampleRepository.find(entityId, query);
  return !examples.length;
}

async function generateCode(entityId, length) {
  let code = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  const isValidCode = await validateCode(entityId, code);
  if (!isValidCode) code = await generateCode(entityId, length);
  return code;
}

async function find(entityId, filter = {}, options = {}) {
  const [examples, total] = await Promise.all([
    exampleRepository.find(entityId, filter, options),
    exampleRepository.count(entityId, filter),
  ]);

  return { examples, total };
}

async function validateInsertExample(example) {
  const { name, cliamTitle, claimMessage, acceptButtonLabel, pageUrl, pathsMatch } = example;
  if (
    !name ||
    (!cliamTitle && !claimMessage) ||
    !acceptButtonLabel ||
    (!pageUrl &&
      (
        !pathsMatch ||
        !pathsMatch.conditions ||
        !pathsMatch.conditions.length ||
        !pathsMatch.conditions[0].matchType
      )
    )
  ) {
    throw newError(400, 'Required fields not given', 'TEST.ERROR.INSERT.REQUIRED.DETAIL', 'TEST.ERROR.INSERT.REQUIRED.DETAIL');
  }
}

async function validateUpdateExample(entityId, _id) {
  if (!_id) {
    throw newError(400, 'Required fields not given', 'TEST.ERROR.INSERT.REQUIRED.DETAIL', 'TEST.ERROR.INSERT.REQUIRED.DETAIL');
  }

  const query = { _id };
  const examples = await exampleRepository.find(entityId, query);
  errorIfNotExists(examples && examples.length, 'Example doesn\'t exist', 400, 'TEST.ERROR.INSERT.EXISTING.DETAIL', 'TEST.ERROR.INSERT.EXISTING.DETAIL');
}

async function validateUpdateExampleStat(entityId, exampleId, stat, value) {
  if (
    !stat ||
    !value
  ) {
    throw newError(400, 'Required fields not given', 'TEST.ERROR.INSERT.REQUIRED.DETAIL', 'TEST.ERROR.INSERT.REQUIRED.DETAIL');
  }

  await validateUpdateExample(entityId, exampleId);
}

async function insertOne(entityId, example) {
  await validateInsertExample(example);
  const code = await generateCode(entityId, 5);
  const exampleParsed = {
    ...example,
    code,
    creationDate: new Date(),
  };
  const exampleCreated = await exampleRepository.insertOne(entityId, exampleParsed);
  return exampleCreated;
}

async function updateOne(entityId, example) {
  await validateUpdateExample(entityId, example._id);
  const exampleParsed = { ...example, modificationDate: new Date() };
  const exampleUpdated = await exampleRepository.updateOne(entityId, exampleParsed);
  return exampleUpdated;
}

async function deleteOne(entityId, example) {
  await validateUpdateExample(entityId, example._id);
  const exampleDeleted = await exampleRepository.deleteOne(entityId, example);
  return exampleDeleted;
}

async function increaseStat(entityId, exampleId, stat, value) {
  await validateUpdateExampleStat(entityId, exampleId, stat, value);
  const field = `stats.${stat.toLowerCase()}`;
  const exampleParsed = { _id: exampleId, $inc: {} };
  exampleParsed.$inc[field] = value;
  exampleRepository.increase(entityId, exampleParsed);
}

async function getGlobalStats(entityId) {
  const globalStats = await exampleRepository.getGlobalStats(entityId);
  return globalStats[0];
}

module.exports = {
  find,
  insertOne,
  updateOne,
  deleteOne,
  increaseStat,
  getGlobalStats,
};
