# ⚡ Quick Start Guide

Get your AI Resume Analyzer backend running in 5 minutes!

## ✅ Pre-Launch Checklist

### Step 1: Install MongoDB

**Option A - MongoDB Compass (Easiest for beginners):**
1. Download from: https://www.mongodb.com/try/download/community
2. Install with default settings
3. MongoDB will start automatically
4. Default URI: `mongodb://localhost:27017`

**Option B - MongoDB Atlas (Cloud - Free tier):**
1. Go to: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create free cluster (512MB)
4. Click "Connect" → "Connect your application"
5. Copy connection string
6. Replace `<password>` with your database password

### Step 2: Get Google Gemini API Key (FREE!)

1. Go to: https://ai.google.dev/
2. Click "Get API key in Google AI Studio"
3. Sign in with your Google account
4. Click "Create API key"
5. **IMPORTANT:** Copy the key immediately!
6. **Best part:** FREE tier with 15 requests/min, 1500/day - perfect for testing!

### Step 3: Configure Environment Variables

Edit the `.env` file:

```bash
# 1. MongoDB Connection
# LOCAL:
MONGO_URI=mongodb://localhost:27017/resume-analyzer

# OR ATLAS:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/resume-analyzer

# 2. Google Gemini API Key (REQUIRED!)
GEMINI_API_KEY=your-gemini-api-key-here

# 3. JWT Secret (Change this!)
JWT_SECRET=make-this-a-long-random-string-abc123xyz789

# Everything else can stay as default for now
```

### Step 4: Start the Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
📊 Database Name: resume-analyzer

╔════════════════════════════════════════════════════╗
║                                                    ║
║    🚀 AI RESUME ANALYZER SERVER RUNNING           ║
║                                                    ║
║    📡 Port: 5000                                   ║
║    🌍 Environment: development                     ║
║    📊 Database: Connected                          ║
║                                                    ║
╚════════════════════════════════════════════════════╝
```

## 🧪 Quick Test

### Test 1: Server is Running

Open browser and go to: http://localhost:5000

Expected response:
```json
{
  "success": true,
  "message": "AI Resume Analyzer API is running"
}
```

### Test 2: Register a User

Using **Postman**, **Thunder Client**, or **curl**:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Expected: Status 201 with token and user data.

### Test 3: Upload a Resume

1. Create a test PDF or DOCX file with sample resume text
2. Use Postman:
   - URL: `POST http://localhost:5000/api/resumes/upload`
   - Body: form-data
   - Key: `resume` (type: File)
   - Value: Select your resume file
   - Add another key: `jobDescription` (type: Text)
   - Value: "Software Engineer position requiring React and Node.js"

Expected: Status 201 with analysis results.

## ❌ Troubleshooting

### Error: "MongoDB connection failed"

**Solution 1 - Check MongoDB is running:**
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

**Solution 2 - Check connection string:**
- Local: `mongodb://localhost:27017/resume-analyzer`
- Atlas: Make sure password is correct (no < >)
- Atlas: Whitelist your IP address in Atlas dashboard

### Error: "AI analysis failed"

**Cause:** Gemini API key is missing or invalid

**Solution:**
1. Check `.env` file has: `GEMINI_API_KEY=your-key...`
2. Get/verify key at: https://ai.google.dev/
3. Free tier includes 15 req/min, 1500/day - no payment needed!
4. Restart server after changing .env file

### Error: "Invalid file type"

**Cause:** Uploaded file is not PDF or DOCX

**Solution:**
- Only `.pdf` and `.docx` files are supported
- Check file extension is lowercase
- File must be under 5MB

### Error: "Not authorized"

**Cause:** JWT cookie not sent with request

**Solution:**
- Make sure you logged in first
- Postman: Cookies are handled automatically
- Browser: Credentials must be included in fetch
- cURL: Use `-c cookies.txt` on login, `-b cookies.txt` on other requests

### Error: "Too many requests"

**Cause:** Rate limiting triggered

**Solution:**
- Wait 15 minutes
- Or restart server (resets rate limits in development)

## 📁 Project Structure Quick Reference

```
resume-analyzer-backend/
│
├── server.js              # START HERE - Main entry point
├── .env                   # CONFIGURE THIS - Environment variables
│
├── config/
│   └── database.js        # MongoDB connection
│
├── models/
│   ├── User.js           # User schema + auth methods
│   ├── Resume.js         # Resume analysis data
│   └── JobMatch.js       # Job recommendations
│
├── middleware/
│   ├── auth.js           # JWT verification
│   ├── security.js       # Helmet, CORS, Rate limiting
│   └── upload.js         # Multer file upload
│
├── controllers/
│   ├── authController.js # Auth logic
│   └── resumeController.js # Resume logic
│
├── routes/
│   ├── authRoutes.js     # /api/auth/*
│   └── resumeRoutes.js   # /api/resumes/*
│
├── utils/
│   ├── fileParser.js     # PDF/DOCX parsing
│   └── aiAnalyzer.js     # Gemini AI integration
│
└── uploads/              # Temporary file storage
```

## 🎯 Development Workflow

### 1. Make Code Changes
- Edit files in your code editor
- Server auto-restarts (thanks to nodemon)

### 2. View Logs
- Check terminal for console.log output
- Errors show with stack traces

### 3. Test Endpoints
- Use Postman or Thunder Client
- Refer to `API_TESTING_GUIDE.md`

### 4. Check Database
**Option 1 - MongoDB Compass:**
- Open MongoDB Compass
- Connect to `mongodb://localhost:27017`
- Browse `resume-analyzer` database

**Option 2 - Command line:**
```bash
mongosh
use resume-analyzer
db.users.find()
db.resumes.find()
```

## 📚 Next Steps

### Phase 1: Backend Complete ✅
- [x] Authentication system
- [x] Resume upload & parsing
- [x] AI analysis
- [x] Security middleware

### Phase 2: Testing & Refinement
- [ ] Test all endpoints thoroughly
- [ ] Try different resume formats
- [ ] Test error scenarios
- [ ] Verify security features

### Phase 3: Frontend Development
- [ ] Create React app
- [ ] Build login/register forms
- [ ] Create resume upload UI
- [ ] Build analysis dashboard
- [ ] Add charts (Recharts library)
- [ ] Create job recommendations view

### Phase 4: Integration
- [ ] Connect frontend to backend
- [ ] Test full user flow
- [ ] Handle loading states
- [ ] Implement error handling

### Phase 5: Enhancements
- [ ] Add job matching API (Adzuna/Jooble)
- [ ] Build admin dashboard
- [ ] Add user analytics
- [ ] Email notifications
- [ ] Resume templates

### Phase 6: Deployment
- [ ] Deploy backend (Railway, Render, Heroku)
- [ ] Deploy frontend (Vercel, Netlify)
- [ ] Set up production MongoDB (Atlas)
- [ ] Configure environment variables
- [ ] Set up custom domain

## 🆘 Getting Help

### Resources:
- **README.md** - Full documentation
- **API_TESTING_GUIDE.md** - Detailed API testing
- **ARCHITECTURE.md** - System design explanation
- **Inline comments** - Every file is heavily documented

### Common Questions:

**Q: Can I use Gemini Pro instead of Flash?**
A: Yes! In `utils/aiAnalyzer.js`, change model to `'gemini-1.5-pro'` (more powerful but slower)

**Q: How much does Gemini cost?**
A: **FREE** for up to 1500 requests/day! Perfect for development and small-scale production.

**Q: What are Gemini rate limits?**
A: Free tier: 15 requests/min, 1500/day. More than enough for testing and small deployments!

**Q: Is this production-ready?**
A: For MVP, yes. For scale, you'd want:
- Redis for session storage
- S3 for file storage
- Job queue for async processing
- Better error monitoring (Sentry)

**Q: Can I customize the AI prompt?**
A: Yes! Edit `buildAnalysisPrompt()` in `utils/aiAnalyzer.js`

## 🎉 Success!

If you can:
1. ✅ Start the server without errors
2. ✅ Register and login a user
3. ✅ Upload a resume and get AI analysis

Then you're ready to build the frontend! 🚀

---

**Need help?** Read the inline code comments - every function is explained!

**Ready for more?** Check out `ARCHITECTURE.md` for deep dive into system design.

**Happy Coding!** 💻
