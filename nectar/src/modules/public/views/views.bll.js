const CONFIG = require('../../../../config');

function getCallsView(res) {
  res.render('calls/index', {
    API_BASE_URL: CONFIG.API_BASE_URL,
    AGORA_APP_ID: CONFIG.AGORA_APP_ID,
    DEFAULT_USER_IMG: CONFIG.DEFAULT_USER_IMG,
  });
}

module.exports = {
  getCallsView,
};
