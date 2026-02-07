# 🧪 API Testing Guide

Quick reference for testing all endpoints using different tools.

## 🔧 Tools You Can Use

1. **Postman** (Recommended for beginners)
2. **Thunder Client** (VS Code extension)
3. **cURL** (Command line)
4. **Insomnia**
5. **JavaScript fetch/axios**

## 📝 Postman Setup

### Step 1: Create a Collection

1. Open Postman
2. Create new collection: "AI Resume Analyzer"
3. Add environment variables:
   - `baseUrl`: `http://localhost:5000`
   - `token`: (will be auto-set after login)

### Step 2: Configure Cookie Handling

- Postman automatically handles cookies
- JWT will be stored in cookies after login

## 🚀 Test Endpoints (in order)

### 1. ✅ Health Check

**Request:**
```
GET {{baseUrl}}/
```

**Expected Response:**
```json
{
  "success": true,
  "message": "AI Resume Analyzer API is running",
  "version": "1.0.0"
}
```

---

### 2. 📝 Register New User

**Request:**
```
POST {{baseUrl}}/api/auth/register
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "64abc123...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

**Cookie Set:** `token` (HTTP-only)

---

### 3. 🔐 Login

**Request:**
```
POST {{baseUrl}}/api/auth/login
Content-Type: application/json
```

**Body:**
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "64abc123...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

---

### 4. 👤 Get Current User

**Request:**
```
GET {{baseUrl}}/api/auth/me
```

**Headers:**
```
Cookie: token=<your-jwt-token>
```

**Expected Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "64abc123...",
    "name": "Test User",
    "email": "test@example.com",
    "role": "user"
  }
}
```

---

### 5. 📄 Upload Resume (Most Important!)

**Request:**
```
POST {{baseUrl}}/api/resumes/upload
Content-Type: multipart/form-data
```

**Body (form-data):**
- Key: `resume` | Type: File | Value: [Select your .pdf or .docx file]
- Key: `jobDescription` | Type: Text | Value: (Optional job description)

**Example Job Description:**
```
Senior Software Engineer position requiring:
- 5+ years of experience in full-stack development
- Strong proficiency in React, Node.js, and MongoDB
- Experience with AWS cloud services
- Knowledge of Docker and Kubernetes
- Excellent problem-solving and communication skills
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Resume analyzed successfully",
  "data": {
    "_id": "64xyz789...",
    "user": "64abc123...",
    "originalFileName": "john_doe_resume.pdf",
    "extractedText": "John Doe\nSoftware Engineer...",
    "jobDescription": "Senior Software Engineer...",
    "analysis": {
      "matchScore": 78,
      "missingKeywords": {
        "hardSkills": ["Docker", "Kubernetes", "AWS"],
        "softSkills": [],
        "certifications": ["AWS Certified Solutions Architect"]
      },
      "foundKeywords": {
        "hardSkills": ["React", "Node.js", "MongoDB", "JavaScript"],
        "softSkills": ["Problem-solving", "Communication"],
        "certifications": []
      },
      "actionableTips": [
        {
          "category": "keywords",
          "suggestion": "Add Docker and Kubernetes to your technical skills section",
          "priority": "high"
        },
        {
          "category": "content",
          "suggestion": "Quantify your achievements with metrics",
          "priority": "medium"
        }
      ],
      "aiSummary": "Strong foundation in web development..."
    },
    "status": "completed",
    "createdAt": "2026-02-06T12:00:00.000Z"
  }
}
```

---

### 6. 📋 Get All My Resumes

**Request:**
```
GET {{baseUrl}}/api/resumes
```

**Expected Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64xyz789...",
      "originalFileName": "john_doe_resume.pdf",
      "analysis": {
        "matchScore": 78
      },
      "status": "completed",
      "createdAt": "2026-02-06T12:00:00.000Z"
    }
  ]
}
```

---

### 7. 🔍 Get Specific Resume

**Request:**
```
GET {{baseUrl}}/api/resumes/:id
```

Replace `:id` with actual resume ID.

**Expected Response (200):**
Full resume object with all details.

---

### 8. 🗑️ Delete Resume

**Request:**
```
DELETE {{baseUrl}}/api/resumes/:id
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Resume deleted successfully"
}
```

---

### 9. 🚪 Logout

**Request:**
```
POST {{baseUrl}}/api/auth/logout
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookie Cleared:** `token`

---

## ⚠️ Error Scenarios to Test

### 1. Rate Limiting

Try logging in 6 times quickly with wrong password:

**Expected Response (429):**
```json
{
  "success": false,
  "message": "Too many authentication attempts. Please try again in 15 minutes."
}
```

### 2. Invalid File Type

Upload a .txt or .jpg file:

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Invalid file type. Only PDF and DOCX files are allowed."
}
```

### 3. Unauthorized Access

Try accessing `/api/resumes` without logging in:

**Expected Response (401):**
```json
{
  "success": false,
  "message": "Not authorized to access this route. Please log in."
}
```

### 4. File Too Large

Upload a file > 5MB:

**Expected Response (400):**
```json
{
  "success": false,
  "message": "File too large. Maximum size is 5MB."
}
```

### 5. Duplicate Registration

Register with same email twice:

**Expected Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

## 🐛 Debugging Tips

### If resume upload fails:

1. **Check Gemini API Key:**
   ```bash
   # In .env file
   GEMINI_API_KEY=your-gemini-api-key
   # Get free key at: https://ai.google.dev/
   ```

2. **Check MongoDB connection:**
   - Look for "MongoDB Connected" message in console
   - Verify `MONGO_URI` in .env

3. **Check file permissions:**
   - Ensure `uploads/` folder exists
   - Check write permissions

4. **View server logs:**
   - Console will show detailed error messages
   - Look for "AI analysis failed" or "PDF parsing failed"

### If authentication fails:

1. **Check JWT_SECRET:**
   - Should be long and random
   - Same across server restarts

2. **Check cookies:**
   - Browser should accept cookies
   - Postman automatically handles cookies

3. **Check CORS:**
   - If testing from browser, ensure `CLIENT_URL` matches

---

## 📊 Sample Resume for Testing

Create a simple text file and save as `.pdf` or `.docx`:

```
JOHN DOE
Software Engineer
john.doe@email.com | (555) 123-4567 | linkedin.com/in/johndoe

SUMMARY
Experienced Full-Stack Developer with 3 years of building web applications
using React, Node.js, and MongoDB.

SKILLS
- Languages: JavaScript, Python, HTML, CSS
- Frontend: React, Redux, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB, PostgreSQL
- Tools: Git, VS Code, Postman

EXPERIENCE
Software Developer | Tech Company Inc.
Jan 2021 - Present
- Built RESTful APIs using Node.js and Express
- Developed responsive UIs with React
- Managed MongoDB databases

EDUCATION
Bachelor of Science in Computer Science
University of Technology, 2020
```

---

## 🎯 Success Criteria

Your backend is working correctly if:

1. ✅ You can register a new user
2. ✅ You can login and receive a token
3. ✅ You can upload a PDF/DOCX resume
4. ✅ AI analysis completes with match score
5. ✅ You can view resume history
6. ✅ You can delete a resume
7. ✅ You can logout successfully

---

## 🚀 Next: Connect Frontend

Once all tests pass, you're ready to build the React frontend!

**Frontend Features to Build:**
- Login/Register forms
- Drag-and-drop resume upload
- Analysis dashboard with charts
- Job recommendations list
- Resume history view

---

**Happy Testing! 🎉**
