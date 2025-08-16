const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const seoGenerator = require('../utils/seoGenerator');
const iconGenerator = require('../utils/iconGenerator');
const zipGenerator = require('../utils/zipGenerator');
const ai = require('../utils/ai');
const { optionalAuth, requireCredits } = require('../middleware/auth');
const { getDatabase } = require('../database/config');

const router = express.Router();
const db = getDatabase();

// Generate unique session ID for concurrent user isolation
const generateSessionId = () => {
  return crypto.randomUUID().replace(/-/g, '').substring(0, 16);
};

// Create session-specific directories
const createSessionDirectories = async (sessionId) => {
  const sessionDir = path.join('generated', 'sessions', sessionId);
  const dirs = [
    'uploads',
    'generated',
    'generated/sessions',
    sessionDir,
    path.join(sessionDir, 'icons'),
    path.join(sessionDir, 'temp')
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      console.log(`Directory ${dir} already exists or error creating:`, err.message);
    }
  }
  
  return sessionDir;
};

// Cleanup old session directories (older than 2 hours)
const cleanupOldSessions = async () => {
  try {
    const sessionsDir = path.join('generated', 'sessions');
    await fs.mkdir(sessionsDir, { recursive: true });
    
    const sessions = await fs.readdir(sessionsDir);
    const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
    
    for (const session of sessions) {
      const sessionPath = path.join(sessionsDir, session);
      const stats = await fs.stat(sessionPath);
      
      if (stats.isDirectory() && stats.mtime.getTime() < twoHoursAgo) {
        await fs.rmdir(sessionPath, { recursive: true });
        console.log(`Cleaned up old session: ${session}`);
      }
    }
  } catch (err) {
    console.log('Error during session cleanup:', err.message);
  }
};

// Ensure base directories exist
const ensureDirectories = async () => {
  const dirs = ['uploads', 'generated'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      console.log(`Directory ${dir} already exists or error creating:`, err.message);
    }
  }
};

// Initialize directories and start cleanup routine
ensureDirectories();

// Run cleanup every hour
setInterval(cleanupOldSessions, 60 * 60 * 1000);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'icon-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and SVG files are allowed'));
    }
  }
});

// Home page with optional auth
router.get('/', optionalAuth, (req, res) => {
  const welcome = req.query.welcome === 'true';
  res.render('index', { 
    title: 'SEO Generator',
    result: null,
    error: null,
    user: req.user,
    welcome
  });
});

// AI description enhancement endpoint with credit system
router.post('/enhance-description', requireCredits(1), async (req, res) => {
  try {
    const { description } = req.body;
    const userId = req.session.userId;
    
    if (!description || !description.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Description is required for enhancement' 
      });
    }

    // Deduct credits
    const remainingCredits = await db.updateCredits(userId, 1);
    
    // Log usage
    await db.logUsage(userId, 'AI Enhancement', 1, `Enhanced description: "${description.substring(0, 50)}..."`);

    // Use the existing AI enhancement method
    const enhancedDescription = await ai.enhanceDescription(description.trim());
    
    res.json({
      success: true,
      originalDescription: description.trim(),
      enhancedDescription: enhancedDescription.trim(),
      remainingCredits: remainingCredits
    });

  } catch (error) {
    console.error('AI Enhancement error:', error);
    
    // If it's a credit error, return specific message
    if (error.message === 'Insufficient credits') {
      return res.status(402).json({
        success: false,
        error: 'Insufficient credits. Please add more credits to use AI enhancement.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to enhance description. Please try again.'
    });
  }
});

// Handle form submission
router.post('/generate', upload.single('siteIcon'), async (req, res) => {
  let sessionDir = null;
  let sessionId = null;
  
  try {
    const { siteTitle, siteDescription, websiteUrl, siteLinks } = req.body;
    
    // Validate inputs
    if (!siteTitle || !siteDescription || !websiteUrl) {
      return res.render('index', {
        title: 'SEO Generator',
        result: null,
        error: 'Please provide site title, description, and website URL.',
        user: req.user
      });
    }

    // Generate unique session for this user
    sessionId = generateSessionId();
    sessionDir = await createSessionDirectories(sessionId);
    
    console.log(`Processing request for session: ${sessionId}`);

    let iconData = null;
    
    // Process uploaded icon if provided
    if (req.file) {
      iconData = await iconGenerator.generateIcons(req.file.path, req.file.filename, sessionDir);
    }

    // Generate SEO assets with session-specific directory
    const seoData = await seoGenerator.generateSEO({
      title: siteTitle,
      description: siteDescription,
      websiteUrl: websiteUrl,
      siteLinks: siteLinks,
      iconData: iconData,
      sessionDir: sessionDir,
      sessionId: sessionId
    });

    // Clean up uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.log('Error cleaning up uploaded file:', err.message);
      }
    }

    res.render('index', {
      title: 'SEO Generator',
      result: seoData,
      error: null,
      user: req.user
    });

  } catch (error) {
    console.error('Generation error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (err) {
        console.log('Error cleaning up uploaded file:', err.message);
      }
    }

    // Clean up session directory on error
    if (sessionDir) {
      try {
        await fs.rmdir(sessionDir, { recursive: true });
        console.log(`Cleaned up failed session: ${sessionId}`);
      } catch (err) {
        console.log('Error cleaning up session directory:', err.message);
      }
    }

    res.render('index', {
      title: 'SEO Generator',
      result: null,
      error: 'An error occurred while generating SEO assets. Please try again.',
      user: req.user
    });
  }
});

// Download ZIP file with all assets
router.post('/download', async (req, res) => {
  try {
    const { seoData } = req.body;
    
    if (!seoData || !seoData.sessionId) {
      return res.status(400).json({ error: 'No valid SEO data provided for download' });
    }
    
    // Use session-specific directory for zip creation
    const sessionDir = path.join('generated', 'sessions', seoData.sessionId);
    
    // Check if session directory exists
    try {
      await fs.access(sessionDir);
    } catch {
      return res.status(404).json({ error: 'Session expired or not found' });
    }
    
    // Generate unique filename
    const zipFilename = zipGenerator.generateZipFilename();
    const zipPath = path.join(sessionDir, 'temp', zipFilename);
    
    // Create the zip file
    await zipGenerator.createAssetsZip(seoData, zipPath);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`);
    
    // Stream the file
    const fileStream = require('fs').createReadStream(zipPath);
    
    fileStream.pipe(res);
    
    // Clean up the temporary file after sending
    fileStream.on('end', async () => {
      try {
        await fs.unlink(zipPath);
        console.log(`Temporary zip file cleaned up: ${zipFilename}`);
      } catch (err) {
        console.log('Error cleaning up zip file:', err.message);
      }
    });
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to create download package' });
  }
});

module.exports = router;
