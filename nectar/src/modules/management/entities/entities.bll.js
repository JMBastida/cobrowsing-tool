const userBll = require('../../../shared/database/user/user.bll');
const entityBll = require('../../../shared/database/entity/entity.bll');
const passwordBll = require('../../../shared/database/password/password.bll');
const entityConfigBll = require('../../../shared/database/entity-config/entity-config.bll');
const { ROLES } = require('../../../shared/database/user/user.enums');

async function updateEntity(entity) {
  const entityUpdated = await entityBll.updateOne(entity);
  return entityUpdated;
}

async function getEntities(filter) {
  const options = { sortField: filter.sortField, sortOrder: filter.sortOrder, limit: filter.limit, skip: filter.skip };
  const response = await entityBll.find(filter, options);
  return response;
}

async function createEntity(data) {
  const entityParsed = { email: data.email };
  const entityCreated = await entityBll.insertOne(entityParsed);
  const userParsed = { ...data, role: ROLES.ADMIN, entityId: entityCreated._id };
  const userCreated = await userBll.insertOne(userParsed);
  const passwordData = { userId: userCreated._id, password: data.password };
  passwordBll.insertOne(passwordData);
  entityConfigBll.insertOne(entityCreated._id, data);
  return entityCreated;
}

module.exports = {
  getEntities,
  updateEntity,
  createEntity,
};
