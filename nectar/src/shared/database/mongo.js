const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const CONFIG = require('../../../config');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(CONFIG.DATABASE.URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

function getDb(dbName) {
  return client.db(dbName.toString());
}

function getCollection(collectionName, dbName) {
  const database = dbName ? client.db(dbName.toString()) : client.db();
  return database.collection(collectionName);
}

async function connect() {
  // Connect the client to the server (optional starting in v4.7)
  await client.connect();
  // Send a ping to confirm a successful connection
  await client.db("admin").command({ ping: 1 });
  console.log("Pinged your deployment. You successfully connected to MongoDB!");
}

module.exports = {
  getDb,
  connect,
  ObjectId,
  getCollection,
  client, // Also exporting client for graceful shutdown if needed
};
