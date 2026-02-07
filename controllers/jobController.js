const Resume = require('../models/Resume');
const { matchJobsWithResume } = require('../services/jobService');

/**
 * WHAT THIS IS:
 * Job Controller - Handles job matching and recommendations
 *
 * WHY WE NEED IT:
 * - Match jobs with user's latest resume
 * - Provide job recommendations
 * - Track user's job applications
 *
 * HOW IT WORKS:
 * 1. Get user's latest resume
 * 2. Extract skills and qualifications
 * 3. Fetch matching jobs from external API
 * 4. Calculate match scores
 * 5. Return ranked job listings
 */

/**
 * @route   GET /api/jobs/match
 * @desc    Get matched jobs based on user's latest resume
 * @access  Private
 *
 * QUERY PARAMETERS:
 * - location: Job location (default: 'us')
 * - page: Page number for pagination (default: 1)
 *
 * RESPONSE:
 * - Array of matched jobs with scores
 * - Each job includes: title, company, match score, matched skills
 */
const getMatchedJobs = async (req, res) => {
  try {
    const { location, page } = req.query;

    // Get user's most recent resume
    const latestResume = await Resume.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!latestResume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found. Please upload a resume first.',
      });
    }

    // Check if resume has been analyzed
    if (!latestResume.analysis || !latestResume.analysis.foundKeywords) {
      return res.status(400).json({
        success: false,
        message: 'Resume analysis not complete. Please wait for analysis to finish.',
      });
    }

    // Match jobs with resume
    const matchedJobs = await matchJobsWithResume(latestResume, {
      location: location || 'us',
      page: parseInt(page) || 1,
    });

    res.status(200).json({
      success: true,
      count: matchedJobs.length,
      data: matchedJobs,
      resumeUsed: {
        id: latestResume._id,
        fileName: latestResume.originalFileName,
        uploadDate: latestResume.createdAt,
      },
    });
  } catch (error) {
    console.error('Error getting matched jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job matches',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/jobs/match/:resumeId
 * @desc    Get matched jobs for a specific resume
 * @access  Private
 *
 * USE CASE:
 * - User wants to see job matches for an older resume
 * - Compare job matches across different resume versions
 */
const getMatchedJobsForResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const { location, page } = req.query;

    // Get specific resume
    const resume = await Resume.findById(resumeId);

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
        message: 'Not authorized to access this resume',
      });
    }

    // Check if resume has been analyzed
    if (!resume.analysis || !resume.analysis.foundKeywords) {
      return res.status(400).json({
        success: false,
        message: 'Resume analysis not complete.',
      });
    }

    // Match jobs with resume
    const matchedJobs = await matchJobsWithResume(resume, {
      location: location || 'us',
      page: parseInt(page) || 1,
    });

    res.status(200).json({
      success: true,
      count: matchedJobs.length,
      data: matchedJobs,
      resumeUsed: {
        id: resume._id,
        fileName: resume.originalFileName,
        uploadDate: resume.createdAt,
      },
    });
  } catch (error) {
    console.error('Error getting matched jobs for resume:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job matches',
      error: error.message,
    });
  }
};

module.exports = {
  getMatchedJobs,
  getMatchedJobsForResume,
};
