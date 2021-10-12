const stateRepository = require('./state.repository');
const { newError } = require('../../helpers/errors.helper');

async function find(filter = {}, options = {}) {
  const [states, total] = await Promise.all([
    stateRepository.find(filter, options),
    stateRepository.count(filter),
  ]);

  return { states, total };
}

async function validateUpdateState(state) {
  const { _id } = state;
  if (!_id) {
    throw newError(400, 'Required fields not given', null, null);
  }
}

async function updateOne(state) {
  await validateUpdateState(state);
  const stateParsed = { ...state, modificationDate: new Date() };
  const stateUpdated = await stateRepository.updateOne(stateParsed);
  return stateUpdated;
}

async function insertOne(state) {
  const stateParsed = { ...state, creationDate: new Date() };
  const stateCreated = await stateRepository.insertOne(stateParsed);
  return stateCreated;
}

async function initialize() {
  const states = await stateRepository.find({});
  if (states && states.length) return;
  const initialState = {
    inactiveTime: 0,
    maxSocketConnections: 0,
    isConnectionWithoutAgentsValidationActive: true,
  };
  await insertOne(initialState);
}

module.exports = {
  find,
  insertOne,
  updateOne,
  initialize,
};
