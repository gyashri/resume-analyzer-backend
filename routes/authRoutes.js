const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

/**
 * WHAT THIS IS:
 * Authentication Routes - Defines API endpoints for user authentication
 *
 * WHY SEPARATE ROUTE FILES:
 * - Modular structure (easier to maintain)
 * - Clear separation of concerns
 * - Easy to apply route-specific middleware
 *
 * ROUTES DEFINED:
 * POST   /api/auth/register - Create new account
 * POST   /api/auth/login    - Login to account
 * POST   /api/auth/logout   - Logout (clear cookie)
 * GET    /api/auth/me       - Get current user info
 */

const router = express.Router();

/**
 * PUBLIC ROUTES (No authentication required)
 * - Register and Login have strict rate limiting to prevent brute-force (DISABLED for development)
 */
router.post('/register', register); // authLimiter disabled for development
router.post('/login', login); // authLimiter disabled for development

/**
 * PROTECTED ROUTES (Authentication required)
 * - protect middleware verifies JWT token
 * - Only logged-in users can access these routes
 */
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
