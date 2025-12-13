const { getCollection, ObjectId } = require('../mongo');

const COLLECTION_NAME = 'examples';

function find(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME).find(filter, options).toArray();
}

function findOne(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME).findOne(filter, options);
}

function count(filter = {}) {
  return getCollection(COLLECTION_NAME).countDocuments(filter);
}

function insertOne(example) {
  return getCollection(COLLECTION_NAME).insertOne(example);
}

function updateOne(example) {
  const filter = { _id: example._id };
  const update = { $set: example };
  return getCollection(COLLECTION_NAME).updateOne(filter, update);
}

function parse(data) {
  const example = {};
  if (data._id) example._id = data._id;
  if (data.name) example.name = data.name;
  if (data.userIds) example.userIds = data.userIds.map(id => new ObjectId(id));
  if (data.creationDate) example.creationDate = data.creationDate;
  return example;
}

module.exports = {
  find,
  findOne,
  count,
  parse,
  updateOne,
  insertOne,
};
