const { newError, errorIfNotExists } = require('../../../shared/helpers/errors.helper');
const sessionRepository = require('./session.repository');
const { ObjectId } = require('../mongo'); // Corrected path

async function find(entityId, filter = {}, options = {}) {
  // Combine entityId with the provided filter
  const query = { ...filter, entityId: new ObjectId(entityId) };
  
  // If filter has _id as string, convert to ObjectId
  if (query._id && typeof query._id === 'string') {
    query._id = new ObjectId(query._id);
  }

  const [sessions, total] = await Promise.all([
    sessionRepository.find(query, options),
    sessionRepository.count(query),
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

  const query = { _id: new ObjectId(_id), entityId: new ObjectId(entityId) };
  const sessions = await sessionRepository.find(query);
  errorIfNotExists(sessions && sessions.length, 'Session doesn\'t exist', 400, 'SESSION.ERROR.UPDATE.EXISTING.DETAIL', 'SESSION.ERROR.UPDATE.EXISTING.DETAIL');
}

async function insertOne(entityId, session) {
  await validateInsertSession(session);
  const sessionParsed = { ...session, entityId: new ObjectId(entityId), creationDate: new Date() };
  const result = await sessionRepository.insertOne(sessionParsed);
  return { ...sessionParsed, _id: result.insertedId };
}

async function updateOne(entityId, session) {
  await validateUpdateSession(entityId, session._id);
  const sessionParsed = { ...session, modificationDate: new Date() };
  // Ensure _id is not in the $set update payload if it's there, though updateOne usually handles filter separately
  const { _id, ...updateData } = sessionParsed;
  
  // We need to pass the full object to repository updateOne as it expects 'session'
  // But repository implementation does: const filter = { _id: session._id }; const update = { $set: session };
  // So we should pass the object with _id.
  const sessionToUpdate = { ...sessionParsed, _id: new ObjectId(session._id) };
  
  const sessionUpdated = await sessionRepository.updateOne(sessionToUpdate);
  return sessionUpdated;
}

async function addMessages(entityId, session) {
  await validateUpdateSession(entityId, session._id);
  const messages = session.messages;
  const sessionParsed = { _id: new ObjectId(session._id), modificationDate: new Date() };
  const sessionUpdated = await sessionRepository.addMessages(entityId, sessionParsed, messages);
  return sessionUpdated;
}

module.exports = {
  find,
  insertOne,
  updateOne,
  addMessages,
};
