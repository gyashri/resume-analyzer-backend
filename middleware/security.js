const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

/**
 * WHAT THIS IS:
 * Security Configuration - Implements multiple layers of security
 *
 * WHY WE NEED IT:
 * - Protects against common web vulnerabilities (XSS, CSRF, etc.)
 * - Controls which origins can access the API
 * - Prevents brute-force attacks through rate limiting
 *
 * SECURITY LAYERS:
 * 1. Helmet: Sets secure HTTP headers
 * 2. CORS: Controls cross-origin requests
 * 3. Rate Limiting: Prevents API abuse
 */

/**
 * HELMET CONFIGURATION
 *
 * WHAT IT DOES:
 * Sets various HTTP headers to protect against common attacks
 *
 * KEY PROTECTIONS:
 * - Content Security Policy (CSP): Prevents XSS attacks
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Strict-Transport-Security: Enforces HTTPS
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding from same origin
});

/**
 * CORS CONFIGURATION
 *
 * WHAT IT DOES:
 * Controls which domains can access your API
 *
 * WHY:
 * - Prevents unauthorized websites from making requests to your API
 * - Allows your React frontend to communicate with backend
 * - Enables cookies to be sent with cross-origin requests
 *
 * HOW IT WORKS:
 * - origin: Whitelisted domains (your frontend URL)
 * - credentials: true = allows cookies to be sent
 */
const corsConfig = cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true, // Allow cookies to be sent with requests
  optionsSuccessStatus: 200,
});

/**
 * RATE LIMITING CONFIGURATION
 *
 * WHAT IT DOES:
 * Limits the number of requests from a single IP address
 *
 * WHY:
 * - Prevents brute-force attacks on login endpoints
 * - Protects against DoS attacks
 * - Reduces server load from abusive clients
 *
 * HOW IT WORKS:
 * - windowMs: Time window (15 minutes)
 * - max: Maximum requests per window
 * - If limit exceeded, returns 429 Too Many Requests
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

/**
 * STRICT RATE LIMITER FOR AUTH ROUTES
 *
 * WHY STRICTER:
 * - Login/Register endpoints are common targets for attacks
 * - Brute-force password attempts
 * - Account enumeration attempts
 *
 * LIMITS:
 * - 50 attempts per 15 minutes (relaxed for development)
 * - In production, reduce to 5-10 for security
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs for auth routes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});

module.exports = {
  helmetConfig,
  corsConfig,
  generalLimiter,
  authLimiter,
};
