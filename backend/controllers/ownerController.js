const crypto = require('crypto');
const mongoose = require('mongoose');
const Company = require('../models/Company');
const CV = require('../models/CV');
const Job = require('../models/Job');
const Session = require('../models/Session');
const SystemSetting = require('../models/SystemSetting');
const User = require('../models/User');
const { hashPassword } = require('../services/authService');

const PERMISSIONS = ['jobs:manage', 'candidates:manage', 'settings:manage'];
const databaseUnavailable = (res) => res.status(503).json({ message: 'Owner administration requires the configured database.' });
const validUsername = (username) => /^[a-z0-9][a-z0-9._-]{2,39}$/.test(username);
const validPassword = (password) => typeof password === 'string' && password.length >= 12 && password.length <= 256;
const validEmail = (email) => !email || (email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

const getDashboard = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
    const [companies, activeCompanies, suspendedCompanies, hrUsers, jobs, candidates, recentUsers] = await Promise.all([
      Company.countDocuments({ status: { $ne: 'deleted' } }),
      Company.countDocuments({ status: 'active' }),
      Company.countDocuments({ status: 'suspended' }),
      User.countDocuments({ role: 'hr', active: true }),
      Job.countDocuments(),
      CV.countDocuments(),
      User.find({ role: 'hr' }).select('username name company_id last_active_at last_login_at active').sort({ last_active_at: -1, last_login_at: -1 }).limit(5).lean(),
    ]);
    return res.json({
      stats: { companies, active_companies: activeCompanies, suspended_companies: suspendedCompanies, hr_users: hrUsers, jobs, candidates },
      recent_activity: recentUsers,
    });
  } catch (error) {
    return next(error);
  }
};

const getSettings = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
    const settings = await SystemSetting.findOneAndUpdate(
      { key: 'platform' },
      { $setOnInsert: { key: 'platform' } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();
    return res.json({
      allow_public_applications: settings.allow_public_applications,
      default_brand_color: settings.default_brand_color,
      updated_at: settings.updated_at,
    });
  } catch (error) {
    return next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
    const updates = {};
    if (req.body?.allow_public_applications !== undefined) {
      if (typeof req.body.allow_public_applications !== 'boolean') {
        return res.status(400).json({ message: 'Public application access must be enabled or disabled.' });
      }
      updates.allow_public_applications = req.body.allow_public_applications;
    }
    if (req.body?.default_brand_color !== undefined) {
      if (!/^#[0-9a-f]{6}$/i.test(req.body.default_brand_color)) {
        return res.status(400).json({ message: 'Default brand color must be a six-digit hexadecimal color.' });
      }
      updates.default_brand_color = req.body.default_brand_color;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'Provide at least one system setting to update.' });
    updates.updated_by = req.user.username;
    updates.updated_at = new Date();
    const settings = await SystemSetting.findOneAndUpdate(
      { key: 'platform' },
      { $set: updates, $setOnInsert: { key: 'platform' } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true },
    ).lean();
    return res.json({
      allow_public_applications: settings.allow_public_applications,
      default_brand_color: settings.default_brand_color,
      updated_at: settings.updated_at,
    });
  } catch (error) {
    return next(error);
  }
};

const listCompanies = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
    const companies = await Company.find().sort({ created_at: -1 }).lean();
    const companyIds = companies.map((company) => company.company_id);
    const users = await User.find({ role: 'hr', company_id: { $in: companyIds } })
      .select('username name email company_id active permissions last_login_at last_active_at created_at')
      .lean();
    const userByCompany = new Map(users.map((user) => [user.company_id, user]));
    const jobs = await Job.aggregate([{ $match: { company_id: { $in: companyIds } } }, { $group: { _id: '$company_id', count: { $sum: 1 } } }]);
    const jobCounts = new Map(jobs.map((item) => [item._id, item.count]));
    const candidateCounts = await Promise.all(companyIds.map(async (companyId) => {
      const jobIds = await Job.find({ company_id: companyId }).distinct('job_id');
      return [companyId, await CV.countDocuments({ job_id: { $in: jobIds } })];
    }));
    const candidateCountByCompany = new Map(candidateCounts);

    return res.json(companies.map((company) => ({
      ...company,
      hr_user: userByCompany.get(company.company_id) || null,
      job_count: jobCounts.get(company.company_id) || 0,
      candidate_count: candidateCountByCompany.get(company.company_id) || 0,
    })));
  } catch (error) {
    return next(error);
  }
};

const createCompany = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
    const name = String(req.body?.name || '').trim();
    const username = String(req.body?.hr_username || '').trim().toLowerCase();
    const hrName = String(req.body?.hr_name || '').trim();
    const email = String(req.body?.hr_email || '').trim().toLowerCase();
    const password = req.body?.hr_password;
    if (name.length < 2 || name.length > 120) return res.status(400).json({ message: 'Company name must be between 2 and 120 characters.' });
    if (!validUsername(username)) return res.status(400).json({ message: 'HR username must be 3–40 characters using letters, numbers, dots, underscores, or hyphens.' });
    if (hrName.length > 100 || !validEmail(email)) return res.status(400).json({ message: 'Enter a valid HR name and email address.' });
    if (!validPassword(password)) return res.status(400).json({ message: 'HR password must be between 12 and 256 characters.' });
    if (await User.exists({ username })) return res.status(409).json({ message: 'That username is already assigned to another account.' });

    const company = await Company.create({ company_id: `company_${crypto.randomUUID()}`, name });
    try {
      const user = await User.create({
        username,
        name: hrName,
        email,
        role: 'hr',
        company_id: company.company_id,
        password_hash: await hashPassword(password),
        permissions: PERMISSIONS,
      });
      if (await Company.countDocuments() === 1) {
        await Job.updateMany(
          { $or: [{ company_id: null }, { company_id: { $exists: false } }] },
          { $set: { company_id: company.company_id, company_name: name } },
        );
      }
      return res.status(201).json({
        company: company.toObject(),
        hr_user: { username: user.username, name: user.name, email: user.email, active: user.active, permissions: user.permissions },
      });
    } catch (error) {
      await User.deleteMany({ role: 'hr', company_id: company.company_id });
      await Company.deleteOne({ company_id: company.company_id });
      throw error;
    }
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That username is already assigned to another account.' });
    return next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
    const { companyId } = req.params;
    const company = await Company.findOne({ company_id: companyId });
    if (!company) return res.status(404).json({ message: 'Company account not found.' });
    if (company.status === 'deleted') return res.status(409).json({ message: 'Deleted company accounts cannot be edited.' });

    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length < 2 || name.length > 120) return res.status(400).json({ message: 'Company name must be between 2 and 120 characters.' });
      company.name = name;
    }
    if (req.body?.status !== undefined) {
      if (!['active', 'suspended'].includes(req.body.status)) return res.status(400).json({ message: 'Company status must be active or suspended.' });
      company.status = req.body.status;
      if (req.body.status === 'suspended') {
        const companyUsers = await User.find({ role: 'hr', company_id: companyId }).select('_id');
        await Session.deleteMany({ user_id: { $in: companyUsers.map((user) => user._id) } });
      }
    }
    company.updated_at = new Date();
    await company.save();
    return res.json({ company });
  } catch (error) {
    return next(error);
  }
};

const updateHrUser = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
    const { companyId } = req.params;
    const company = await Company.findOne({ company_id: companyId, status: { $ne: 'deleted' } });
    if (!company) return res.status(404).json({ message: 'Company account not found.' });
    const user = await User.findOne({ role: 'hr', company_id: companyId }).select('+password_hash');
    if (!user) return res.status(404).json({ message: 'HR user not found.' });

    if (req.body?.username !== undefined) {
      const username = String(req.body.username).trim().toLowerCase();
      if (!validUsername(username)) return res.status(400).json({ message: 'HR username must be 3–40 characters using letters, numbers, dots, underscores, or hyphens.' });
      const existing = await User.findOne({ username, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ message: 'That username is already assigned to another account.' });
      user.username = username;
    }
    if (req.body?.name !== undefined) {
      const name = String(req.body.name).trim();
      if (name.length > 100) return res.status(400).json({ message: 'HR name must be 100 characters or fewer.' });
      user.name = name;
    }
    if (req.body?.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (!validEmail(email)) return res.status(400).json({ message: 'Enter a valid HR email address.' });
      user.email = email;
    }
    if (req.body?.active !== undefined) {
      if (typeof req.body.active !== 'boolean') return res.status(400).json({ message: 'HR account access must be active or suspended.' });
      user.active = req.body.active;
      if (!req.body.active) await Session.deleteMany({ user_id: user._id });
    }
    if (req.body?.permissions !== undefined) {
      if (!Array.isArray(req.body.permissions) || req.body.permissions.some((permission) => !PERMISSIONS.includes(permission))) {
        return res.status(400).json({ message: 'One or more permissions are invalid.' });
      }
      user.permissions = req.body.permissions;
    }
    if (req.body?.password !== undefined) {
      if (!validPassword(req.body.password)) return res.status(400).json({ message: 'HR password must be between 12 and 256 characters.' });
      user.password_hash = await hashPassword(req.body.password);
      await Session.deleteMany({ user_id: user._id });
    }
    await user.save();
    return res.json({
      hr_user: { username: user.username, name: user.name, email: user.email, active: user.active, permissions: user.permissions, last_login_at: user.last_login_at, last_active_at: user.last_active_at },
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That username is already assigned to another account.' });
    return next(error);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) return databaseUnavailable(res);
    const company = await Company.findOne({ company_id: req.params.companyId });
    if (!company) return res.status(404).json({ message: 'Company account not found.' });
    if (company.status === 'deleted') return res.status(409).json({ message: 'Company account is already deleted.' });

    const users = await User.find({ role: 'hr', company_id: company.company_id }).select('_id');
    const userIds = users.map((user) => user._id);
    await Session.deleteMany({ user_id: { $in: userIds } });
    await User.deleteMany({ _id: { $in: userIds } });
    company.status = 'deleted';
    company.updated_at = new Date();
    await company.save();
    return res.json({ company_id: company.company_id, deleted: true, data_retained: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCompany,
  deleteCompany,
  getDashboard,
  getSettings,
  listCompanies,
  updateCompany,
  updateHrUser,
  updateSettings,
};
