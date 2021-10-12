const CONFIG = require('../../../config');
const languageMap = require('../../locales');
const { WRONG_PATTERN } = require('../enums/message.enums');

function getLiterals(lan) {
  let language = lan;
  if (!language) language = CONFIG.DEFAULT_LANGUAGE;
  if (!language) language = 'en';
  let literals = languageMap[language.toLowerCase()];
  if (!literals) literals = languageMap.en;
  return literals;
}

function evalPattern(pattern, lan) {
  const splitPattern = pattern.split('.');
  const length = splitPattern.length;
  const literals = getLiterals(lan);
  let literal = literals[splitPattern[0]];
  for (let i = 1; i < length; i++) {
    literal = literal[splitPattern[i]];
  }

  return literal;
}

function getLiteral(pattern, lan) {
  let literal;
  try {
    literal = evalPattern(pattern, lan);
  } catch (err) {
    literal = evalPattern(WRONG_PATTERN, lan);
  }

  if (!literal) {
    literal = evalPattern(WRONG_PATTERN, lan);
  }

  return literal;
}

function getMessage(severity, summaryPattern, detailPattern, lan) {
  const message = {
    severity: severity.toLowerCase(),
    summary: '',
    detail: '',
  };
  if (summaryPattern) {
    message.summary = getLiteral(summaryPattern, lan);
  }

  if (detailPattern) {
    message.detail = getLiteral(detailPattern, lan);
  }

  if (!message.summary && !message.detail) {
    message.detail = getLiteral(WRONG_PATTERN, lan);
  }

  return message;
}

function getToastMessageLiterals(toastMessages, lan) {
  if (!toastMessages) return [];
  const parsedToastMessages = [];
  const total = toastMessages.length;
  for (let i = 0; i < total; i += 1) {
    const { summaryPattern, detailPattern, severity } = toastMessages[i];
    if (!summaryPattern && !detailPattern) continue;
    const message = getMessage(severity, summaryPattern, detailPattern, lan);
    parsedToastMessages.push(message);
  }

  return parsedToastMessages;
}

module.exports = {
  getMessage,
  getToastMessageLiterals,
};
