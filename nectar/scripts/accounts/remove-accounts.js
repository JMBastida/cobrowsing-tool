/**
 * Remove accounts by entity emails
 * launch: node src/scripts/accounts/remove-accounts.js 'email1,email2,email3,...'
 */

const CONFIG = require('../../config');
const { connect, getCollection, getDb } = require('../../src/shared/database/mongo');

let usersCollection;
let passwordCollection;
let entitiesCollection;
let registriesCollection;

if (!process.argv[2] || !process.argv[2].length) {
  console.log('no emails to process');
  process.exit(0);
}

const emails = process.argv[2].replace(/ /g, '').split(',');

async function handleUser(userId) {
  await Promise.all([
    usersCollection.deleteMany({ _id: userId }),
    passwordCollection.deleteMany({ userId }),
    registriesCollection.deleteMany({ userId }),
  ]);
}

async function handleUsers(users) {
  console.log('##################');
  console.log('## handle users ##');
  console.log('##################');
  const total = users.length;
  for (let i = 0; i < total; i += 1) {
    const userId = users[i]._id;
    console.log(userId);
    await handleUser(userId);
  }
}

async function handleEntities(entityIds) {
  console.log('#####################');
  console.log('## handle entities ##');
  console.log('#####################');
  await entitiesCollection.deleteMany({ _id: { $in: entityIds } });
  const total = entityIds.length;
  for (let i = 0; i < total; i += 1) {
    const entityId = entityIds[i];
    console.log(entityId);
    const db = getDb(entityId);
    await db.dropDatabase();
  }
}

async function handleEmails() {
  console.log('###################');
  console.log('## handle emails ##');
  console.log('###################');
  console.log(emails);
  const entities = await entitiesCollection.find({ companyEmail: { $in: emails } }).toArray();
  const entityIds = entities.map(e => e._id);
  const users = await usersCollection.find({ entityId: { $in: entityIds } }).toArray();
  await handleUsers(users);
  await handleEntities(entityIds);
}

connect().then(async () => {
  console.log('###########');
  console.log('## START ##');
  console.log('###########');
  usersCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'users');
  entitiesCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'entities');
  passwordCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'passwords');
  registriesCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'registries');
  await handleEmails();
  console.log('#########');
  console.log('## END ##');
  console.log('#########');
  process.exit(0);
}).catch((err) => {
  console.log(err);
  process.exit(1);
})