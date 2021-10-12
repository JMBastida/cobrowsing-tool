function getClientEntityObject(entity, entityConfig) {
  const data = {
    ...entityConfig,
    code: entity.code,
    modules: entity.modules,
    maxUsers: entity.maxUsers || 0,
    isScriptInstalled: !!entity.scriptOrigins && !!entity.scriptOrigins.length,
  };
  return data;
}

module.exports = {
  getClientEntityObject,
};