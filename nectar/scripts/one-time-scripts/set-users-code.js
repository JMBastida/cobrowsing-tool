/**
 * New user schema requires:
 * 1 - set user codes.
 */

const CONFIG = require('../../config');
const { connect, getCollection } = require('../../src/shared/database/mongo');

let usersCollection;

async function getUsers() {
  const users = await usersCollection.find({}).toArray();
  return users;
}

async function validateCode(code) {
  if (!code) return false;
  const query = { code };
  const users = await usersCollection.find(query);
  return !users.length;
}

async function generateCode(length) {
  let code = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  const isValidCode = await validateCode(code);
  if (!isValidCode) code = await generateCode(length);
  return code;
}

async function setUserCode(user) {
  const { _id } = user;
  const query = { _id };
  const code = await generateCode(6);
  const update = { $set: { code } };
  await usersCollection.findOneAndUpdate(query, update, { returnOriginal: false });
}

async function handleUsers() {
  const users = await getUsers();
  const total = users.length;
  for (let i = 0; i < total; i += 1) {
    const user = users[i];
    await setUserCode(user);
  }
}

connect().then(async () => {
  usersCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'users');
  await handleUsers();
  process.exit(0);
}).catch((err) => {
  console.log(err);
  process.exit(1);
});