# 🏗️ System Architecture Overview

This document explains how all components work together.

## 📊 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│                   http://localhost:3000                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │ (JSON + multipart/form-data)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS SERVER (Node.js)                  │
│                    http://localhost:5000                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         SECURITY MIDDLEWARE LAYER                   │    │
│  │  • Helmet (Secure Headers)                         │    │
│  │  • CORS (Origin Control)                           │    │
│  │  • Rate Limiting (Abuse Prevention)                │    │
│  │  • Cookie Parser                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │              ROUTE HANDLERS                         │    │
│  │                                                     │    │
│  │  /api/auth/*        /api/resumes/*                 │    │
│  │  ├─ /register       ├─ /upload                     │    │
│  │  ├─ /login          ├─ GET /                       │    │
│  │  ├─ /logout         ├─ GET /:id                    │    │
│  │  └─ /me             └─ DELETE /:id                 │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │         AUTHENTICATION MIDDLEWARE                   │    │
│  │  • protect: Verify JWT token                       │    │
│  │  • authorize: Check user role                      │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │              CONTROLLERS                            │    │
│  │  • authController: Business logic for auth         │    │
│  │  • resumeController: Business logic for resumes    │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│       ┌──────────────────┼──────────────────┐              │
│       │                  │                  │              │
│       ▼                  ▼                  ▼              │
│  ┌─────────┐      ┌──────────┐       ┌─────────┐         │
│  │  File   │      │   AI     │       │  Models │         │
│  │ Parser  │      │ Analyzer │       │(MongoDB)│         │
│  │ Utility │      │ Utility  │       │         │         │
│  └─────────┘      └──────────┘       └─────────┘         │
└─────────────────────────────────────────────────────────────┘
       │                   │                    │
       ▼                   ▼                    ▼
┌───────────┐       ┌──────────┐        ┌────────────┐
│ pdf-parse │       │  Gemini  │        │  MongoDB   │
│  mammoth  │       │  AI API  │        │  Database  │
└───────────┘       └──────────┘        └────────────┘
```

## 🔄 Request Flow Examples

### 1. User Registration Flow

```
1. Client sends POST /api/auth/register
   ↓
2. Security middleware checks rate limits
   ↓
3. authController.register receives request
   ↓
4. Check if email already exists in database
   ↓
5. User model pre-save hook hashes password
   ↓
6. Save user to MongoDB
   ↓
7. Generate JWT token
   ↓
8. Set HTTP-only cookie with token
   ↓
9. Return success response with user data
```

### 2. Resume Upload & Analysis Flow

```
1. Client sends POST /api/resumes/upload
   ↓
2. Security middleware (CORS, rate limit)
   ↓
3. protect middleware verifies JWT token
   ↓
4. Multer middleware handles file upload
   │  • Validates file type (.pdf, .docx)
   │  • Checks file size (max 5MB)
   │  • Saves to uploads/ folder
   ↓
5. resumeController.uploadResume receives request
   ↓
6. fileParser utility extracts text
   │  ├─ PDF: pdf-parse library
   │  └─ DOCX: mammoth library
   ↓
7. Save initial resume record (status: processing)
   ↓
8. aiAnalyzer sends to Gemini AI API
   │  • Structured prompt with resume + job description
   │  • Gemini-1.5-flash analyzes and returns JSON
   │  • Parse response into our data model
   ↓
9. Update resume record with analysis
   │  • matchScore
   │  • missingKeywords
   │  • foundKeywords
   │  • actionableTips
   │  • status: completed
   ↓
10. Delete temporary file from uploads/
   ↓
11. Return complete analysis to client
```

### 3. Protected Route Access Flow

```
1. Client sends GET /api/resumes
   ↓
2. protect middleware intercepts
   ↓
3. Extract JWT from cookie
   ↓
4. Verify token signature using JWT_SECRET
   ↓
5. Decode token to get user ID
   ↓
6. Find user in database
   ↓
7. Attach user object to req.user
   ↓
8. resumeController.getMyResumes executes
   ↓
9. Query MongoDB for user's resumes
   ↓
10. Return results
```

## 📦 Component Breakdown

### 1. **server.js** (Entry Point)
```javascript
Purpose: Application initialization
Responsibilities:
  - Load environment variables
  - Connect to MongoDB
  - Apply global middleware
  - Mount route handlers
  - Start Express server
  - Handle graceful shutdown
```

### 2. **Models** (Data Layer)

#### User Model
```javascript
Purpose: User account management
Fields:
  - name, email, password
  - role (user/admin)
Methods:
  - generateAuthToken()
  - comparePassword()
Hooks:
  - pre('save'): Hash password before saving
```

#### Resume Model
```javascript
Purpose: Store resume analysis data
Fields:
  - user (reference)
  - extractedText
  - jobDescription
  - analysis (nested object)
  - status (processing/completed/failed)
```

#### JobMatch Model
```javascript
Purpose: Store job recommendations
Fields:
  - resume, user (references)
  - jobTitle, company, location
  - matchPercentage
  - matchedKeywords
```

### 3. **Middleware** (Processing Layer)

#### auth.js
```javascript
Exports:
  - protect: Verify JWT, attach user to req
  - authorize(...roles): Check user role
```

#### security.js
```javascript
Exports:
  - helmetConfig: Secure HTTP headers
  - corsConfig: Cross-origin rules
  - generalLimiter: 100 req/15min
  - authLimiter: 5 req/15min
```

#### upload.js
```javascript
Exports:
  - Multer configuration
  - File type validation
  - File size limits
  - Custom filename strategy
```

### 4. **Controllers** (Business Logic)

#### authController.js
```javascript
Exports:
  - register: Create new user
  - login: Authenticate user
  - logout: Clear cookie
  - getMe: Get current user
```

#### resumeController.js
```javascript
Exports:
  - uploadResume: Upload + analyze
  - getMyResumes: Get user's history
  - getResumeById: Get details
  - deleteResume: Remove record
```

### 5. **Utilities** (Helper Functions)

#### fileParser.js
```javascript
Exports:
  - parseResume(filePath)
    ├─ parsePDF()
    └─ parseDOCX()
```

#### aiAnalyzer.js
```javascript
Exports:
  - analyzeResume(text, jobDesc)
    └─ buildAnalysisPrompt()
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────────┐
│          SECURITY LAYERS                    │
├─────────────────────────────────────────────┤
│                                             │
│  1. NETWORK LAYER                           │
│     ✓ CORS (origin whitelisting)           │
│     ✓ Rate Limiting (DDoS prevention)      │
│                                             │
│  2. HEADER LAYER                            │
│     ✓ Helmet (CSP, X-Frame-Options, etc.)  │
│     ✓ HTTPS enforcement (production)        │
│                                             │
│  3. AUTHENTICATION LAYER                    │
│     ✓ JWT tokens (stateless auth)          │
│     ✓ HTTP-only cookies (XSS prevention)   │
│     ✓ Secure flag (HTTPS only)             │
│     ✓ SameSite (CSRF prevention)           │
│                                             │
│  4. AUTHORIZATION LAYER                     │
│     ✓ Role-Based Access Control            │
│     ✓ Resource ownership checks            │
│                                             │
│  5. DATA LAYER                              │
│     ✓ Password hashing (bcrypt)            │
│     ✓ Input validation                     │
│     ✓ File type validation                 │
│     ✓ File size limits                     │
│                                             │
│  6. ERROR HANDLING                          │
│     ✓ Never expose stack traces            │
│     ✓ Generic error messages               │
│     ✓ Detailed logging (server-side only)  │
│                                             │
└─────────────────────────────────────────────┘
```

## 🗄️ Database Schema Relationships

```
┌─────────────┐
│    User     │
├─────────────┤
│ _id         │◄───────┐
│ name        │        │
│ email       │        │ References (user)
│ password    │        │
│ role        │        │
└─────────────┘        │
                       │
              ┌────────┴────────┐
              │                 │
    ┌─────────▼───────┐   ┌─────▼──────────┐
    │     Resume      │   │    JobMatch    │
    ├─────────────────┤   ├────────────────┤
    │ _id             │◄──┤ resume         │
    │ user            │   │ user           │
    │ extractedText   │   │ jobTitle       │
    │ analysis        │   │ company        │
    │ status          │   │ matchPercent   │
    └─────────────────┘   └────────────────┘
```

## 🔄 Data Flow: AI Analysis

```
┌──────────────┐
│ Resume File  │
│  (.pdf/.docx)│
└──────┬───────┘
       │
       ▼
┌─────────────────────┐
│   File Parser       │
│  (pdf-parse/mammoth)│
└──────┬──────────────┘
       │
       │ Raw Text
       ▼
┌─────────────────────┐
│  AI Analyzer        │
│  (Gemini AI)        │
└──────┬──────────────┘
       │
       │ Structured Prompt
       ▼
┌─────────────────────────────────┐
│      Gemini AI API              │
│                                 │
│  System: You are resume expert  │
│  User: Analyze this resume...   │
│                                 │
│  Response Format: JSON          │
└──────┬──────────────────────────┘
       │
       │ JSON Response
       ▼
┌────────────────────────────────┐
│  Analysis Object               │
├────────────────────────────────┤
│  • matchScore: 85              │
│  • missingKeywords: [...]      │
│  • foundKeywords: [...]        │
│  • actionableTips: [...]       │
│  • aiSummary: "..."            │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────┐
│  MongoDB Resume    │
│  Collection        │
└────────────────────┘
```

## 🎯 Key Design Decisions

### 1. **Why HTTP-only Cookies instead of localStorage?**
- ✅ JavaScript cannot access (XSS protection)
- ✅ Automatically sent with requests
- ✅ Can set secure and sameSite flags
- ❌ localStorage accessible to any script

### 2. **Why separate Controllers from Routes?**
- ✅ Better code organization
- ✅ Easier to test
- ✅ Reusable business logic
- ✅ Cleaner route definitions

### 3. **Why delete uploaded files after parsing?**
- ✅ Save server storage
- ✅ Privacy (don't store sensitive documents)
- ✅ Only extracted text is needed

### 4. **Why use Mongoose instead of native MongoDB driver?**
- ✅ Schema validation
- ✅ Middleware (pre/post hooks)
- ✅ Built-in methods
- ✅ Easier relationships

### 5. **Why Gemini AI instead of building own ML model?**
- ✅ No training data required
- ✅ State-of-the-art performance
- ✅ Easy to implement
- ✅ Regular updates from Google
- ✅ FREE tier (1500 requests/day)
- ✅ Native JSON output support
- ❌ Dependent on external service (minor concern with Google's reliability)

## 📈 Scalability Considerations

### Current (MVP) Architecture:
```
Single Server
├─ Express app
├─ File uploads
└─ MongoDB connection
```

### Future Production Architecture:
```
Load Balancer
├─ Server Instance 1
├─ Server Instance 2
└─ Server Instance 3
    │
    ├─ File Storage (AWS S3)
    ├─ MongoDB Cluster (Replica Set)
    ├─ Redis Cache (Session storage)
    └─ Job Queue (Bull/BullMQ)
        └─ Background workers for AI analysis
```

## 🚀 Performance Optimizations

1. **Database Indexing**
   - User email (unique index)
   - Resume user + createdAt (compound index)
   - JobMatch matchPercentage (descending)

2. **File Handling**
   - Stream large files instead of loading into memory
   - Immediate deletion after parsing

3. **AI Analysis**
   - Could cache common job descriptions
   - Could process asynchronously with job queue

4. **API Responses**
   - Don't send extractedText in list endpoints
   - Pagination for resume history

---

**This architecture is designed to be:**
- ✅ Secure by default
- ✅ Easy to understand
- ✅ Simple to extend
- ✅ Production-ready with minor tweaks

For questions about specific components, refer to the inline comments in each file!
