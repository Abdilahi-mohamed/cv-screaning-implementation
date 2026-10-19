const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  job_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  responsibilities: { type: String, default: '' },
  image_url: { type: String, default: '' },
  company_name: { type: String, default: '' },
  brand_color: { type: String, default: '#2563eb' },
  brand_logo_url: { type: String, default: '' },
  application_fields: { type: [mongoose.Schema.Types.Mixed], default: [] },
  required_skills: { type: [String], default: [] },
  required_qualifications: { type: [String], default: [] },
  required_experience: { type: String, default: '' },
  education_requirements: { type: [String], default: [] },
  other_requirements: { type: [String], default: [] },
  application_link: { type: String, default: '' },
  rubric: {
    must_have: { type: [String], default: [] },
    nice_to_have: { type: [String], default: [] },
    weights: {
      skills: { type: Number, default: 40 },
      experience: { type: Number, default: 30 },
      education: { type: Number, default: 15 },
      communication: { type: Number, default: 15 },
    },
  },
  status: { type: String, default: 'active' },
  created_at: { type: Date, default: Date.now },
  created_by: { type: String, default: 'manager_001' },
});

module.exports = mongoose.models.Job || mongoose.model('Job', jobSchema);
