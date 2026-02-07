const mongoose = require('mongoose');

/**
 * WHAT THIS DOES:
 * Establishes a connection to MongoDB using Mongoose (MongoDB Object Data Modeling library)
 *
 * WHY WE NEED IT:
 * - Connects our Express server to MongoDB database
 * - Handles connection errors gracefully
 * - Uses async/await for better error handling
 *
 * HOW IT WORKS:
 * 1. Reads MONGO_URI from environment variables (.env file)
 * 2. Attempts to connect using mongoose.connect()
 * 3. Logs success or failure messages
 */
const connectDB = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    // Exit process with failure code if connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
