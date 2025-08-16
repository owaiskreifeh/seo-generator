const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Database constants
const DB_PATH = path.join(__dirname, 'users.db');
const INITIAL_CREDITS = 10;
const CREDITS_PER_ENHANCEMENT = 1;

class Database {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Create users table
      this.db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          credits INTEGER DEFAULT ${INITIAL_CREDITS},
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create usage_log table for tracking credit consumption
      this.db.run(`
        CREATE TABLE IF NOT EXISTS usage_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          action TEXT NOT NULL,
          credits_used INTEGER NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      console.log('Database initialized successfully');
    });
  }

  // User management methods
  async createUser(username, email, password) {
    return new Promise((resolve, reject) => {
      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
          return reject(err);
        }

        const stmt = this.db.prepare(`
          INSERT INTO users (username, email, password_hash, credits)
          VALUES (?, ?, ?, ?)
        `);

        stmt.run([username, email, hash, INITIAL_CREDITS], function(err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
              if (err.message.includes('username')) {
                return reject(new Error('Username already exists'));
              } else if (err.message.includes('email')) {
                return reject(new Error('Email already exists'));
              }
            }
            return reject(err);
          }

          resolve({
            id: this.lastID,
            username,
            email,
            credits: INITIAL_CREDITS
          });
        });

        stmt.finalize();
      });
    });
  }

  async authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT id, username, email, password_hash, credits
        FROM users WHERE username = ? OR email = ?
      `);

      stmt.get([username, username], (err, row) => {
        if (err) {
          return reject(err);
        }

        if (!row) {
          return reject(new Error('User not found'));
        }

        bcrypt.compare(password, row.password_hash, (err, isMatch) => {
          if (err) {
            return reject(err);
          }

          if (!isMatch) {
            return reject(new Error('Invalid password'));
          }

          resolve({
            id: row.id,
            username: row.username,
            email: row.email,
            credits: row.credits
          });
        });
      });

      stmt.finalize();
    });
  }

  async getUserById(userId) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT id, username, email, credits, created_at
        FROM users WHERE id = ?
      `);

      stmt.get([userId], (err, row) => {
        if (err) {
          return reject(err);
        }

        if (!row) {
          return reject(new Error('User not found'));
        }

        resolve(row);
      });

      stmt.finalize();
    });
  }

  async updateCredits(userId, creditsToDeduct) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET credits = credits - ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND credits >= ?
      `);

      stmt.run([creditsToDeduct, userId, creditsToDeduct], function(err) {
        if (err) {
          return reject(err);
        }

        if (this.changes === 0) {
          return reject(new Error('Insufficient credits'));
        }

        resolve(this.changes > 0);
      });

      stmt.finalize();
    });
  }

  async logUsage(userId, action, creditsUsed, description = '') {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO usage_log (user_id, action, credits_used, description)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run([userId, action, creditsUsed, description], function(err) {
        if (err) {
          return reject(err);
        }

        resolve(this.lastID);
      });

      stmt.finalize();
    });
  }

  async getUsageHistory(userId, limit = 10) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        SELECT action, credits_used, description, created_at
        FROM usage_log 
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `);

      stmt.all([userId, limit], (err, rows) => {
        if (err) {
          return reject(err);
        }

        resolve(rows);
      });

      stmt.finalize();
    });
  }

  async addCredits(userId, creditsToAdd) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        UPDATE users 
        SET credits = credits + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);

      stmt.run([creditsToAdd, userId], function(err) {
        if (err) {
          return reject(err);
        }

        resolve(this.changes > 0);
      });

      stmt.finalize();
    });
  }

  close() {
    this.db.close();
  }
}

// Export constants and database instance
module.exports = {
  Database,
  INITIAL_CREDITS,
  CREDITS_PER_ENHANCEMENT
};
