const path = require('path');
const fs = require('fs');
const multer = require('multer');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const makeStorage = (folder) => {
  const uploadPath = path.join(__dirname, '..', 'uploads', folder);
  ensureDir(uploadPath);

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPath),
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${Date.now()}-${safeName}`);
    },
  });
};

const avatarUpload = multer({
  storage: makeStorage('avatars'),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    return cb(null, true);
  },
});

const documentUpload = multer({
  storage: makeStorage('documents'),
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  avatarUpload,
  documentUpload,
};
