const { getCollection, ObjectId } = require('../mongo');

const COLLECTION_NAME = 'registries';

function find(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME).find(filter, options).toArray();
}

function findOne(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME).findOne(filter, options);
}

function count(filter = {}) {
  return getCollection(COLLECTION_NAME).countDocuments(filter);
}

function insertOne(registry) {
  return getCollection(COLLECTION_NAME).insertOne(registry);
}

function updateOne(registry) {
  const filter = { _id: registry._id };
  const update = { $set: registry };
  return getCollection(COLLECTION_NAME).updateOne(filter, update);
}

function parse(data) {
  const registry = {};
  if (data._id) registry._id = data._id;
  if (data.userId) registry.userId = new ObjectId(data.userId);
  if (data.type) registry.type = data.type;
  if (data.creationDate) registry.creationDate = data.creationDate;
  return registry;
}

module.exports = {
  find,
  findOne,
  count,
  parse,
  updateOne,
  insertOne,
};
