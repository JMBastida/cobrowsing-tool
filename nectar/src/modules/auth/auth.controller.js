const log4js = require('log4js');
const CONFIG = require('../../../config');
const authBll = require('./auth.bll');
const { getToastMessageLiterals } = require('../../shared/helpers/message.helper');

const logger = log4js.getLogger('AUTH');
logger.level = 'debug';

async function login(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { body, headers } = req;
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'];
    if (body.language) lan = body.language;
      const response = await authBll.login(body, ip);


    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function signup(req, res) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    const { body, headers } = req;
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'];
    if (body.language) lan = body.language;
    const response = await authBll.signup(body, ip);
    res.send(response);
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 500).send({ toastMessages });
  }
}

async function checkValidLogin(req, res) {
  try {
    const { params, headers } = req;
    const { token } = params;
    const ip = headers['x-forwarded-for'] || headers['x-real-ip'];
    const response = await authBll.checkValidLogin(token, ip);
    res.send(response);
  } catch (err) {
    logger.error(err);
    res.status(200).send({ isValid: false });
  }
}

module.exports = {
  login,
  signup,
  checkValidLogin,
};
