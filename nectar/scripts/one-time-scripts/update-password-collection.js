/**
 * New password schema requires:
 * 1 - remove "email" and "entityId" attributes
 * 2 - add "userId" attribute
 */

const CONFIG = require('../../config');
const { connect, getCollection } = require('../../src/shared/database/mongo');

let usersCollection;
let passwordCollection;

async function getUsers() {
  const users = await usersCollection.find({}).toArray();
  return users;
}

async function updatePasswordData(user) {
  const { email, _id } = user;
  const currentQuery = { email };
  const currentPasswordData = await passwordCollection.findOne(currentQuery);
  if (!currentPasswordData) return;
  const query = { _id: currentPasswordData._id };
  const update = {
    $set: { userId: _id },
    $unset: { entityId: '', email: '' },
  };
  await passwordCollection.findOneAndUpdate(query, update, { returnOriginal: false });
}

async function handleUsers() {
  const users = await getUsers();
  const total = users.length;
  for (let i = 0; i < total; i += 1) {
    const user = users[i];
    await updatePasswordData(user);
  }
}

connect().then(async () => {
  usersCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'users');
  passwordCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'passwords');
  await handleUsers();
  process.exit(0);
}).catch((err) => {
  console.log(err);
  process.exit(1);
});