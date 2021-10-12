const log4js = require('log4js');
const CONFIG = require('../../../../config');
const statusBll = require('./status.bll');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('STATUS');
logger.level = 'debug';

async function getStatus(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { query } = req;
    const response = await statusBll.getStatus(query);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  getStatus,
};