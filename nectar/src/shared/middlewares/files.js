const multer = require('multer');
const fs = require('fs');
const { FIELD_NAMES } = require('../enums/file.enums');

function getFileName(file, entity, user) {
  const { originalname, fieldname } = file;
  const extension = originalname.substr(originalname.lastIndexOf('.')).toLowerCase();
  let fileName;
  switch (fieldname) {
    case FIELD_NAMES.AVATAR:
      fileName = `${user.code}${extension}`;
      break;
    case FIELD_NAMES.ENTITY_LOGO:
      fileName = `${entity.code}${extension}`;
      break;
    default:
      fileName = originalname;
      break;
  }

  return fileName;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { code } = req.entity;
    const dir = `./temp/media/${code}`;
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const { entity, user } = req;
    const fileName = getFileName(file, entity, user);
    cb(null, fileName);
  },
});

const upload =
  multer({ storage })
    .fields([
      { name: FIELD_NAMES.ENTITY_LOGO, maxCount: 1 },
      { name: FIELD_NAMES.AVATAR, maxCount: 1 },
    ]);

module.exports = {
  upload,
};
