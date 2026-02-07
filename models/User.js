const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * WHAT THIS IS:
 * User Schema - Defines the structure of user documents in MongoDB
 *
 * WHY WE NEED IT:
 * - Stores user account information securely
 * - Implements Role-Based Access Control (RBAC) with user/admin roles
 * - Handles password hashing and JWT token generation
 *
 * KEY FEATURES:
 * 1. Password is hashed before saving (never store plain text passwords!)
 * 2. JWT tokens for stateless authentication
 * 3. Password comparison method for login
 * 4. Timestamps for created/updated tracking
 */
const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

/**
 * MIDDLEWARE: Hash password before saving
 *
 * HOW IT WORKS:
 * - Runs before .save() or .create() operations
 * - Only hashes if password is new or modified
 * - Uses bcrypt with 10 salt rounds (good balance of security vs performance)
 *
 * NOTE: With Mongoose 9.x, async middleware doesn't need next() callback
 * - Promise resolution is handled automatically
 * - Simply return or throw errors
 */
UserSchema.pre('save', async function () {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return;
  }

  // Generate salt and hash password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * METHOD: Generate JWT Token
 *
 * WHAT IT DOES:
 * Creates a signed JSON Web Token containing user ID
 *
 * WHY:
 * - Stateless authentication (no session storage needed)
 * - Token can be verified without database lookup
 * - Contains expiration time for security
 */
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role }, // Payload
    process.env.JWT_SECRET, // Secret key
    { expiresIn: process.env.JWT_EXPIRE } // Expiration
  );
};

/**
 * METHOD: Compare entered password with hashed password
 *
 * WHAT IT DOES:
 * Safely compares plain text password with stored hash
 *
 * USAGE:
 * const isMatch = await user.comparePassword('userEnteredPassword');
 */
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
