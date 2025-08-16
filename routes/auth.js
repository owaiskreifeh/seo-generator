const express = require('express');
const { getDatabase } = require('../database/config');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();
const db = getDatabase();

// Register page
router.get('/register', optionalAuth, (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('auth/register', { 
    title: 'Register - SEO Generator',
    error: null,
    success: null,
    user: req.user || null
  });
});

// Register POST
router.post('/register', optionalAuth, async (req, res) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      return res.render('auth/register', {
        title: 'Register - SEO Generator',
        error: 'All fields are required',
        success: null,
        user: req.user || null
      });
    }

    if (password !== confirmPassword) {
      return res.render('auth/register', {
        title: 'Register - SEO Generator',
        error: 'Passwords do not match',
        success: null,
        user: req.user || null
      });
    }

    if (password.length < 6) {
      return res.render('auth/register', {
        title: 'Register - SEO Generator',
        error: 'Password must be at least 6 characters long',
        success: null,
        user: req.user || null
      });
    }

    // Create user
    const user = await db.createUser(username, email, password);
    
    // Auto-login after registration
    req.session.userId = user.id;
    req.session.username = user.username;

    res.redirect('/?welcome=true');

  } catch (error) {
    console.error('Registration error:', error);
    res.render('auth/register', {
      title: 'Register - SEO Generator',
      error: error.message,
      success: null,
      user: req.user || null
    });
  }
});

// Login page
router.get('/login', optionalAuth, (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/');
  }
  res.render('auth/login', { 
    title: 'Login - SEO Generator',
    error: null,
    user: req.user || null
  });
});

// Login POST
router.post('/login', optionalAuth, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.render('auth/login', {
        title: 'Login - SEO Generator',
        error: 'Username/email and password are required',
        user: req.user || null
      });
    }

    const user = await db.authenticateUser(username, password);
    
    req.session.userId = user.id;
    req.session.username = user.username;

    res.redirect('/');

  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', {
      title: 'Login - SEO Generator',
      error: error.message,
      user: req.user || null
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

// User profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await db.getUserById(req.session.userId);
    const usageHistory = await db.getUsageHistory(req.session.userId, 20);
    
    res.render('auth/profile', {
      title: 'Profile - SEO Generator',
      user,
      usageHistory
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.redirect('/');
  }
});

// Add credits (admin function - for demo purposes)
router.post('/add-credits', requireAuth, async (req, res) => {
  try {
    const { credits } = req.body;
    const creditsToAdd = parseInt(credits) || 0;
    
    if (creditsToAdd <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credit amount' 
      });
    }

    const updatedCredits = await db.addCredits(req.session.userId, creditsToAdd);
    
    res.json({ 
      success: true, 
      credits: updatedCredits,
      message: `Added ${creditsToAdd} credits successfully`
    });

  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add credits' 
    });
  }
});

module.exports = router;
