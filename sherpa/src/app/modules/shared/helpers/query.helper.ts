export function parseFilter(data: any) {
  if (!data) return {};
  const filterParsed: any = {
    skip: data.first,
    limit: data.rows || 10,
    sortField: data.sortField,
    sortOrder: data.sortOrder,
  };
  const filters = data.filters || {};
  const keys = Object.keys(filters);
  if (!keys) return filterParsed;
  const total = keys.length;
  for (let i = 0; i < total; i += 1) {
    let attribute = keys[i];
    const { matchMode, value } = filters[attribute];
    if (matchMode === 'contains') attribute += 'Like';
    else if (matchMode === 'lte') {
      attribute = attribute[0].toUpperCase() + attribute.substr(1);
      attribute = `max${attribute}`;
    } else if (matchMode === 'gte') {
      attribute = attribute[0].toUpperCase() + attribute.substr(1);
      attribute = `min${attribute}`;
    }

    filterParsed[attribute] = value;
  }

  return filterParsed;
};

export function buildQuery(filter: any) {
  let stringQuery = '';
  if (!filter) return stringQuery;
  const keys = Object.keys(filter);
  const total = keys.length;
  for (let i = 0; i < total; i += 1) {
    const k = keys[i];
    const data = filter[k];
    if (!data) continue;
    if (data.constructor === Array) {
      const totalItems = data.length;
      for (let j = 0; j < totalItems; j += 1) {
        stringQuery += `${k}[]=${data[j]}&`;
      }

      continue;
    }

    stringQuery += `${k}=${data}&`;
  }

  return stringQuery;
};