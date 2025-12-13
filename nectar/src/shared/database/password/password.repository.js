const { getCollection, ObjectId } = require('../mongo');
const { DATABASE } = require('../../../../config');

const COLLECTION_NAME = 'passwords';
const DB_NAME = DATABASE.MANAGEMENT_DB;

function find(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME, DB_NAME).find(filter, options).toArray();
}

function findOne(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME, DB_NAME).findOne(filter, options);
}

function count(filter = {}) {
  return getCollection(COLLECTION_NAME, DB_NAME).countDocuments(filter);
}

function insertOne(password) {
  return getCollection(COLLECTION_NAME, DB_NAME).insertOne(password);
}

function updateOne(password) {
  const filter = { _id: password._id };
  const update = { $set: password };
  return getCollection(COLLECTION_NAME, DB_NAME).updateOne(filter, update);
}

function deleteMany(filter = {}) {
  return getCollection(COLLECTION_NAME, DB_NAME).deleteMany(filter);
}

function parse(data) {
  const password = {};
  if (data._id) password._id = data._id;
  if (data.entityId) password.entityId = new ObjectId(data.entityId);
  if (data.password) password.password = data.password;
  if (data.creationDate) password.creationDate = data.creationDate;
  return password;
}

module.exports = {
  find,
  findOne,
  count,
  parse,
  updateOne,
  insertOne,
  deleteMany,
};
