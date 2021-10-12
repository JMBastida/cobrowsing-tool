const log4js = require('log4js');
const CONFIG = require('../../../../config');
const usersBll = require('./users.bll');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('USERS');
logger.level = 'debug';

async function getUsers(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { user, query } = req;
    lan = user.language;
    const response = await usersBll.getUsers(query);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  getUsers,
};
