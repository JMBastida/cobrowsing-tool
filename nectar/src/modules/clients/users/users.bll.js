const bcrypt = require('bcryptjs');
const userBll = require('../../../shared/database/user/user.bll');
const passwordBll = require('../../../shared/database/password/password.bll');
const { errorIfNotExists } = require('../../../shared/helpers/errors.helper');
const { validateEmail } = require('../../../shared/helpers/validators.helper');
const { getClientEntityObject } = require('../../../shared/helpers/entities.helper');

function sanitizeUser(user) {
  const userSanitized = { ...user };
  if (user.email) {
    userSanitized.email = user.email.trim();
    const isValidEmail = validateEmail(userSanitized.email);
    errorIfNotExists(isValidEmail, `Invalid company email: ${userSanitized.email}`, 400, 'AUTH.ERROR.EMAIL.SUMMARY', 'AUTH.ERROR.EMAIL.INVALID_COMPANY_EMAIL');
  }

  if (user.name) userSanitized.name = user.name.trim();
  if (user.lastName) userSanitized.lastName = user.lastName.trim();
  return userSanitized;
}

function getSelfUser(entity, entityConfig, user) {
  const clientEntity = getClientEntityObject(entity, entityConfig);
  const response = { user, entity: clientEntity };
  return response;
}

async function getUsers(entity, filter) {
  const options = {
    skip: filter.skip,
    limit: filter.limit,
    sortOrder: filter.sortOrder,
    sortField: filter.sortField,
  };
  const filterParsed = { ...filter, entityId: entity._id };
  const response = await userBll.find(filterParsed, options);
  return response;
}

async function updateUserPasswordData(userId, password) {
  const passwordDataResponse = await passwordBll.find({ userId });
  const [currentPasswordData] = passwordDataResponse.passwords;
  errorIfNotExists(currentPasswordData, 'Password not found', 404, 'USER.ERROR.UPDATE.PASSWORD.SUMMARY', 'USER.ERROR.UPDATE.PASSWORD.DETAIL');
  const { _id } = currentPasswordData;
  const passwordDataParsed = { _id, password };
  await passwordBll.updateOne(passwordDataParsed);
}

async function updateSelfPasswordData(userId, password, newPassword) {
  const passwordDataResponse = await passwordBll.find({ userId });
  const [currentPasswordData] = passwordDataResponse.passwords;
  errorIfNotExists(currentPasswordData, 'Password not found', 404, 'USER.ERROR.UPDATE.PASSWORD.SUMMARY', 'USER.ERROR.UPDATE.PASSWORD.DETAIL');
  const isValid = bcrypt.compareSync(password, currentPasswordData.password);
  errorIfNotExists(isValid, 'Passwords don\'t match', 403, 'USER.ERROR.UPDATE.PASSWORD.SUMMARY', 'USER.ERROR.UPDATE.PASSWORD.DETAIL');
  const updatePasswordData = { _id: currentPasswordData._id, password: newPassword };
  await passwordBll.updateOne(updatePasswordData);
}

async function createUser(entity, user) {
  // const usersResponse = await getUsers(entity, {});
  // const { users } = usersResponse;
  // const { maxUsers } = entity;
  // errorIfExists(!maxUsers || (users && users.length >= maxUsers), 'Users limit exceeded', 403, 'USER.ERROR.INSERT.LIMIT.SUMMARY', 'USER.ERROR.INSERT.LIMIT.DETAIL')
  const { email, name, password } = user;
  errorIfNotExists(email && password, 'Missing user fields', 400, 'USER.ERROR.INSERT.REQUIRED.SUMMARY', 'USER.ERROR.INSERT.REQUIRED.DETAIL');
  const emailParsed = email.trim();
  const nameParsed = name.trim();
  const isValidEmail = validateEmail(emailParsed);
  errorIfNotExists(isValidEmail, `Invalid company email: ${emailParsed}`, 400, 'AUTH.ERROR.EMAIL.SUMMARY', 'AUTH.ERROR.EMAIL.INVALID_COMPANY_EMAIL');
  const userParsed = { ...user, entityId: entity._id, email: emailParsed, name: nameParsed };
  const userCreated = await userBll.insertOne(userParsed);
  const passwordData = { password, userId: userCreated._id };
  passwordBll.insertOne(passwordData);
  return userCreated;
}

async function updateUser(entity, loggedUser, user) {
  const userSanitized = sanitizeUser(user);
  const { _id } = userSanitized;
  const usersResponse = await userBll.find({ _id, entityId: entity._id });
  const [currentUser] = usersResponse.users;
  errorIfNotExists(currentUser, 'User not found', 400, 'USER.ERROR.UPDATE.NOT_FOUND.SUMMARY', 'USER.ERROR.UPDATE.NOT_FOUND.DETAIL');
  const userParsed = { ...userSanitized, entityId: entity._id };
  const userUpdated = await userBll.updateOne(userParsed);
  if (userSanitized.password) updateUserPasswordData(_id, userSanitized.password);
  const response = userUpdated;
  if (_id.toString() === loggedUser._id.toString()) {
    userUpdated.token = loggedUser.token;
    response.user = JSON.parse(JSON.stringify(userUpdated));
  }

  return response;
}

async function updateSelfUser(currentUser, newUser) {
  const { _id, entityId } = currentUser;
  const userSanitized = sanitizeUser(newUser);
  const { password, newPassword } = userSanitized;
  const userParsed = { ...userSanitized, _id, entityId };
  if (password && newPassword) await updateSelfPasswordData(currentUser._id, password, newPassword);
  const userUpdated = await userBll.updateOne(userParsed);
  userUpdated.token = currentUser.token;
  const response = { user: userUpdated };
  return response;
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  getSelfUser,
  updateSelfUser,
};
