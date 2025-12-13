const { MongoClient, ServerApiVersion } = require('mongodb');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('crypto');
const CONFIG = require('./config/index.json');
const { ROLES } = require('./src/shared/database/user/user.enums');
const { ENTITY_STATUS } = require('./src/shared/database/entity/entity.enums'); // Import ENTITY_STATUS

const client = new MongoClient(CONFIG.DATABASE.URL, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Function to generate a random hex code
function generateEntityCode() {
  return randomBytes(12).toString('hex');
}

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");

    const db = client.db(CONFIG.DATABASE.MANAGEMENT_DB); 
    
    const usersCollection = db.collection('users');
    const passwordsCollection = db.collection('passwords');
    const entitiesCollection = db.collection('entities');
    const entityConfigsCollection = db.collection('entity-configs');

    const adminEmail = 'admin@example.com';
    const adminPassword = 'password123';
    const entityCode = generateEntityCode();

    // 1. Create a default Entity with a code and status
    const entityResult = await entitiesCollection.insertOne({
      code: entityCode,
      status: ENTITY_STATUS.ACTIVE, // <-- AÑADIDO: Estado ACTIVO
      companyName: 'Admin Company',
      companyEmail: adminEmail,
      creationDate: new Date(),
      modificationDate: new Date(),
    });
    const entityId = entityResult.insertedId;
    console.log(`Default entity created with id: ${entityId} and code: ${entityCode}`);

    // 2. Create a default Entity Config
    await entityConfigsCollection.insertOne({
      entityId: entityId,
      companyEmail: adminEmail,
      creationDate: new Date(),
      modificationDate: new Date(),
    });
    console.log(`Default entity-config created for entityId: ${entityId}`);

    // 3. Create the Admin User and associate it with the Entity
    const userResult = await usersCollection.insertOne({
      email: adminEmail,
      role: ROLES.ADMIN,
      name: 'Admin',
      lastName: 'User',
      entityId: entityId,
      creationDate: new Date(),
      modificationDate: new Date(),
    });
    const userId = userResult.insertedId;
    console.log(`New admin user created with id: ${userId}`);

    // 4. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // 5. Create the password document
    const passwordResult = await passwordsCollection.insertOne({
      userId: userId,
      password: hashedPassword,
      creationDate: new Date(),
    });
    console.log(`New password entry created with id: ${passwordResult.insertedId}`);

  } finally {
    await client.close();
    console.log("Connection closed.");
  }
}

run().catch(console.dir);
