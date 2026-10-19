const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const WordExtractor = require('word-extractor');

const extractTextFromFile = async (filePath, mimetype = '') => {
  if (!filePath) {
    return '';
  }

  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === '.pdf' || mimetype.includes('pdf')) {
      const data = await pdfParse(fs.readFileSync(filePath));
      return data.text || '';
    }

    if (ext === '.docx' || mimetype.includes('officedocument')) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    }

    if (ext === '.doc') {
      const extractor = new WordExtractor();
      const document = await extractor.extract(filePath);
      return document.getBody() || '';
    }

    return '';
  } catch (error) {
    console.error('CV extraction failed:', error.message);
    return '';
  }
};

module.exports = { extractTextFromFile };
