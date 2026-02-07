const express = require('express');
const {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

/**
 * WHAT THIS IS:
 * Resume Routes - API endpoints for resume operations
 *
 * ALL ROUTES ARE PROTECTED:
 * - User must be logged in
 * - JWT token verified by protect middleware
 *
 * ROUTES:
 * POST   /api/resumes/upload - Upload & analyze resume
 * GET    /api/resumes        - Get all user's resumes
 * GET    /api/resumes/:id    - Get specific resume details
 * DELETE /api/resumes/:id    - Delete a resume
 */

const router = express.Router();

/**
 * Upload route with file handling
 *
 * MIDDLEWARE CHAIN:
 * 1. protect - Verify JWT token
 * 2. upload.single('resume') - Handle file upload (expects field name 'resume')
 * 3. uploadResume - Controller function
 *
 * FRONTEND USAGE:
 * const formData = new FormData();
 * formData.append('resume', fileInput.files[0]);
 * formData.append('jobDescription', 'Optional job posting text');
 * fetch('/api/resumes/upload', { method: 'POST', body: formData });
 */
router.post('/upload', protect, upload.single('resume'), uploadResume);

// Get all resumes for logged-in user
router.get('/', protect, getMyResumes);

// Get specific resume by ID
router.get('/:id', protect, getResumeById);

// Delete resume
router.delete('/:id', protect, deleteResume);

module.exports = router;
