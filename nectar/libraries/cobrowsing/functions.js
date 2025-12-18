/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
var io = require('socket.io-client');
var styles = require('./styles');
var literals = require('./locales');
var phoneSvg = require('./assets/phone');
var LZString = require('lz-string');

var {
  getHelpPinContent,
  getAgentBusyContent,
  getHelpButtonContent,
  getAgentCursorContent,
  getCallRequestContent,
  getCobrowsingEndContent,
  getSmartLinkAdviceContent,
  getCoBrowsingAdviseContent,
  getPermissionAdviceContent,
} = require('./html');

var UID_KEY = 'sbUid';
var STATE_KEY = 'sbState';
var APP_ID = 'COBROWSING_APP_ID';
var API_BASE_URL = '{{API_BASE_URL}}';
var AGORA_APP_ID = '{{AGORA_APP_ID}}';
var INVALID_INPUT_TYPES = ['password', 'email'];
var HOT_WORDS = ['username', 'name', 'firstname', 'surname', 'lastname', 'familyname', 'fullname', 'email',
  'phone', 'cell', 'cellphone', 'telephone', 'tel', 'postcode', 'postalcode', 'zip', 'zipcode', 'mobile', 'address',
  'ssn', 'security', 'securitynum', 'socialsec', 'socialsecuritynumber', 'socsec', 'ppsn', 'nationalinsurancenumber',
  'nin', 'dob', 'dateofbirth', 'password', 'pass', 'adgangskode', 'authpw', 'contrasena', 'contrasenya', 'contrasinal',
  'cyfrinair', 'contraseña', 'fjalëkalim', 'focalfaire', 'IP', 'creditcard', 'cc', 'ccnum', 'ccname', 'ccnumber',
  'ccexpiry', 'ccexp', 'ccexpmonth', 'ccexpyear', 'cccvc', 'cccvv', 'cctype', 'cvc', 'cvv'];

var entityId = '{{entityId}}';
var isWidgetEnabled = '{{isWidgetEnabled}}' === 'true';
var uid;
var socket;
var lan = 'en';
var headObserver;
var bodyObserver;
var sessionId = '';
var requestingUser;
var htmlTagObserver;
var scrollOrder = 0;
var ticking = false;
var headStylesTimeout;
var hiddenStyles = '';
var isEmitting = false;
var isSendingDom = false;
var isCobrowsing = false;
var latestKnownScrollY = 0;
var latestKnownScrollX = 0;
var iframesWithScript = [];
var forceConnection = false;
var isCobrowsingRequest = false;
var location = sanitizeUrl(window.location.href);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function generateCode(length) {
  var code = '';
  var characters = 'XJK3AVFR56IYPUD0S84LZT1BEQOH2MNG79WC';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i += 1) {
    code += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return code;
}

function requestHelp() {
  if (!socket) return;
  socket.emit('help-request', {});
}

function dispatch() {
  if (!socket) {
    forceConnection = true;
    initializeSocket();
  }

  if (isCobrowsingRequest || isCobrowsing) return;
  socket.emit('custom-flow-triggered', {});
}

function hideElement(elementId) {
  var element = document.getElementById(elementId);
  if (!element) return null;
  element.style.display = 'none';
  return element;
}

function showElement(elementId, display) {
  var element = document.getElementById(elementId);
  if (!element) return null;
  element.style.display = display;
  return element;
}

function getSelector(originalNode) {
  if (!originalNode || [3, 8].includes(originalNode.nodeType) || !originalNode.parentNode) return null;
  var node = originalNode;
  var path = '';
  var name = '';
  while (node && node.localName && node.parentNode) {
    name = node.localName;
    var parent = node.parentNode;
    var className = node.getAttribute('class');
    if (name.includes('hx')) {
      if (className) {
        path = '.' + className.trim().replace(' ', '.') + ' > ' + path;
        node = parent;
        continue;
      }
    }

    var sameTagSiblings = [];
    var children = Array.prototype.slice.call(parent.childNodes);
    var totalChildren = children.length;
    for (var i = 0; i < totalChildren; i += 1) {
      var child = children[i];
      if (child.localName === name) sameTagSiblings.push(child);
    }

    if (sameTagSiblings.length > 1) {
      var index = sameTagSiblings.indexOf(node);
      var position = index + 1;
      name += ':nth-of-type(' + (position) + ')';
    }

    if (path) path = name + ' > ' + path;
    else path = name;
    node = parent;
  }

  if (name === path && path !== 'html') return null;
  return path;
}

function getLanguage() {
  var language = navigator.language || navigator['userLanguage'];
  if (!language) return literals.defaultLanguage;
  if (language.toLowerCase() === 'es-es' || language.toLowerCase() === 'es') return 'es';
  return literals.defaultLanguage;
}

function sanitizeUrl(url) {
  if (!url) return '';
  var urlSanitized = url.replace('http://', '').replace('https://', '').replace('www.', '');
  if (urlSanitized.substr(-1) === '/') urlSanitized = urlSanitized.substr(0, urlSanitized.length - 1);
  urlSanitized = urlSanitized.replace(/=/g, '{equals}');
  urlSanitized = urlSanitized.replace(/&/g, '{ampersand}');
  return urlSanitized;
}

function setScrollPosition(element) {
  if (!isEmitting || !socket) return;
  var data = {
    type: "SCROLL",
    data: {
      selector: getSelector(element),
      value: element.scrollTop || 0,
    },
  };
  socket.emit('new-client-event', data);
}

function checkLocationOnClick() {
  if (socket) socket.emit('heart-beat', {});
  var newLocation = sanitizeUrl(window.location.href);
  if (location !== newLocation) {
    location = newLocation;
    if (!socket) return;
    updateHeadStyles();
    setTimeout(function () {
      socket.emit('new-location', { location });
      setScrollPosition(document.body);
    }, 200);
  }
}

function onVisibilityChange() {
  if (!socket) return;
  socket.emit('visibility-change', { isInTab: !document.hidden });
}

function handleSPANavigation() {
  window.addEventListener('click', checkLocationOnClick, true);
}

function handleTabVisibilityChange() {
  document.addEventListener("visibilitychange", onVisibilityChange, true);
}

function onScroll(e) {
  if (!isEmitting || !socket) return;
  var scrollTop = e.target.scrollTop;
  var scrollLeft = e.target.scrollLeft;
  var scrollingElement = e.target;
  if (e.target === document) {
    scrollTop = e.target.scrollingElement.scrollTop;
    scrollLeft = e.target.scrollingElement.scrollLeft;
    scrollingElement = e.target.scrollingElement;
  }

  latestKnownScrollX = 0;
  latestKnownScrollY = 0;
  if (scrollTop) latestKnownScrollY = scrollTop;
  if (scrollLeft) latestKnownScrollX = scrollLeft;
  if (!ticking) {
    window.requestAnimationFrame(function () {
      if (!isEmitting || !socket) return;
      ticking = false;
      var data = {
        type: "SCROLL",
        data: {
          selector: getSelector(scrollingElement),
          value: { x: latestKnownScrollX || 0, y: latestKnownScrollY || 0 },
        },
      };
      socket.emit('new-client-event', data);
    });
  }
  ticking = true;
}

function validateEmail(value) {
  if (!value) return false;
  var arroba = value.indexOf('@');
  var arroba2 = value.lastIndexOf('@');
  var point = value.substr(arroba + 1).indexOf('.');
  var point2 = value.substr(arroba + 1).lastIndexOf('.');
  var lastPoint = value.lastIndexOf('.');
  var extension = value.substr(lastPoint + 1);
  return arroba >= 1 && arroba === arroba2 && point > 0 && point === point2 && extension.length;
}

function removeEmails(value) {
  if (!value) return value;
  var newValue = '';
  var splitValue = value.split(' ');
  var total = splitValue.length;
  for (var i = 0; i < total; i += 1) {
    var section = splitValue[i];
    var isEmail = validateEmail(section);
    if (isEmail) newValue += '*'.repeat(section.length);
    else newValue += section;
    if (i + 1 < total) newValue += ' ';
  }

  return newValue;
}

function getInputValue(input) {
  var value = input.value;
  var number;
  var isNAN = !parseInt(value, 10);
  if (isNAN && value) value = removeEmails(value);
  if (!isNAN) number = value.toString().replace(/ /g, '').replace(/-/g, '');
  var type = input.type ? input.type.toLowerCase() : '';
  var id = input.id ? input.id.toLowerCase().replace(/-/g, '').replace(/_/g, '') : '';
  var name = input.name ? input.name.toLowerCase().replace(/-/g, '').replace(/_/g, '') : '';
  if (
    HOT_WORDS.includes(id) ||
    HOT_WORDS.includes(name) ||
    INVALID_INPUT_TYPES.includes(type) ||
    (number && number.length > 8)
  ) {
    value = '*'.repeat(value.toString().length);
  }

  return value;
}

function sendInputValue(input) {
  if (!isEmitting || !socket) return;
  var value = getInputValue(input);
  var checked = input.checked;
  var data = {
    type: 'VALUE_CHANGE',
    data: {
      value,
      checked,
      selector: getSelector(input),
    },
  };
  socket.emit('new-client-event', data);
}

function onInput(e) {
  if (!isEmitting || !socket) return;
  var input = e.composedPath()[0];
  if (e.detail && e.detail.isAgentInput) return;
  sendInputValue(input);
}

function iframeEventHandler(msg) {
  if (msg.data.type === 'DOM_CHANGE') {
    var socketData = { selector: msg.data.data.iframeSelector, newInnerHtml: msg.data.data.html }
    socket.emit('new-mutations', socketData);
  } else if (msg.data.type === 'NEW_MUTATIONS') {
    var frameMutations = msg.data.mutations;
    var totalFrameMutations = frameMutations.length;
    for (var j = 0; j < totalFrameMutations; j += 1) {
      socket.emit('new-mutations', frameMutations[j]);
    }
  } else if (msg.data.type === 'CLIENT_EVENT') {
    socket.emit('new-client-event', msg.data.data);
  }
}

function onIframeCommunication(msg) {
  if (msg.data.type === 'INITIALIZE_IFRAME') {
    var iframes = document.getElementsByTagName('IFRAME');
    var totalIframes = iframes.length;
    for (var i = 0, iframe, win; i < totalIframes; i += 1) {
      iframe = iframes[i];
      win = iframe.contentWindow || iframe.contentDocument.defaultView;
      if (win === msg.source) initializeIframe(iframe);
    }
  } else if (msg.data.type) {
    iframeEventHandler(msg);
  }
}

function onResize() {
  if (!socket || !isEmitting) return;
  var innerWidth = window.innerWidth;
  var innerHeight = window.innerHeight;
  var data = { innerWidth, innerHeight };
  socket.emit('window-resize', data);
}

function onClick(e) {
  if (!isEmitting || !socket) return;
  var selector, value = null;
  if (e.target.getAttribute('type') === 'checkbox' || e.target.getAttribute('type') === 'radio') {
    selector = getSelector(e.composedPath()[0]);
    var element = document.body.querySelector(selector);
    element.setAttribute('checked', element.checked);
    value = element.getAttribute('checked') === 'true';
  }

  var data = { type: "CLICK", data: { x: e.clientX, y: e.clientY, selector, value } };
  socket.emit('new-client-event', data);
}

function onMouseMove(e) {
  if (!isEmitting || !socket) return;
  var data = { type: 'MOUSE_MOVE', data: { left: e.x, top: e.y } };
  socket.emit('new-client-event', data);
}

function startGlobalListeners() {
  window.addEventListener("input", onInput, true);
  window.addEventListener('resize', onResize, true);
  window.addEventListener('message', onIframeCommunication);
}

function startMouseListeners() {
  window.addEventListener('click', onClick, true);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener('mousemove', onMouseMove, true);
}

function stopGlobalListeners() {
  window.removeEventListener("input", onInput, true);
  window.removeEventListener('resize', onResize, true);
  window.removeEventListener('message', onIframeCommunication);
}

function stopMouseListeners() {
  window.removeEventListener('click', onClick, true);
  window.removeEventListener("scroll", onScroll, true);
  window.removeEventListener('mousemove', onMouseMove, true);
}

function getHiddenStyles() {
  var styleSheets = document.styleSheets;
  var totalSheets = styleSheets.length;
  var hiddenStyles = '';
  for (var i = 0; i < totalSheets; i += 1) {
    var styleSheet = styleSheets[i];
    var nodeName = '';
    if (styleSheet && styleSheet.ownerNode) nodeName = styleSheet.ownerNode.nodeName;
    if (nodeName === 'LINK') continue;
    var rules = styleSheet.rules || styleSheet.cssRules;
    if (!rules || !rules.length) continue;
    var totalRules = rules.length;
    for (var j = 0; j < totalRules; j += 1) {
      var rule = rules[j];
      if (!rule || !rule.cssText) continue;
      if (nodeName === 'STYLE') {
        if (!styleSheet.ownerNode.textContent) {
          hiddenStyles += rule.cssText;
          continue;
        }
      }
    }
  }

  hiddenStyles.replace(/\/n/g, '');
  return hiddenStyles;
}

function getFontStyles(rules) {
  var fontStyles = '';
  if (!rules || !rules.length) return fontStyles;
  var fontRules = Array.prototype.slice.call(rules).filter(function (r) { return r.type === 5 });
  var totalRules = fontRules.length;
  for (var i = 0; i < totalRules; i += 1) fontStyles += fontRules[i].cssText;
  return fontStyles;
}

function styleSheetsToString(styleSheets) {
  var styles = '';
  var totalSheets = styleSheets.length;
  for (var i = 0; i < totalSheets; i += 1) {
    var styleSheet = styleSheets[i];
    var nodeName = '';
    var textContent;
    if (styleSheet && styleSheet.ownerNode) {
      nodeName = styleSheet.ownerNode.nodeName;
      textContent = styleSheet.ownerNode.textContent;
      if (nodeName === 'STYLE' && !textContent) continue;
    }

    var rules;
    try { rules = styleSheet.rules || styleSheet.cssRules; } catch (err) { /* */ }
    if (nodeName === 'LINK') {
      styles += styleSheet.ownerNode.outerHTML;
      var fontStyles = getFontStyles(rules);
      styles += `<style class="shr-font-tag">/*${fontStyles}*/</style>`;
      continue;
    }

    if (!rules || !rules.length) continue;
    styles += '<style>';
    var totalRules = rules.length;
    for (var j = 0; j < totalRules; j += 1) {
      var rule = rules[j];
      if (!rule || !rule.cssText) continue;
      styles = styles + ' ' + rule.cssText;
    }

    styles += '</style>';
  }

  styles.replace(/\/n/g, '');
  return styles;
}

function getHeadStyles() {
  var styleSheets = document.styleSheets;
  var styles = styleSheetsToString(styleSheets);
  hiddenStyles = getHiddenStyles();
  var hiddenStylesTag = '<style id="shr-hidden-css">' + hiddenStyles + '</style>';
  var headStyles = styles + hiddenStylesTag;
  return headStyles;
}

function getHeadString() {
  var styles = getHeadStyles();
  var head = `<head><base href="${document.baseURI}" target="_blank">${styles}</head>`;
  return head;
}

function getShadowData(node) {
  if (!node.shadowRoot || !node.shadowRoot.innerHTML) return null;
  var shadowStyleSheets = node.shadowRoot.adoptedStyleSheets || node.shadowRoot.styleSheets;
  var shadowRootStyles = styleSheetsToString(shadowStyleSheets);
  var data = {
    htmlValue: node.shadowRoot.innerHTML,
    cssValue: shadowRootStyles,
    selector: getSelector(node),
  };
  return data;
}

function handleAllNodes() {
  var shadowDatas = [];
  var allNodes = document.getElementsByTagName('*');
  var totalNodes = allNodes.length;
  for (var i = 0; i < totalNodes; i += 1) {
    var node = allNodes[i];
    var data = getShadowData(node);
    if (data) shadowDatas.push(data);
  }

  return shadowDatas;
}

function getBodyString() {
  var body = document.body.outerHTML;
  var startIndex = body.indexOf('<script');
  while (startIndex !== -1) {
    var endIndex = body.indexOf('</script>', startIndex) + 9;
    var referenceIndex = 0;
    if (endIndex !== 8) body = body.substr(0, startIndex) + body.substr(endIndex);
    else referenceIndex = endIndex;
    startIndex = body.indexOf('<script', referenceIndex);
  }

  body = body.replace(/autoplay/g, '');
  body = removeInputsValues(body);
  return body;
}

function getHtmlSanitized() {
  var body = getBodyString();
  var head = getHeadString();
  var html = '<html>' + head + body + '</html>';
  return html;
}

async function sendNewDom() {
  if (isSendingDom) {
    setTimeout(function () { sendNewDom(); }, 500);
    return;
  }

  isSendingDom = true;
  var html = getHtmlSanitized();
  var maxLength = 200000;
  var total = html.length / maxLength;
  var data = { order: -1, timeStamp: Date.now() };
  for (var i = 0; i < total; i += 1) {
    data.html = html.substr(i * maxLength, maxLength);
    data.order += 1;
    socket.emit("dom-change", data);
    await sleep(100);
  }

  data.html = '';
  var shadow = handleAllNodes();
  var shadowString = JSON.stringify(shadow);
  total = shadowString.length / maxLength;
  for (var j = 0; j < total; j += 1) {
    data.shadowString = shadowString.substr(j * maxLength, maxLength);
    data.order += 1;
    socket.emit("dom-change", data);
    await sleep(100);
  }

  data.isLast = true;
  data.shadowString = '';
  data.order += 1;
  socket.emit("dom-change", data);
  isSendingDom = false;
  setTimeout(function () { sendContainingInputsValues('body'); }, 200);
}

function removeInputsValues(html) {
  if (!html) return html;
  var newHtml = html;
  var start = newHtml.indexOf('<input');
  var end;
  var length;
  while (start !== -1) {
    end = newHtml.indexOf('>', start);
    if (end === -1) break;
    length = end - start + 1;
    var string = newHtml.substr(start, length);
    if (string.includes('value')) {
      var startValue = newHtml.indexOf(' value', start);
      if (startValue !== -1) {
        var endValue = newHtml.indexOf('"', startValue + 8);
        if (endValue > end) endValue = end;
        if (endValue !== -1) newHtml = newHtml.substr(0, startValue) + newHtml.substr(endValue + 1);
      }
    }

    start = newHtml.indexOf('<input', end);
  }

  return newHtml;
}

function handleInputs(element) {
  if (!element) return;
  if (element.nodeName.toLowerCase() === 'input') {
    sendInputValue(element);
    return;
  }

  var children = element.children;
  if (!children || !children.length) return;
  var total = children.length;
  for (var i = 0; i < total; i += 1) handleInputs(children[i]);
}

function sendContainingInputsValues(selector) {
  if (!selector) return;
  var element = document.querySelector(selector);
  if (!element || !element.children || !element.children.length) return;
  handleInputs(element);
}

function updateDomMutation(mutations) {
  if (!isEmitting || !socket) return;
  var totalMutations = mutations.length;
  for (var i = 0; i < totalMutations; i += 1) {
    var mutation = mutations[i];
    var {
      type,
      target,
      addedNodes,
      removedNodes,
      forceNewHtml,
      attributeName,
    } = mutation;
    var textContent = '';
    var newInnerHtml = '';
    var shadowData = [];
    var addedElements = [];
    var previousElementSiblings = [];
    var targetedElement = getSelector(target);
    var elementAttributes = { type: '', value: '' };
    if (type === 'characterData') {
      targetedElement = getSelector(target.parentNode);
      textContent = target.data;
    } else if (type === 'attributes') {
      if (!target || !target.attributes || !target.attributes.length) continue;
      if (attributeName === 'class') {
        elementAttributes.type = 'class';
        if (!target.attributes.class) elementAttributes.value = "";
        else elementAttributes.value = target.attributes.class.value;
      } else if (attributeName === 'style') {
        elementAttributes.type = 'style';
        if (!target.attributes.style) elementAttributes.value = "";
        elementAttributes.value = target.attributes.style.value;
      } else if (attributeName === 'transform') {
        elementAttributes.type = 'style';
        elementAttributes.value = 'transform: ' + target.attributes.transform.value;
      } else if (attributeName === 'src') {
        elementAttributes.type = 'src';
        if (!target.attributes.src) elementAttributes.value = "";
        elementAttributes.value = target.attributes.src.value;
      }
    }

    if (forceNewHtml || (removedNodes && removedNodes.length)) newInnerHtml = target.innerHTML;
    if (addedNodes && addedNodes.length) {
      var totalAddedNodes = addedNodes.length;
      for (var j = 0; j < totalAddedNodes; j += 1) {
        var addedNode = addedNodes[j];
        var { shadowRoot, outerHTML, previousElementSibling, nodeType } = addedNode;
        if (nodeType === 3) {
          newInnerHtml = target.innerHTML;
          continue;
        }

        if (shadowRoot && shadowRoot.innerHTML !== '') {
          var shadowStyleSheets = shadowRoot.adoptedStyleSheets || shadowRoot.styleSheets;
          var shadowRootStyles = styleSheetsToString(shadowStyleSheets);
          var data = {
            htmlValue: shadowRoot.innerHTML,
            cssValue: shadowRootStyles,
            selector: getSelector(addedNode),
          };
          shadowData.push(data);
        }

        addedElements.push({ html: outerHTML, selector: getSelector(addedNode) });
        var previousElementSelector = getSelector(previousElementSibling);
        previousElementSiblings.push(previousElementSelector);
      }
    }

    if (!targetedElement) continue;
    var hasInputs = newInnerHtml && newInnerHtml.includes('<input');
    if (hasInputs) newInnerHtml = removeInputsValues(newInnerHtml);
    var socketData = { selector: targetedElement, addedElements, newInnerHtml, elementAttributes, previousElementSiblings, textContent, shadowData };
    socket.emit('new-mutations', socketData);
    if (hasInputs) setTimeout(function () { sendContainingInputsValues(targetedElement); }, 200);
  }
}

function getBodyValidMutations(mutations) {
  var totalMutations = mutations.length;
  var validMutations = [];
  for (var i = 0; i < totalMutations; i += 1) {
    var mutation = mutations[i];
    var { target, addedNodes, removedNodes } = mutation;
    if (!target.parentNode) continue;
    if (addedNodes && addedNodes.length) {
      var addedParent = addedNodes[0].parentElement;
      var addedParentSelector = getSelector(addedParent);
      if (!addedParentSelector) continue;
      var indexSvg = addedParentSelector.indexOf(' > svg');
      if (indexSvg !== -1) {
        var svgSelector = addedParentSelector.substring(0, indexSvg);
        var svgParent = document.querySelector(svgSelector);
        var svgMutation = { target: svgParent, addedNodes: [], forceNewHtml: true };
        var hasSvgMutation = validMutations.some(function (m) { return m.forceNewHtml && m.target === svgParent });
        if (!hasSvgMutation) validMutations.push(svgMutation);
        continue;
      }

      if (addedNodes[0].nodeName === 'IFRAME') updateIFramesSelector();
    }

    if (removedNodes && removedNodes.length) {
      if (removedNodes[0].nodeName === 'IFRAME') {
        var index = iframesWithScript.indexOf(removedNodes[0]);
        if (index > -1) {
          iframesWithScript.splice(index, 1);
          updateIFramesSelector();
        }
      }

      if (target.children && target.children.length) {
        var iframes = target.getElementsByTagName('iframe');
        if (iframes) sendIFrameEmitStatus();
      }
    }

    validMutations.push(mutation);
  }

  return validMutations;
}

function checkHeadValidMutations(mutations) {
  var hasValidMutations = mutations.some(function (m) { return m.target.nodeName !== 'TITLE'; });
  return hasValidMutations;
}

function updateHeadStyles() {
  if (!isEmitting || !socket) return;
  if (headStylesTimeout) clearTimeout(headStylesTimeout);
  headStylesTimeout = setTimeout(function () {
    var stringHead = getHeadString();
    var newInnerHtml = stringHead.substring(6, stringHead.length - 7);
    newInnerHtml = LZString.compress(newInnerHtml);
    var socketData = { selector: 'html > head', newInnerHtml };
    socket.emit('new-mutations', socketData);
  }, 200);
}

function handleHiddenStyles() {
  if (!isEmitting || !socket) return;
  setTimeout(function () {
    var newHiddenStyles = getHiddenStyles();
    if (hiddenStyles === newHiddenStyles) return;
    hiddenStyles = newHiddenStyles;
    var socketData = { selector: '#shr-hidden-css', newInnerHtml: hiddenStyles };
    socket.emit('new-mutations', socketData);
  }, 500);
}

function getHtmlTagObserver() {
  return new MutationObserver(function (mutations) {
    if (!isEmitting || !socket) return;
    updateDomMutation(mutations);
    handleHiddenStyles();
  });
}

function getHeadObserver() {
  return new MutationObserver(function (mutations) {
    if (!isEmitting || !socket) return;
    var hasValidMutations = checkHeadValidMutations(mutations);
    if (hasValidMutations) updateHeadStyles();
  });
}

function getBodyObserver() {
  return new MutationObserver(function (mutations) {
    if (!isEmitting || !socket) return;
    var validMutations = getBodyValidMutations(mutations);
    if (validMutations && validMutations.length) updateDomMutation(validMutations);
    handleHiddenStyles();
  });
}

function startHtmlTagMutationsListener() {
  var config = { attributes: true };
  var html = document.documentElement;
  if (!htmlTagObserver) htmlTagObserver = getHtmlTagObserver();
  htmlTagObserver.observe(html, config);
}

function startHeadMutationsListener() {
  var config = {
    attributes: true,
    subtree: true,
    childList: true,
  };
  if (!headObserver) headObserver = getHeadObserver();
  var head = document.head;
  headObserver.observe(head, config);
}

function startBodyMutationsListener() {
  var attributeFilter = ['id', 'class', 'style', 'src', 'transform'];
  var config = {
    attributeFilter,
    subtree: true,
    childList: true,
    characterData: true,
  };
  var body = document.body;
  if (!bodyObserver) bodyObserver = getBodyObserver();
  bodyObserver.observe(body, config);
}

function startMutationsListeners() {
  if (!isEmitting || !socket) return;
  startHeadMutationsListener();
  startBodyMutationsListener();
  startHtmlTagMutationsListener();
}

function updateIFramesSelector() {
  var totalInitFrames = iframesWithScript.length;
  for (var i = 0; i < totalInitFrames; i += 1) {
    var selector = getSelector(iframesWithScript[i]);
    var data = { type: 'UPDATE_SELECTOR', selector };
    iframesWithScript[i].contentWindow.postMessage(data, '*');
  }
}

function sendIFrameEmitStatus() {
  setTimeout(function () {
    var totalInitFrames = iframesWithScript.length;
    var data = { type: 'EMIT_STATUS', isEmitting };
    for (var i = 0; i < totalInitFrames; i += 1) {
      iframesWithScript[i].contentWindow.postMessage(data, '*');
    }
  }, 500);
}

function showBorders() {
  var top = showElement('shr-border-top', 'block');
  var left = showElement('shr-border-left', 'block');
  var right = showElement('shr-border-right', 'block');
  var bottom = showElement('shr-border-bottom', 'block');
  if (top && left && right && bottom) return;
  var child = document.createElement('div');
  top = document.createElement('div');
  top.id = 'shr-border-top';
  left = document.createElement('div');
  left.id = 'shr-border-left';
  right = document.createElement('div');
  right.id = 'shr-border-right';
  bottom = document.createElement('div');
  bottom.id = 'shr-border-bottom';
  child.appendChild(top);
  child.appendChild(left);
  child.appendChild(right);
  child.appendChild(bottom);
  document.body.appendChild(child);
}

function hideBorders() {
  hideElement('shr-border-top');
  hideElement('shr-border-left');
  hideElement('shr-border-right');
  hideElement('shr-border-bottom');
}

function handleShowCoBrowsingAdvise() {
  showBorders();
  var existingAdvise = showElement('shr-co-browsing-advise', 'flex');
  if (!existingAdvise) {
    var coBrowsingAdvise = document.createElement('div');
    coBrowsingAdvise.id = 'shr-co-browsing-advise';
    coBrowsingAdvise.innerHTML = getCoBrowsingAdviseContent(lan);
    setTimeout(function () { document.body.appendChild(coBrowsingAdvise) }, 200);
  }
}

function handleShowRequestAdvise(user) {
    if (!user || !user._id) {
        setState(sessionId, isCobrowsing, false);
        return;
    }

    requestingUser = user;

    // --- AÑADIR ESTA LÍNEA (Backup de seguridad) ---
    sessionStorage.setItem('sb_requesting_user', JSON.stringify(user));
    // -----------------------------------------------

    hideElement('shr-smart-link-advise');
    hideElement('shr-agent-busy-advise');
    var existingPermissionAdvise = showElement('shr-permission-advise', 'block');
    if (!existingPermissionAdvise) {
        var permissionAdvise = document.createElement('div');
        permissionAdvise.id = 'shr-permission-advise';
        var innerHtml = getPermissionAdviceContent(user.name, lan);
        permissionAdvise.innerHTML = innerHtml;
        document.body.appendChild(permissionAdvise);
    }

    setState(sessionId, isCobrowsing, true);
}
function startCoBrowsing() {
  hideElement('shr-help-bubble-button');
  hideElement('shr-co-browsing-end-advise');
  handleShowCoBrowsingAdvise();
  setState(sessionId, true, isCobrowsingRequest);
  var totalInitFrames = iframesWithScript.length;
  for (var i = 0; i < totalInitFrames; i += 1) {
    iframesWithScript[i].sandbox = 'allow-same-origin';
  }
}

function responseCoBrowsing(isAccepted) {
  hideElement('shr-permission-advise');
  setState(sessionId, isCobrowsing, false);
    // Si la variable requestingUser murió, intentamos revivirla desde el backup
    if (!requestingUser) {
        try {
            var backupUser = sessionStorage.getItem('sb_requesting_user');
            if (backupUser) {
                requestingUser = JSON.parse(backupUser);
            }
        } catch (e) {
            console.log('Error recuperando usuario backup', e);
        }
    }
    // Check de seguridad por si acaso
    if (!requestingUser || !requestingUser._id) {
        console.error("No hay usuario solicitante");
        return;
    }
  if (!socket) return;
  var data = { userId: requestingUser._id, isAccepted };
  socket.emit('client-co-browsing-response', data);
    sessionStorage.removeItem('sb_requesting_user');
  if (isAccepted) {
    startCoBrowsing();
    addCursor(requestingUser);
  }
}

function removeAllCursors() {
  var cursors = document.getElementsByClassName('shr-cursor');
  var total = cursors.length;
  for (var i = 0; i < total; i += 1) {
    var cursor = cursors[i];
    cursor.remove();
  }
}

function stopCoBrowsing() {
  hideElement('shr-permission-advise');
  hideElement('shr-co-browsing-advise');
  if (isWidgetEnabled) showElement('shr-help-bubble-button', 'flex');
  hideBorders();
  if (!socket) return;
  socket.emit('client-stop-co-browsing', {});
  setState(sessionId, false, false);
  var totalInitFrames = iframesWithScript.length;
  for (var i = 0; i < totalInitFrames; i += 1) {
    var sandbox = iframesWithScript[i].getAttribute('sandbox');
    sandbox = sandbox.replace('allow-same-origin', '');
    iframesWithScript[i].sandbox = sandbox;
  }

  removeAllCursors();
  handleCoBrowsingEndAdvise();
}

async function sendFullDom() {
  if (!socket || !isEmitting) return;
  await sendNewDom();
  var innerWidth = window.innerWidth;
  var innerHeight = window.innerHeight;
  var resizeData = { innerWidth, innerHeight };
  socket.emit("window-resize", resizeData);
}

function stopMutationsListeners() {
  if (bodyObserver) bodyObserver.disconnect();
  if (headObserver) headObserver.disconnect();
  if (htmlTagObserver) htmlTagObserver.disconnect();
}

function removeListeners() {
  stopMutationsListeners();
  stopGlobalListeners();
  stopMouseListeners();
}

function initializeListeners() {
  startMutationsListeners();
  startGlobalListeners();
  startMouseListeners();
}

function stopEmitting() {
  isEmitting = false;
  sendIFrameEmitStatus();
  removeListeners();
}

function startEmitting() {
  if (!socket) return;
  isEmitting = true;
  initializeListeners();
  sendFullDom();
  sendIFrameEmitStatus();
  setScrollPosition(document.documentElement);
}

function addHelpButton() {
  var helpButton = document.createElement('div');
  helpButton.setAttribute('id', 'shr-help-bubble-button');
  helpButton.innerHTML = getHelpButtonContent(lan);
  helpButton.onclick = requestHelp;
  document.body.appendChild(helpButton);
  return helpButton;
}

function addCursor(user) {
  if (!user || !user._id) return;
  var existing = document.getElementById(user._id);
  if (existing) return;
  cursor = document.createElement('div');
  cursor.setAttribute('id', user._id);
  cursor.classList.add('shr-cursor');
  cursor.innerHTML = getAgentCursorContent(user);
  var html = document.documentElement;
  html.appendChild(cursor);
}

function removeCursor(userId) {
  if (!userId) return;
  var existing = document.getElementById(userId);
  if (!existing) return;
  existing.remove();
}

function handleClickEffect(user) {
  if (!user || !user._id) return;
  var element = document.getElementById(user._id);
  if (!element) return;
  var cursorSvg = element.getElementsByClassName('shr-svg-cursor')[0];
  if (!cursorSvg) return;
  cursorSvg.style.animation = 'blink-2 0.9s both';
  setTimeout(function () { cursorSvg.style.animation = ''; }, 1000);
}

function handleScroll(data) {
  scrollOrder = Date.now();
  var element = document.querySelector(data.data.path);
  if (element) element.scrollTo({ top: data.data.value.y, left: data.data.value.x, behavior: 'smooth' });
  setTimeout(function () {
    var now = Date.now();
    if (now >= scrollOrder + 500) {
      window.addEventListener("scroll", onScroll, true);
    }
  }, 500);
}

function handleMouseMove(data) {
  if (!data || (!data.data && !data.event)) return;
  var cursor = document.getElementById(`${data.user._id}`);
  if (!cursor) return;
  var { top, left } = data.data ? data.data : data.event.data;
  if (data.selector) {
    var iframe = document.querySelector(data.selector);
    var position = iframe.getBoundingClientRect();
    left += position.left;
    top += position.top;
  }

  cursor.style.top = `${top}px`;
  cursor.style.left = `${left}px`;
  if (left < 150) {
    cursor.classList.add('shr-cursor-limit-left');
    cursor.style.transform = `translateX(0px)`;
  } else {
    cursor.classList.remove('shr-cursor-limit-left');
    cursor.style.transform = `translateX(-${cursor.offsetWidth}px)`;
  }
}

function handleKeyPress(data) {
  var input = document.querySelector(data.data.path);
  var nativeInputValueSetter;
  if (input.nodeName === 'INPUT') nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  else if (input.nodeName === 'SELECT') nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value").set;
  else if (input.nodeName === 'TEXTAREA') nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
  else {
    input.setAttribute('value', data.data.value);
    input.value = data.data.value;
  }

  if (nativeInputValueSetter) nativeInputValueSetter.call(input, data.data.value);
  var event = new CustomEvent('input', {
    bubbles: true,
    cancelable: true,
    detail: { isAgentInput: !!data.user && !!data.user._id },
  });
  input.dispatchEvent(event);
}

function handleClick(data) {
  handleClickEffect(data.user);
  var element = document.querySelector(data.data.path);
  if (element) {
    try {
      element.focus();
      element.click();
    } catch (err) {
      if (err.message === 'element.click is not a function') {
        try {
          element.parentElement.click();
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
}

function handleAgentBusyAdvise() {
  hideAllAdvises();
  var existingAdvise = showElement('shr-agent-busy-advise', 'block');
  if (existingAdvise) return;
  var smartLinkAdvise = document.createElement('div');
  smartLinkAdvise.id = 'shr-agent-busy-advise';
  var innerHtml = getAgentBusyContent(lan);
  smartLinkAdvise.innerHTML = innerHtml;
  document.body.appendChild(smartLinkAdvise);
}

function handleCallRequestAdvise(name, userCode) {
  hideAllAdvises();
  var existingAdvise = showElement('shr-call-request-advise', 'block');
  if (existingAdvise) return;
  var callRequestAdvise = document.createElement('div');
  callRequestAdvise.id = 'shr-call-request-advise';
  var innerHtml = getCallRequestContent(lan, name, userCode);
  callRequestAdvise.innerHTML = innerHtml;
  document.body.appendChild(callRequestAdvise);
}

function handleCoBrowsingEndAdvise() {
  hideAllAdvises();
  var existingAdvise = showElement('shr-co-browsing-end-advise', 'block');
  if (existingAdvise) return;
  var coBrowsingEndAdvise = document.createElement('div');
  coBrowsingEndAdvise.id = 'shr-co-browsing-end-advise';
  var innerHtml = getCobrowsingEndContent(lan);
  coBrowsingEndAdvise.innerHTML = innerHtml;
  document.body.appendChild(coBrowsingEndAdvise);
}

function hideAllAdvises() {
  hideElement('shr-help-pin-advise');
  hideElement('shr-smart-link-advise');
  hideElement('shr-agent-busy-advise');
  hideElement('shr-permission-advise');
  hideElement('shr-call-request-advise');
  hideElement('shr-co-browsing-end-advise');
}

function showSidebyPin() {
  if (!socket) {
    forceConnection = true;
    initializeSocket();
  }

  hideAllAdvises();
  var existingAdvise = showElement('shr-help-pin-advise', 'block');
  if (existingAdvise) return;
  var helpPinAdvise = document.createElement('div');
  helpPinAdvise.id = 'shr-help-pin-advise';
  var pin = generateCode(6);
  var innerHtml = getHelpPinContent(lan, pin);
  helpPinAdvise.innerHTML = innerHtml;
  document.body.appendChild(helpPinAdvise);
  socket.emit('help-pin-request', { pin });
}

function handleShowSmartLinkAdvise() {
  hideAllAdvises();
  var existingAdvise = showElement('shr-smart-link-advise', 'block');
  if (existingAdvise) return;
  var smartLinkAdvise = document.createElement('div');
  smartLinkAdvise.id = 'shr-smart-link-advise';
  var innerHtml = getSmartLinkAdviceContent(lan);
  smartLinkAdvise.innerHTML = innerHtml;
  document.body.appendChild(smartLinkAdvise);
}

function showEndCallButton() {
  var existingEndCallButton = showElement('shr-end-call-button', 'block');
  if (existingEndCallButton) return;
  var endCallButton = document.createElement('button');
  endCallButton.id = 'shr-end-call-button';
  endCallButton.innerHTML = phoneSvg;
  endCallButton.onclick = endCall;
  document.body.appendChild(endCallButton);
}

function handleSmartLink() {
  if (!socket) return;
  var urlSearchParams = new URLSearchParams(window.location.search);
  var params = Object.fromEntries(urlSearchParams.entries());
  var code = params.sideby;
  if (!code) return;
  socket.emit('smart-link-access', { code });
  handleShowSmartLinkAdvise();
}

function closeSmartLinkAdvise() {
  hideElement('shr-smart-link-advise');
}

function closeAgentBusyAdvise() {
  hideElement('shr-agent-busy-advise');
}

function closeHelpPinAdvise() {
  hideElement('shr-help-pin-advise');
}

function closeCallRequestAdvise() {
  hideElement('shr-call-request-advise');
}

function closeCobrowsingEndAdvise() {
  hideElement('shr-co-browsing-end-advise');
}

function endCall() {
  if (!socket) return;
  socket.emit('client-end-call-request', {});
}

function onSocketInitialized() {
  handleSPANavigation();
  handleTabVisibilityChange();
}

function setUid(id) {
  if (uid) return;
  uid = id + Date.now();
  localStorage.setItem(UID_KEY, uid);
}

function initializeSocket() {
  if (socket) return;
    if (!uid) {
        uid = localStorage.getItem(UID_KEY);
    }
  var options = {
    path: '/ws/',
    forceNew: true,
    transports: ['websocket'],
    query: `sessionId=${sessionId || ''}&entityId=${entityId || ''}&location=${location}&uid=${uid}&appId=${APP_ID}&force=${forceConnection}`,
  };
  socket = io.connect(API_BASE_URL, options);
  socket.on('connect', function () {
    var deviceData = {
      navigator: {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        platform: navigator.platform,
        appVersion: navigator.appVersion,
      },
      window: {
        opera: window.opera,
      },
      language: navigator.language || navigator['userLanguage'],
    };
    socket.emit('client-session-connected', deviceData);
  });
  socket.on('session-created', function (data) {
    if (!uid) setUid(data._id);
    setState(data._id, false, false);
    handleSmartLink();
  });
  socket.on('session-recovered', function (data) {
    var { session, agentsCoBrowsing, agentRequesting, emit, isOnCall } = data;
    if (!session || !session._id) return;
    setState(session._id, !!agentsCoBrowsing.length, !!agentRequesting);
    if (emit) startEmitting();
    if (isOnCall) showEndCallButton();
    if (agentRequesting) handleShowRequestAdvise(agentRequesting);
    if (agentsCoBrowsing.length) {
      startCoBrowsing();
      for (var i = 0; i < agentsCoBrowsing.length; i += 1) {
        var user = agentsCoBrowsing[i];
        addCursor(user);
      }
    }
  });
  socket.on('start-emitting', function () {
    startEmitting();
  });
  socket.on('stop-emitting', function () {
    stopEmitting();
  });
  socket.on('stop-co-browsing-request', function () {
    hideElement('shr-permission-advise');
    setState(sessionId, isCobrowsing, false);
  });
  socket.on('co-browsing-stopped', function () {
    if (!isCobrowsing) return;
    hideElement('shr-co-browsing-advise');
    if (isWidgetEnabled) showElement('shr-help-bubble-button', 'flex');
    hideBorders();
    setState(sessionId, false, isCobrowsingRequest);
    removeAllCursors();
    handleCoBrowsingEndAdvise();
  });
  socket.on('agent-co-browsing-request', function (data) {
        // GUARDAMOS EN STORAGE PARA QUE SOBREVIVA A UN REFRESH
        sessionStorage.setItem('sbRequestingUser', JSON.stringify(data));
        handleShowRequestAdvise(data);
  });

  socket.on('agent-left', function (data) {
    if (!data || !data.userId) return;
    removeCursor(data.userId);
  });
  socket.on('agent-event', function (data) {
    if (!data || !data.user || !data.user._id || (!data.data && !data.event)) return;
    if (data.type === "IFRAME_EVENT") {
      if (data.event.type === "MOUSE_MOVE") handleMouseMove(data);
      else {
        var iframe = document.querySelector(data.selector);
        var msgData = { type: 'AGENT_EVENT', data: data.event };
        iframe.contentWindow.postMessage(msgData, '*');
      }
    } else if (data.type === "MOUSE_MOVE") {
      handleMouseMove(data);
    } else if (data.type === "SCROLL") {
      window.removeEventListener("scroll", onScroll, true);
      handleScroll(data);
    } else if (data.type === "CLICK") {
      handleClick(data);
    } else if (data.type === "VALUE_CHANGE") {
      handleKeyPress(data);
    }
  });
  socket.on('dom-request', function () {
    if (!isEmitting || !socket) return;
    sendFullDom();
  });
  socket.on('new-message', function () {
  });
  socket.on('set-widget-availability', function (data) {
    if (!data) return;
    isWidgetEnabled = data.isWidgetEnabled;
    if (!isWidgetEnabled) hideElement('shr-help-bubble-button');
    else if (!isCobrowsing) showElement('shr-help-bubble-button', 'flex');
  });
  socket.on('bubble-status-change', function (data) {
    if (isCobrowsing) return;
    if (isWidgetEnabled && data && data.show) {
      var helpButtonElement = showElement('shr-help-bubble-button', 'flex');
      if (!helpButtonElement) addHelpButton();
      return;
    }

    hideElement('shr-help-bubble-button');
  });
  socket.on('smart-link-agent-response', function (data) {
    if (!data) return;
    if (data.isBusy) handleAgentBusyAdvise();
  });
  socket.on('agent-request-call', function (data) {
    if (!data || !data.code) return;
    var { name, code } = data;
    handleCallRequestAdvise(name, code);
  });
  socket.on('call-started', function () {
    showEndCallButton();
  });
  socket.on('call-ended', function () {
    hideElement('shr-end-call-button');
  });
  socket.on('force-disconnection', function () {
    if (!isCobrowsing) socket.disconnect();
  });
  onSocketInitialized();
}

function includeStyles() {
  var style = document.createElement('style');
  style.innerHTML = styles;
  document.head.appendChild(style);
}

function recoverState() {
  uid = localStorage.getItem(UID_KEY);
  var stateString = sessionStorage.getItem(STATE_KEY);
  var requestingUserString = sessionStorage.getItem('sbRequestingUser');
  if (requestingUserString) {
      try {
          requestingUser = JSON.parse(requestingUserString);
      } catch(e) {}
  }
  if (!stateString) return;
  var state = JSON.parse(stateString);
  if (!state || !state.sessionId) {
    sessionStorage.clear();
    return;
  }

  sessionId = state.sessionId;
  isCobrowsing = state.isCobrowsing;
  isCobrowsingRequest = state.isCobrowsingRequest;
}

function setState(newSessionId, newIsCobrowsing, newIsCobrowsingRequest) {
  sessionId = newSessionId;
  isCobrowsing = newIsCobrowsing;
  isCobrowsingRequest = newIsCobrowsingRequest;
  var state = {
    sessionId: newSessionId,
    isCobrowsing: newIsCobrowsing,
    isCobrowsingRequest: newIsCobrowsingRequest,
  };
  var stateString = JSON.stringify(state);
  sessionStorage.setItem(STATE_KEY, stateString);
}

function setUserData(metadata) {
  socket.emit('client-initialize', { metadata });
}

function startCall(userCode) {
  hideElement('shr-call-request-advise');
  var url = `${API_BASE_URL}/v/calls?appId=${AGORA_APP_ID}&channel=${userCode}&uid=session_${sessionId}`;
  window.open(url, 'sidebyCalls', 'width=300,height=400');
}

function initializeIframe(iframe) {
  var iframeSelector = getSelector(iframe);
  iframesWithScript.push(iframe);
  var iFrameHtml = iframe.cloneNode().outerHTML;
  var data = { sessionId, selector: iframeSelector };
  var socketData = { selector: iframeSelector, newOuterHtml: iFrameHtml }
  iframe.contentWindow.postMessage(data, '*');
  socket.emit('new-mutations', socketData);
}

function setForceConnectionValue() {
  if (sessionId) {
    forceConnection = true;
    return;
  }

  var urlSearchParams = new URLSearchParams(window.location.search);
  var params = Object.fromEntries(urlSearchParams.entries());
  if (params.sideby) {
    forceConnection = true;
    return;
  }

  forceConnection = false;
}

function init() {
  lan = getLanguage();
  includeStyles();
  recoverState();
  setForceConnectionValue();
  initializeSocket();
}

module.exports = {
  init,
  dispatch,
  startCall,
  requestHelp,
  setUserData,
  showSidebyPin,
  stopCoBrowsing,
  responseCoBrowsing,
  closeHelpPinAdvise,
  closeSmartLinkAdvise,
  closeAgentBusyAdvise,
  closeCallRequestAdvise,
  closeCobrowsingEndAdvise,
};
