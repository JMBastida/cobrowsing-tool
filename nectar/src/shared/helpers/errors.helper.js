const { ERROR } = require('../enums/message.enums');

function newError(status, message, summaryPattern, detailPattern) {
  const err = new Error(message);
  err.status = status || 500;
  if (summaryPattern || detailPattern) {
    err.toastMessages = [{ severity: ERROR, summaryPattern, detailPattern }];
  }

  return err;
}

function errorIfNotExists(data, message, status, summaryPattern, detailPattern, callback) {
  if (!data) {
    if (callback) {
      callback();
    }

    throw newError(status, message, summaryPattern, detailPattern);
  }
}

function errorIfExists(data, message, status, summaryPattern, detailPattern, callback) {
  if (data) {
    if (callback) {
      callback();
    }

    throw newError(status, message, summaryPattern, detailPattern);
  }
}

module.exports = {
  errorIfNotExists,
  errorIfExists,
  newError,
};
