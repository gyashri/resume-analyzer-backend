const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * WHAT THIS IS:
 * Authentication Middleware - Protects routes that require login
 *
 * WHY WE NEED IT:
 * - Ensures only authenticated users can access protected routes
 * - Extracts user info from JWT token
 * - Prevents unauthorized access to sensitive operations
 *
 * HOW IT WORKS:
 * 1. Reads JWT token from HTTP-only cookie
 * 2. Verifies token signature using JWT_SECRET
 * 3. Finds user in database
 * 4. Attaches user object to request for use in route handlers
 *
 * USAGE:
 * app.get('/api/protected', protect, (req, res) => {
 *   // req.user is now available
 * });
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token exists in cookies
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found, user is not authenticated
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please log in.',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID from token payload
      // select('-password') ensures password is not included
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found. Token may be invalid.',
        });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or has expired.',
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
};

/**
 * WHAT THIS IS:
 * Role Authorization Middleware - Restricts access based on user role
 *
 * WHY WE NEED IT:
 * - Implements Role-Based Access Control (RBAC)
 * - Ensures only admins can access admin-only routes
 * - Protects sensitive operations like user management
 *
 * HOW IT WORKS:
 * 1. Must be used AFTER protect middleware (requires req.user)
 * 2. Checks if user's role matches allowed roles
 * 3. Blocks access if role doesn't match
 *
 * USAGE:
 * app.delete('/api/users/:id', protect, authorize('admin'), deleteUser);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user's role is in the allowed roles array
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
