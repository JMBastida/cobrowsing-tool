const log4js = require('log4js');
const CONFIG = require('../../../config');
const userBll = require('../database/user/user.bll');
const entityBll = require('../database/entity/entity.bll');
const entityConfigBll = require('../database/entity-config/entity-config.bll');
const { getToken, decodeToken } = require('../helpers/token.helper');
const { errorIfNotExists } = require('../helpers/errors.helper');
const { getToastMessageLiterals } = require('../helpers/message.helper');
const { getClientEntityObject } = require('../helpers/entities.helper');

const logger = log4js.getLogger('ACCESS');
logger.level = 'debug';

async function validateToken(req, res, next) {
  let lan = CONFIG.DEFAULT_LANGUAGE;
  try {
    errorIfNotExists(req.headers, 'Headers are missing.', 401, 'SHARED.MW.ERROR.SUMMARY', 'SHARED.MW.ERROR.DETAIL');
    const bearer = req.headers.authorization;
    errorIfNotExists(bearer, 'Authorization header is missing.', 401, 'SHARED.MW.ERROR.SUMMARY', 'SHARED.MW.ERROR.DETAIL');
    const token = bearer.replace('Bearer ', '');
    const decodedToken = decodeToken(token);
    const { userId } = decodedToken;
    errorIfNotExists(userId, 'User id is missing in token.', 401, 'SHARED.MW.ERROR.SUMMARY', 'SHARED.MW.ERROR.DETAIL');
    const usersResponse = await userBll.find({ _id: userId });
    const { users } = usersResponse;
    errorIfNotExists(users && users.length, 'User not found.', 404, 'SHARED.MW.ERROR.SUMMARY', 'SHARED.MW.ERROR.DETAIL');
    const [user] = users;
    lan = user.language;
    const { entityId } = user;
    user.token = getToken(user._id);
    req.user = user;
    const entitiesResponse = await entityBll.find({ _id: entityId });
    const { entities } = entitiesResponse;
    errorIfNotExists(entities && entities.length, 'User not found.', 404, 'SHARED.MW.ERROR.SUMMARY', 'SHARED.MW.ERROR.DETAIL');
    const [entity] = entities;
    const entityConfigResponse = await entityConfigBll.find(entityId);
    const { entityConfigs } = entityConfigResponse;
    const [entityConfig] = entityConfigs;
    req.entity = entity;
    req.entityConfig = entityConfig;
    const clientEntity = getClientEntityObject(entity, entityConfig);
    req.user.entity = clientEntity;
    next();
  } catch (err) {
    logger.error(err);
    const toastMessages = getToastMessageLiterals(err.toastMessages, lan);
    res.status(err.status || 401).send({ toastMessages });
  }
}

module.exports = {
  validateToken,
};
