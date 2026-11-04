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

  const users = mongoose.connection.collection('users');
  const userIndexes = await users.indexes().catch((error) => {
    if (error.code === 26 || error.codeName === 'NamespaceNotFound') return [];
    throw error;
  });
  const singleOwnerIndex = userIndexes.find((index) =>
    index.unique
    && index.key?.role === 1
    && index.partialFilterExpression?.role === 'owner');
  if (singleOwnerIndex) await users.dropIndex(singleOwnerIndex.name);
  if (!(await users.countDocuments({ role: 'owner', is_primary_owner: true }))) {
    await users.updateOne({ role: 'owner' }, { $set: { is_primary_owner: true } });
  }
  await users.createIndex(
    { is_primary_owner: 1 },
    { unique: true, partialFilterExpression: { is_primary_owner: true } },
  );

  console.log('MongoDB connected successfully');
};

module.exports = connectDB;
