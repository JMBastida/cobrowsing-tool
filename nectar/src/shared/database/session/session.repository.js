const { getCollection, ObjectId } = require('../mongo');

const COLLECTION_NAME = 'sessions';

function find(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME).find(filter, options).toArray();
}

function findOne(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME).findOne(filter, options);
}

function count(filter = {}) {
  return getCollection(COLLECTION_NAME).countDocuments(filter);
}

function insertOne(session) {
  return getCollection(COLLECTION_NAME).insertOne(session);
}

function updateOne(session) {
  const filter = { _id: session._id };
  const update = { $set: session };
  return getCollection(COLLECTION_NAME).updateOne(filter, update);
}

function parse(data) {
  const session = {};
  if (data._id) session._id = data._id;
  if (data.testId) session.testId = new ObjectId(data.testId);
  if (data.userId) session.userId = new ObjectId(data.userId);
  if (data.trackId) session.trackId = new ObjectId(data.trackId);
  if (data.name) session.name = data.name;
  if (data.creationDate) session.creationDate = data.creationDate;
  return session;
}

module.exports = {
  find,
  findOne,
  count,
  parse,
  updateOne,
  insertOne,
};
