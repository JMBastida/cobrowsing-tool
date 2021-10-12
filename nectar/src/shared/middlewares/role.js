const log4js = require('log4js');
const CONFIG = require('../../../config');
const { ROLES } = require('../database/user/user.enums');
const { newError } = require('../helpers/errors.helper');
const { getToastMessageLiterals } = require('../helpers/message.helper');

const logger = log4js.getLogger('MIDDLEWARE_ROLE');
logger.level = 'debug';

module.exports = (validRoles) => (req, res, next) => {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { user } = req;
    if (user) lan = user.language;
    validRoles.push(ROLES.SUPER);
    if (!user || !user.role || !validRoles.includes(user.role)) {
      const message = `Bad user role. User: ${user ? user._id : 'undefined'}. Role: ${user ? user.role : 'undefined'}.`;
      throw newError(403, message, 'SHARED.MW.ERROR.SUMMARY', 'SHARED.MW.ERROR.DETAIL');
    }
    
    next();
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 401).send({ toastMessages });
  }
};
