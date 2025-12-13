const { DATABASE } = require('../../../../config');
const { getCollection, getDb } = require('../mongo');
const { sanitize } = require('../../helpers/objects.helper');
const { errorIfNotExists } = require('../../helpers/errors.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');
const schema = require('./entity.json');

const collectionName = 'entities';
const dbName = DATABASE.MANAGEMENT_DB;

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

function parse(data) {
  const entity = {};
  if (data._id) entity._id = data._id;
  if (data.companyName) entity.companyName = data.companyName;
  if (data.companyEmail) entity.companyEmail = data.companyEmail;
  if (data.maxUsers) entity.maxUsers = data.maxUsers;
  if (data.isScriptInstalled) entity.isScriptInstalled = data.isScriptInstalled;
  if (data.creationDate) entity.creationDate = data.creationDate;
  if (data.modificationDate) entity.modificationDate = data.modificationDate;
  return entity;
}

async function find(query, options = {}) {
  const collection = getCollection(collectionName, dbName);
  const queryParsed = getQuery(query);
  const optionsPrsed = parseOptions(options);
  const data = await collection.find(queryParsed, optionsPrsed).collation({ locale: 'en' }).toArray();
  return data;
}

async function count(query) {
  const collection = getCollection(collectionName, dbName);
  const queryParsed = getQuery(query);
  return collection.countDocuments(queryParsed);
}

async function insertOne(entity) {
  const collection = getCollection(collectionName, dbName);
  const entityParsed = parseEntity(entity);
  const inserted = await collection.insertOne(entityParsed);
  errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(entity) {
  const collection = getCollection(collectionName, dbName);
  const query = { _id: entity._id };
  const queryParsed = getQuery(query);
  const entityParsed = parseEntity(entity);
  const update = { $set: entityParsed };
  const updated = await collection.findOneAndUpdate(queryParsed, update, { returnOriginal: false });
  errorIfNotExists(updated && updated.value, 'Update document fails.');
  return updated.value;
}

async function deleteMany(filter) {
  const collection = getCollection(collectionName, dbName);
  const queryParsed = getQuery(filter);
  await collection.deleteMany(queryParsed);
}

async function dropDatabase(entityId) {
  const db = getDb(entityId);
  if (!db) return;
  await db.dropDatabase();
}

module.exports = {
  find,
  count,
  parse,
  insertOne,
  updateOne,
  deleteMany,
  dropDatabase,
};
