const fs = require('fs');
const CONFIG = require('../../../../config');

async function moveFiles(entity, data) {
  const paths = [];
  const attributes = Object.keys(data);
  const files = attributes.reduce((prev, curr) => prev.concat(data[curr]), []);
  const dir = `./public/media/${entity.code}`;
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const newPath = `${dir}/${file.filename}`;
    fs.renameSync(file.path, newPath);
    const fullPath = `${CONFIG.API_BASE_URL}/${newPath.substr(2)}`;
    paths.push(fullPath);
  }

  return paths;
}

async function uploadFile(entity, data) {
  const paths = await moveFiles(entity, data);
  return { paths };
}



module.exports = {
  uploadFile,
};
