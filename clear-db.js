// Simple script to clear the database
const mongoose = require('mongoose');
require('dotenv').config();

const clearDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    await mongoose.connection.db.collection('users').deleteMany({});
    await mongoose.connection.db.collection('resumes').deleteMany({});

    console.log('🗑️  Database cleared successfully!');
    console.log('You can now register with any email.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

clearDatabase();
