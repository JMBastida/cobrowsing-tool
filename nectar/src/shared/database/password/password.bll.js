const bcrypt = require('bcryptjs');
const { newError, errorIfExists, errorIfNotExists } = require('../../helpers/errors.helper');
const passwordRepository = require('./password.repository');

async function find(filter = {}, options = {}) {
  const [passwords, total] = await Promise.all([
    passwordRepository.find(filter, options),
    passwordRepository.count(filter),
  ]);

  return { passwords, total };
}

async function validateInsertPassword(passwordData) {
  const { userId, password } = passwordData;
  if (!userId || !password) {
    throw newError(400, 'Required fields not given', 'USER.ERROR.INSERT.REQUIRED.DETAIL', 'USER.ERROR.INSERT.REQUIRED.DETAIL');
  }

  const query = { userId };
  const passwords = await passwordRepository.find(query);
  errorIfExists(passwords && passwords.length, 'Email in use', 400, 'USER.ERROR.INSERT.EXISTING.DETAIL', 'USER.ERROR.INSERT.EXISTING.DETAIL');
}

async function validateUpdatePassword(passwordData) {
  const { _id } = passwordData;
  if (!_id) {
    throw newError(400, 'Required fields not given', 'USER.ERROR.INSERT.REQUIRED.DETAIL', 'USER.ERROR.INSERT.REQUIRED.DETAIL');
  }

  const query = { _id };
  const passwords = await passwordRepository.find(query);
  errorIfNotExists(passwords && passwords.length, 'Password doesn\'t exist', 400, 'USER.ERROR.INSERT.EXISTING.DETAIL', 'USER.ERROR.INSERT.EXISTING.DETAIL');
}

async function insertOne(password) {
  await validateInsertPassword(password);
  const passwordParsed = { ...password, creationDate: new Date(), password: bcrypt.hashSync(password.password) };
  const newPassword = await passwordRepository.insertOne(passwordParsed);
  return newPassword;
}

async function updateOne(password) {
  await validateUpdatePassword(password);
  const passwordParsed = { ...password, modificationDate: new Date() };
  delete password.userId;
  if (passwordParsed.password) passwordParsed.password = bcrypt.hashSync(passwordParsed.password);
  const passwordUpdated = await passwordRepository.updateOne(passwordParsed);
  return passwordUpdated;
}

async function deleteMany(filter) {
  await passwordRepository.deleteMany(filter);
}

module.exports = {
  find,
  insertOne,
  updateOne,
  deleteMany,
};
