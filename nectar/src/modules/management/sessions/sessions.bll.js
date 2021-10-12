const sessionBll = require('../../../shared/database/session/session.bll');
const userBll = require('../../../shared/database/user/user.bll');

async function getSessions(entityId, filter) {
  const options = { sortField: filter.sortField, sortOrder: filter.sortOrder, limit: filter.limit, skip: filter.skip };
  const sessionsResponse = await sessionBll.find(entityId, filter, options);
  const totalSessions = sessionsResponse.sessions.length;
  const users = [];
  for (let i = 0; i < totalSessions; i += 1) {
    const session = sessionsResponse.sessions[i];
    const { userId } = session;
    let user = users.find(u => u._id === userId);
    if (!user) {
      const usersResponse = await userBll.find({ _id: userId });
      [user] = usersResponse.users;
    }

    if (user) session.user = user;
  }

  return sessionsResponse;
}

module.exports = {
  getSessions,
};
