const log4js = require('log4js');
const CONFIG = require('../../../../config');
const libBll = require('./lib.bll.js');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('LIB');
logger.level = 'debug';

async function getCoBrowsingLib(req, res) {
  const lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { params } = req;
    const { code } = params;
    const data = await libBll.getCoBrowsingLib(code);
    if (!data) res.send();
    else {
      res.type('.js');
      res.send(data);
    }
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function getIframeLib(req, res) {
  const lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const data = await libBll.getIframeLib();
    if (!data) res.send();
    else {
      res.type('.js');
      res.send(data);
    }
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  getIframeLib,
  getCoBrowsingLib,
};
