/**
 * VOID-X PLATFORM - MAIN SERVER
 * Code-Name: VANILLA
 * Module: Core Express Server with All 5 Modules
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ExifTool = require('exiftool-vendored').ExifTool;
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { Pool } = require('pg');
const mongoose = require('mongoose');
const axios = require('axios');
const FormData = require('form-data');
const sanitize = require('sanitize-filename');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;
const exiftool = new ExifTool();

// ==================== DATABASE CONFIGURATION ====================
// PostgreSQL Connection (Primary for IP Logging)
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:voidx',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// MongoDB Connection (Alternative for Document Storage)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/voidx';
mongoose.connect(mongoURI).then(() => {
  console.log('[VOID-X] MongoDB Connected - Audit Log Active');
}).catch(err => {
  console.error('[VOID-X] MongoDB Connection Error:', err.message);
});

// Audit Log Schema
const auditSchema = new mongoose.Schema({
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  country: String,
  city: String,
  threatLevel: { type: String, default: 'LOW' },
  requestBody: mongoose.Schema.Types.Mixed,
  responseStatus: Number
});

const AuditLog = mongoose.model('AuditLog', auditSchema);

// ==================== WINSTON LOGGER CONFIGURATION ====================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Create logs directory if not exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// ==================== MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Custom Morgan Format for IP Logging
morgan.token('real-ip', (req) => {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         '0.0.0.0';
});

morgan.token('timestamp', () => new Date().toISOString());

// ==================== IP LOGGING MIDDLEWARE ====================
const ipLogger = async (req, res, next) => {
  const ipAddress = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress || 
                    '0.0.0.0';
  
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const endpoint = req.originalUrl;
  const method = req.method;
  
  // Log to Winston
  logger.info({
    message: 'ACCESS_LOG',
    ipAddress,
    userAgent,
    endpoint,
    method,
    timestamp: new Date().toISOString()
  });

  // Log to PostgreSQL
  try {
    await pgPool.query(
      'INSERT INTO access_logs (ip_address, user_agent, endpoint, method, timestamp) VALUES ($1, $2, $3, $4, NOW())',
      [ipAddress, userAgent, endpoint, method]
    );
  } catch (err) {
    logger.error('PostgreSQL Logging Error:', err.message);
  }

  // Log to MongoDB (Async - don't block request)
  const auditEntry = new AuditLog({
    ipAddress,
    userAgent,
    endpoint,
    method,
    requestBody: method === 'POST' ? { ...req.body, password: undefined } : null
  });
  
  auditEntry.save().catch(err => {
    logger.error('MongoDB Audit Error:', err.message);
  });

  // Add IP to request object for later use
  req.clientIP = ipAddress;
  req.clientUA = userAgent;
  
  next();
};

app.use(ipLogger);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Rate limit exceeded. Try again later.' }
});
app.use('/api/', limiter);

// ==================== CREATE DATABASE TABLES ====================
const initDB = async () => {
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        user_agent TEXT,
        endpoint VARCHAR(500),
        method VARCHAR(10),
        timestamp TIMESTAMP DEFAULT NOW(),
        country VARCHAR(100),
        threat_level VARCHAR(20) DEFAULT 'LOW'
      )
    `);
    console.log('[VOID-X] PostgreSQL Tables Initialized');
  } catch (err) {
    console.error('[VOID-X] Database Init Error:', err.message);
  }
};

initDB();

// ==================== MODULE 1: THE REAPER DOWNLOADER ====================
const downloadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10 // 10 downloads per hour
});

app.post('/api/reaper/download', downloadLimiter, async (req, res) => {
  const { url, format = 'best', quality = 'best' } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL
  const supportedPlatforms = [
    'youtube.com', 'youtu.be', 'facebook.com', 'fb.watch',
    'twitter.com', 'x.com', 'instagram.com', 'tiktok.com',
    'reddit.com', 'vimeo.com', 'dailymotion.com', 'twitch.tv',
    'soundcloud.com', 'spotify.com', 'bilibili.com'
  ];
  
  const isValid = supportedPlatforms.some(platform => url.includes(platform));
  if (!isValid) {
    return res.status(400).json({ error: 'Unsupported platform' });
  }

  try {
    // Get video info first
    const infoCmd = `yt-dlp --dump-json --no-download "${url}"`;
    const { stdout: infoJson } = await execAsync(infoCmd, { timeout: 30000 });
    const videoInfo = JSON.parse(infoJson.split('\n')[0]);

    // Generate safe filename
    const safeTitle = sanitize(videoInfo.title || 'download').substring(0, 100);
    const outputPath = path.join(__dirname, 'downloads', `${safeTitle}-%(id)s.%(ext)s`);
    
    // Ensure downloads directory exists
    if (!fs.existsSync(path.join(__dirname, 'downloads'))) {
      fs.mkdirSync(path.join(__dirname, 'downloads'));
    }

    // Build download command
    let formatOption = '';
    if (format === 'audio') {
      formatOption = '-x --audio-format mp3 --audio-quality 0';
    } else if (format === 'video') {
      formatOption = `-f "bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]"`;
    } else {
      formatOption = '-f best';
    }

    const downloadCmd = `yt-dlp ${formatOption} -o "${outputPath}" "${url}"`;
    
    // Execute download
    const { stdout, stderr } = await execAsync(downloadCmd, { timeout: 300000 });

    // Find downloaded file
    const downloadsDir = path.join(__dirname, 'downloads');
    const files = fs.readdirSync(downloadsDir);
    const downloadedFile = files.find(f => f.includes(videoInfo.id));

    if (downloadedFile) {
      const filePath = path.join(downloadsDir, downloadedFile);
      const stats = fs.statSync(filePath);
      
      res.json({
        success: true,
        message: 'Download completed',
        filename: downloadedFile,
        title: videoInfo.title,
        duration: videoInfo.duration,
        uploader: videoInfo.uploader,
        size: stats.size,
        downloadUrl: `/api/reaper/file/${encodeURIComponent(downloadedFile)}`,
        expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour expiry
      });

      // Schedule file deletion after 1 hour
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          logger.info(`Deleted expired file: ${downloadedFile}`);
        }
      }, 3600000);
    } else {
      res.status(500).json({ error: 'File not found after download' });
    }

  } catch (error) {
    logger.error('Download Error:', error.message);
    res.status(500).json({ 
      error: 'Download failed', 
      details: error.message 
    });
  }
});

// Stream download endpoint
app.get('/api/reaper/file/:filename', async (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(__dirname, 'downloads', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    
    fs.createReadStream(filePath).pipe(res);
  }
});

// Get video info without downloading
app.post('/api/reaper/info', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const cmd = `yt-dlp --dump-json --no-download "${url}"`;
    const { stdout } = await execAsync(cmd, { timeout: 30000 });
    const info = JSON.parse(stdout.split('\n')[0]);
    
    res.json({
      title: info.title,
      description: info.description,
      duration: info.duration,
      uploader: info.uploader,
      uploadDate: info.upload_date,
      viewCount: info.view_count,
      likeCount: info.like_count,
      thumbnail: info.thumbnail,
      formats: info.formats?.map(f => ({
        formatId: f.format_id,
        ext: f.ext,
        quality: f.quality_label || f.format_note,
        filesize: f.filesize,
        vcodec: f.vcodec,
        acodec: f.acodec
      })) || []
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch video info', details: error.message });
  }
});

// ==================== MODULE 2: METADATA PURGE ====================
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.post('/api/purge/image', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `purged_${req.file.originalname}`);

  try {
    // Read original metadata
    const originalTags = await exiftool.read(inputPath);
    
    // Strip all metadata
    await exiftool.write(inputPath, {}, ['-all=', '-overwrite_original']);
    
    // Copy to output
    fs.copyFileSync(inputPath, outputPath);
    
    // Read new metadata (should be minimal)
    const newTags = await exiftool.read(outputPath);
    
    // Clean up input file
    fs.unlinkSync(inputPath);
    
    // Schedule output file deletion
    setTimeout(() => {
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
    }, 3600000); // 1 hour

    const removedFields = Object.keys(originalTags).filter(
      key => !['SourceFile', 'ExifToolVersion'].includes(key)
    );

    res.json({
      success: true,
      message: 'Metadata purged successfully',
      originalFilename: req.file.originalname,
      removedFields: removedFields.length,
      removedFieldNames: removedFields.slice(0, 20), // Show first 20
      downloadUrl: `/api/purge/download/${path.basename(outputPath)}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

  } catch (error) {
    // Clean up on error
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    logger.error('Metadata Purge Error:', error.message);
    res.status(500).json({ error: 'Failed to purge metadata', details: error.message });
  }
});

app.post('/api/purge/pdf', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const inputPath = req.file.path;
  const outputPath = path.join('uploads', `purged_${req.file.originalname}`);

  try {
    // Use exiftool to remove PDF metadata
    await exiftool.write(inputPath, {}, [
      '-all:all=',
      '-overwrite_original',
      '-Producer=',
      '-Creator=',
      '-Author=',
      '-Title=',
      '-Subject='
    ]);

    fs.copyFileSync(inputPath, outputPath);
    fs.unlinkSync(inputPath);

    setTimeout(() => {
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }, 3600000);

    res.json({
      success: true,
      message: 'PDF metadata purged successfully',
      originalFilename: req.file.originalname,
      downloadUrl: `/api/purge/download/${path.basename(outputPath)}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

  } catch (error) {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    logger.error('PDF Purge Error:', error.message);
    res.status(500).json({ error: 'Failed to purge PDF metadata', details: error.message });
  }
});

app.get('/api/purge/download/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found or expired' });
  }

  res.download(filePath);
});

// ==================== MODULE 3: PROXY FETCH (SHADOW FETCHING) ====================
app.post('/api/shadow/fetch', async (req, res) => {
  const { url, method = 'GET', headers = {}, body, timeout = 30000 } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Validate URL format
    new URL(url);
    
    // Block internal network requests
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '10.', '192.168.', '172.'];
    const urlObj = new URL(url);
    if (blockedHosts.some(host => urlObj.hostname.includes(host))) {
      return res.status(403).json({ error: 'Internal network requests are blocked' });
    }

    const startTime = Date.now();
    
    const response = await axios({
      url,
      method: method.toLowerCase(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        ...headers
      },
      data: body,
      timeout,
      maxRedirects: 5,
      validateStatus: () => true, // Don't throw on any status
      responseType: 'arraybuffer'
    });

    const responseTime = Date.now() - startTime;
    
    // Convert binary to base64 for JSON response
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const isText = contentType.includes('text') || 
                   contentType.includes('json') || 
                   contentType.includes('xml') ||
                   contentType.includes('javascript');

    let responseData;
    if (isText) {
      responseData = response.data.toString('utf-8');
    } else {
      responseData = Buffer.from(response.data).toString('base64');
    }

    res.json({
      success: true,
      proxyInfo: {
        proxyIP: req.clientIP, // Shows user's IP (they already know it)
        serverIP: 'REDACTED', // Our server IP is hidden
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      },
      targetResponse: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        contentType,
        isBase64: !isText,
        size: response.data.length,
        data: responseData.substring(0, 50000) // Limit response size
      },
      anonymityStatus: 'ACTIVE - Your IP is hidden from target'
    });

  } catch (error) {
    logger.error('Shadow Fetch Error:', error.message);
    res.status(500).json({ 
      error: 'Proxy fetch failed', 
      details: error.message 
    });
  }
});

// ==================== MODULE 4: IDENTITY LEAK CHECKER ====================
// Mock database of breaches for demonstration
const mockBreaches = [
  { name: 'Collection #1', date: '2019-01-01', records: 773000000, sources: ['email', 'password'] },
  { name: 'Verifications.io', date: '2019-02-01', records: 763000000, sources: ['email', 'phone'] },
  { name: 'EVite 2013', date: '2013-01-01', records: 10000000, sources: ['email', 'password'] },
  { name: 'LinkedIn 2012', date: '2012-01-01', records: 164000000, sources: ['email', 'password', 'username'] },
  { name: 'Adobe 2013', date: '2013-01-01', records: 153000000, sources: ['email', 'password', 'username'] },
  { name: 'Canva 2019', date: '2019-05-01', records: 137000000, sources: ['email', 'username'] },
  { name: 'Dropbox 2012', date: '2012-01-01', records: 68000000, sources: ['email', 'password'] },
  { name: 'MyFitnessPal 2018', date: '2018-02-01', records: 150000000, sources: ['email', 'username', 'password'] }
];

app.post('/api/leak/check', async (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  try {
    // Hash email for consistent "random" results (same email = same breaches)
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
    const hashValue = parseInt(hash.substring(0, 8), 16);
    
    // Determine breaches based on hash (deterministic but appears random)
    const numBreaches = (hashValue % 5) + 1; // 1-5 breaches
    const selectedBreaches = [];
    
    for (let i = 0; i < numBreaches; i++) {
      const breachIndex = (hashValue + i * 7) % mockBreaches.length;
      selectedBreaches.push(mockBreaches[breachIndex]);
    }

    // Calculate risk score
    const riskScore = Math.min(100, numBreaches * 15 + (hashValue % 20));
    let riskLevel = 'LOW';
    if (riskScore > 80) riskLevel = 'CRITICAL';
    else if (riskScore > 60) riskLevel = 'HIGH';
    else if (riskScore > 40) riskLevel = 'MEDIUM';

    // Generate compromised data types
    const compromisedData = new Set();
    selectedBreaches.forEach(b => {
      b.sources.forEach(s => compromisedData.add(s));
    });

    res.json({
      success: true,
      email: email.substring(0, 3) + '***@' + email.split('@')[1], // Partially masked
      scanId: hash.substring(0, 16),
      timestamp: new Date().toISOString(),
      summary: {
        totalBreaches: selectedBreaches.length,
        riskScore,
        riskLevel,
        compromisedDataTypes: Array.from(compromisedData),
        totalExposedRecords: selectedBreaches.reduce((sum, b) => sum + b.records, 0)
      },
      breaches: selectedBreaches.map(b => ({
        name: b.name,
        breachDate: b.date,
        recordsExposed: b.records.toLocaleString(),
        compromisedData: b.sources
      })),
      recommendations: [
        'Change passwords on affected accounts immediately',
        'Enable two-factor authentication where available',
        'Use a unique password for each service',
        'Consider using a password manager',
        'Monitor your accounts for suspicious activity'
      ],
      disclaimer: 'This is a simulated check for demonstration purposes. For real breach monitoring, use services like Have I Been Pwned.'
    });

  } catch (error) {
    logger.error('Leak Check Error:', error.message);
    res.status(500).json({ error: 'Leak check failed', details: error.message });
  }
});

// ==================== MODULE 5: SECURITY AUDIT LOGS ====================
app.get('/api/audit/logs', async (req, res) => {
  // In production, add authentication here
  const { limit = 100, offset = 0, ip, startDate, endDate } = req.query;
  
  try {
    let query = 'SELECT * FROM access_logs WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (ip) {
      query += ` AND ip_address = $${paramIndex++}`;
      params.push(ip);
    }

    if (startDate) {
      query += ` AND timestamp >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${paramIndex++}`;
      params.push(endDate);
    }

    query += ` ORDER BY timestamp DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pgPool.query(query, params);

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') as requests_24h
      FROM access_logs
    `;
    const statsResult = await pgPool.query(statsQuery);

    res.json({
      success: true,
      statistics: statsResult.rows[0],
      logs: result.rows,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: parseInt(statsResult.rows[0].total_requests)
      }
    });

  } catch (error) {
    logger.error('Audit Logs Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get MongoDB audit logs (more detailed)
app.get('/api/audit/detailed', async (req, res) => {
  const { limit = 100, ip, threatLevel } = req.query;
  
  try {
    const query = {};
    if (ip) query.ipAddress = ip;
    if (threatLevel) query.threatLevel = threatLevel;

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: logs.length,
      logs: logs.map(log => ({
        id: log._id,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        endpoint: log.endpoint,
        method: log.method,
        timestamp: log.timestamp,
        threatLevel: log.threatLevel,
        country: log.country,
        city: log.city
      }))
    });

  } catch (error) {
    logger.error('Detailed Audit Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch detailed audit logs' });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    codeName: 'VANILLA',
    project: 'VOID-X',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modules: {
      reaper: 'ACTIVE',
      purge: 'ACTIVE',
      shadow: 'ACTIVE',
      leakCheck: 'ACTIVE',
      audit: 'ACTIVE'
    }
  });
});

// ==================== STATIC FILES ====================
app.use(express.static(path.join(__dirname, '../dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  logger.error('Unhandled Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'VOID-X-500'
  });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██╗   ██╗ ██████╗ ██╗██████╗       ██╗  ██╗               ║
║   ██║   ██║██╔═══██╗██║██╔══██╗      ╚██╗██╔╝               ║
║   ██║   ██║██║   ██║██║██║  ██║       ╚███╔╝                ║
║   ╚██╗ ██╔╝██║   ██║██║██║  ██║       ██╔██╗                ║
║    ╚████╔╝ ╚██████╔╝██║██████╔╝      ██╔╝ ██╗               ║
║     ╚═══╝   ╚═════╝ ╚═╝╚═════╝       ╚═╝  ╚═╝               ║
║                                                              ║
║   PROJECT: VOID-X          CODE-NAME: VANILLA               ║
║   STATUS: OPERATIONAL       PORT: ${PORT}                       ║
║                                                              ║
║   MODULES:                                                   ║
║   [✓] THE REAPER DOWNLOADER                                 ║
║   [✓] METADATA PURGE                                        ║
║   [✓] SHADOW FETCH (PROXY)                                  ║
║   [✓] IDENTITY LEAK CHECKER                                 ║
║   [✓] SECURITY AUDIT LOG                                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
