const invalidServers = [
  'gmail',
  'hotmail',
  'yahoo',
];

function validateEmail(email) {
  if (!email || email.length < 5 || email.trim().includes(' ')) return false;
  var arroba = email.indexOf('@');
  var arroba2 = email.lastIndexOf('@');
  var point = email.substr(arroba + 1).indexOf('.');
  var point2 = email.substr(arroba + 1).lastIndexOf('.');
  var lastPoint = email.lastIndexOf('.');
  var extension = email.substr(lastPoint + 1);
  return arroba >= 1 && arroba === arroba2 && point > 0 && point === point2 && extension.length > 1;
}

function validateCompanyEmail(email) {
  if (!email || email.length < 5) return false;
  let isValid = true;
  for (let i = 0; i < invalidServers.length; i += 1) {
    const server = invalidServers[i];
    if (email.includes(server)) {
      isValid = false;
      break;
    }
  }

  return isValid;
}

module.exports = {
  validateEmail,
  validateCompanyEmail,
};
