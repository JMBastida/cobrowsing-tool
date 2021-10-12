/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
var {
  init,
  dispatch,
  startCall,
  requestHelp,
  setUserData,
  showSidebyPin,
  stopCoBrowsing,
  closeHelpPinAdvise,
  responseCoBrowsing,
  closeSmartLinkAdvise,
  closeAgentBusyAdvise,
  closeCallRequestAdvise,
  closeCobrowsingEndAdvise,
} = require('./functions');

init();

module.exports = {
  dispatch,
  startCall,
  requestHelp,
  setUserData,
  showSidebyPin,
  stopCoBrowsing,
  closeHelpPinAdvise,
  responseCoBrowsing,
  closeSmartLinkAdvise,
  closeAgentBusyAdvise,
  closeCallRequestAdvise,
  closeCobrowsingEndAdvise,
};
