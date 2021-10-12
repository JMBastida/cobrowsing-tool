const sessionBll = require('../../../shared/database/session/session.bll');
const userBll = require('../../../shared/database/user/user.bll');
const { errorIfNotExists } = require('../../../shared/helpers/errors.helper');
const { ROLES } = require('../../../shared/database/user/user.enums');

async function validateOperation(entity, user, sessionId) {
  if (user.role === ROLES.ADMIN) return true;
  const sessionsResponse = await sessionBll.find(entity._id, { _id: sessionId });
  const [currentSession] = sessionsResponse.sessions;
  return currentSession.userId.toString() === user._id.toString();
}

async function getSessions(entity, filter) {
  const options = { sortField: filter.sortField, sortOrder: filter.sortOrder, limit: filter.limit, skip: filter.skip };
  const sessionsResponse = await sessionBll.find(entity._id, filter, options);
  const totalSessions = sessionsResponse.sessions.length;
  const users = [];
  for (let i = 0; i < totalSessions; i += 1) {
    const session = sessionsResponse.sessions[i];
    const { userId } = session;
    let user = users.find(u => u._id === userId);
    if (userId && !user) {
      const usersResponse = await userBll.find({ _id: userId });
      [user] = usersResponse.users;
      if (user) users.push(user);
    }

    if (user) session.user = user;
    if (!session.client) session.client = {};
  }

  return sessionsResponse;
}

async function updateSession(entity, user, session) {
  const isValid = await validateOperation(entity, user, session._id);
  errorIfNotExists(isValid, 'Can not update a session of other user', 403, 'SESSION.ERROR.UPDATE.WRONG_USER.SUMMARY', 'SESSION.ERROR.UPDATE.WRONG_USER.DETAIL');
  const sessionUpdated = await sessionBll.updateOne(entity._id, session);
  return sessionUpdated;
}

module.exports = {
  getSessions,
  updateSession,
};
