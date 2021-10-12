/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
var { getIframeListeners } = require('./assets/cobrowsing');

var INVALID_INPUT_TYPES = ['password', 'email'];
var HOT_WORDS = ['username', 'name', 'firstname', 'surname', 'lastname', 'familyname', 'fullname', 'email',
  'phone', 'cell', 'cellphone', 'telephone', 'tel', 'postcode', 'postalcode', 'zip', 'zipcode', 'mobile', 'address',
  'ssn', 'security', 'securitynum', 'socialsec', 'socialsecuritynumber', 'socsec', 'ppsn', 'nationalinsurancenumber',
  'nin', 'dob', 'dateofbirth', 'password', 'pass', 'adgangskode', 'authpw', 'contrasena', 'contrasenya', 'contrasinal',
  'cyfrinair', 'contraseña', 'fjalëkalim', 'focalfaire', 'IP', 'creditcard', 'cc', 'ccnum', 'ccname', 'ccnumber',
  'ccexpiry', 'ccexp', 'ccexpmonth', 'ccexpyear', 'cccvc', 'cccvv', 'cctype', 'cvc', 'cvv'];

var scrollOrder = 0;
var ticking = false;
var refreshIntervalId;
var hiddenStyles = '';
var isEmitting = false;
var isSendingDom = false;
var isNotifyingParent = false;
var latestKnownScrollY = 0;
var latestKnownScrollX = 0;
var currentIframeSelector = '';

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

function setScrollPosition(element) {
  var data = {
    type: "SCROLL",
    data: {
      selector: getSelector(element),
      value: element.scrollTop || 0,
    },
  };
  window.parent.postMessage(data, '*');
}

function onScroll(e) {
  if (!isEmitting) return;
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
      ticking = false;
      var data = {
        type: "SCROLL",
        data: {
          selector: getSelector(scrollingElement),
          value: { x: latestKnownScrollX || 0, y: latestKnownScrollY || 0 },
          iframeSelector: currentIframeSelector,
        }
      };
      var msgData = { type: 'CLIENT_EVENT', data };
      window.parent.postMessage(msgData, '*');
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
  if (!isEmitting) return;
  var value = getInputValue(input);
  var checked = input.checked;
  var data = {
    type: 'VALUE_CHANGE',
    data: {
      value,
      checked,
      selector: getSelector(input),
      iframeSelector: currentIframeSelector,
    },
  };
  var msgData = { type: 'CLIENT_EVENT', data };
  window.parent.postMessage(msgData, '*');
}

function onInput(e) {
  if (!isEmitting) return;
  var input = e.composedPath()[0];
  if (e.detail && e.detail.isAgentInput) return;
  sendInputValue(input);
}

function onClick(e) {
  if (!isEmitting) return;
  var selector, value = null;
  if (e.target.getAttribute('type') === 'checkbox' || e.target.getAttribute('type') === 'radio') {
    selector = getSelector(e.composedPath()[0]);
    var element = document.body.querySelector(selector);
    element.setAttribute('checked', element.checked);
    value = element.getAttribute('checked') === 'true';
  }

  var data = { type: "CLICK", data: { x: e.clientX, y: e.clientY, selector, value, iframeSelector: currentIframeSelector }, };
  var msgData = { type: 'CLIENT_EVENT', data };
  window.parent.postMessage(msgData, '*');
}

function onMouseMove(e) {
  if (!isEmitting) return;
  var data = { type: 'MOUSE_MOVE', data: { left: e.x, top: e.y, iframeSelector: currentIframeSelector }, };
  var msgData = { type: 'CLIENT_EVENT', data };
  window.parent.postMessage(msgData, '*');
}

function startGlobalListeners() {
  window.addEventListener("input", onInput, true);
}

function startMouseListeners() {
  window.addEventListener('click', onClick, true);
  window.addEventListener("scroll", onScroll, true);
  window.addEventListener('mousemove', onMouseMove, true);
}

function stopGlobalListeners() {
  window.removeEventListener("input", onInput, true);
}

function stopMouseListeners() {
  window.removeEventListener('click', onClick, true);
  window.removeEventListener("scroll", onScroll, true);
  window.removeEventListener('mousemove', onMouseMove, true);
}

function getHiddenStyles() {
  var styleSheets = document.styleSheets;
  var totalSheets = styleSheets.length;
  var hiddenStyles = '<style id="shr-hidden-css">';
  for (var i = 0; i < totalSheets; i++) {
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

  hiddenStyles += '</style>';
  hiddenStyles.replace('/"', '"');
  hiddenStyles.replace('/n', '');
  return hiddenStyles;
}

function styleSheetsToString(styleSheets) {
  var styles = '';
  var totalSheets = styleSheets.length;
  for (var i = 0; i < totalSheets; i++) {
    var styleSheet = styleSheets[i];
    var nodeName = '';
    var textContent;
    if (styleSheet && styleSheet.ownerNode) {
      nodeName = styleSheet.ownerNode.nodeName;
      textContent = styleSheet.ownerNode.textContent;
      if (nodeName === 'STYLE' && !textContent) continue;
    }

    if (nodeName === 'LINK') {
      styles += styleSheet.ownerNode.outerHTML;
      continue;
    }

    var rules = styleSheet.rules || styleSheet.cssRules;
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

  styles.replace('/"', '"');
  styles.replace('/n', '');
  return styles;
}

function getHeadStyles() {
  var styleSheets = document.styleSheets;
  var styles = styleSheetsToString(styleSheets);
  hiddenStyles = getHiddenStyles();
  var headStyles = styles + hiddenStyles;
  return headStyles;
}

function getHeadString() {
  var styles = getHeadStyles();
  var cobrowsingScript = getIframeListeners(currentIframeSelector);
  var head = `<head><base href="${document.baseURI}" target="_blank">${styles} ${cobrowsingScript}</head>`;
  return head;
}

function removeCursorsFromHtml(originalHtml) {
  var html = originalHtml;
  var start = html.indexOf('shr-cursor') - 42;
  if (start < 0) return html;
  while (start >= 0) {
    var end = html.indexOf('</div>', start) + 6;
    var length = end - start;
    var searchString = html.substr(start, length);
    html = html.replace(searchString, '');
    start = html.indexOf('shr-cursor') - 42;
  }

  return html;
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
  for (var i = 0; i < totalNodes; i++) {
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
    var endIndex = body.indexOf('</script>') + 9;
    if (endIndex === -1) break;
    body = body.substr(0, startIndex) + body.substr(endIndex);
    startIndex = body.indexOf('<script');
  }

  body = removeCursorsFromHtml(body);
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
  var shadow = handleAllNodes();
  var shadowString = JSON.stringify(shadow);
  var data = { html, shadowString, iframeSelector: currentIframeSelector }
  var iframeDataDOM = { type: "DOM_CHANGE", data };
  window.parent.postMessage(iframeDataDOM, '*');
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

function updateDomMutation(mutations, embeddedSelector) {
  if (!isEmitting) return;
  var mutationsArray = [];
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
    var socketData = { selector: targetedElement, addedElements, newInnerHtml, elementAttributes, previousElementSiblings, textContent, embeddedSelector, shadowData };
    mutationsArray.push(socketData);
    if (hasInputs) setTimeout(function () { sendContainingInputsValues(targetedElement); }, 200);
  }

  return mutationsArray;
}

function getValidMutations(mutations) {
  var addedParent;
  var totalMutations = mutations.length;
  var validMutations = [];
  for (var i = 0; i < totalMutations; i += 1) {
    var mutation = mutations[i];
    var { target, addedNodes } = mutation;
    if (!target.parentNode) continue;
    if (addedNodes && addedNodes.length) {
      var parentElement = addedNodes[0].parentElement;
      if (addedParent === target.parentElement || addedParent === parentElement) continue;
      addedParent = parentElement;
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
    }

    validMutations.push(mutation);
  }

  return validMutations;
}

function updateHeadStyles() {
  setTimeout(function () {
    var stringHead = getHeadString();
    var newInnerHtml = stringHead.substring(6, stringHead.length - 7);
    var mutation = { selector: 'html > head', newInnerHtml, embeddedSelector: currentIframeSelector };
    var data = { type: 'NEW_MUTATIONS', mutations: [mutation] };
    window.parent.postMessage(data, '*');
  }, 200);
}

function handleHiddenStyles() {
  setTimeout(function () {
    var newStyles = getHiddenStyles();
    if (hiddenStyles === newStyles) return;
    hiddenStyles = newStyles;
    var mutation = { selector: '#shr-hidden-css', newOuterHtml: hiddenStyles, embeddedSelector: currentIframeSelector };
    var data = { type: 'NEW_MUTATIONS', mutations: [mutation] };
    window.parent.postMessage(data, '*');
  }, 200);
}

function handleMutations() {
  var mutationAttributeFilters = ['class', 'style', 'src'];
  var target = document;
  var observer = new MutationObserver(function (mutations) {
    if (!isEmitting) return;
    var hasHeadMutations = mutations.some(function (m) { return m.target && m.target.localName === 'head' });
    if (hasHeadMutations) updateHeadStyles();
    else handleHiddenStyles();
    var validMutations = getValidMutations(mutations);
    var mutationsArray = updateDomMutation(validMutations, currentIframeSelector);
    var parsedMutations = JSON.parse(JSON.stringify(mutationsArray));
    var data = { type: 'NEW_MUTATIONS', mutations: parsedMutations };
    window.parent.postMessage(data, '*');
  });
  var config = {
    childList: true,
    subtree: true,
    characterData: true,
    attributeFilter: mutationAttributeFilters,
  };
  observer.observe(target, config);
}

function removeListeners() {
  stopGlobalListeners();
  stopMouseListeners();
}

function initializeListeners() {
  startGlobalListeners();
  startMouseListeners();
}

function startEmitting() {
  sendNewDom();
  handleMutations();
  setScrollPosition(document.documentElement);
  initializeListeners();
}

function stopEmitting() {
  isEmitting = false;
  removeListeners();
  clearInterval(refreshIntervalId);
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

function handleAgentEvents(data) {
  if (!data) return;
  if (data.type === "SCROLL") {
    window.removeEventListener("scroll", onScroll, true);
    handleScroll(data);
  } else if (data.type === "CLICK") {
    handleClick(data);
  } else if (data.type === "VALUE_CHANGE") {
    handleKeyPress(data);
  }
}

function parentNotifyIframe() {
  window.parent.postMessage({ type: 'INITIALIZE_IFRAME' }, '*');
}

function intIFrameCommunication() {
  refreshIntervalId = setInterval(parentNotifyIframe, 3000);
  window.addEventListener('message', function (msg) {
    if (msg.data.type === 'AGENT_EVENT') handleAgentEvents(msg.data.data);
    else if (msg.data.sessionId) {
      clearInterval(refreshIntervalId);
      isNotifyingParent = false;
      currentIframeSelector = msg.data.selector;
      isEmitting = true;
      startEmitting();
    } else if (msg.data.type === 'EMIT_STATUS') {
      if (isNotifyingParent && isEmitting) return;
      isNotifyingParent = true;
      isEmitting = msg.data.isEmitting;
      if (isEmitting) refreshIntervalId = setInterval(parentNotifyIframe, 3000);
      else stopEmitting()
    } else if (msg.data.type === 'UPDATE_SELECTOR') currentIframeSelector = msg.data.selector;
  });
}

function init() {
  intIFrameCommunication();
}

module.exports = {
  init,
};
