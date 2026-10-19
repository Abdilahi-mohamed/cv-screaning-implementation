const crypto = require('crypto');

const generateId = (prefix) => `${prefix}_${crypto.randomBytes(4).toString('hex')}`;

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const scoreToBadge = (score) => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'yellow';
  return 'red';
};

module.exports = {
  generateId,
  safeNumber,
  clamp,
  scoreToBadge,
};
