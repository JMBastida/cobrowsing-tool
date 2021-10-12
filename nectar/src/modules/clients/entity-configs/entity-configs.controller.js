const log4js = require('log4js');
const CONFIG = require('../../../../config');
const entityConfigsBll = require('./entity-configs.bll');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('ENTITIES');
logger.level = 'debug';

async function getEntityConfig(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { entity, user, entityConfig } = req;
    lan = user.language;
    const response = entityConfigsBll.getEntityConfig(entity, entityConfig);
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
    const { entity, user, entityConfig, body } = req;
    lan = user.language;
    const response = await entityConfigsBll.updateEntityConfig(entity, entityConfig, body);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function changeWidgetAvailability(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { entity, user, entityConfig, body } = req;
    lan = user.language;
    const entityUpdated = await entityConfigsBll.changeWidgetAvailability(entity, entityConfig, body);
    res.send(entityUpdated);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  getEntityConfig,
  updateEntityConfig,
  changeWidgetAvailability,
};
