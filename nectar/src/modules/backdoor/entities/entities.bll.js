const entityBll = require('../../../shared/database/entity/entity.bll');
const userBll = require('../../../shared/database/user/user.bll');
const passwordBll = require('../../../shared/database/password/password.bll');
const registryBll = require('../../../shared/database/registry/registry.bll');
const { ENTITY_STATUS, MODULES_MAP } = require('../../../shared/database/entity/entity.enums');

async function setStatus(entityId, status) {
  const entitiesResponse = await entityBll.find({ _id: entityId });
  const [entity] = entitiesResponse.entities;
  if (!entity) return { ERROR: `Entity not found for entityId: ${entityId}. Are you sure this is a valid id?` };
  if (!status) return { ERROR: `Status not given. Set a valid status` };
  const newStatus = status.toUpperCase();
  if (!ENTITY_STATUS[newStatus]) return { ERROR: `Invalid status: ${status}. Are you sure this is a valid status? Ask Samuel if you don't know which status are valid.` };
  const entityParsed = { _id: entity._id, status: newStatus };
  const entityUpdated = await entityBll.updateOne(entityParsed);
  return { STATUS: `Entity status changed from ${entity.status} to ${entityUpdated.status}` };
}

async function handleModule(entityId, module, status) {
  const moduleKey = module.toUpperCase();
  const moduleParsed = MODULES_MAP[moduleKey];
  const isValidModule = !!moduleParsed;
  if (!isValidModule) return { ERROR: `Invalid module: ${module}. Set a valid module.` };
  const statusParsed = status.toUpperCase();
  const isValidStatus = ['ON', 'OFF'].includes(statusParsed);
  if (!isValidStatus) return { ERROR: `Invalid status value: ${status}. Set a valid status value.` };
  const entitiesResponse = await entityBll.find({ _id: entityId });
  const [entity] = entitiesResponse.entities;
  if (!entity) return { ERROR: `Entity not found for entityId: ${entityId}. Are you sure this is a valid id?` };
  const isActive = statusParsed === 'ON';
  const entityParsed = { _id: entity._id, modules: entity.modules };
  entityParsed.modules[moduleParsed] = isActive;
  await entityBll.updateOne(entityParsed);
  return { STATUS: `Entity module '${module}' is now ${isActive ? 'ON' : 'OFF'}` };
}

async function removeEntity(entityId) {
  const usersResponse = await userBll.find({ entityId });
  const { users } = usersResponse;
  const totalUsers = users.length;
  for (let i = 0; i < totalUsers; i += 1) {
    const userId = users[i]._id;
    await Promise.all([
      userBll.deleteMany({ _id: userId }),
      passwordBll.deleteMany({ userId }),
      registryBll.deleteMany({ userId }),
    ]);
  }

  await Promise.all([
    entityBll.deleteMany({ _id: entityId }),
    entityBll.dropDatabase(entityId),
  ]);
  return { message: 'Entity removed' };
}

module.exports = {
  setStatus,
  handleModule,
  removeEntity,
};
