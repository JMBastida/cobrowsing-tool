const errorHelper = require('../../helpers/errors.helper');
const { getCollection, ObjectId } = require('../mongo');
const schema = require('./session.json');
const { sanitize } = require('../../helpers/objects.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');

const collectionName = 'sessions';

function getQuery(data) {
  const query = buildFilterQuery(data);
  if (data.isCompleted) query.isCompleted = eval(data.isCompleted);
  return query;
}

function parseSession(data) {
  const session = { ...data };
  delete session._id;
  if (data.creationDate) session.creationDate = new Date(data.creationDate);
  if (data.modificationDate) session.modificationDate = new Date(data.modificationDate);
  if (data.testId) session.testId = ObjectId(data.testId);
  if (data.userId) session.userId = ObjectId(data.userId);
  if (data.trackId) session.trackId = ObjectId(data.trackId);
  return sanitize(schema, session);
}

async function find(entityId, query, options = {}) {
  const collection = getCollection(entityId, collectionName);
  const queryParsed = getQuery(query);
  const optionsParsed = parseOptions(options);
  const data = await collection.find(queryParsed, optionsParsed).collation({ locale: 'en' }).toArray();
  return data;
}

function count(entityId, query) {
  const collection = getCollection(entityId, collectionName);
  const queryParsed = getQuery(query);
  return collection.countDocuments(queryParsed);
}

async function insertOne(entityId, session) {
  const collection = getCollection(entityId, collectionName);
  const sessionParsed = parseSession(session);
  const inserted = await collection.insertOne(sessionParsed);
  errorHelper.errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(entityId, session) {
  const collection = getCollection(entityId, collectionName);
  const query = { _id: session._id };
  const queryParsed = getQuery(query);
  const sessionParsed = parseSession(session);
  const update = { $set: sessionParsed };
  const updated = await collection.findOneAndUpdate(queryParsed, update, { returnOriginal: false });
  errorHelper.errorIfNotExists(updated && updated.value, 'Update document fails.');
  return updated.value;
}

async function addMessages(entityId, session, messages) {
  const collection = getCollection(entityId, collectionName);
  const query = { _id: session._id };
  const queryParsed = getQuery(query);
  const sessionParsed = parseSession(session);
  const update = { $set: sessionParsed, $addToSet: { messages: { $each: messages } } };
  const updated = await collection.findOneAndUpdate(queryParsed, update, { returnOriginal: false });
  errorHelper.errorIfNotExists(updated && updated.value, 'Update document fails.');
  return updated.value;
}

module.exports = {
  find,
  count,
  insertOne,
  updateOne,
  addMessages,
};
