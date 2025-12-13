const { getCollection } = require('../mongo');
const { DATABASE } = require('../../../../config');
const { sanitize } = require('../../helpers/objects.helper');
const { errorIfNotExists } = require('../../helpers/errors.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');
const schema = require('./geolocation.json');

const collectionName = 'geolocations';
const dbName = DATABASE.MANAGEMENT_DB;

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parseGeolocation(data) {
  const geolocation = { ...data };
  delete geolocation._id;
  if (data.creationDate) {
    geolocation.creationDate = new Date(data.creationDate);
  }

  if (data.modificationDate) {
    geolocation.modificationDate = new Date(data.modificationDate);
  }

  return sanitize(schema, geolocation);
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

async function insertOne(geolocation) {
  const collection = getCollection(collectionName, dbName);
  const geolocationParsed = parseGeolocation(geolocation);
  const inserted = await collection.insertOne(geolocationParsed);
  errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(geolocation) {
  const collection = getCollection(collectionName, dbName);
  const query = { _id: geolocation._id };
  const queryParsed = getQuery(query);
  const geolocationParsed = parseGeolocation(geolocation);
  const update = { $set: geolocationParsed };
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
