const CONFIG = require('../../config');
const { connect, getCollection } = require('../../src/shared/database/mongo');
const { sendEmailToClient } = require('../../src/shared/email-composer/email-composer.bll');
const { ENTITY_EMAIL_TYPE } = require('../../src/shared/database/entity/entity.enums');

const templateId = 2835126;

let usersCollection;
let entitiesCollection;
let registriesCollection;

async function getUsers(entity) {
  const filter = { entityId: entity._id };
  const users = await usersCollection.find(filter).toArray();
  return users;
}

async function checkLastWeekRegistries(entity) {
  const users = await getUsers(entity);
  const date = new Date();
  date.setDate(date.getDate() - 7);
  const userIds = users.map(u => u._id);
  const filter = { userId: { $in: userIds }, creationDate: { $gte: date } };
  const totalRegistries = await registriesCollection.countDocuments(filter);
  return !!totalRegistries;
}

async function sendEmailToUsers(entity) {
  const users = await usersCollection.find({ entityId: entity._id }).toArray();
  const total = users.length;
  const options = { templateId };
  for (let i = 0; i < total; i += 1) {
    const user = users[i];
    const { email, name } = user;
    options.to = email;
    const data = { name };
    if (CONFIG.ENVIRONMENT === 'PRODUCTION') await sendEmailToClient(options, '', data);
  }
}

async function handleSendEmail(entity) {
  const hasRegistries = await checkLastWeekRegistries(entity);
  if (hasRegistries) return;
  await sendEmailToUsers(entity);
  const query = { _id: entity._id };
  const update = {
    $addToSet: { emailsSent: { $each: [ENTITY_EMAIL_TYPE.CHECK_ONE_WEEK_INTERACTION] } },
    $set: { modificationDate: new Date() },
  };
  await entitiesCollection.findOneAndUpdate(query, update, { returnOriginal: false });
}

async function getEntities() {
  const filter = {
    emailsSent: { $nin: [ENTITY_EMAIL_TYPE.CHECK_ONE_WEEK_INTERACTION] },
  };
  const entities = await entitiesCollection.find(filter).toArray();
  return entities;
}

connect().then(async () => {
  usersCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'users');
  entitiesCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'entities');
  registriesCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'registries');
  const entities = await getEntities();
  const total = entities.length;
  for (let i = 0; i < total; i += 1) {
    const entity = entities[i];
    try {
      await handleSendEmail(entity);
    } catch (err) {
      console.log(err);
    }
  }

  process.exit(0);
}).catch((error) => {
  console.log(error);
  process.exit(1);
});