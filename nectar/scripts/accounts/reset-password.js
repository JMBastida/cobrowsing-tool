/**
 * Reset password by user email
 * launch: node scripts/accounts/reset-password.js example@example.com
 */

const bcrypt = require('bcryptjs');
const CONFIG = require('../../config');
const { connect, getCollection } = require('../../src/shared/database/mongo');

let usersCollection;
let passwordsCollection;

if (!process.argv[2] || !process.argv[2].length) {
  console.log('Add an email to process: node scripts/accounts/reset-password.js example@example.com');
  process.exit(0);
}

const email = process.argv[2].replace(/ /g, '');

function generateRandomPassword(length) {
  let password = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return password;
}

function checkUsers(users) {
  console.log('#################');
  console.log('## check users ##');
  console.log('#################');
  if (!users || !users.length) {
    console.log('User not found');
    process.exit(0);
  }

  if (users.length > 1) {
    console.log(`Many users with the same email. Ids: ${users.map(u => u._id)}`);
    process.exit(0);
  }
}

async function getUser() {
  console.log('##############');
  console.log('## get user ##');
  console.log('##############');
  const users = await usersCollection.find({ email }).toArray();
  checkUsers(users);
  const [user] = users;
  return user;
}

function checkPasswords(passwords, userId) {
  console.log('#####################');
  console.log('## check passwords ##');
  console.log('#####################');
  if (!passwords || !passwords.length) {
    console.log(`Password not found. User id: ${userId}`);
    process.exit(0);
  }

  if (passwords.length > 1) {
    console.log(`Many passwords with the same userId. UserId: ${userId} Ids: ${passwords.map(u => u._id)}`);
    process.exit(0);
  }
}

async function getPasswordObject(user) {
  console.log('#########################');
  console.log('## get password object ##');
  console.log('#########################');
  const userId = user._id;
  const passwords = await passwordsCollection.find({ userId }).toArray();
  checkPasswords(passwords, userId);
  const [password] = passwords;
  return password;
}

function getNewPassword() {
  console.log('######################');
  console.log('## get new password ##');
  console.log('######################');
  const password = generateRandomPassword(8);
  console.log(`New password: ${password}`);
  const passwordHash = bcrypt.hashSync(password);
  return passwordHash;
}

async function handlePassword(passwordObject) {
  console.log('#####################');
  console.log('## handle password ##');
  console.log('#####################');
  const { _id } = passwordObject;
  const password = getNewPassword();
  await passwordsCollection.updateOne({ _id }, { $set: { password } });
}

async function handleEmail() {
  console.log('##################');
  console.log('## handle email ##');
  console.log('##################');
  console.log(email);
  const user = await getUser();
  const passwordObject = await getPasswordObject(user);
  await handlePassword(passwordObject);
}

connect().then(async () => {
  console.log('###########');
  console.log('## START ##');
  console.log('###########');
  usersCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'users');
  passwordsCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'passwords');
  await handleEmail();
  console.log('#########');
  console.log('## END ##');
  console.log('#########');
  process.exit(0);
}).catch((err) => {
  console.log(err);
  process.exit(1);
})