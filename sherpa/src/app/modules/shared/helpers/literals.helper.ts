import { es, en } from '../../../../locale/index';
import { WRONG_PATTERN } from '../enums/message.enums';
import { LAN_KEY } from '../enums/cookies.enums';
import { Message } from 'primeng/api';
import Cookies from './cookies.helper';
import { LANGUAGES } from '../enums/language.enums';

function getTranslations(lan: string) {
  if (lan === LANGUAGES.ES) return es;
  return en;
}

function evalPattern(pattern: string, lan: string) {
  const translations = getTranslations(lan);
  const splitPattern = pattern.split('.');
  const length = splitPattern.length;
  let literal = eval(`translations.${splitPattern[0]}`);
  for (let i = 1; i < length; i++) {
    literal = literal[splitPattern[i]];
  }

  return literal;
}

function getLiteral(pattern: string, lan: string) {
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

function getMessage(severity: string, summaryPattern: any, detailPattern: any, lan: string) {
  const message: Message = {
    severity: severity.toLowerCase(),
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

function getCurrentLanguage() {
  let currentLan = Cookies.get(LAN_KEY);
  if (!currentLan) {
    const language = navigator.language || eval('navigator["userLanguage"]');
    if (language === 'es-ES' || language === 'es') currentLan = LANGUAGES.ES;
    currentLan = LANGUAGES.EN;
  }

  return currentLan;
}

function setLanguage(lan: string) {
  let newLan = lan;
  if (!newLan) newLan = LANGUAGES.EN;
  Cookies.set(LAN_KEY, newLan, { expires: 365 });
}

function numberToString(x: number, lan: string) {
  if (!x) return '0';
  let result = '';
  if (lan === LANGUAGES.ES) result = x.toString().replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  else result = x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return result;
}

export {
  getMessage,
  getLiteral,
  setLanguage,
  numberToString,
  getCurrentLanguage,
};
