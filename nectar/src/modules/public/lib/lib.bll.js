const fs = require('fs');
const CONFIG = require('../../../../config');
const entityBll = require("../../../shared/database/entity/entity.bll");
const entityConfigBll = require("../../../shared/database/entity-config/entity-config.bll");
const { ENTITY_STATUS } = require("../../../shared/database/entity/entity.enums");

async function getCoBrowsingLib(code) {
  const entitiesResponse = await entityBll.find({ code, status: ENTITY_STATUS.ACTIVE });
  const [entity] = entitiesResponse.entities;
  if (!entity) return null;
  const entityConfigsResponse = await entityConfigBll.find(entity._id);
  const [entityConfig] = entityConfigsResponse.entityConfigs;
  const isWidgetEnabled = entityConfig ? !!entityConfig.isWidgetEnabled : false;
  let data = fs.readFileSync('./dist/cobrowsing/lib.js', { encoding: 'utf-8' });
  data = data.replace(/{{entityId}}/g, entity._id);
  data = data.replace(/{{isWidgetEnabled}}/g, isWidgetEnabled);
  data = data.replace(/{{API_BASE_URL}}/g, CONFIG.API_BASE_URL);
  data = data.replace(/{{AGORA_APP_ID}}/g, CONFIG.AGORA_APP_ID);
  return data;
}

function getIframeLib() {
  const data = fs.readFileSync('./dist/cobrowsing-iframe/lib.js', { encoding: 'utf-8' });
  return data;
}

module.exports = {
  getIframeLib,
  getCoBrowsingLib,
};
