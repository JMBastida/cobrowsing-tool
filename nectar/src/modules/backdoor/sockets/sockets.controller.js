const log4js = require('log4js');
const CONFIG = require('../../../../config');
const socketsBll = require('./sockets.bll');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('STATUS');
logger.level = 'debug';

async function setMaxConnections(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { params } = req;
    const { value } = params;
    const response = await socketsBll.setMaxConnections(value);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function setSocketInactivityTime(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { params } = req;
    const { value } = params;
    const response = await socketsBll.setSocketInactivityTime(value);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function setConnectionWithoutAgentsValidation(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { params } = req;
    const { value } = params;
    const response = await socketsBll.setConnectionWithoutAgentsValidation(value);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  setMaxConnections,
  setSocketInactivityTime,
  setConnectionWithoutAgentsValidation,
};