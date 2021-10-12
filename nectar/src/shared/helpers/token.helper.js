const jwt = require('jsonwebtoken');
const CONFIG = require('../../../config');
const { errorIfNotExists, newError } = require('./errors.helper');

function getToken(userId) {
  errorIfNotExists(userId, 'User id not given.', 404, null, null);
  errorIfNotExists(CONFIG.AUTH.APISECRET, 'Token api secret not found.', 404, null, null);
  const payload = { userId };
  const token = jwt.sign(payload, CONFIG.AUTH.APISECRET, CONFIG.AUTH.TOKEN_OPTIONS);
  return token;
}

function decodeToken(token) {
  errorIfNotExists(token, 'Token not found.', 403, 'SHARED.MW.ERROR.SUMMARY', 'SHARED.MW.ERROR.DETAIL');
  try {
    const decoded = jwt.verify(token, CONFIG.AUTH.APISECRET);
    return decoded;
  } catch (err) {
    throw newError(403, `Invalid token: ${token.toString()}`, 'SHARED.MW.ERROR.SUMMARY', 'SHARED.MW.ERROR.DETAIL');
  }
}

module.exports = {
  getToken,
  decodeToken,
};
