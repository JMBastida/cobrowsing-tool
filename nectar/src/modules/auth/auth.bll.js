const bcrypt = require('bcryptjs');
const CONFIG = require('../../../config');
const userBll = require('../../shared/database/user/user.bll');
const entityBll = require('../../shared/database/entity/entity.bll');
const passwordBll = require('../../shared/database/password/password.bll');
const registryBll = require('../../shared/database/registry/registry.bll');
const entityConfigBll = require('../../shared/database/entity-config/entity-config.bll');

// const emailComposer = require('../../shared/email-composer/email-composer.bll');

const { REGISTRY_TYPE } = require('../../shared/database/registry/registry.enums');

const { getToken, decodeToken } = require('../../shared/helpers/token.helper');
const { ROLES } = require('../../shared/database/user/user.enums');
const { errorIfNotExists, errorIfExists } = require('../../shared/helpers/errors.helper');
const { validateEmail } = require('../../shared/helpers/validators.helper');
const { forceLogout, checkUserConnection } = require('../public/socket');
const { getClientEntityObject } = require('../../shared/helpers/entities.helper');

function validatePassword(passwordDb, password, email) {
  const isValidPassword = bcrypt.compareSync(password, passwordDb);
  errorIfNotExists(isValidPassword, `Invalid password. Email: ${email}`, 404, 'AUTH.ERROR.LOGIN.SUMMARY', 'AUTH.ERROR.LOGIN.INVALID_PASSWORD');
}

function generateRandomPassword(length) {
  let password = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    password += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return password;
}

function addAccessRegistry(entityId, userId, ip) {
  if (!entityId || !userId) return;
  const registry = {
    ip,
    userId,
    entityId,
    type: REGISTRY_TYPE.ACCESS,
  };
  registryBll.insertOne(registry);
}

// function handleSendEmail(user, password, passwordParsed) {
//   const options = { to: user.email, templateId: 2833028 };
//   const data = {
//     name: user.name || '',
//     email: user.email || '',
//     password: password ? '' : passwordParsed,
//   };
//   emailComposer.sendEmailToClient(options, '', data);
// }

async function getEntity(entityId) {
  if (!entityId) return;
  const entitiesResponse = await entityBll.find({ _id: entityId });
  const [entity] = entitiesResponse.entities;
  if (!entity) return;
  const entityConfigsResponse = await entityConfigBll.find(entityId, {});
  const [entityConfig] = entityConfigsResponse.entityConfigs;
  const clientEntity = getClientEntityObject(entity, entityConfig);
  return clientEntity;
}

async function createEntity(data) {
  const { email, origin, company } = data;
  const entityParsed = {
    origin,
    companyName: company,
    companyEmail: email,
    maxUsers: CONFIG.DEFAULT_MAX_USERS,
  };
  const entity = await entityBll.insertOne(entityParsed);
  const entityConfigParsed = { companyEmail: email };
  entityConfigBll.insertOne(entity._id, entityConfigParsed);
  return entity;
}

async function createUser(entity, data) {
  const entityId = entity._id;
  const { name, email, language } = data;
  const userParsed = { name, email, role: ROLES.ADMIN, entityId, language };
  const user = await userBll.insertOne(userParsed);
  return user;
}

async function createPassword(user, password) {
  const userId = user._id;
  const passwordData = { password, userId };
  await passwordBll.insertOne(passwordData);
}

async function signup(data, ip) {
  const { email, password } = data;
  errorIfNotExists(email, 'Email not given.', 400, 'AUTH.ERROR.SIGNUP.SUMMARY', 'AUTH.ERROR.SIGNUP.EMAIL');
  const emailParsed = email.trim();
  const isValidEmail = validateEmail(emailParsed);
  errorIfNotExists(isValidEmail, `Invalid company email: ${emailParsed}`, 400, 'AUTH.ERROR.EMAIL.SUMMARY', 'AUTH.ERROR.EMAIL.INVALID_COMPANY_EMAIL');
  const usersResponse = await userBll.find({ email: emailParsed });
  const [existingUser] = usersResponse.users;
  errorIfExists(existingUser, `User already exists: ${emailParsed}`, 400, 'AUTH.ERROR.SIGNUP.SUMMARY', 'AUTH.ERROR.SIGNUP.EXISTING_EMAIL');
  const entityCreated = await createEntity(data);
  const newUser = { ...data, email: emailParsed };
  const user = await createUser(entityCreated, newUser);
  let passwordParsed = password;
  if (!password) passwordParsed = generateRandomPassword(8);
  createPassword(user, passwordParsed);
  // handleSendEmail(user, password, passwordParsed);
  user.token = getToken(user._id);
  const entity = await getEntity(user.entityId);
  const response = { user, entity };
  addAccessRegistry(entity._id, user._id, ip);
  return response;
}

async function login(body, ip) {
  const { email, password } = body;
  errorIfNotExists(email, 'Username not given.', 400, 'AUTH.ERROR.LOGIN.SUMMARY', 'AUTH.ERROR.LOGIN.EMAIL');
  errorIfNotExists(password, 'Password not given.', 400, 'AUTH.ERROR.LOGIN.SUMMARY', 'AUTH.ERROR.LOGIN.PASSWORD');
  const emailParsed = email.trim();
  const usersResponse = await userBll.find({ email: emailParsed });
  const [user] = usersResponse.users;
  errorIfNotExists(user, `User not exists: ${emailParsed}.`, 404, 'AUTH.ERROR.LOGIN.SUMMARY', 'AUTH.ERROR.LOGIN.USER_NOT_FOUND');
  const passwordResponse = await passwordBll.find({ userId: user._id });
  const [passwordFound] = passwordResponse.passwords;
  errorIfNotExists(passwordFound, `Password not exists userId: ${user._id}.`, 404, 'AUTH.ERROR.LOGIN.SUMMARY', 'AUTH.ERROR.LOGIN.USER_NOT_FOUND');
  validatePassword(passwordFound.password, password, email);
  user.token = getToken(user._id);
  const entity = await getEntity(user.entityId);
  await forceLogout(user._id);
  const response = { user, entity };
  addAccessRegistry(entity._id, user._id, ip);
  return response;
}

async function checkValidLogin(token, ip) {
  const decodedToken = decodeToken(token);
  const { userId } = decodedToken;
  let isValid = false;
  if (!userId) return { isValid };
  isValid = checkUserConnection(userId);
  if (!isValid) return { isValid };
  const usersResponse = await userBll.find({ _id: userId });
  const [user] = usersResponse.users;
  if (user) addAccessRegistry(user.entityId, userId, ip);
  return { isValid };
}

module.exports = {
  login,
  signup,
  checkValidLogin,
};
