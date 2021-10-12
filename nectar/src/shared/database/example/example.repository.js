const errorHelper = require('../../helpers/errors.helper');
const { getCollection, ObjectId } = require('../mongo');
const schema = require('./example.json');
const { sanitize } = require('../../helpers/objects.helper');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');

const collectionName = 'examples';

function getQuery(data) {
  const query = buildFilterQuery(data);
  return query;
}

function parseExample(data) {
  const example = { ...data };
  delete example._id;
  if (data.userIds) example.userIds = data.userIds.map(id => ObjectId(id));
  if (data.creationDate) example.creationDate = new Date(data.creationDate);
  if (data.modificationDate) example.modificationDate = new Date(data.modificationDate);
  return sanitize(schema, example);
}

async function find(entityId, query, options = {}) {
  const collection = getCollection(entityId, collectionName);
  const optionsPrsed = parseOptions(options);
  const queryParsed = getQuery(query);
  const data = await collection.find(queryParsed, optionsPrsed).collation({ locale: 'en' }).toArray();
  return data;
}

function count(entityId, query) {
  const collection = getCollection(entityId, collectionName);
  const queryParsed = getQuery(query);
  return collection.countDocuments(queryParsed);
}

async function insertOne(entityId, example) {
  const collection = getCollection(entityId, collectionName);
  const exampleParsed = parseExample(example);
  const inserted = await collection.insertOne(exampleParsed);
  errorHelper.errorIfNotExists(inserted.insertedId, 'Insert document fails.');
  const query = { _id: inserted.insertedId };
  const data = await collection.findOne(query);
  return data;
}

async function updateOne(entityId, example) {
  const collection = getCollection(entityId, collectionName);
  const query = { _id: example._id };
  const queryParsed = getQuery(query);
  const exampleParsed = parseExample(example);
  const update = { $set: exampleParsed };
  const updated = await collection.findOneAndUpdate(queryParsed, update, { returnOriginal: false });
  errorHelper.errorIfNotExists(updated && updated.value, 'Update document fails.');
  return updated.value;
}

async function deleteOne(entityId, example) {
  const collection = getCollection(entityId, collectionName);
  const query = { _id: example._id };
  const queryParsed = getQuery(query);
  const deletedExample = await collection.findOne(queryParsed);
  await collection.deleteOne(queryParsed);
  return deletedExample;
}

async function increase(entityId, example) {
  const collection = getCollection(entityId, collectionName);
  const query = { _id: example._id };
  const queryParsed = getQuery(query);
  const update = { $inc: example.$inc };
  const updated = await collection.findOneAndUpdate(queryParsed, update, { returnOriginal: false });
  errorHelper.errorIfNotExists(updated && updated.value, 'Update document fails.');
  return updated.value;
}

async function getGlobalStats(entityId) {
  const collection = getCollection(entityId, collectionName);
  const aggCursor = collection.aggregate([
    {
      $group: {
        _id: null,
        widgetShow: { $sum: '$stats.widget.show' },
        widgetAccept: { $sum: '$stats.widget.accept' },
        widgetClose: { $sum: '$stats.widget.close' },
        widgetUnavailable: { $sum: '$stats.widget.unavailable' },
        callMissed: { $sum: '$stats.call.missed' },
        callAccepted: { $sum: '$stats.call.accepted' },
        callRejected: { $sum: '$stats.call.rejected' },
        callUnavailable: { $sum: '$stats.call.unavailable' },
        callUnavailabledevice: { $sum: '$stats.call.unavailabledevice' },
        callAgentdisconnected: { $sum: '$stats.call.agentdisconnected' },
        callClientdisconnected: { $sum: '$stats.call.clientdisconnected' },
        examplesTotal: { $sum: 1 },
        examplesAvailable: { $sum: { $cond: ['$isActive', 1, 0] } },
        examplesUnavailable: { $sum: { $cond: ['$isActive', 0, 1] } },
      }
    }
  ]);
  const data = [];
  await aggCursor.forEach(item => data.push(item));
  return data;
}

module.exports = {
  find,
  count,
  insertOne,
  updateOne,
  deleteOne,
  increase,
  getGlobalStats,
};
