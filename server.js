const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const {
  helmetConfig,
  corsConfig,
  generalLimiter,
} = require('./middleware/security');

/**
 * ========================================
 * AI RESUME ANALYZER - BACKEND SERVER
 * ========================================
 *
 * WHAT THIS APPLICATION DOES:
 * - Accepts resume uploads (PDF/DOCX)
 * - Parses and extracts text
 * - Analyzes using OpenAI GPT
 * - Provides match scores and actionable tips
 * - Recommends jobs based on missing skills
 *
 * TECH STACK:
 * - Express.js: Web framework
 * - MongoDB: Database
 * - JWT: Authentication
 * - OpenAI: AI analysis
 * - Multer: File uploads
 *
 * SECURITY FEATURES:
 * - HTTP-only cookies (prevents XSS)
 * - Helmet (secure headers)
 * - CORS (origin control)
 * - Rate limiting (prevents abuse)
 * - Password hashing (bcrypt)
 * - Role-based access control
 */

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// ========================================
// MIDDLEWARE SETUP
// ========================================

/**
 * SECURITY MIDDLEWARE
 * - Helmet: Sets secure HTTP headers
 * - CORS: Controls cross-origin requests
 * - Rate Limiting: Prevents API abuse (DISABLED for development)
 */
app.use(helmetConfig);
app.use(corsConfig);
if (process.env.NODE_ENV === 'production') {
  app.use(generalLimiter);
}

/**
 * BODY PARSING MIDDLEWARE
 * - express.json(): Parses JSON request bodies
 * - express.urlencoded(): Parses URL-encoded form data
 * - cookieParser(): Parses cookies from requests
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ========================================
// ROUTES
// ========================================

/**
 * Import route handlers
 */
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');

/**
 * Mount routes
 *
 * BASE PATHS:
 * - /api/auth - Authentication (register, login, logout)
 * - /api/resumes - Resume operations (upload, analyze, history)
 * - /api/jobs - Job matching and recommendations
 */
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);

// Temporary one-time admin promotion endpoint (remove after use)
app.post('/api/promote-admin', async (req, res) => {
  const { email, secret } = req.body;
  if (secret !== process.env.JWT_SECRET) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  const User = require('./models/User');
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.role = 'admin';
  await user.save();
  res.json({ success: true, message: `${user.name} (${user.email}) promoted to admin` });
});

/**
 * ROOT ROUTE
 * Health check endpoint
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AI Resume Analyzer API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      resumes: '/api/resumes',
    },
  });
});

/**
 * 404 HANDLER
 * Catches all undefined routes
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/**
 * GLOBAL ERROR HANDLER
 * Catches any errors that weren't handled in controllers
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 5MB.',
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ========================================
// DATABASE CONNECTION & SERVER START
// ========================================

const PORT = process.env.PORT || 5000;

/**
 * Start server
 *
 * FLOW:
 * 1. Connect to MongoDB
 * 2. If successful, start Express server
 * 3. Listen on specified port
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════╗
║                                                    ║
║    🚀 AI RESUME ANALYZER SERVER RUNNING           ║
║                                                    ║
║    📡 Port: ${PORT}                                    ║
║    🌍 Environment: ${process.env.NODE_ENV}                 ║
║    📊 Database: Connected                          ║
║                                                    ║
║    📍 API Endpoints:                               ║
║       - http://localhost:${PORT}/api/auth           ║
║       - http://localhost:${PORT}/api/resumes        ║
║       - http://localhost:${PORT}/api/jobs           ║
║                                                    ║
╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

/**
 * GRACEFUL SHUTDOWN
 * Handle server termination signals
 */
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
