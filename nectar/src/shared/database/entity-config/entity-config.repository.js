const { getCollection, ObjectId } = require('../mongo');
const { DATABASE } = require('../../../../config');
const { sanitize } = require('../../helpers/objects.helper');
const { errorIfNotExists } = require('../../helpers/errors.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');
const schema = require('./entity-config.json');

const collectionName = 'entity-configs';
const dbName = DATABASE.MANAGEMENT_DB;

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parseEntityConfig(data) {
  const entityConfig = { ...data };
  delete entityConfig._id;
  if (data.creationDate) {
    entityConfig.creationDate = new Date(data.creationDate);
  }

  if (data.modificationDate) {
    entityConfig.modificationDate = new Date(data.modificationDate);
  }

  return sanitize(schema, entityConfig);
}

async function find(entityId, query, options = {}) {
  // Use the shared database
  const collection = getCollection(collectionName, dbName);
  
  // Add entityId to the query to filter by the correct entity
  const queryParsed = getQuery({ ...query, entityId: new ObjectId(entityId) });
  const optionsPrsed = parseOptions(options);
  
  const data = await collection.find(queryParsed, optionsPrsed).collation({ locale: 'en' }).toArray();
  return data;
}

async function count(entityId, query) {
  const collection = getCollection(collectionName, dbName);
  const queryParsed = getQuery({ ...query, entityId: new ObjectId(entityId) });
  return collection.countDocuments(queryParsed);
}

async function insertOne(entityId, entityConfig) {
  const collection = getCollection(collectionName, dbName);
  const entityConfigParsed = parseEntityConfig({ ...entityConfig, entityId: new ObjectId(entityId) });
  const inserted = await collection.insertOne(entityConfigParsed);
  errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(entityId, entityConfig) {
  const collection = getCollection(collectionName, dbName);
  const query = { _id: entityConfig._id };
  const queryParsed = getQuery(query);
  const entityConfigParsed = parseEntityConfig(entityConfig);
  const update = { $set: entityConfigParsed };
  const updated = await collection.findOneAndUpdate(queryParsed, update, { returnOriginal: false });
  errorIfNotExists(updated && updated.value, 'Update document fails.');
  return updated.value;
}

module.exports = {
  find,
  count,
  insertOne,
  updateOne,
};
