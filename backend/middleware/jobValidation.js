const validateJobPayload = (req, res, next) => {
  const { title, description, required_skills, required_qualifications, required_experience, education_requirements, other_requirements, responsibilities } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Job title and description are required.' });
  }

  const normalizeList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  };

  req.body.required_skills = normalizeList(required_skills);
  req.body.required_qualifications = normalizeList(required_qualifications);
  req.body.education_requirements = normalizeList(education_requirements);
  req.body.other_requirements = normalizeList(other_requirements);
  req.body.required_experience = String(required_experience || '').trim();
  req.body.responsibilities = String(responsibilities || '').trim();
  req.body.rubric = req.body.rubric || {};
  req.body.rubric.must_have = req.body.rubric.must_have || req.body.required_skills;
  req.body.rubric.nice_to_have = req.body.rubric.nice_to_have || [];
  req.body.rubric.weights = req.body.rubric.weights || {
    skills: 40,
    experience: 30,
    education: 15,
    communication: 15,
  };

  next();
};

module.exports = { validateJobPayload };