const entityConfigBll = require('../../../shared/database/entity-config/entity-config.bll');
const { getClientEntityObject } = require('../../../shared/helpers/entities.helper');

function getEntityConfig(entity, entityConfig) {
  const clientEntity = getClientEntityObject(entity, entityConfig);
  const response = { entity: clientEntity };
  return response;
}

async function updateEntityConfig(entity, currentEntityConfig, newEntityConfig) {
  const {
    _id,
    companyName,
    companyEmail,
  } = currentEntityConfig;
  const entityConfigParsed = {
    _id,
    logoUrl: newEntityConfig.logoUrl,
    companySite: newEntityConfig.companySite,
    companyName: newEntityConfig.companyName || companyName,
    companyEmail: newEntityConfig.companyEmail || companyEmail,
    companyPhone: newEntityConfig.companyPhone,
    modificationDate: new Date(),
  };
  const entityConfigUpdated = await entityConfigBll.updateOne(entity._id, entityConfigParsed);
  const response = getEntityConfig(entity, entityConfigUpdated);
  return response;
}

async function changeWidgetAvailability(entity, currentEntityConfig, newEntityConfig) {
  const { _id } = currentEntityConfig;
  const { isWidgetEnabled } = newEntityConfig;
  const entityConfigParsed = { _id, isWidgetEnabled, modificationDate: new Date() };
  const entityConfigUpdated = await entityConfigBll.updateOne(entity._id, entityConfigParsed);
  const response = getEntityConfig(entity, entityConfigUpdated);
  return response;
}

module.exports = {
  getEntityConfig,
  updateEntityConfig,
  changeWidgetAvailability,
};
