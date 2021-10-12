const log4js = require('log4js');
const CONFIG = require('../../../../config');
const entityConfigsBll = require('./entity-configs.bll');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('ENTITY_CONFIGS');
logger.level = 'debug';

async function getEntityConfigs(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { user, query, params } = req;
    lan = user.language;
    const { entityId } = params;
    const response = await entityConfigsBll.getEntityConfigs(entityId, query);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function updateEntityConfig(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { user, body, params } = req;
    lan = user.language;
    const { entityId } = params;
    const entityUpdated = await entityConfigsBll.updateEntityConfig(entityId, body);
    res.send(entityUpdated);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  getEntityConfigs,
  updateEntityConfig,
};
