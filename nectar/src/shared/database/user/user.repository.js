const { getCollection, ObjectId } = require('../mongo');
const { DATABASE } = require('../../../../config');

const COLLECTION_NAME = 'users';
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

function insertOne(user) {
  return getCollection(COLLECTION_NAME, DB_NAME).insertOne(user);
}

function updateOne(user) {
  const filter = { _id: user._id };
  const update = { $set: user };
  return getCollection(COLLECTION_NAME, DB_NAME).updateOne(filter, update);
}

function deleteMany(filter = {}) {
  return getCollection(COLLECTION_NAME, DB_NAME).deleteMany(filter);
}

function parse(data) {
  const user = {};
  if (data._id) user._id = data._id;
  if (data.entityId) user.entityId = data.entityId;
  if (data.name) user.name = data.name;
  if (data.lastName) user.lastName = data.lastName;
  if (data.email) user.email = data.email;
  if (data.password) user.password = data.password;
  if (data.role) user.role = data.role;
  if (data.avatarUrl) user.avatarUrl = data.avatarUrl;
  if (data.creationDate) user.creationDate = data.creationDate;
  if (data.modificationDate) user.modificationDate = data.modificationDate;
  return user;
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
