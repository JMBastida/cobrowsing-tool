const { newError, errorIfNotExists } = require('../../helpers/errors.helper');
const ticketRepository = require('./ticket.repository');

async function find(filter = {}, options = {}) {
  const [tickets, total] = await Promise.all([
    ticketRepository.find(filter, options),
    ticketRepository.count(filter),
  ]);

  return { tickets, total };
}

async function validateUpdateTicket(ticket) {
  const { _id } = ticket;
  if (!_id) {
    throw newError(400, 'Required fields not given', 'TICKET.ERROR.UPDATE.REQUIRED.DETAIL', 'TICKET.ERROR.UPDATE.REQUIRED.DETAIL');
  }

  const tickets = await ticketRepository.find({ _id });
  const [current] = tickets;
  errorIfNotExists(current, 'Ticket doesn\'t exist', 400, 'TICKET.ERROR.UPDATE.EXISTING.SUMMARY', 'TICKET.ERROR.UPDATE.EXISTING.DETAIL');
}

async function updateOne(ticket) {
  await validateUpdateTicket(ticket);
  const ticketParsed = { ...ticket, modificationDate: new Date() };
  const ticketUpdated = await ticketRepository.updateOne(ticketParsed);
  return ticketUpdated;
}

async function insertOne(ticket) {
  const ticketParsed = { ...ticket, creationDate: new Date() };
  const ticketCreated = await ticketRepository.insertOne(ticketParsed);
  return ticketCreated;
}

module.exports = {
  find,
  insertOne,
  updateOne,
};
