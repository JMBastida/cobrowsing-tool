const nodemailer = require('./nodemailer');
const mailjet = require('./mailjet');

async function sendInternEmail(options, type, data) {
  return nodemailer.sendEmail(options, type, data);
}

async function sendEmailToClient(options, type, data) {
  return mailjet.sendEmail(options, type, data);
}

module.exports = {
  sendInternEmail,
  sendEmailToClient,
};