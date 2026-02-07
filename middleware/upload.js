const multer = require('multer');
const path = require('path');

/**
 * WHAT THIS IS:
 * Multer Configuration - Handles file upload from frontend
 *
 * WHY MULTER:
 * - Industry standard for handling multipart/form-data
 * - Efficient file storage
 * - Built-in validation
 *
 * HOW IT WORKS:
 * 1. Client sends file via POST request
 * 2. Multer intercepts and validates file
 * 3. Saves file to uploads/ directory
 * 4. Adds file info to req.file
 */

/**
 * STORAGE CONFIGURATION
 *
 * WHAT IT DOES:
 * - destination: Where to save uploaded files
 * - filename: How to name the file
 *
 * NAMING STRATEGY:
 * - userId + timestamp + original extension
 * - Example: 64abc123_1234567890_resume.pdf
 * - Prevents name collisions
 * - Easy to trace ownership
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save to uploads directory
  },
  filename: (req, file, cb) => {
    // Create unique filename: userId_timestamp_originalname
    const uniqueName = `${req.user._id}_${Date.now()}${path.extname(
      file.originalname
    )}`;
    cb(null, uniqueName);
  },
});

/**
 * FILE FILTER
 *
 * WHAT IT DOES:
 * - Validates file type before upload
 * - Only allows PDF and DOCX files
 *
 * WHY:
 * - Security: Prevents malicious file uploads
 * - Consistency: Only formats we can parse
 */
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const allowedExtensions = ['.pdf', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true); // Accept file
  } else {
    cb(
      new Error('Invalid file type. Only PDF and DOCX files are allowed.'),
      false
    );
  }
};

/**
 * MULTER CONFIGURATION
 *
 * OPTIONS:
 * - storage: Custom storage configuration
 * - fileFilter: Validation function
 * - limits: File size limit (5MB)
 *
 * WHY 5MB LIMIT:
 * - Resumes are typically 100-500KB
 * - 5MB allows for detailed resumes with some images
 * - Prevents server overload from huge files
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

module.exports = upload;
