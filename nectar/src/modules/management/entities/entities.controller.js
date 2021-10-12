const log4js = require('log4js');
const CONFIG = require('../../../../config');
const entitiesBll = require('./entities.bll');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('ENTITIES');
logger.level = 'debug';

async function getEntities(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { query, user } = req;
    lan = user.language;
    const response = await entitiesBll.getEntities(query);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function createEntity(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { user, body } = req;
    lan = user.language;
    const entityCreated = await entitiesBll.createEntity(body);
    res.send(entityCreated);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function updateEntity(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { user, body } = req;
    lan = user.language;
    const entityUpdated = await entitiesBll.updateEntity(body);
    res.send(entityUpdated);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  getEntities,
  createEntity,
  updateEntity,
};
