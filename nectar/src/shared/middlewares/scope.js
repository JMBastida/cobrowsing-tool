const log4js = require('log4js');
const CONFIG = require('../../../config');
const { newError } = require('../helpers/errors.helper');
const { getToastMessageLiterals } = require('../helpers/message.helper');

const logger = log4js.getLogger('MIDDLEWARE_SCOPE');
logger.level = 'debug';

module.exports = (scope) => (req, res, next) => {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { user } = req;
    if (user) lan = user.language;
    if (!user || !user.scopes || !user.scopes.includes(scope)) {
      const message = `Bad user scope. Valid scope: ${scope}. User: ${user ? user._id : 'undefined'}. Scopes: ${user ? user.scopes.toString() : 'undefined'}.`;
      throw newError(403, message, 'SHARED.MW.ERROR.SUMMARY', 'SHARED.MW.ERROR.DETAIL');
    }

    next();
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 401).send({ toastMessages });
  }
};
