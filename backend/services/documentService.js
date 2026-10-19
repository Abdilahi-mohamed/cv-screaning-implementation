const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const documentRoot = path.join(__dirname, '..', 'uploads');

const ensureUploadDirectory = () => {
  if (!fs.existsSync(documentRoot)) {
    fs.mkdirSync(documentRoot, { recursive: true });
  }
};

const sanitizeFileName = (originalName = '') => {
  const safe = String(originalName || '').replace(/[^a-zA-Z0-9._-]/g, '_');
  return safe || 'document';
};

const buildDocumentRecord = (file, kind) => {
  if (!file) return null;
  const fileName = sanitizeFileName(file.originalname || `${kind}-${Date.now()}`);
  return {
    filename: file.filename || fileName,
    originalName: file.originalname || fileName,
    mimeType: file.mimetype || '',
    path: file.path || path.join(documentRoot, file.filename || fileName),
    size: file.size || 0,
    uploadedAt: new Date().toISOString(),
  };
};

const createSignedDocumentUrl = (req, fileName) => {
  if (!fileName) return '';
  const base = `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${encodeURIComponent(fileName)}`;
};

module.exports = {
  ensureUploadDirectory,
  sanitizeFileName,
  buildDocumentRecord,
  createSignedDocumentUrl,
  documentRoot,
  generateDocumentToken: (filePath) => crypto.createHash('sha256').update(filePath).digest('hex').slice(0, 16),
};