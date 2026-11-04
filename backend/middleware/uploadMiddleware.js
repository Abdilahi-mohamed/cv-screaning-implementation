const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const mongoose = require('mongoose');
const SystemSetting = require('../models/SystemSetting');

const uploadDirectory = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirectory),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${crypto.randomUUID()}${extension}`);
  },
});

const allowedImages = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const createUpload = ({ allowCustomImages = false, maxFileSizeMb = 10 } = {}) => multer({
  storage,
  limits: {
    fileSize: maxFileSizeMb * 1024 * 1024,
    files: 20,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (file.fieldname === 'kur_file' || (allowCustomImages && allowedImages[ext])) {
      if (allowedImages[ext] === file.mimetype) {
        cb(null, true);
        return;
      }
      cb(new Error('Image uploads must be JPEG, PNG, WebP, or GIF files.'));
      return;
    }

    const allowedDocuments = ['.pdf', '.doc', '.docx'];
    if (allowedDocuments.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error('Unsupported file type. Please upload a PDF or Word document.'));
  },
});

const getUploadMiddleware = (method, args, options) => (req, res, next) => {
  const createRequestMiddleware = async () => {
    let maxFileSizeMb = 10;
    if (mongoose.connection.readyState === 1) {
      const settings = await SystemSetting.findOne({ key: 'platform' }).select('max_cv_file_size_mb').lean();
      maxFileSizeMb = settings?.max_cv_file_size_mb || maxFileSizeMb;
    }
    createUpload({ ...options, maxFileSizeMb })[method](...args)(req, res, next);
  };
  createRequestMiddleware().catch(next);
};

const createUploadRouter = (options = {}) => ({
  array: (field, maxCount) => getUploadMiddleware('array', [field, maxCount], options),
  any: () => getUploadMiddleware('any', [], options),
});

const upload = createUploadRouter();
upload.application = createUploadRouter({ allowCustomImages: true });

module.exports = upload;
