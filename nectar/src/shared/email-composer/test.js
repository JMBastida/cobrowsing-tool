const { sendInternEmail, sendEmailToClient } = require('./email-composer.bll');

// welcome template id: 2833028
// no rooms template id: 2833058
// next day template id: 2832926

const options = {
  to: 'jorge@uoc.es',
  templateId: 2833058,
  isPlainText: true,
};

const type = 'userWelcome';

const data = {
  name: 'Jorge',
  genderLetter: 'o',
  password: 'APSM1984DS',
  email: 'jorge@uoc.com',
};

// sendInternEmail(options, type, data);
sendEmailToClient(options, type, data);