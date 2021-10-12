const log4js = require('log4js');
const CONFIG = require('../../../../config');
const sessionsBll = require('./sessions.bll');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('SESSIONS');
logger.level = 'debug';

async function getSessions(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { user, query, params } = req;
    lan = user.language;
    const { entityId } = params;
    const response = await sessionsBll.getSessions(entityId, query);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  getSessions,
};
