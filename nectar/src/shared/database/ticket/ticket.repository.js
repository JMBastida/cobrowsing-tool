const { getCollection, ObjectId } = require('../mongo');

const COLLECTION_NAME = 'tickets';

function find(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME).find(filter, options).toArray();
}

function findOne(filter = {}, options = {}) {
  return getCollection(COLLECTION_NAME).findOne(filter, options);
}

function count(filter = {}) {
  return getCollection(COLLECTION_NAME).countDocuments(filter);
}

function insertOne(ticket) {
  return getCollection(COLLECTION_NAME).insertOne(ticket);
}

function updateOne(ticket) {
  const filter = { _id: ticket._id };
  const update = { $set: ticket };
  return getCollection(COLLECTION_NAME).updateOne(filter, update);
}

function parse(data) {
  const ticket = {};
  if (data._id) ticket._id = data._id;
  if (data.userId) ticket.userId = new ObjectId(data.userId);
  if (data.type) ticket.type = data.type;
  if (data.status) ticket.status = data.status;
  if (data.creationDate) ticket.creationDate = data.creationDate;
  return ticket;
}

module.exports = {
  find,
  findOne,
  count,
  parse,
  updateOne,
  insertOne,
};
