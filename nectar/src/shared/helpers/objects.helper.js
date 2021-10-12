function sanitize(schema, data) {
  const dataSanitized = { ...data };
  const schemaKeys = Object.keys(schema);
  const dataKeys = Object.keys(data);
  const totalKeys = dataKeys.length;
  for (let i = 0; i < totalKeys; i += 1) {
    const k = dataKeys[i];
    if (!schemaKeys.includes(k)) delete dataSanitized[k];
  }

  return dataSanitized;
}

module.exports = {
  sanitize,
};
