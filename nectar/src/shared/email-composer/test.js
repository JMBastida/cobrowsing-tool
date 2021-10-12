const { sendInternEmail, sendEmailToClient } = require('./email-composer.bll');

// welcome template id: 2833028
// no rooms template id: 2833058
// next day template id: 2832926

const options = {
  to: 'samuel@vidiwise.com',
  templateId: 2833058,
  isPlainText: true,
};

const type = 'userWelcome';

const data = {
  name: 'Samuel',
  genderLetter: 'o',
  password: 'APSM1984DS',
  email: 'samuel@vidiwise.com',
};

// sendInternEmail(options, type, data);
sendEmailToClient(options, type, data);