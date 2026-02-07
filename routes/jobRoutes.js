const express = require('express');
const {
  getMatchedJobs,
  getMatchedJobsForResume,
} = require('../controllers/jobController');
const { protect } = require('../middleware/auth');

/**
 * WHAT THIS IS:
 * Job Routes - API endpoints for job matching
 *
 * ALL ROUTES ARE PROTECTED:
 * - User must be logged in
 * - JWT token verified by protect middleware
 *
 * ROUTES:
 * GET /api/jobs/match          - Get jobs matched to latest resume
 * GET /api/jobs/match/:resumeId - Get jobs matched to specific resume
 */

const router = express.Router();

// Get matched jobs for user's latest resume
// Query params: ?location=us&page=1
router.get('/match', protect, getMatchedJobs);

// Get matched jobs for specific resume
// Query params: ?location=us&page=1
router.get('/match/:resumeId', protect, getMatchedJobsForResume);

module.exports = router;
