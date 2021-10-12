const { getCollection } = require('../mongo');
const { DATABASE } = require('../../../../config');
const { sanitize } = require('../../helpers/objects.helper');
const { errorIfNotExists } = require('../../helpers/errors.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');
const schema = require('./state.json');

const collectionName = 'states';
const dbName = DATABASE.MANAGEMENT_DB;

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parseState(data) {
  const state = { ...data };
  delete state._id;
  if (data.creationDate) {
    state.creationDate = new Date(data.creationDate);
  }

  if (data.modificationDate) {
    state.modificationDate = new Date(data.modificationDate);
  }

  return sanitize(schema, state);
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

async function insertOne(state) {
  const collection = getCollection(dbName, collectionName);
  const stateParsed = parseState(state);
  const inserted = await collection.insertOne(stateParsed);
  errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(state) {
  const collection = getCollection(dbName, collectionName);
  const query = { _id: state._id };
  const queryParsed = getQuery(query);
  const stateParsed = parseState(state);
  const update = { $set: stateParsed };
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
