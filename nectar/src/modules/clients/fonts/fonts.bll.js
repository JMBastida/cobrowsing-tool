const fs = require('fs');
const axios = require('axios').default;
const CONFIG = require('../../../../config');
const { errorIfNotExists } = require('../../../shared/helpers/errors.helper');

const FONTS_FOLDER = CONFIG.FONTS_FOLDER;

function checkExistingFont(dir, fileName) {
  const fileNames = fs.readdirSync(dir);
  const exists = fileNames.includes(fileName);
  return exists;
}

function getEntityFontsFolder(entity) {
  errorIfNotExists(entity && entity.code, 'Entity code not found', 404, null, null, null);
  const { code } = entity;
  const dir = `${FONTS_FOLDER}/${code}`;
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sanitizeEndpoint(endpoint) {
  if (!endpoint) return endpoint;
  let endpointSanitized = endpoint;
  const lastChar = endpoint.length - 1;
  if (endpoint[lastChar] === '/') endpointSanitized = endpoint.substring(0, lastChar);
  return endpointSanitized;
}

function getFileNameFromEndpoint(fontEndpoint) {
  const enpointSanitized = sanitizeEndpoint(fontEndpoint);
  const index = enpointSanitized.lastIndexOf('/');
  const fileName = enpointSanitized.substr(index + 1);
  return fileName;
}

async function getFontFile(endpoint, dir, fileName) {
  const response = await axios.get(endpoint, { responseType: 'arraybuffer' });
  const { headers, data } = response;
  if (!headers['content-type'].includes('font')) return;
  fs.writeFileSync(`${dir}/${fileName}`, data, { encoding: 'binary' });
}

async function handleFontEndpoints(entity, dir, fontEndpoints) {
  if (!entity || !entity.code || !fontEndpoints || !fontEndpoints.length) return { fileNames: [] };
  const fileNames = [];
  const totalEndpoints = fontEndpoints.length;
  for (let i = 0; i < totalEndpoints; i += 1) {
    const fontEndpoint = fontEndpoints[i];
    if (!fontEndpoint) continue;
    const fileName = getFileNameFromEndpoint(fontEndpoint);
    if (!fileNames.includes(fileName)) fileNames.push(fileName);
    const fileExists = checkExistingFont(dir, fileName);
    if (fileExists) continue;
    await getFontFile(fontEndpoint, dir, fileName);
  }

  return { fileNames };
}

async function handleFonts(entity, data) {
  const { fontEndpoints } = data;
  if (!fontEndpoints || !fontEndpoints.length) return { fileNames: [] };
  const fontsDir = getEntityFontsFolder(entity);
  const response = await handleFontEndpoints(entity, fontsDir, fontEndpoints);
  return response;
}

module.exports = {
  handleFonts,
};
