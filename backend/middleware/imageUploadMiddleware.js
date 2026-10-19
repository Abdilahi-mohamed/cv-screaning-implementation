const multer = require('multer');

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      callback(new Error('Please upload a JPEG, PNG, WebP, or GIF image.'));
      return;
    }
    callback(null, true);
  },
});

module.exports = uploadImage;
