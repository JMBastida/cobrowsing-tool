const entityConfigBll = require('../../../shared/database/entity-config/entity-config.bll');

async function getEntityConfigs(entityId, filter) {
  const options = { sortField: filter.sortField, sortOrder: filter.sortOrder, limit: filter.limit, skip: filter.skip };
  const response = await entityConfigBll.find(entityId, filter, options);
  return response;
}

async function updateEntityConfig(entityId, entityConfig) {
  const entityUpdated = await entityConfigBll.updateOne(entityId, entityConfig);
  return entityUpdated;
}

module.exports = {
  getEntityConfigs,
  updateEntityConfig,
};
