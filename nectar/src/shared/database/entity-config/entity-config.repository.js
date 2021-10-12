const errorHelper = require('../../helpers/errors.helper');
const { getCollection } = require('../mongo');
const schema = require('./entity-config.json');
const { sanitize } = require('../../helpers/objects.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');

const collectionName = 'entityconfigs';

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parseEntity(data) {
  const entity = { ...data };
  delete entity._id;
  if (data.creationDate) {
    entity.creationDate = new Date(data.creationDate);
  }

  if (data.modificationDate) {
    entity.modificationDate = new Date(data.modificationDate);
  }

  return sanitize(schema, entity);
}

async function find(entityId, query, options = {}) {
  const collection = getCollection(entityId, collectionName);
  const queryParsed = getQuery(query);
  const optionsPrsed = parseOptions(options);
  const data = await collection.find(queryParsed, optionsPrsed).collation({ locale: 'en' }).toArray();
  return data;
}

async function count(entityId, query) {
  const collection = getCollection(entityId, collectionName);
  const queryParsed = getQuery(query);
  return collection.countDocuments(queryParsed);
}

async function insertOne(entityId, entity) {
  const collection = getCollection(entityId, collectionName);
  const entityParsed = parseEntity(entity);
  const inserted = await collection.insertOne(entityParsed);
  errorHelper.errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(entityId, entity) {
  const collection = getCollection(entityId, collectionName);
  const query = { _id: entity._id };
  const queryParsed = getQuery(query);
  const entityParsed = parseEntity(entity);
  const update = { $set: entityParsed };
  const updated = await collection.findOneAndUpdate(queryParsed, update, { returnOriginal: false });
  errorHelper.errorIfNotExists(updated && updated.value, 'Update document fails.');
  return updated.value;
}

module.exports = {
  find,
  count,
  insertOne,
  updateOne,
};
