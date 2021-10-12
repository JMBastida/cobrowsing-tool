var timesSvg = require('../assets/times');
var fullLogoSvg = require('../assets/full-logo');
var logoSvg = require('../assets/logo');
var passFieldSvg = require('../assets/pass-field');
var shieldLockSvg = require('../assets/shield-lock');
var slashEyeSvg = require('../assets//slash-eye');

var literals = require('../locales');

var defaultLanguage = literals.defaultLanguage;

function getPoweredBy(language) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <div class="shr-powered-by">
      <span class="shr-powered-by-text">${literals[lan].POWERED_BY}</span>
      <span class="shr-powered-by-logo">${fullLogoSvg}</span>
    </div>
  `;
}

function getSmartLinkAdviceContent(language) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <div class="shr-smart-link-advise-text">${literals[lan].SMART_LINK_TEXT_1}</div>
    <div class="shr-smart-link-advise-text">${literals[lan].SMART_LINK_TEXT_2}</div>
    <div class="shr-smart-link-button-content">
      <div class="shr-smart-link-button shr-smart-link-button-close" onclick="sideby.closeSmartLinkAdvise()">
        ${literals[lan].CLOSE}
      </div>
    </div>
    ${getPoweredBy(language)}
  `;
}

function getAgentBusyContent(language) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <div class="shr-smart-link-advise-text">${literals[lan].AGENT_BUSY}</div>
    <div class="shr-smart-link-button-content">
      <div class="shr-smart-link-button shr-smart-link-button-close" onclick="sideby.closeAgentBusyAdvise()">
        ${literals[lan].CLOSE}
      </div>
    </div>
    ${getPoweredBy(language)}
  `;
}

function getCallRequestContent(language, name, userCode) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <div class="shr-call-request-advise-text">${name || literals[lan].SOMEONE} ${literals[lan].CALL_REQUEST}</div>
    <div class="shr-call-request-button-content">
      <div class="shr-call-request-button shr-call-request-button-accept" onclick="sideby.startCall('${userCode}')">
        ${literals[lan].ACCEPT}
      </div>
      <div class="shr-call-request-button shr-call-request-button-close" onclick="sideby.closeCallRequestAdvise()">
        ${literals[lan].CLOSE}
      </div>
    </div>
    ${getPoweredBy(language)}
  `;
}

function getPermissionAdviceContent(name, language) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <div class="shr-permission-advise-text">${name || literals[lan].OUR_TEAM} ${literals[lan].REQUEST_TEXT}</div>
    <div class="shr-permission-button-content">
      <div class="shr-permission-button shr-permission-button-accept" onclick="sideby.responseCoBrowsing(true)">
        ${literals[lan].ALLOW}
      </div>
      <div class="shr-permission-button shr-permission-button-reject" onclick="sideby.responseCoBrowsing(false)">
        ${literals[lan].DONT_ALLOW}
      </div>
    </div>
    <div class="shr-permission-advise-wrapper">
      <div class="shr-permission-advise-wrapper-item">
      <div class="shr-powered-by-logo">${slashEyeSvg}</div>
        ${literals[lan].PERMISION_1}
      </div>
      <div class="shr-permission-advise-wrapper-item">
        <div class="shr-powered-by-logo">${shieldLockSvg}</div>
        ${literals[lan].PERMISION_2}
      </div>
      <div class="shr-permission-advise-wrapper-item">
        <div class="shr-powered-by-logo">${passFieldSvg}</div>
        ${literals[lan].PERMISION_3}
      </div>
    </div>
    
    ${getPoweredBy(language)}
  `;
}

function getCoBrowsingAdviseContent(language) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <div class="shr-text">${literals[lan].CO_BROWSING}</div>
    <div class="shr-close-icon" onclick="sideby.stopCoBrowsing()">${timesSvg}</div>
    <div class="shr-logo-miniature">${logoSvg}</div>
  `;
}

function getCobrowsingEndContent(language) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <div class="shr-co-browsing-end-advise-text">${literals[lan].CO_BROWSING_END_1}</div>
    <div class="shr-co-browsing-end-advise-text">${literals[lan].CO_BROWSING_END_2}</div>
    <div class="shr-co-browsing-end-button-content">
      <div class="shr-co-browsing-end-button shr-co-browsing-end-button-close" onclick="sideby.closeCobrowsingEndAdvise()">
        ${literals[lan].CLOSE}
      </div>
    </div>
    ${getPoweredBy(language)}
  `;
}

function getAgentCursorContent(user, language) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <span class="shr-svg-cursor">
      <svg width="21" height="26" viewBox="0 0 21 26" fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0)">
          <g>
            <g>
              <mask maskUnits="userSpaceOnUse" x="-5.13575" y="-4.54962" width="33.9186"
                height="35.7487" fill="black">
                <rect fill="white" x="-5.13575" y="-4.54962" width="33.9186" height="35.7487" />
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M14.5095 1.90833C16.8696 0.545674 19.8199 2.24899 19.8199 4.9743L19.8199 17.5155C19.8199 20.2408 16.8696 21.9441 14.5095 20.5815L11.7086 18.9644L9.66849 22.498C8.81925 23.969 6.93837 24.4729 5.46743 23.6237C3.9965 22.7744 3.49252 20.8936 4.34176 19.4226L6.3819 15.889L3.64847 14.3109C1.28829 12.9482 1.28829 9.54158 3.64848 8.17892L14.5095 1.90833Z" />
              </mask>
              <path fill-rule="evenodd" clip-rule="evenodd"
                d="M14.5095 1.90833C16.8696 0.545674 19.8199 2.24899 19.8199 4.9743L19.8199 17.5155C19.8199 20.2408 16.8696 21.9441 14.5095 20.5815L11.7086 18.9644L9.66849 22.498C8.81925 23.969 6.93837 24.4729 5.46743 23.6237C3.9965 22.7744 3.49252 20.8936 4.34176 19.4226L6.3819 15.889L3.64847 14.3109C1.28829 12.9482 1.28829 9.54158 3.64848 8.17892L14.5095 1.90833Z"
                fill="#00CD8E" />
              <path
                d="M19.8199 4.9743L18.8199 4.9743L19.8199 4.9743ZM14.5095 1.90833L14.0095 1.0423L14.5095 1.90833ZM19.8199 17.5155L18.8199 17.5155L19.8199 17.5155ZM14.5095 20.5815L14.0095 21.4475L14.5095 20.5815ZM11.7086 18.9644L10.8426 18.4644L11.3426 17.5984L12.2086 18.0984L11.7086 18.9644ZM6.3819 15.889L6.8819 15.023L7.74792 15.523L7.24792 16.389L6.3819 15.889ZM3.64847 14.3109L3.14847 15.1769L3.64847 14.3109ZM3.64848 8.17892L4.14848 9.04495L3.64848 8.17892ZM18.8199 4.9743C18.8199 3.01879 16.703 1.7966 15.0095 2.77435L14.0095 1.0423C17.0363 -0.705253 20.8199 1.4792 20.8199 4.9743L18.8199 4.9743ZM18.8199 17.5155L18.8199 4.9743L20.8199 4.9743L20.8199 17.5155H18.8199ZM15.0095 19.7154C16.703 20.6932 18.8199 19.471 18.8199 17.5155H20.8199C20.8199 21.0106 17.0363 23.195 14.0095 21.4475L15.0095 19.7154ZM12.2086 18.0984L15.0095 19.7154L14.0095 21.4475L11.2086 19.8304L12.2086 18.0984ZM8.80247 21.998L10.8426 18.4644L12.5747 19.4644L10.5345 22.998L8.80247 21.998ZM5.96743 22.7577C6.96008 23.3308 8.22936 22.9907 8.80247 21.998L10.5345 22.998C9.40913 24.9472 6.91666 25.6151 4.96743 24.4897L5.96743 22.7577ZM5.20779 19.9226C4.63468 20.9153 4.97479 22.1846 5.96743 22.7577L4.96743 24.4897C3.0182 23.3643 2.35035 20.8719 3.47574 18.9226L5.20779 19.9226ZM7.24792 16.389L5.20779 19.9226L3.47574 18.9226L5.51587 15.389L7.24792 16.389ZM4.14847 13.4448L6.8819 15.023L5.8819 16.755L3.14847 15.1769L4.14847 13.4448ZM4.14848 9.04495C2.45496 10.0227 2.45496 12.4671 4.14847 13.4448L3.14847 15.1769C0.12162 13.4293 0.121626 9.06045 3.14848 7.3129L4.14848 9.04495ZM15.0095 2.77435L4.14848 9.04495L3.14848 7.3129L14.0095 1.0423L15.0095 2.77435Z"
                fill="white" mask="url(#path-1-outside-1)" />
            </g>
          </g>
        </g>
        <defs>
          <clipPath id="clip0">
            <rect width="21" height="26" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </span>
    <span class="shr-agent-name">${user.name || literals[lan].DEFAULT_AGENT_NAME}</span>
  `;
}

function getHelpButtonContent(language) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <div class="shr-logo-miniature">${logoSvg}</div>
    <div class="shr-bubble-text">${literals[lan].HELP}</div>
  `;
}

function getHelpPinContent(language, pin) {
  var lan = language;
  if (lan !== 'es' && lan !== 'en') lan = defaultLanguage;
  return `
    <div class="shr-help-pin-advise-text">${literals[lan].HELP_PIN_TEXT}</div>
    <div class="shr-help-pin-advise-text shr-help-pin">${pin}</div>
    <div class="shr-help-pin-button-content">
      <div class="shr-help-pin-button shr-help-pin-button-close" onclick="sideby.closeHelpPinAdvise()">
        ${literals[lan].CLOSE}
      </div>
    </div>
    ${getPoweredBy(language)}
  `;
}

module.exports = {
  getHelpPinContent,
  getAgentBusyContent,
  getHelpButtonContent,
  getAgentCursorContent,
  getCallRequestContent,
  getCobrowsingEndContent,
  getSmartLinkAdviceContent,
  getCoBrowsingAdviseContent,
  getPermissionAdviceContent,
};
