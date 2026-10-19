const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Job = require('../models/Job');
const { generateId } = require('../utils/helpers');
const { getStore } = require('../data/store');

const useMemory = () => mongoose.connection.readyState !== 1;

const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      responsibilities,
      required_skills,
      required_qualifications,
      required_experience,
      education_requirements,
      other_requirements,
      rubric,
      company_name,
      brand_color,
      application_fields,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Job title and description are required.' });
    }

    const safeRubric = {
      must_have: Array.isArray(rubric?.must_have) ? rubric.must_have : required_skills || [],
      nice_to_have: Array.isArray(rubric?.nice_to_have) ? rubric.nice_to_have : [],
      weights: {
        skills: Number(rubric?.weights?.skills ?? 40),
        experience: Number(rubric?.weights?.experience ?? 30),
        education: Number(rubric?.weights?.education ?? 15),
        communication: Number(rubric?.weights?.communication ?? 15),
      },
    };

    const jobId = generateId('job');
    const applicationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/apply/${jobId}`;

    const jobRecord = {
      job_id: jobId,
      title,
      description,
      responsibilities: responsibilities || '',
      company_name: company_name || '',
      brand_color: /^#[0-9a-f]{6}$/i.test(brand_color) ? brand_color : '#2563eb',
      application_fields: Array.isArray(application_fields) ? application_fields : [],
      required_skills: required_skills || [],
      required_qualifications: required_qualifications || [],
      required_experience: required_experience || '',
      education_requirements: education_requirements || [],
      other_requirements: other_requirements || [],
      application_link: applicationLink,
      rubric: safeRubric,
      status: 'active',
      created_at: new Date().toISOString(),
      created_by: 'manager_001',
    };

    if (useMemory()) {
      getStore().jobs.unshift(jobRecord);
      return res.status(201).json({ job_id: jobRecord.job_id, status: 'created', application_link: applicationLink, job: jobRecord });
    }

    const job = await Job.create({
      ...jobRecord,
      rubric: safeRubric,
    });

    return res.status(201).json({ job_id: job.job_id, status: 'created', application_link: job.application_link, job });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to create job.' });
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const job = useMemory()
      ? getStore().jobs.find((item) => item.job_id === id)
      : await Job.findOne({ job_id: id });
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    const {
      title,
      description,
      responsibilities,
      required_skills,
      required_qualifications,
      required_experience,
      education_requirements,
      other_requirements,
      rubric,
      company_name,
      brand_color,
      application_fields,
    } = req.body;

    Object.assign(job, {
      title,
      description,
      responsibilities: responsibilities || '',
      required_skills: required_skills || [],
      required_qualifications: required_qualifications || [],
      required_experience: required_experience || '',
      education_requirements: education_requirements || [],
      other_requirements: other_requirements || [],
      rubric: rubric || job.rubric,
      company_name: company_name || '',
      brand_color: /^#[0-9a-f]{6}$/i.test(brand_color) ? brand_color : '#2563eb',
      application_fields: Array.isArray(application_fields) ? application_fields : [],
    });

    if (!useMemory()) await job.save();
    return res.json({ job_id: job.job_id, status: 'updated', job });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to update job.' });
  }
};

const getJobs = async (req, res) => {
  try {
    if (useMemory()) {
      return res.json(getStore().jobs.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    }

    const jobs = await Job.find().sort({ created_at: -1 });
    return res.json(jobs);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch jobs.' });
  }
};

const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = useMemory() ? getStore().jobs.find((item) => item.job_id === id) : await Job.findOne({ job_id: id });

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    return res.json(job);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to fetch job.' });
  }
};

const updateJobImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please select an image to upload.' });
    const job = useMemory()
      ? getStore().jobs.find((item) => item.job_id === req.params.id)
      : await Job.findOne({ job_id: req.params.id });
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    const extension = path.extname(req.file.originalname || '').toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension)) {
      return res.status(400).json({ message: 'Please upload a JPEG, PNG, WebP, or GIF image.' });
    }
    const fileName = `${crypto.randomUUID()}${extension}`;
    const uploadDirectory = path.join(__dirname, '..', 'uploads');
    await fs.promises.mkdir(uploadDirectory, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDirectory, fileName), req.file.buffer);
    const imageUrl = `/uploads/${fileName}`;

    if (useMemory()) {
      job.image_url = imageUrl;
    } else {
      job.image_url = imageUrl;
      await job.save();
    }
    return res.json({ job_id: job.job_id, image_url: imageUrl });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to save job image.' });
  }
};

const updateBrandLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please select a logo to upload.' });
    const job = useMemory()
      ? getStore().jobs.find((item) => item.job_id === req.params.id)
      : await Job.findOne({ job_id: req.params.id });
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    const extension = path.extname(req.file.originalname || '').toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension)) {
      return res.status(400).json({ message: 'Please upload a JPEG, PNG, WebP, or GIF logo.' });
    }
    const fileName = `${crypto.randomUUID()}${extension}`;
    const uploadDirectory = path.join(__dirname, '..', 'uploads');
    await fs.promises.mkdir(uploadDirectory, { recursive: true });
    await fs.promises.writeFile(path.join(uploadDirectory, fileName), req.file.buffer);
    job.brand_logo_url = `/uploads/${fileName}`;
    if (!useMemory()) await job.save();
    return res.json({ job_id: job.job_id, brand_logo_url: job.brand_logo_url });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to save company logo.' });
  }
};

module.exports = { createJob, updateJob, getJobs, getJobById, updateJobImage, updateBrandLogo };
