const mongoose = require('mongoose');

/**
 * WHAT THIS IS:
 * Resume Schema - Stores uploaded resumes and their AI analysis results
 *
 * WHY WE NEED IT:
 * - Tracks user's resume upload history
 * - Stores AI analysis results for comparison view
 * - Links to job matching data
 *
 * KEY FIELDS:
 * - originalFileName: User's uploaded file name
 * - extractedText: Parsed text from PDF/DOCX
 * - analysis: AI-generated insights (score, keywords, tips)
 * - jobDescription: Optional job posting to compare against
 */
const ResumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to User model
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true, // Path where file is stored temporarily
    },
    extractedText: {
      type: String,
      required: true, // Raw text extracted from the resume
    },
    jobDescription: {
      type: String,
      default: '', // Optional: specific job to analyze against
    },
    analysis: {
      matchScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      missingKeywords: {
        hardSkills: [String], // e.g., ['Python', 'Docker', 'AWS']
        softSkills: [String], // e.g., ['Leadership', 'Communication']
        certifications: [String], // e.g., ['AWS Certified', 'PMP']
      },
      foundKeywords: {
        hardSkills: [String],
        softSkills: [String],
        certifications: [String],
      },
      actionableTips: [
        {
          category: {
            type: String,
            enum: ['formatting', 'content', 'keywords', 'impact', 'structure'],
          },
          suggestion: String,
          priority: {
            type: String,
            enum: ['high', 'medium', 'low'],
            default: 'medium',
          },
        },
      ],
      aiSummary: {
        type: String, // Overall assessment from AI
        default: '',
      },
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/**
 * INDEX: Speed up queries by user
 * - Users will frequently query their own resumes
 * - Sorting by creation date (most recent first)
 */
ResumeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', ResumeSchema);
