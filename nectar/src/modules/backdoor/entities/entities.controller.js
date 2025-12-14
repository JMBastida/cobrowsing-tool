const log4js = require('log4js');
const entitiesBll = require('./entities.bll');

const logger = log4js.getLogger('ENTITIES');
logger.level = 'debug';

async function setStatus(req, res) {
  const { params } = req;
  const { entityId, status } = params;
  try {
    const response = await entitiesBll.setStatus(entityId, status);
    res.send(response);
  } catch (err) {
    logger.error(err);
    res.send({ ERROR: `Something went wrong. ID: ${entityId}. STATUS: ${status}.` });
  }
}

async function handleModule(req, res) {
  const { params } = req;
  const { entityId, module, status } = params;
  try {
    const response = await entitiesBll.handleModule(entityId, module, status);
    res.send(response);
  } catch (err) {
    logger.error(err);
    res.send({ ERROR: `Something went wrong. ID: ${entityId}. STATUS: ${status}.` });
  }
}

async function removeEntity(req, res) {
  const { params } = req;
  const { entityId } = params;
  try {
    const response = await entitiesBll.removeEntity(entityId);
    res.send(response);
  } catch (err) {
    logger.error(err);
    res.send({ ERROR: `Something went wrong. ID: ${entityId}.` });
  }
}

module.exports = {
  setStatus,
  handleModule,
  removeEntity,
};
