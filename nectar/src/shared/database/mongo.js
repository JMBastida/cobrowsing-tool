const { MongoClient, ObjectId } = require('mongodb');
const CONFIG = require('../../../config');

let client;

function getDb(dbName) {
  return client.db(dbName.toString());
}

function getCollection(dbName, collectionName) {
  return client.db(dbName.toString()).collection(collectionName);
}

async function connect() {
  client = await MongoClient.connect(CONFIG.DATABASE.URL, { useUnifiedTopology: true });
}

module.exports = {
  getDb,
  connect,
  ObjectId,
  getCollection,
};