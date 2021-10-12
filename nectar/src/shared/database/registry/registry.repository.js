const errorHelper = require('../../helpers/errors.helper');
const { getCollection, ObjectId } = require('../mongo');
const schema = require('./registry.json');
const { sanitize } = require('../../helpers/objects.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');
const { DATABASE } = require('../../../../config');

const collectionName = 'registries';
const dbName = DATABASE.MANAGEMENT_DB;

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parseRegistry(data) {
  const registry = { ...data };
  delete registry._id;
  if (data.creationDate) {
    registry.creationDate = new Date(data.creationDate);
  }

  if (data.userId) {
    registry.userId = ObjectId(data.userId);
  }

  return sanitize(schema, registry);
}

async function find(query, options = {}) {
  const collection = getCollection(dbName, collectionName);
  const queryParsed = getQuery(query);
  const optionsPrsed = parseOptions(options);
  const data = await collection.find(queryParsed, optionsPrsed).collation({ locale: 'en' }).toArray();
  return data;
}

async function count(query) {
  const collection = getCollection(dbName, collectionName);
  const queryParsed = getQuery(query);
  return collection.countDocuments(queryParsed);
}

async function insertOne(registry) {
  const collection = getCollection(dbName, collectionName);
  const registryParsed = parseRegistry(registry);
  const inserted = await collection.insertOne(registryParsed);
  errorHelper.errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
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
  deleteMany,
};
