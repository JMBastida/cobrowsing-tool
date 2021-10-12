const log4js = require('log4js');
const CONFIG = require('../../../../config');
const filesBll = require('./files.bll');
const { getToastMessageLiterals } = require('../../../shared/helpers/message.helper');

const logger = log4js.getLogger('FILES');
logger.level = 'debug';

async function uploadFile(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { files, entity, user } = req;
    lan = user.language;
    const response = await filesBll.uploadFile(entity, files);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

module.exports = {
  uploadFile,
};
