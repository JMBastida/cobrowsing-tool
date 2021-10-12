const socketFunctions = require('../../public/socket');
const stateBll = require('../../../shared/database/state/state.bll');

async function setMaxConnections(value) {
  if (isNaN(value)) return { ERROR: `Invalid value: ${value}. Set a valid value.` };
  const maxSocketConnections = parseInt(value);
  const statesResponse = await stateBll.find({});
  const [state] = statesResponse.states;
  const stateParsed = { _id: state._id, maxSocketConnections };
  await stateBll.updateOne(stateParsed);
  socketFunctions.setMaxConnections(maxSocketConnections);
  if (!maxSocketConnections) return { STATUS: 'Now there isn\'t a max connections limit' };
  return { STATUS: `The max amount of socket connections is set to ${maxSocketConnections}` };
}

async function setSocketInactivityTime(value) {
  if (isNaN(value)) return { ERROR: `Invalid value: ${value}. Set a valid value.` };
  const inactiveTime = parseInt(value);
  const statesResponse = await stateBll.find({});
  const [state] = statesResponse.states;
  const stateParsed = { _id: state._id, inactiveTime };
  await stateBll.updateOne(stateParsed);
  socketFunctions.setSocketInactivityTime(inactiveTime);
  if (!inactiveTime) return { STATUS: 'Now there isn\'t a inactivity time limit' };
  return { STATUS: `The inactivity time of a socket connection is set to ${inactiveTime} miliseconds` };
}

async function setConnectionWithoutAgentsValidation(value) {
  const valueParsed = value.toUpperCase();
  const isValid = ['ON', 'OFF'].includes(valueParsed);
  if (!isValid) return { ERROR: `Invalid status value: ${value}. Set a valid status value.` };
  const isActive = valueParsed === 'ON';
  const statesResponse = await stateBll.find({});
  const [state] = statesResponse.states;
  const stateParsed = { _id: state._id, isConnectionWithoutAgentsValidationActive: isActive };
  await stateBll.updateOne(stateParsed);
  socketFunctions.setConnectionWithoutAgentsValidation(isActive);
  return { STATUS: `The connection without agents validation now is ${isActive ? 'ON' : 'OFF'}` };
}

module.exports = {
  setMaxConnections,
  setSocketInactivityTime,
  setConnectionWithoutAgentsValidation,
};
