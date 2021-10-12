const errorHelper = require('../../helpers/errors.helper');
const { getCollection, ObjectId } = require('../mongo');
const schema = require('./password.json');
const { sanitize } = require('../../helpers/objects.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');
const { DATABASE } = require('../../../../config');

const collectionName = 'passwords';
const dbName = DATABASE.MANAGEMENT_DB;

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parsePassword(data) {
  const password = { ...data };
  delete password._id;
  if (data.entityId) password.entityId = ObjectId(data.entityId);
  if (data.creationDate) password.creationDate = new Date(data.creationDate);
  if (data.modificationDate) password.modificationDate = new Date(data.modificationDate);
  return sanitize(schema, password);
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

async function insertOne(password) {
  const collection = getCollection(dbName, collectionName);
  const passwordParsed = parsePassword(password);
  const inserted = await collection.insertOne(passwordParsed);
  errorHelper.errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(password) {
  const collection = getCollection(dbName, collectionName);
  const queryParsed = getQuery({ _id: password._id });
  const passwordParsed = parsePassword(password);
  const update = { $set: passwordParsed };
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
