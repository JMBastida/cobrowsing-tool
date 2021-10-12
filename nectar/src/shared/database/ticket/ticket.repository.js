const errorHelper = require('../../helpers/errors.helper');
const { getCollection, ObjectId } = require('../mongo');
const schema = require('./ticket.json');
const { sanitize } = require('../../helpers/objects.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');
const { DATABASE } = require('../../../../config');

const collectionName = 'tickets';
const dbName = DATABASE.MANAGEMENT_DB;

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parseTicket(data) {
  const ticket = { ...data };
  delete ticket._id;
  if (data.userId) {
    ticket.userId = ObjectId(data.userId);
  }

  if (data.creationDate) {
    ticket.creationDate = new Date(data.creationDate);
  }

  if (data.modificationDate) {
    ticket.modificationDate = new Date(data.modificationDate);
  }

  return sanitize(schema, ticket);
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

async function insertOne(ticket) {
  const collection = getCollection(dbName, collectionName);
  const ticketParsed = parseTicket(ticket);
  const inserted = await collection.insertOne(ticketParsed);
  errorHelper.errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(ticket) {
  const collection = getCollection(dbName, collectionName);
  const query = { _id: ticket._id };
  const queryParsed = getQuery(query);
  const ticketParsed = parseTicket(ticket);
  const update = { $set: ticketParsed };
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
