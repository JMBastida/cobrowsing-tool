const entityBll = require('../../../shared/database/entity/entity.bll');
const registryBll = require('../../../shared/database/registry/registry.bll');
const { getConnections } = require('../../public/socket');

function getConnectionStats(connections) {
  const connectionStats = connections.reduce((prev, curr) => {
    if (curr.isAgent) prev.agents += 1;
    else prev.clients += 1;
    if (curr.user && curr.user.email) prev.users.push(curr.user.email);
    return prev;
  }, {
    users: [],
    agents: 0,
    clients: 0,
  });
  return connectionStats;
}

async function getStatus(query) {
  const filter = {};
  const { exclude, include } = query;
  if (exclude && exclude.length) filter.companyEmail = { $nin: exclude };
  else if (include && include.length) filter.companyEmail = { $in: include };
  const connections = getConnections();
  const entitiesResponse = await entityBll.find(filter);
  const { entities, total } = entitiesResponse;
  const scriptInstalled = [];
  const scriptInstalledInDev = [];
  const scriptNotInstalled = [];
  for (let i = 0; i < total; i += 1) {
    const entity = entities[i];
    const registriesResponse = await registryBll.find({ entityId: entity._id });
    entity.registries = registriesResponse.registries;
    if (entity.scriptOrigins && entity.scriptOrigins.length) {
      const isInProduction = entity.scriptOrigins.some(s => !s.includes('localhost'));
      if (isInProduction) scriptInstalled.push(entity);
      else scriptInstalledInDev.push(entity);
    } else scriptNotInstalled.push(entity);
  }

  const connectionStats = getConnectionStats(connections);
  const response = {
    connectionStats,
    scriptInstalled,
    scriptInstalledInDev,
    scriptNotInstalled,
  };
  return response;
}

module.exports = {
  getStatus,
};
