const fs = require('fs');

function insertData(content, data) {
  let newContent = content;
  const properties = Object.getOwnPropertyNames(data);
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    if (newContent.includes(`{{${property}}}`)) {
      const regex = new RegExp(`{{${property}}}`, 'g');
      newContent = newContent.replace(regex, data[property]);
    }
  }

  return newContent;
}

function getTemplate(type, data) {
  return new Promise(((resolve, reject) => {
    let content = fs.readFileSync(`./src/shared/email-composer/templates/${type}.html`, 'utf-8');
    if (!content) {
      reject(new Error(`Error getting content file: ${type}.html`));
    }

    content = insertData(content, data);
    resolve(content);
  }));
}



module.exports = {
  getTemplate,
};
