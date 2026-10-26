const crypto = require('crypto');
const { promisify } = require('util');
const User = require('../models/User');

const scrypt = promisify(crypto.scrypt);
const SESSION_DURATION_MS = 1000 * 60 * 60 * 12;

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString('hex')}`;
};

const verifyPassword = async (password, storedHash) => {
  const [salt, expectedHex] = String(storedHash || '').split(':');
  if (!salt || !expectedHex || !/^[\da-f]{128}$/i.test(expectedHex)) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  return crypto.timingSafeEqual(actual, expected);
};

const hashSessionToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createSession = async (user) => {
  const Session = require('../models/Session');
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await Session.create({
    token_hash: hashSessionToken(token),
    user_id: user._id,
    role: user.role,
    expires_at: expiresAt,
  });
  return { token, expiresAt };
};

const initializeOwner = async () => {
  if (await User.exists({ role: 'owner' })) return;
  const username = String(process.env.OWNER_USERNAME || '').trim().toLowerCase();
  const password = process.env.OWNER_PASSWORD || '';
  if (!username && !password) return;
  if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username) || password.length < 12 || password.length > 256) {
    throw new Error('Set both OWNER_USERNAME and an OWNER_PASSWORD of at least 12 characters to bootstrap the system owner.');
  }
  await User.create({
    username,
    name: 'System owner',
    role: 'owner',
    password_hash: await hashPassword(password),
    permissions: ['system:manage'],
  });
};

module.exports = {
  SESSION_DURATION_MS,
  createSession,
  hashPassword,
  hashSessionToken,
  initializeOwner,
  verifyPassword,
};
