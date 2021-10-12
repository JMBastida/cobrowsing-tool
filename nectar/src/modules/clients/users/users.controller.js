const log4js = require('log4js');
const CONFIG = require('../../../../config');
const usersBll = require('./users.bll');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('USERS');
logger.level = 'debug';

async function getSelfUser(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { entity, entityConfig, user } = req;
    lan = user.language;
    const response = usersBll.getSelfUser(entity, entityConfig, user);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function getUsers(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { entity, user, query } = req;
    lan = user.language;
    const response = await usersBll.getUsers(entity, query);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function createUser(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { entity, user, body } = req;
    lan = user.language;
    const newUser = await usersBll.createUser(entity, body);
    res.send({ ...newUser });
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function updateUser(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { entity, user, body } = req;
    lan = user.language;
    const response = await usersBll.updateUser(entity, user, body);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function updateSelfUser(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { user, body } = req;
    lan = user.language;
    const response = await usersBll.updateSelfUser(user, body);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  getSelfUser,
  updateSelfUser,
};
