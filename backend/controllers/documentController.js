const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const CV = require('../models/CV');
const Job = require('../models/Job');
const { documentRoot } = require('../services/documentService');
const { getStore } = require('../data/store');

const filenameMatches = (filename, candidate) => (
  candidate?.documents?.cv?.filename === filename
  || candidate?.documents?.certificate?.filename === filename
  || candidate?.documents?.kur?.filename === filename
  || candidate?.application_documents?.some((item) => item.document?.filename === filename)
);

const serveCandidateDocument = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName) || fileName === '.' || fileName === '..' || path.basename(fileName) !== fileName) {
      return res.status(404).json({ message: 'Document not found.' });
    }
    const jobIds = await Job.find({ company_id: req.user.company_id }).distinct('job_id');
    if (!jobIds.length) return res.status(404).json({ message: 'Document not found.' });
    const candidate = await CV.findOne({
      job_id: { $in: jobIds },
      $or: [
        { 'documents.cv.filename': fileName },
        { 'documents.certificate.filename': fileName },
        { 'documents.kur.filename': fileName },
        { 'application_documents.document.filename': fileName },
      ],
    }).lean();
    if (!candidate || !filenameMatches(fileName, candidate)) {
      return res.status(404).json({ message: 'Document not found in this company workspace.' });
    }

    const targetPath = path.resolve(documentRoot, fileName);
    if (path.dirname(targetPath) !== path.resolve(documentRoot)) {
      return res.status(404).json({ message: 'Document not found.' });
    }
    await fs.promises.access(targetPath, fs.constants.R_OK);
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(targetPath);
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ message: 'Document not found.' });
    return next(error);
  }
};

const serveJobImage = async (req, res, next) => {
  try {
    const { fileName } = req.params;
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName) || fileName === '.' || fileName === '..' || path.basename(fileName) !== fileName) {
      return res.status(404).json({ message: 'Image not found.' });
    }
    const imageUrl = `/uploads/${fileName}`;
    const job = mongoose.connection.readyState !== 1
      ? getStore().jobs.find((item) => item.image_url === imageUrl || item.brand_logo_url === imageUrl)
      : await Job.findOne({ $or: [{ image_url: imageUrl }, { brand_logo_url: imageUrl }] }).select('job_id company_id');
    if (!job) return res.status(404).json({ message: 'Image not found.' });
    const targetPath = path.resolve(documentRoot, fileName);
    if (path.dirname(targetPath) !== path.resolve(documentRoot)) return res.status(404).json({ message: 'Image not found.' });
    await fs.promises.access(targetPath, fs.constants.R_OK);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.sendFile(targetPath);
  } catch (error) {
    if (error.code === 'ENOENT') return res.status(404).json({ message: 'Image not found.' });
    return next(error);
  }
};

module.exports = { serveCandidateDocument, serveJobImage };
