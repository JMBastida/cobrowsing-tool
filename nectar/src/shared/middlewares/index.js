const { validateToken } = require('./token');
const validateRole = require('./role');
const validateScope = require('./scope');
const { upload } = require('./files');

module.exports = {
  validateToken,
  validateRole,
  validateScope,
  upload,
};
