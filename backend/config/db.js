const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cvevolution';

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    console.log('Continuing without MongoDB for local fallback mode.');
    return;
  }

  const conversations = mongoose.connection.collection('recruitmentconversations');
  const existingIndexes = await conversations.indexes().catch((error) => {
    if (error.code === 26 || error.codeName === 'NamespaceNotFound') return [];
    throw error;
  });
  const legacyUniqueIndex = existingIndexes.find((index) =>
    index.unique
    && index.key?.job_id === 1
    && index.key?.candidate_id === 1
    && Object.keys(index.key).length === 2);
  if (legacyUniqueIndex) await conversations.dropIndex(legacyUniqueIndex.name);
  console.log('MongoDB connected successfully');
};

module.exports = connectDB;
