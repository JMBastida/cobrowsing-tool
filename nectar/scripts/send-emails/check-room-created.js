



// DEPRECTAED ====> isScriptInstalled is deprecated. Now we check scriptsOrigins array to know if is installed and where




// const CONFIG = require('../../config');
// const { connect, getCollection } = require('../../src/shared/database/mongo');
// const { sendEmailToClient } = require('../../src/shared/email-composer/email-composer.bll');
// const { ENTITY_EMAIL_TYPE } = require('../../src/shared/database/entity/entity.enums');

// const templateId = 2833058;

// let entitiesCollection;
// let usersCollection;

// async function checkRooms(entity) {
//   const roomCollection = getCollection(entity._id.toString(), 'rooms');
//   const totalRooms = await roomCollection.countDocuments({});
//   return !!totalRooms;
// }

// async function sendEmailToUsers(entity) {
//   const users = await usersCollection.find({ entityId: entity._id }).toArray();
//   const total = users.length;
//   const options = { templateId };
//   for (let i = 0; i < total; i += 1) {
//     const user = users[i];
//     const { email, name } = user;
//     options.to = email;
//     const data = { name };
//     if (CONFIG.ENVIRONMENT === 'PRODUCTION') await sendEmailToClient(options, '', data);
//   }
// }

// async function handleSendEmail(entity) {
//   const hasRooms = await checkRooms(entity);
//   const query = { _id: entity._id };
//   if (hasRooms) {
//     const update = { $set: { isRoomCreated: true, modificationDate: new Date() } };
//     await entitiesCollection.findOneAndUpdate(query, update, { returnOriginal: false });
//     return;
//   }

//   await sendEmailToUsers(entity);
//   const update = {
//     $addToSet: { emailsSent: { $each: [ENTITY_EMAIL_TYPE.CHECK_SCRIPT_INSTALLATION] } },
//     $set: { modificationDate: new Date() },
//   };
//   await entitiesCollection.findOneAndUpdate(query, update, { returnOriginal: false });
// }

// async function getEntities() {
//   const filter = {
//     emailsSent: { $nin: [ENTITY_EMAIL_TYPE.CHECK_ROOM_CREATED] },
//     isScriptInstalled: true,
//     isRoomCreated: { $ne: true },
//   };
//   const entities = await entitiesCollection.find(filter).toArray();
//   return entities;
// }

// connect().then(async () => {
//   entitiesCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'entities');
//   usersCollection = getCollection(CONFIG.DATABASE.MANAGEMENT_DB, 'users');
//   const entities = await getEntities();
//   const total = entities.length;
//   for (let i = 0; i < total; i += 1) {
//     const entity = entities[i];
//     try {
//       await handleSendEmail(entity);
//     } catch (err) {
//       console.log(err);
//     }
//   }

//   process.exit(0);
// }).catch((error) => {
//   console.log(error);
//   process.exit(1);
// });