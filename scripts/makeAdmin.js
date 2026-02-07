/**
 * Script to promote a user to admin
 *
 * Usage: node scripts/makeAdmin.js <email>
 * Example: node scripts/makeAdmin.js user@example.com
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');

const makeAdmin = async () => {
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: node scripts/makeAdmin.js <email>');
    console.log('Example: node scripts/makeAdmin.js user@example.com');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User with email "${email}" not found.`);
      const allUsers = await User.find().select('name email role');
      console.log('\nAvailable users:');
      allUsers.forEach((u) => console.log(`  - ${u.email} (${u.name}) [${u.role}]`));
      process.exit(1);
    }

    if (user.role === 'admin') {
      console.log(`"${user.name}" is already an admin.`);
      process.exit(0);
    }

    user.role = 'admin';
    await user.save();

    console.log(`"${user.name}" (${user.email}) has been promoted to admin!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

makeAdmin();
