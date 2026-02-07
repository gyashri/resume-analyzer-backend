const mongoose = require('mongoose');

/**
 * WHAT THIS IS:
 * JobMatch Schema - Stores job recommendations based on resume analysis
 *
 * WHY WE NEED IT:
 * - Links resume analysis to actual job listings
 * - Tracks which jobs were recommended for which resume
 * - Stores job details from external APIs (Adzuna, Jooble, etc.)
 *
 * HOW IT'S USED:
 * After analyzing a resume, we query job APIs using missing keywords
 * and store relevant matches here for the user to view
 */
const JobMatchSchema = new mongoose.Schema(
  {
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume', // Links to specific resume analysis
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Job Details from External API
    jobTitle: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: 'Remote',
    },
    description: {
      type: String,
      default: '',
    },
    salary: {
      min: Number,
      max: Number,
      currency: {
        type: String,
        default: 'USD',
      },
    },
    url: {
      type: String, // Direct link to job posting
      required: true,
    },
    source: {
      type: String, // Which API: 'adzuna', 'jooble', etc.
      default: 'adzuna',
    },
    // Matching Metadata
    matchPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0, // How well this job matches the resume
    },
    matchedKeywords: [String], // Keywords that led to this match
    // User Interaction
    status: {
      type: String,
      enum: ['new', 'viewed', 'applied', 'saved', 'rejected'],
      default: 'new',
    },
  },
  {
    timestamps: true,
  }
);

/**
 * INDEXES: For efficient querying
 * - Users will filter by resume and status
 * - Sort by match percentage (best matches first)
 */
JobMatchSchema.index({ user: 1, resume: 1 });
JobMatchSchema.index({ matchPercentage: -1 });

module.exports = mongoose.model('JobMatch', JobMatchSchema);
