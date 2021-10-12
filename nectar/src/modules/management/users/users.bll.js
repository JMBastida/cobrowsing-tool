const userBll = require('../../../shared/database/user/user.bll');

async function getUsers(filter) {
  const options = { sortField: filter.sortField, sortOrder: filter.sortOrder, limit: filter.limit, skip: filter.skip };
  const response = await userBll.find(filter, options);
  return response;
}

module.exports = {
  getUsers,
};
