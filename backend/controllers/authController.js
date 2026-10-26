const mongoose = require('mongoose');
const Company = require('../models/Company');
const Session = require('../models/Session');
const User = require('../models/User');
const { createSession, hashSessionToken, verifyPassword } = require('../services/authService');
const { readCookie } = require('../middleware/authMiddleware');

const cookieOptions = (maxAge) => [
  'Path=/',
  'HttpOnly',
  `SameSite=${process.env.NODE_ENV === 'production' ? 'None' : 'Lax'}`,
  `Max-Age=${Math.max(0, Math.floor(maxAge / 1000))}`,
  process.env.NODE_ENV === 'production' ? 'Secure' : '',
].filter(Boolean).join('; ');

const cookieName = (role) => role === 'owner' ? 'cv_owner_session' : 'cv_hr_session';

const setSessionCookie = (res, token, expiresAt, role) => {
  res.setHeader('Set-Cookie', `${cookieName(role)}=${encodeURIComponent(token)}; ${cookieOptions(expiresAt.getTime() - Date.now())}`);
};

const clearSessionCookie = (res, role) => {
  res.setHeader('Set-Cookie', `${cookieName(role)}=; ${cookieOptions(0)}`);
};

const login = (role) => async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Sign-in requires the configured database. Please try again when the database is available.' });
    }
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });
    if (username.length > 40 || password.length > 256) {
      return res.status(400).json({ message: 'Username or password exceeds the allowed length.' });
    }

    const user = await User.findOne({ username, role }).select('+password_hash');
    const passwordMatches = user && await verifyPassword(password, user.password_hash);
    if (!passwordMatches) return res.status(401).json({ message: 'The username or password is incorrect.' });
    if (!user.active) return res.status(403).json({ message: 'This account is inactive. Contact the system owner.' });

    let company = null;
    if (role === 'hr') {
      company = await Company.findOne({ company_id: user.company_id });
      if (!company || company.status !== 'active') {
        return res.status(403).json({ message: 'This company account is not active. Contact the system owner.' });
      }
    }

    await Session.deleteMany({ user_id: user._id, expires_at: { $lte: new Date() } });
    const { token, expiresAt } = await createSession(user);
    user.last_login_at = new Date();
    user.last_active_at = new Date();
    await user.save();
    setSessionCookie(res, token, expiresAt, role);
    return res.json({
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
        company_id: user.company_id,
        company_name: company?.name || '',
        permissions: user.permissions,
      },
      expires_at: expiresAt,
    });
  } catch (error) {
    return next(error);
  }
};

const currentUser = (role) => async (req, res, next) => {
  try {
    const token = readCookie(req, cookieName(role));
    if (!token || mongoose.connection.readyState !== 1) {
      return res.status(401).json({ message: 'Please sign in to continue.' });
    }
    const session = await Session.findOne({
      token_hash: hashSessionToken(token),
      role,
      expires_at: { $gt: new Date() },
    });
    if (!session) return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    const user = await User.findById(session.user_id);
    if (!user || user.role !== role || !user.active) return res.status(401).json({ message: 'Your account is no longer available. Please sign in again.' });

    let company = null;
    if (role === 'hr') {
      company = await Company.findOne({ company_id: user.company_id });
      if (!company || company.status !== 'active') return res.status(403).json({ message: 'This company account is not active.' });
    }
    return res.json({
      user: {
        username: user.username,
        name: user.name,
        role: user.role,
        company_id: user.company_id,
        company_name: company?.name || '',
        permissions: user.permissions,
      },
      expires_at: session.expires_at,
    });
  } catch (error) {
    return next(error);
  }
};

const logout = (role) => async (req, res, next) => {
  try {
    const token = readCookie(req, cookieName(role));
    if (token && mongoose.connection.readyState === 1) {
      await Session.deleteOne({ token_hash: hashSessionToken(token) });
    }
    clearSessionCookie(res, role);
    return res.json({ logged_out: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  currentOwner: currentUser('owner'),
  currentHR: currentUser('hr'),
  loginOwner: login('owner'),
  loginHR: login('hr'),
  logoutHR: logout('hr'),
  logoutOwner: logout('owner'),
};
