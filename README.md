# 🚀 AI Resume Analyzer - Backend

A robust MERN stack backend for analyzing resumes using Google Gemini AI, featuring secure authentication, file parsing, and intelligent job matching.

## 📋 Features

- ✅ **Secure Authentication**: JWT-based auth with HTTP-only cookies
- ✅ **Role-Based Access Control**: User and Admin roles
- ✅ **Resume Parsing**: Supports PDF and DOCX formats
- ✅ **AI Analysis**: Google Gemini AI powered resume evaluation
- ✅ **Match Scoring**: 0-100% compatibility with job descriptions
- ✅ **Keyword Extraction**: Identifies missing and found skills
- ✅ **Actionable Tips**: AI-generated improvement suggestions
- ✅ **Security**: Helmet, CORS, Rate Limiting, Password Hashing
- ✅ **File Validation**: Size limits and format restrictions

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT + bcryptjs
- **AI Engine**: Google Gemini AI API
- **File Parsing**: pdf-parse, mammoth
- **File Upload**: Multer
- **Security**: Helmet, CORS, express-rate-limit

## 📁 Project Structure

```
resume-analyzer-backend/
├── config/
│   └── database.js           # MongoDB connection
├── controllers/
│   ├── authController.js     # Auth logic (register, login, logout)
│   └── resumeController.js   # Resume operations
├── middleware/
│   ├── auth.js               # JWT verification & RBAC
│   ├── security.js           # Helmet, CORS, Rate limiting
│   └── upload.js             # Multer file upload config
├── models/
│   ├── User.js               # User schema with password hashing
│   ├── Resume.js             # Resume analysis data
│   └── JobMatch.js           # Job recommendations
├── routes/
│   ├── authRoutes.js         # /api/auth endpoints
│   └── resumeRoutes.js       # /api/resumes endpoints
├── utils/
│   ├── fileParser.js         # PDF/DOCX text extraction
│   └── aiAnalyzer.js         # Gemini AI integration
├── uploads/                  # Temporary file storage
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
├── package.json             # Dependencies
└── server.js                # Main application entry
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google Gemini API Key (Free tier available!)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd resume-analyzer-backend
   ```

2. **Install dependencies** (already done)
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Edit the `.env` file with your settings:
   ```env
   # Server
   PORT=5000
   NODE_ENV=development

   # MongoDB (Update this!)
   MONGO_URI=mongodb://localhost:27017/resume-analyzer
   # OR for MongoDB Atlas:
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/resume-analyzer

   # JWT Secret (Change this!)
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   JWT_COOKIE_EXPIRE=7

   # Google Gemini API Key (Get free at https://ai.google.dev/)
   GEMINI_API_KEY=your-gemini-api-key-here

   # Frontend URL
   CLIENT_URL=http://localhost:3000
   ```

4. **Set up MongoDB**

   **Option A - Local MongoDB:**
   - Install MongoDB from https://www.mongodb.com/try/download/community
   - Start MongoDB service:
     ```bash
     # Windows
     net start MongoDB

     # macOS/Linux
     sudo systemctl start mongod
     ```

   **Option B - MongoDB Atlas (Cloud):**
   - Create free cluster at https://www.mongodb.com/cloud/atlas
   - Get connection string
   - Update `MONGO_URI` in `.env`

5. **Get Google Gemini API Key** (FREE!)
   - Go to https://ai.google.dev/
   - Click "Get API key in Google AI Studio"
   - Sign in with Google account
   - Click "Create API key"
   - Copy the key and add to `.env` file
   - **Free tier**: 15 requests/minute, 1500 requests/day!

### Running the Server

**Development mode** (with auto-restart):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| POST | `/api/auth/logout` | Logout user | Private |
| GET | `/api/auth/me` | Get current user | Private |

### Resume Routes (`/api/resumes`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/resumes/upload` | Upload & analyze resume | Private |
| GET | `/api/resumes` | Get all user's resumes | Private |
| GET | `/api/resumes/:id` | Get specific resume | Private |
| DELETE | `/api/resumes/:id` | Delete resume | Private |

## 🧪 Testing the API

### 1. Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }' \
  -c cookies.txt
```

### 3. Upload Resume

```bash
curl -X POST http://localhost:5000/api/resumes/upload \
  -F "resume=@/path/to/your/resume.pdf" \
  -F "jobDescription=Software Engineer position requiring Python, React, and AWS" \
  -b cookies.txt
```

### 4. Get Resume History

```bash
curl http://localhost:5000/api/resumes \
  -b cookies.txt
```

## 🔐 Security Features

### 1. **Password Security**
- Passwords hashed using bcrypt (10 salt rounds)
- Never stored in plain text
- Automatically hashed on user creation

### 2. **JWT Authentication**
- Stateless authentication
- HTTP-only cookies (prevents XSS attacks)
- 7-day expiration
- Secure flag in production (HTTPS only)

### 3. **Rate Limiting**
- General API: 100 requests per 15 minutes
- Auth routes: 5 attempts per 15 minutes
- Prevents brute-force attacks

### 4. **Input Validation**
- File type validation (PDF, DOCX only)
- File size limit (5MB max)
- Email format validation
- Password minimum length

### 5. **Security Headers** (via Helmet)
- Content Security Policy
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing prevention)
- Strict-Transport-Security (HTTPS enforcement)

### 6. **CORS Protection**
- Whitelisted frontend origin
- Credentials allowed only from trusted sources

## 🧠 How AI Analysis Works

### Analysis Pipeline

1. **File Upload** → Multer saves to `uploads/`
2. **Text Extraction** → pdf-parse or mammoth extracts text
3. **AI Analysis** → Google Gemini AI analyzes resume
4. **Structured Response** → JSON with scores and tips
5. **Database Storage** → Results saved to MongoDB
6. **Cleanup** → Temporary file deleted

### AI Response Structure

```json
{
  "matchScore": 85,
  "missingKeywords": {
    "hardSkills": ["Docker", "Kubernetes"],
    "softSkills": ["Leadership"],
    "certifications": ["AWS Certified Solutions Architect"]
  },
  "foundKeywords": {
    "hardSkills": ["Python", "React", "Node.js"],
    "softSkills": ["Communication", "Teamwork"],
    "certifications": []
  },
  "actionableTips": [
    {
      "category": "keywords",
      "suggestion": "Add Docker and Kubernetes to your technical skills",
      "priority": "high"
    }
  ],
  "aiSummary": "Strong technical background with modern web stack..."
}
```

## 🗄️ Database Models

### User Model
- `name`: String (required)
- `email`: String (unique, required)
- `password`: String (hashed, required)
- `role`: Enum ['user', 'admin']
- Auto-generates JWT tokens
- Password comparison method

### Resume Model
- `user`: Reference to User
- `originalFileName`: Original file name
- `extractedText`: Parsed resume text
- `jobDescription`: Optional job posting
- `analysis`: AI analysis results
- `status`: Enum ['processing', 'completed', 'failed']
- Timestamps

### JobMatch Model
- `user`: Reference to User
- `resume`: Reference to Resume
- `jobTitle`, `company`, `location`
- `matchPercentage`: 0-100%
- `matchedKeywords`: Array of strings
- `status`: Enum ['new', 'viewed', 'applied', 'saved', 'rejected']

## 🛡️ Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## 📚 Next Steps

### Phase 1 (Current) ✅
- User authentication
- Resume upload and parsing
- AI analysis
- Database storage

### Phase 2 (Coming Next)
- Job matching API integration (Adzuna/Jooble)
- Admin dashboard
- User analytics
- Email notifications

### Phase 3 (Future)
- Resume templates
- ATS optimization tips
- Interview preparation
- Skill gap analysis

## 🤝 Contributing

This is a learning project. Feel free to:
- Add new features
- Improve error handling
- Enhance security
- Optimize AI prompts

## 📄 License

MIT License - Feel free to use for learning and commercial projects.

---

**Built with ❤️ using MERN Stack + Google Gemini AI**

For questions or issues, refer to the inline code comments - every file is extensively documented!
