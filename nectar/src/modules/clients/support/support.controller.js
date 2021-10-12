const log4js = require('log4js');
const supportBll = require('./support.bll');

const logger = log4js.getLogger('SUPPORT');
logger.level = 'debug';

function supportRequest(req, res) {
  const { user, body } = req;
  const response = supportBll.supportRequest(user, body);
  res.send(response);
}

module.exports = {
  supportRequest,
};
