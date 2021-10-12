const stateBll = require('./state/state.bll');

function initialize() {
  stateBll.initialize();
}

module.exports = {
  initialize,
};