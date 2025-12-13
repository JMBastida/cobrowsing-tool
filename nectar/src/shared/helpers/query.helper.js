const { ObjectId } = require("mongodb");

function buildFilterQuery(data) {
  const { filter } = parse(data);
  return filter;
}

function parseOptions(data) {
  const { options } = parse(data);
  return options;
}

function parse(query) {
  const filter = {};
  const options = {};
  const { page, limit, sort, ...params } = query;

  if (limit) options.limit = parseInt(limit, 10);
  if (page) options.skip = parseInt(page, 10) * options.limit;
  if (sort) options.sort = parseSort(sort);

  const keys = Object.keys(params);
  for (const k of keys) {
    let data = params[k];
    try {
      data = JSON.parse(data);
    } catch (e) {
      // Not a JSON string, continue
    }

    if (k.includes('Id') || k === '_id') {
      const toObjectId = (id) => (typeof id === 'string' && ObjectId.isValid(id)) ? new ObjectId(id) : id;

      if (Array.isArray(data)) {
        if (data.length > 0) {
          if (k === 'id') { // Special case for 'id' mapping to '_id'
            filter._id = { $in: data.map(toObjectId) };
          } else {
            const index = k.indexOf('s');
            filter[k.substr(0, index)] = { $in: data.map(toObjectId) };
          }
        }
      } else if (data && data.$in) {
        filter[k] = { $in: data.$in.map(toObjectId) };
      } else {
        filter[k] = toObjectId(data);
      }
    } else if (k.includes('Date')) {
      if (data.$gte) filter[k] = { $gte: new Date(data.$gte) };
      if (data.$lte) filter[k] = { ...filter[k], $lte: new Date(data.$lte) };
    } else if (Array.isArray(data)) {
      filter[k] = { $in: data };
    } else if (data && data.$regex) {
      filter[k] = { $regex: data.$regex, $options: 'i' };
    } else {
      filter[k] = data;
    }
  }

  return { filter, options };
}

function parseSort(sort) {
  const sortArr = sort.split(':');
  const field = sortArr[0];
  const order = sortArr[1];
  return { [field]: order === 'desc' ? -1 : 1 };
}

module.exports = {
  parse,
  parseSort,
  buildFilterQuery,
  parseOptions,
};
