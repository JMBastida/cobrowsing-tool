const log4js = require('log4js');
const viewsBll = require('./views.bll.js');

const logger = log4js.getLogger('LIB');
logger.level = 'debug';

async function getCallsView(req, res) {
  viewsBll.getCallsView(res);
}

module.exports = {
  getCallsView,
};
