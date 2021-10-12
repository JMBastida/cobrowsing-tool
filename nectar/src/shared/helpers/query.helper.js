const { ObjectId } = require("mongodb");

function sanitize(filter) {
  const sanitized = { ...filter };
  delete sanitized.sortField;
  delete sanitized.sortOrder;
  delete sanitized.limit;
  delete sanitized.skip;
  return sanitized;
}

function buildFilterQuery(query) {
  const filter = {};
  const keys = Object.keys(query);
  const totalKeys = keys.length;
  for (let i = 0; i < totalKeys; i += 1) {
    const k = keys[i];
    const data = query[k];
    if (k.includes('Like')) {
      const regex = new RegExp(data);
      const index = k.indexOf('Like');
      filter[k.substr(0, index)] = { $regex: regex, $options: 'i' };
    } else if (k.includes('Date')) {
      if (k.includes('min')) {
        let attribute = k.substr(3);
        attribute = attribute[0].toLowerCase() + attribute.substr(1);
        filter[attribute] = { $gte: new Date(data) };
      } else if (k.includes('max')) {
        let attribute = k.substr(3);
        attribute = attribute[0].toLowerCase() + attribute.substr(1);
        filter[attribute] = { $lte: new Date(data) };
      } else {
        filter[k] = new Date(data);
      }
    } else if (k.includes('min')) {
      let attribute = k.substr(3);
      attribute = attribute[0].toLowerCase() + attribute.substr(1);
      filter[attribute] = { $gte: parseInt(data, 10) };
    } else if (k.includes('max')) {
      let attribute = k.substr(3);
      attribute = attribute[0].toLowerCase() + attribute.substr(1);
      filter[attribute] = { $lte: parseInt(data, 10) };
    } else if (k.substr(-3) === 'Ids') {
      if (data.$in) {
        filter[k] = { $in: data.$in.map(id => ObjectId(id)) };
      } else {
        const index = k.indexOf('Ids');
        filter[k.substr(0, index)] = { $in: data.map(id => ObjectId(id)) };
      }
    } else if (k === 'ids') {
      filter._id = { $in: data.map(id => ObjectId(id)) };
    } else if (k.substr(-2).toLowerCase() === 'id') {
      if (data.constructor === Array) {
        filter[k] = { $in: data.map(id => ObjectId(id)) };
      } else {
        filter[k] = ObjectId(data);
      }
    } else if (data && data.constructor === Array) {
      filter[k] = { $in: data };
    } else {
      filter[k] = data;
    }
  }

  return sanitize(filter);
}

function parseOptions(options) {
  const optionsParsed = { ...options };
  optionsParsed.sort = { creationDate: -1 };
  if (options.limit) optionsParsed.limit = parseInt(options.limit, 10);
  if (options.skip) optionsParsed.skip = parseInt(options.skip, 10);
  if (options.sortField) {
    delete optionsParsed.sort.creationDate;
    optionsParsed.sort[options.sortField] = parseInt(options.sortOrder, 10);
  }

  delete optionsParsed.sortField;
  delete optionsParsed.sortOrder;
  return optionsParsed;
}

module.exports = {
  buildFilterQuery,
  parseOptions,
};
