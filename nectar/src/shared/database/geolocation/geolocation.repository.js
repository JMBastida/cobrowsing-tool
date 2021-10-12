const errorHelper = require('../../helpers/errors.helper');
const { getCollection } = require('../mongo');
const schema = require('./geolocation.json');
const { sanitize } = require('../../helpers/objects.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');
const { DATABASE } = require('../../../../config');

const collectionName = 'geolocations';
const dbName = DATABASE.MANAGEMENT_DB;

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parseGeolocation(data) {
  const geolocation = { ...data };
  delete geolocation._id;
  if (data.creationDate) geolocation.creationDate = new Date(data.creationDate);
  if (data.modificationDate) geolocation.modificationDate = new Date(data.modificationDate);
  return sanitize(schema, geolocation);
}

async function find(query, options = {}) {
  const collection = getCollection(dbName, collectionName);
  const optionsPrsed = parseOptions(options);
  const queryParsed = getQuery(query);
  const data = await collection.find(queryParsed, optionsPrsed).collation({ locale: 'en' }).toArray();
  return data;
}

function count(query) {
  const collection = getCollection(dbName, collectionName);
  const queryParsed = getQuery(query);
  return collection.countDocuments(queryParsed);
}

async function insertOne(geolocation) {
  const collection = getCollection(dbName, collectionName);
  const geolocationParsed = parseGeolocation(geolocation);
  const inserted = await collection.insertOne(geolocationParsed);
  errorHelper.errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(geolocation) {
  const collection = getCollection(dbName, collectionName);
  const query = { _id: geolocation._id };
  const queryParsed = getQuery(query);
  const geolocationParsed = parseGeolocation(geolocation);
  const update = { $set: geolocationParsed };
  const updated = await collection.findOneAndUpdate(queryParsed, update, { returnOriginal: false });
  errorHelper.errorIfNotExists(updated && updated.value, 'Update document fails.');
  return updated.value;
}

async function deleteOne(geolocation) {
  const collection = getCollection(dbName, collectionName);
  const query = { _id: geolocation._id };
  const queryParsed = getQuery(query);
  const deletedGeolocation = await collection.findOne(queryParsed);
  await collection.deleteOne(queryParsed);
  return deletedGeolocation;
}

module.exports = {
  find,
  count,
  insertOne,
  updateOne,
  deleteOne,
};
