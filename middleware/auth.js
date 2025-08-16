const { getDatabase } = require('../database/config');

// Initialize database
const db = getDatabase();

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

// Optional auth middleware (for routes that work with or without auth)
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    // User is authenticated, load user data
    db.getUserById(req.session.userId)
      .then(user => {
        req.user = user;
        next();
      })
      .catch(err => {
        console.error('Error loading user:', err);
        // Clear invalid session
        req.session.destroy();
        next();
      });
  } else {
    next();
  }
};

// Credit check middleware for AI enhancement
const requireCredits = (creditsNeeded = 1) => {
  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    try {
      const user = await db.getUserById(req.session.userId);
      if (user.credits < creditsNeeded) {
        return res.status(402).json({ 
          success: false, 
          error: `Insufficient credits. You need ${creditsNeeded} credit(s) but have ${user.credits}.` 
        });
      }
      
      req.user = user;
      next();
    } catch (err) {
      console.error('Error checking credits:', err);
      res.status(500).json({ 
        success: false, 
        error: 'Error checking credits' 
      });
    }
  };
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireCredits,
  db
};
