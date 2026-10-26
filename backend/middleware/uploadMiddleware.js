const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

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

const createUpload = ({ allowCustomImages = false } = {}) => multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
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

const upload = createUpload();
upload.application = createUpload({ allowCustomImages: true });

module.exports = upload;
