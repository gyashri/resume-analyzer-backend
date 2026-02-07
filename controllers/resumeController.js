const Resume = require('../models/Resume');
const { parseResume } = require('../utils/fileParser');
const { analyzeResume } = require('../utils/aiAnalyzer');
const fs = require('fs').promises;

/**
 * WHAT THIS IS:
 * Resume Controller - Handles all resume-related operations
 *
 * MAIN FEATURES:
 * - Upload and parse resume files
 * - Analyze using AI
 * - Retrieve user's resume history
 * - Get detailed analysis results
 */

/**
 * @route   POST /api/resumes/upload
 * @desc    Upload and analyze resume
 * @access  Private
 *
 * HOW IT WORKS:
 * 1. Multer middleware saves file to uploads/
 * 2. Parse file to extract text
 * 3. Send to OpenAI for analysis
 * 4. Save results to database
 * 5. Delete temporary file
 *
 * FLOW:
 * Client Upload → Multer → Parse → AI Analysis → Database → Response
 */
const uploadResume = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a resume file',
      });
    }

    const { jobDescription } = req.body; // Optional job description from frontend

    // Step 1: Parse the uploaded file
    console.log(`📄 Parsing file: ${req.file.originalname}`);
    const extractedText = await parseResume(req.file.path);

    // Step 2: Create initial resume record (status: processing)
    const resume = await Resume.create({
      user: req.user._id,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      extractedText,
      jobDescription: jobDescription || '',
      status: 'processing',
    });

    // Step 3: Analyze with AI
    console.log(`🤖 Sending to AI for analysis...`);
    try {
      const analysis = await analyzeResume(extractedText, jobDescription);

      // Step 4: Update resume with analysis results
      resume.analysis = analysis;
      resume.status = 'completed';
      await resume.save();

      console.log(`✅ Analysis complete. Score: ${analysis.matchScore}%`);
    } catch (aiError) {
      // If AI analysis fails, mark as failed but keep the resume record
      resume.status = 'failed';
      await resume.save();

      return res.status(500).json({
        success: false,
        message: 'AI analysis failed. Please try again.',
        error: aiError.message,
      });
    }

    // Step 5: Clean up uploaded file (no longer needed)
    try {
      await fs.unlink(req.file.path);
    } catch (unlinkError) {
      console.warn('Could not delete temporary file:', unlinkError.message);
    }

    // Step 6: Return response
    res.status(201).json({
      success: true,
      message: 'Resume analyzed successfully',
      data: resume,
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Clean up file if it exists
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.warn('Could not delete file after error:', unlinkError.message);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error processing resume',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/resumes
 * @desc    Get all resumes for logged-in user
 * @access  Private
 *
 * WHY:
 * - Shows user's resume history
 * - Displays all previous analyses
 * - Used for dashboard visualization
 */
const getMyResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // Most recent first
      .select('-extractedText'); // Don't send full text (can be large)

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching resumes',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/resumes/:id
 * @desc    Get single resume with full details
 * @access  Private
 *
 * WHY:
 * - View detailed analysis
 * - Show comparison view (resume vs job description)
 * - Display actionable tips
 */
const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Ensure user owns this resume (security check)
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume',
      });
    }

    res.status(200).json({
      success: true,
      data: resume,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching resume',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete a resume
 * @access  Private
 *
 * WHY:
 * - Users may want to remove old analyses
 * - Privacy: delete sensitive data
 */
const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found',
      });
    }

    // Ensure user owns this resume
    if (resume.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resume',
      });
    }

    await resume.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting resume',
      error: error.message,
    });
  }
};

module.exports = {
  uploadResume,
  getMyResumes,
  getResumeById,
  deleteResume,
};
