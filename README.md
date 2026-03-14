# VOID-X PLATFORM
**Code-Name: VANILLA**

A comprehensive privacy and security utility platform featuring media downloading, metadata anonymization, proxy fetching, identity leak checking, and security audit logging.

![VOID-X](https://img.shields.io/badge/VOID--X-OPERATIONAL-00ff41?style=for-the-badge&logo=terminal)
![Version](https://img.shields.io/badge/version-1.0.0-000000?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-ff0040?style=for-the-badge)

---

## 🎯 CORE MODULES

### MODULE 1: THE REAPER DOWNLOADER
Media downloader powered by yt-dlp supporting all major platforms:
- YouTube, Facebook, Twitter/X, Instagram, TikTok
- Reddit, Vimeo, Dailymotion, Twitch
- SoundCloud, Spotify, Bilibili

**Features:**
- Video and audio extraction
- Quality selection (360p to 4K)
- Streaming download support
- Automatic file cleanup (1-hour expiry)

### MODULE 2: METADATA PURGE
Remove identifying EXIF data from images and PDFs:
- GPS location removal
- Camera/device info stripping
- Author/creator data removal
- Timestamp anonymization

**Supported Formats:** JPG, PNG, TIFF, WebP, PDF

### MODULE 3: SHADOW FETCH (PROXY)
Anonymous HTTP request forwarding:
- IP address masking
- Custom headers support
- All HTTP methods (GET, POST, PUT, DELETE, etc.)
- Response inspection

### MODULE 4: IDENTITY LEAK CHECKER
Simulated data breach scanner:
- Email-based breach detection
- Risk score calculation
- Compromised data type analysis
- Security recommendations

### MODULE 5: SECURITY AUDIT LOG
Comprehensive access monitoring:
- IP address logging
- User agent tracking
- Request endpoint monitoring
- PostgreSQL + MongoDB dual storage
- Real-time log viewer

---

## 🚀 DEPLOYMENT

### Railway.app Deployment

1. **Create Railway Account**: https://railway.app

2. **Create New Project**:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init
```

3. **Add PostgreSQL Database**:
- Go to Railway Dashboard
- Click "New" → "Database" → "Add PostgreSQL"
- Copy the `DATABASE_URL` from Variables

4. **Add MongoDB Database** (Optional):
- Click "New" → "Database" → "Add MongoDB"
- Or use MongoDB Atlas

5. **Deploy**:
```bash
# Deploy from GitHub or local
git add .
git commit -m "Initial VOID-X deployment"
git push

# Or deploy directly
railway up
```

### Environment Variables

Create a `.env` file or set in Railway Dashboard:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/voidx
MONGODB_URI=mongodb://user:pass@host:27017/voidx

# Server
PORT=3000
NODE_ENV=production
SESSION_SECRET=your-super-secret-key
```

---

## 🖥️ LOCAL DEVELOPMENT

### Prerequisites
- Node.js 18+
- PostgreSQL (optional)
- MongoDB (optional)
- Python 3 + yt-dlp
- ExifTool

### Installation

```bash
# Clone repository
git clone <repo-url>
cd void-x

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Create directories
mkdir -p logs uploads downloads

# Start development server
npm run dev
```

### Development Mode

```bash
# Frontend + Backend concurrently
npm run dev

# Frontend only (port 5173)
npm run client

# Backend only (port 3000)
npm run server
```

---

## 📁 FOLDER STRUCTURE

```
void-x/
├── src/                    # Frontend React + TypeScript
│   ├── sections/          # Module components
│   │   ├── ReaperModule.tsx
│   │   ├── PurgeModule.tsx
│   │   ├── ShadowModule.tsx
│   │   ├── LeakModule.tsx
│   │   └── AuditModule.tsx
│   ├── App.tsx            # Main application
│   └── index.css          # Hyper-Dark Terminal theme
├── server/                # Backend Express
│   └── index.js           # Main server with all modules
├── database/              # Database configs
├── dist/                  # Build output (generated)
├── logs/                  # Application logs
├── uploads/               # Temporary uploads
├── downloads/             # Temporary downloads
├── package.json           # Dependencies
├── Dockerfile             # Container config
├── Procfile               # Railway process
├── railway.toml           # Railway config
└── vite.config.ts         # Vite configuration
```

---

## 🎨 THEME: HYPER-DARK TERMINAL

Custom Tailwind CSS theme featuring:
- **Primary**: Neon Green (#00ff41)
- **Danger**: Blood Red (#ff0040)
- **Info**: Cyan (#00ffff)
- **Background**: Deep Black (#050505)
- **Font**: JetBrains Mono (monospace)

---

## 🔒 SECURITY FEATURES

- **IP Logging**: All requests logged to PostgreSQL + MongoDB
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet.js**: Security headers
- **CORS**: Configured for safety
- **Input Sanitization**: Filename sanitization
- **File Size Limits**: 100MB max upload
- **Auto Cleanup**: Files expire after 1 hour

---

## 📊 API ENDPOINTS

### Health Check
```
GET /api/health
```

### Module 1: Reaper
```
POST /api/reaper/info      # Get video info
POST /api/reaper/download  # Download media
GET  /api/reaper/file/:id  # Download file
```

### Module 2: Purge
```
POST /api/purge/image      # Purge image metadata
POST /api/purge/pdf        # Purge PDF metadata
GET  /api/purge/download   # Download clean file
```

### Module 3: Shadow
```
POST /api/shadow/fetch     # Proxy HTTP request
```

### Module 4: Leak Check
```
POST /api/leak/check       # Check email breaches
```

### Module 5: Audit
```
GET /api/audit/logs        # Get access logs
GET /api/audit/detailed    # Get detailed logs
```

---

## 🛠️ TECH STACK

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS 3.4
- shadcn/ui components
- Lucide React icons

**Backend:**
- Node.js + Express
- yt-dlp (media downloader)
- ExifTool (metadata removal)
- Multer (file uploads)

**Database:**
- PostgreSQL (primary logs)
- MongoDB (detailed audit)

**Deployment:**
- Docker
- Railway.app

---

## 📜 LICENSE

MIT License - See LICENSE file for details.

---

## ⚠️ DISCLAIMER

This tool is for educational and legitimate privacy protection purposes only. Users are responsible for complying with all applicable laws and service terms.

**VOID-X - Protect Your Digital Footprint**

---

```
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   VOID-X PLATFORM v1.0.0                                     ║
║   CODE-NAME: VANILLA                                         ║
║   STATUS: OPERATIONAL                                        ║
║                                                              ║
║   [ALL SYSTEMS NOMINAL]                                      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```
