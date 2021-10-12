const errorHelper = require('../../../shared/helpers/errors.helper');
const { getCollection, ObjectId } = require('../mongo');
const schema = require('./user.json');
const { sanitize } = require('../../helpers/objects.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');
const { DATABASE } = require('../../../../config');

const collectionName = 'users';
const dbName = DATABASE.MANAGEMENT_DB;

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parseUser(data) {
  const user = { ...data };
  delete user._id;
  if (data.entityId) user.entityId = ObjectId(data.entityId);
  if (data.creationDate) user.creationDate = new Date(data.creationDate);
  if (data.modificationDate) user.modificationDate = new Date(data.modificationDate);
  return sanitize(schema, user);
}

async function find(query, options = {}) {
  const collection = getCollection(dbName, collectionName);
  const queryParsed = getQuery(query);
  const optionsPrsed = parseOptions(options);
  const data = await collection.find(queryParsed, optionsPrsed).collation({ locale: 'en' }).toArray();
  return data;
}

function count(query) {
  const collection = getCollection(dbName, collectionName);
  const queryParsed = getQuery(query);
  return collection.countDocuments(queryParsed);
}

async function insertOne(user) {
  const collection = getCollection(dbName, collectionName);
  const userParsed = parseUser(user);
  const inserted = await collection.insertOne(userParsed);
  errorHelper.errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(user) {
  const collection = getCollection(dbName, collectionName);
  const queryParsed = getQuery({ _id: user._id });
  const userParsed = parseUser(user);
  const update = { $set: userParsed };
  const updated = await collection.findOneAndUpdate(queryParsed, update, { returnOriginal: false });
  errorHelper.errorIfNotExists(updated && updated.value, 'Update document fails.');
  return updated.value;
}

async function deleteMany(filter) {
  const collection = getCollection(dbName, collectionName);
  const queryParsed = getQuery(filter);
  await collection.deleteMany(queryParsed);
}

module.exports = {
  find,
  count,
  insertOne,
  updateOne,
  deleteMany,
};
