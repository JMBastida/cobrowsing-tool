const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const CONFIG = require('../../../../config');
const { getTemplate } = require('../templates');

const myOAuth2Client = new google.auth.OAuth2(CONFIG.OAUTH.CLIENT_ID, CONFIG.OAUTH.CLIENT_SECRET);
myOAuth2Client.setCredentials({ refresh_token: CONFIG.OAUTH.REFRESH_TOKEN });

function getSubject(type, data) {
  const subjects = {
    userWelcome: `[Vidiwise] You’re in!`,
    userWelcomeDemoWp: `[Vidiwise] You’re in!`,
    userWelcomeFreeTrialWp: `[Vidiwise] You’re in!`,
    support: `[Vidiwise] [SUPPORT] [${data.type}] Nuevo ticket`,
    pendingUsage: `[Vidiwise] You are one script away`,
    pendingRoom: `[Vidiwise] Delight your visitors with this…`,
    oneWeekDisconnected: '[Vidiwise] If You Only Read One Email From Us, Read This...',
    default: '[Vidiwise]',
  };

  return subjects[type] || subjects.default;
}

async function getMailOptions(options, type, data) {
  const mailOptions = { from: CONFIG.OAUTH.FROM, subject: getSubject(type, data) };
  const content = await getTemplate(type, data);
  if (options.isPlainText) mailOptions.text = content;
  else mailOptions.html = content;
  mailOptions.to = options.to;
  mailOptions.cc = options.cc;
  if (CONFIG.ENVIRONMENT !== 'PRODUCTION') {
    mailOptions.to = CONFIG.DEFAULT_EMAIL;
    if (mailOptions.cc) delete mailOptions.cc;
    mailOptions.subject += ' [PREPRODUCTION]';
  }

  return mailOptions;
}

async function sendEmail(options, type, data) {
  const mailOptions = await getMailOptions(options, type, data);
  return new Promise((resolve, reject) => {
    const myAccessToken = myOAuth2Client.getAccessToken();
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: CONFIG.OAUTH.USER,
        clientId: CONFIG.OAUTH.CLIENT_ID,
        clientSecret: CONFIG.OAUTH.CLIENT_SECRET,
        refreshToken: CONFIG.OAUTH.REFRESH_TOKEN,
        accessToken: myAccessToken,
      }
    });
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) reject(error);
      resolve(info);
    });
  });
}

module.exports = {
  sendEmail,
};