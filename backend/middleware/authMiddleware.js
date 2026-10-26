const mongoose = require('mongoose');
const Company = require('../models/Company');
const CV = require('../models/CV');
const Job = require('../models/Job');
const Session = require('../models/Session');
const User = require('../models/User');
const { hashSessionToken } = require('../services/authService');
const { getStore } = require('../data/store');

const unavailable = (res) => res.status(503).json({ message: 'Authentication requires the configured database. Please try again when the database is available.' });
const isTrustedOrigin = (origin) => {
  if (!origin) return true;
  if (origin === process.env.FRONTEND_URL) return true;
  try {
    const { hostname, port } = new URL(origin);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname) && (port === '' || /^\d+$/.test(port));
  } catch {
    return false;
  }
};

const requireTrustedOrigin = (req, res, next) => {
  if (!isTrustedOrigin(req.get('origin'))) {
    return res.status(403).json({ message: 'This request origin is not allowed.' });
  }
  return next();
};

const readCookie = (req, name) => {
  const cookie = String(req.headers.cookie || '').split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!cookie) return '';
  try {
    return decodeURIComponent(cookie.slice(name.length + 1));
  } catch {
    return '';
  }
};

const getSessionCookieName = (role) => role === 'owner' ? 'cv_owner_session' : 'cv_hr_session';

const loadAuthenticatedUser = async (req, res, required, role) => {
  if (mongoose.connection.readyState !== 1) {
    if (required) unavailable(res);
    return null;
  }

  const token = readCookie(req, getSessionCookieName(role));
  if (!token) {
    if (required) res.status(401).json({ message: 'Please sign in to continue.' });
    return null;
  }

  const session = await Session.findOne({
    token_hash: hashSessionToken(token),
    expires_at: { $gt: new Date() },
    ...(role ? { role } : {}),
  });
  if (!session) {
    if (required) res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    return null;
  }

  const user = await User.findById(session.user_id);
  if (!user || !user.active || user.role !== session.role) {
    if (required) res.status(401).json({ message: 'Your account is no longer available. Please sign in again.' });
    return null;
  }
  if (user.role === 'hr') {
    const company = await Company.findOne({ company_id: user.company_id });
    if (!company || company.status !== 'active') {
      if (required) res.status(403).json({ message: 'This company account is not active. Contact the system owner.' });
      return null;
    }
    req.company = company;
  }
  req.user = user;
  req.session = session;
  return user;
};

const requireRole = (role) => async (req, res, next) => {
  try {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !isTrustedOrigin(req.get('origin'))) {
      return res.status(403).json({ message: 'This request origin is not allowed.' });
    }
    const user = await loadAuthenticatedUser(req, res, true, role);
    if (!user) return;
    if (user.role !== role) return res.status(403).json({ message: 'You do not have permission to access this resource.' });
    user.last_active_at = new Date();
    await user.save();
    return next();
  } catch (error) {
    return next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !isTrustedOrigin(req.get('origin'))) {
      return res.status(403).json({ message: 'This request origin is not allowed.' });
    }
    const hrToken = readCookie(req, getSessionCookieName('hr'));
    const ownerToken = readCookie(req, getSessionCookieName('owner'));
    const user = (hrToken && await loadAuthenticatedUser(req, res, false, 'hr'))
      || (ownerToken && await loadAuthenticatedUser(req, res, false, 'owner'))
      || null;
    if (!user) req.user = null;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireJobAccess = (parameter = 'jobId') => async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'hr') {
      return res.status(403).json({ message: 'HR access is required for this company resource.' });
    }
    const jobId = req.params[parameter] || req.body?.job_id || req.body?.jobId;
    const job = mongoose.connection.readyState !== 1
      ? getStore().jobs.find((item) => item.job_id === jobId && item.company_id === req.user.company_id)
      : await Job.findOne({ job_id: jobId, company_id: req.user.company_id });
    if (!job) return res.status(404).json({ message: 'Job not found in this company workspace.' });
    req.job = job;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireCandidateAccess = (parameter = 'id') => async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'hr') {
      return res.status(403).json({ message: 'HR access is required for this company resource.' });
    }
    const candidateId = req.params[parameter];
    const candidate = mongoose.connection.readyState !== 1
      ? getStore().cvs.find((item) => item.cv_id === candidateId)
      : await CV.findOne({ cv_id: candidateId });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found.' });
    const job = mongoose.connection.readyState !== 1
      ? getStore().jobs.find((item) => item.job_id === candidate.job_id && item.company_id === req.user.company_id)
      : await Job.findOne({ job_id: candidate.job_id, company_id: req.user.company_id });
    if (!job) return res.status(404).json({ message: 'Candidate not found in this company workspace.' });
    req.candidate = candidate;
    req.job = job;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user || req.user.role !== 'hr') {
    return res.status(403).json({ message: 'HR access is required for this company resource.' });
  }
  if (!req.user.permissions?.includes(permission)) {
    return res.status(403).json({ message: `Your account does not have the ${permission} permission.` });
  }
  return next();
};

const requireHR = requireRole('hr');
const requireOwner = requireRole('owner');

module.exports = {
  optionalAuth,
  readCookie,
  requireCandidateAccess,
  requireHR,
  requireJobAccess,
  requireOwner,
  requirePermission,
  requireTrustedOrigin,
};
