const WIDGET_STAT_TYPE = {
  SHOW: 'SHOW',
  CLOSE: 'CLOSE',
  ACCEPT: 'ACCEPT',
  UNAVAILABLE: 'UNAVAILABLE',
};

const WIDGET_STAT_TYPE_VALUES = Object.values(WIDGET_STAT_TYPE);

const CALL_STAT_TYPE = {
  MISSED: 'MISSED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  UNAVAILABLE: 'UNAVAILABLE',
  UNAVAILABLEDEVICE: 'UNAVAILABLEDEVICE',
  AGENTDISCONNECTED: 'AGENTDISCONNECTED',
  CLIENTDISCONNECTED: 'CLIENTDISCONNECTED',
};

const CALL_STAT_TYPE_VALUES = Object.values(CALL_STAT_TYPE);

module.exports = {
  CALL_STAT_TYPE,
  WIDGET_STAT_TYPE,
  CALL_STAT_TYPE_VALUES,
  WIDGET_STAT_TYPE_VALUES,
};
