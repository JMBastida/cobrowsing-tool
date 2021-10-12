const emailComposer = require('../../../shared/email-composer/email-composer.bll');
const ticketBll = require('../../../shared/database/ticket/ticket.bll');

function sendMessage(user, body) {
  const options = { to: 'samuel@vidiwise.com, grisel@vidiwise.com, diego@vidiwise.com, wrahn@vidiwise.com, jmartinez@vidiwise.com, vserrano@vidiwise.com' };
  let type = 'support';
  const emailData = {
    message: body.message,
    type: body.type,
    userName: user.name,
    userLastName: user.lastName || '',
    userEmail: user.email,
    userPhone: user.phone,
    userId: user._id,
    entityId: user.entityId,
  };
  emailComposer.sendInternEmail(options, type, emailData);
  return { sent: 'OK' };
}

function supportRequest(user, body) {
  sendMessage(user, body);
  const ticket = {
    type: body.type,
    userId: user._id,
    message: body.message,
  };
  ticketBll.insertOne(ticket);
}

module.exports = {
  supportRequest,
};
