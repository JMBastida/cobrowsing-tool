const { newError, errorIfExists, errorIfNotExists } = require('../../../shared/helpers/errors.helper');
const userRepository = require('./user.repository');
const { buildFilterQuery, parseOptions } = require('../../helpers/query.helper');

async function validateCode(code) {
  if (!code) return false;
  const query = { code };
  const users = await userRepository.find(query);
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

async function find(filter = {}, options = {}) {
  const query = buildFilterQuery(filter);
  const queryOptions = parseOptions(options);
  
  const [users, total] = await Promise.all([
    userRepository.find(query, queryOptions),
    userRepository.count(query),
  ]);

  const parsedUsers = users.map(user => userRepository.parse(user));
  return { users: parsedUsers, total };
}

async function validateInsertUser(user) {
  const { entityId, role, email } = user;
  if (!email || !role || !entityId) {
    throw newError(400, 'Required fields not given', 'USER.ERROR.INSERT.REQUIRED.SUMMARY', 'USER.ERROR.INSERT.REQUIRED.DETAIL');
  }

  const query = { email };
  const users = await userRepository.find(query);
  errorIfExists(users && users.length, 'Email in use', 400, 'USER.ERROR.INSERT.EXISTING.SUMMARY', 'USER.ERROR.INSERT.EXISTING.DETAIL');
}

async function validateUpdateUser(user) {
  const { _id, email } = user;
  if (!_id) {
    throw newError(400, 'Required fields not given', 'USER.ERROR.INSERT.REQUIRED.SUMMARY', 'USER.ERROR.INSERT.REQUIRED.DETAIL');
  }

  let query = { _id };
  let users = await userRepository.find(query);
  errorIfNotExists(users && users.length, 'User doesn\'t exist', 400, 'USER.ERROR.INSERT.EXISTING.SUMMARY', 'USER.ERROR.INSERT.EXISTING.DETAIL');
  if (email) {
    query = { email };
    users = await userRepository.find(query);
    errorIfExists(users && users.length && users[0]._id.toString() !== _id.toString(), 'Email in use', 400, 'USER.ERROR.INSERT.EXISTING.SUMMARY', 'USER.ERROR.INSERT.EXISTING.DETAIL');
  }
}

async function insertOne(user) {
  await validateInsertUser(user);
  const code = await generateCode(6);
  const userParsed = { ...user, code, creationDate: new Date() };
  const newUser = await userRepository.insertOne(userParsed);
  return newUser;
}

async function updateOne(user) {
  await validateUpdateUser(user);
  const userParsed = { ...user, modificationDate: new Date() };
  const userUpdated = await userRepository.updateOne(userParsed);
  return userUpdated;
}

async function deleteMany(filter) {
  await userRepository.deleteMany(filter);
}

module.exports = {
  find,
  insertOne,
  updateOne,
  deleteMany,
};
