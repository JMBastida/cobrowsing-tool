const geolocationRepository = require('./geolocation.repository');
const { newError, errorIfNotExists, errorIfExists } = require('../../helpers/errors.helper');

async function find(filter = {}, options = {}) {
  const [geolocations, total] = await Promise.all([
    geolocationRepository.find(filter, options),
    geolocationRepository.count(filter),
  ]);

  return { geolocations, total };
}

async function validateInsertGeolocation(geolocation) {
  const { ip } = geolocation;
  if (!ip) {
    throw newError(400, 'Required fields not given');
  }

  const query = { ip };
  const geolocations = await geolocationRepository.find(query);
  errorIfExists(geolocations && geolocations.length, 'Geolocation already exist', 400);
}

async function validateUpdateGeolocation(_id) {
  if (!_id) {
    throw newError(400, 'Required fields not given');
  }

  const query = { _id };
  const geolocations = await geolocationRepository.find(query);
  errorIfNotExists(geolocations && geolocations.length, 'Geolocation doesn\'t exist', 400);
}

async function insertOne(geolocation) {
  await validateInsertGeolocation(geolocation);
  const geolocationParsed = { ...geolocation, creationDate: new Date() };
  const geolocationCreated = await geolocationRepository.insertOne(geolocationParsed);
  return geolocationCreated;
}

async function updateOne(geolocation) {
  await validateUpdateGeolocation(geolocation._id);
  const geolocationParsed = { ...geolocation, modificationDate: new Date() };
  const geolocationUpdated = await geolocationRepository.updateOne(geolocationParsed);
  return geolocationUpdated;
}

async function deleteOne(geolocation) {
  await validateUpdateGeolocation(geolocation._id);
  const geolocationDeleted = await geolocationRepository.deleteOne(geolocation);
  return geolocationDeleted;
}

module.exports = {
  find,
  insertOne,
  updateOne,
  deleteOne,
};
