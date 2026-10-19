const mongoose = require('mongoose');
const CV = require('../models/CV');
const Feedback = require('../models/Feedback');
const { getStore } = require('../data/store');
const { generateId } = require('../utils/helpers');

const useMemory = () => mongoose.connection.readyState !== 1;

const saveFeedback = async (req, res) => {
  try {
    const { cv_id, job_id, decision, notes } = req.body;

    if (!cv_id || !job_id || !decision) {
      return res.status(400).json({ message: 'cv_id, job_id and decision are required.' });
    }

    let cv = null;
    if (useMemory()) {
      cv = getStore().cvs.find((item) => item.cv_id === cv_id && item.job_id === job_id);
    } else {
      cv = await CV.findOne({ cv_id, job_id });
    }

    if (!cv) {
      return res.status(404).json({ message: 'CV not found.' });
    }

    const feedbackId = generateId('fb');
    const payload = {
      feedback_id: feedbackId,
      cv_id,
      job_id,
      manager_decision: decision,
      manager_notes: notes || '',
      manager_id: 'manager_001',
      decision_date: new Date().toISOString(),
    };

    if (useMemory()) {
      getStore().feedbacks.unshift(payload);
      const target = getStore().cvs.find((item) => item.cv_id === cv_id);
      if (target) target.status = decision === 'shortlist' ? 'shortlisted' : 'rejected';
      return res.status(201).json({ status: 'saved', decision });
    }

    await Feedback.create(payload);
    cv.status = decision === 'shortlist' ? 'shortlisted' : 'rejected';
    await cv.save();

    return res.status(201).json({ status: 'saved', decision });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unable to save feedback.' });
  }
};

module.exports = { saveFeedback };
