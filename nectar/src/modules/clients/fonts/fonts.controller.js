const log4js = require('log4js');
const fontsBll = require('./fonts.bll');

const logger = log4js.getLogger('FONTS');
logger.level = 'debug';

async function handleFonts(req, res) {
  try {
    const { entity, body } = req;
    const response = await fontsBll.handleFonts(entity, body);
    res.send(response);
  } catch (err) {
    logger.error(err);
    res.status(200).send({ fileNames: [] });
  }
}

module.exports = {
  handleFonts,
};
