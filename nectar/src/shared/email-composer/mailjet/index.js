const CONFIG = require('../../../../config');
const { getTemplate } = require('../templates');

const mailjet = require('node-mailjet').connect(CONFIG.MAILJET.APIKEY_PUBLIC, CONFIG.MAILJET.APIKEY_PRIVATE);

function getSubject(type, data) {
  const subjects = {
    default: '[Vidiwise]',
  };

  return subjects[type] || subjects.default;
}

async function getMailjetMessage(options, type, data) {
  let To;
  const TemplateID = options.templateId;
  if (typeof options.to === 'string') To = [{ Email: options.to }];
  else To = options.to.map(email => ({ Email: email }));
  const message = { To, Variables: data };
  if (TemplateID) {
    message.TemplateID = TemplateID;
    message.TemplateLanguage = true;
  } else {
    message.Subject = getSubject(type, data);
    message.From = {
      Email: CONFIG.MAILJET.FROM.EMAIL,
      Name: CONFIG.MAILJET.FROM.NAME
    };
    const content = await getTemplate(type, data);
    if (options.isPlainText) message.TextPart = content;
    else message.HTMLPart = content;
  }

  if (CONFIG.ENVIRONMENT !== 'PRODUCTION') {
    message.To = [{ Email: CONFIG.DEFAULT_EMAIL }];
    if (message.Cc) delete message.Cc;
    if (message.Bcc) delete message.Bcc;
    if (message.Subject) message.Subject += ' [PREPRODUCTION]';
  }

  return message;
}

async function sendEmail(options, type, data) {
  try {
    const message = await getMailjetMessage(options, type, data);
    await mailjet
      .post('send', { version: 'v3.1' })
      .request({ Messages: [message] });
  } catch (err) {
    if (err && err.response && err.response.res) console.log(err.response.res.text);
  }
}

module.exports = {
  sendEmail,
};
