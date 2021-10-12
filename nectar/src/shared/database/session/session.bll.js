const { newError, errorIfNotExists } = require('../../../shared/helpers/errors.helper');
const sessionRepository = require('./session.repository');

async function find(entityId, filter = {}, options = {}) {
  const [sessions, total] = await Promise.all([
    sessionRepository.find(entityId, filter, options),
    sessionRepository.count(entityId, filter),
  ]);

  return { sessions, total };
}

async function validateInsertSession(session) {
  if (!session) {
    throw newError(400, 'Required fields not given', 'SESSION.ERROR.INSERT.REQUIRED.DETAIL', 'SESSION.ERROR.INSERT.REQUIRED.DETAIL');
  }
}

async function validateUpdateSession(entityId, _id) {
  if (!_id) {
    throw newError(400, 'Required fields not given', 'SESSION.ERROR.UPDATE.REQUIRED.DETAIL', 'SESSION.ERROR.UPDATE.REQUIRED.DETAIL');
  }

  const query = { _id };
  const sessions = await sessionRepository.find(entityId, query);
  errorIfNotExists(sessions && sessions.length, 'Session doesn\'t exist', 400, 'SESSION.ERROR.UPDATE.EXISTING.DETAIL', 'SESSION.ERROR.UPDATE.EXISTING.DETAIL');
}

async function insertOne(entityId, session) {
  await validateInsertSession(session);
  const sessionParsed = { ...session, creationDate: new Date() };
  const sessionCreated = await sessionRepository.insertOne(entityId, sessionParsed);
  return sessionCreated;
}

async function updateOne(entityId, session) {
  await validateUpdateSession(entityId, session._id);
  const sessionParsed = { ...session, modificationDate: new Date() };
  const sessionUpdated = await sessionRepository.updateOne(entityId, sessionParsed);
  return sessionUpdated;
}

async function addMessages(entityId, session) {
  await validateUpdateSession(entityId, session._id);
  const messages = session.messages;
  const sessionParsed = { _id: session._id, modificationDate: new Date() };
  const sessionUpdated = await sessionRepository.addMessages(entityId, sessionParsed, messages);
  return sessionUpdated;
}

module.exports = {
  find,
  insertOne,
  updateOne,
  addMessages,
};
