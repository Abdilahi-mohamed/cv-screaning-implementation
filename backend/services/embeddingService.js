const normalize = (text = '') =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const computeTextSimilarity = (textA, textB) => {
  const wordsA = new Set(normalize(textA));
  const wordsB = new Set(normalize(textB));
  const combined = new Set([...wordsA, ...wordsB]);

  if (!combined.size) return 0;

  let common = 0;
  for (const word of combined) {
    if (wordsA.has(word) && wordsB.has(word)) common += 1;
  }

  return Number((common / combined.size).toFixed(4));
};

const computeJobSimilarity = (cvText, jobDescription, rubric = {}) => {
  const jobText = [jobDescription, ...(rubric.must_have || []), ...(rubric.nice_to_have || [])].join(' ');
  const score = computeTextSimilarity(cvText, jobText);
  return score;
};

module.exports = {
  computeTextSimilarity,
  computeJobSimilarity,
};
