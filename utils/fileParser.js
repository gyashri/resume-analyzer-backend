// pdf-parse v1.1.1 exports a direct function
const pdfParse = require('pdf-parse');

const mammoth = require('mammoth');
const fs = require('fs').promises;
const path = require('path');

/**
 * WHAT THIS IS:
 * File Parser Utility - Extracts text from PDF and DOCX files
 *
 * WHY WE NEED IT:
 * - Resumes come in different formats (PDF, DOCX)
 * - AI needs plain text to analyze
 * - Must handle both formats consistently
 *
 * HOW IT WORKS:
 * 1. Determines file type from extension
 * 2. Uses appropriate library (pdf-parse for PDF, mammoth for DOCX)
 * 3. Returns extracted text
 */

/**
 * Parse PDF file
 *
 * LIBRARY: pdf-parse
 * - Lightweight and reliable
 * - Extracts text from all pages
 * - Handles most PDF formats
 */
const parsePDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text; // Extracted text content
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

/**
 * Parse DOCX file
 *
 * LIBRARY: mammoth
 * - Converts DOCX to plain text
 * - Handles formatting gracefully
 * - Lightweight and fast
 */
const parseDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value; // Extracted text content
  } catch (error) {
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
};

/**
 * Main parser function
 *
 * WHAT IT DOES:
 * - Detects file type from extension
 * - Routes to appropriate parser
 * - Returns clean text
 *
 * SUPPORTED FORMATS:
 * - .pdf
 * - .docx
 */
const parseResume = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  let extractedText = '';

  switch (ext) {
    case '.pdf':
      extractedText = await parsePDF(filePath);
      break;
    case '.docx':
      extractedText = await parseDOCX(filePath);
      break;
    default:
      throw new Error('Unsupported file format. Only PDF and DOCX are allowed.');
  }

  // Clean up text (remove excessive whitespace)
  extractedText = extractedText.replace(/\s+/g, ' ').trim();

  if (!extractedText || extractedText.length < 50) {
    throw new Error('Could not extract meaningful text from the file.');
  }

  return extractedText;
};

module.exports = { parseResume };
