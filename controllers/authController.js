const User = require('../models/User');

/**
 * WHAT THIS IS:
 * Authentication Controller - Handles user registration, login, and logout
 *
 * WHY SEPARATE CONTROLLERS:
 * - Keeps route files clean and focused on routing
 * - Centralizes business logic for reusability
 * - Makes testing easier
 *
 * PATTERN USED:
 * Each function follows async/await with try-catch for error handling
 */

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 *
 * HOW IT WORKS:
 * 1. Receives name, email, password from request body
 * 2. Checks if user already exists (prevent duplicates)
 * 3. Creates new user (password auto-hashed by User model pre-save hook)
 * 4. Generates JWT token
 * 5. Sends token in HTTP-only cookie (prevents XSS attacks)
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Create user (password will be hashed by pre-save middleware)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user', // Default to 'user' role
    });

    // Generate JWT token
    const token = user.generateAuthToken();

    // Send token in HTTP-only cookie
    sendTokenResponse(user, token, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 *
 * HOW IT WORKS:
 * 1. Receives email and password
 * 2. Finds user by email (with password field included)
 * 3. Compares entered password with hashed password
 * 4. If match, generates JWT and sends in cookie
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user by email and include password field
    // (password is excluded by default due to select: false in schema)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token and send response
    const token = user.generateAuthToken();
    sendTokenResponse(user, token, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (clear cookie)
 * @access  Private
 *
 * HOW IT WORKS:
 * - Clears the JWT cookie by setting it to 'none' with immediate expiry
 * - Client-side also typically clears any stored tokens
 */
const logout = async (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 1 * 1000), // Expire in 1 second
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 *
 * WHY WE NEED THIS:
 * - Frontend can check if user is still authenticated
 * - Retrieve current user's profile information
 * - req.user is set by protect middleware
 */
const getMe = async (req, res) => {
  try {
    // req.user is already populated by protect middleware
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
    });
  }
};

/**
 * HELPER FUNCTION: Send Token Response
 *
 * WHAT IT DOES:
 * - Creates HTTP-only cookie with JWT token
 * - Returns user data (without password)
 *
 * WHY HTTP-ONLY COOKIES:
 * - Cannot be accessed by JavaScript (prevents XSS attacks)
 * - Automatically sent with every request
 * - More secure than localStorage
 *
 * COOKIE OPTIONS:
 * - expires: When cookie expires
 * - httpOnly: Prevents client-side JS access
 * - secure: Only send over HTTPS (in production)
 * - sameSite: CSRF protection
 */
const sendTokenResponse = (user, token, statusCode, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true, // Accessible only by web server
    secure: isProduction, // HTTPS only in production
    sameSite: isProduction ? 'none' : 'strict', // 'none' needed for cross-domain in production
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token, // Also send in response body for mobile apps
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
