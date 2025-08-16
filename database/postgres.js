const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database constants
const INITIAL_CREDITS = 10;
const CREDITS_PER_ENHANCEMENT = 1;

class PostgresDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    // Test the connection
    this.pool.query('SELECT NOW()', (err, res) => {
      if (err) {
        console.error('Database connection error:', err);
      } else {
        console.log('PostgreSQL database connected successfully');
      }
    });
  }

  // User management methods
  async createUser(username, email, password) {
    const client = await this.pool.connect();
    try {
      const saltRounds = 10;
      const hash = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (username, email, password_hash, credits)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, email, credits
      `;

      const result = await client.query(query, [username, email, hash, INITIAL_CREDITS]);
      
      return {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        credits: result.rows[0].credits
      };
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        if (error.constraint.includes('username')) {
          throw new Error('Username already exists');
        } else if (error.constraint.includes('email')) {
          throw new Error('Email already exists');
        }
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async authenticateUser(username, password) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, username, email, password_hash, credits
        FROM users WHERE username = $1 OR email = $1
      `;

      const result = await client.query(query, [username]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password_hash);
      
      if (!isMatch) {
        throw new Error('Invalid password');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        credits: user.credits
      };
    } finally {
      client.release();
    }
  }

  async getUserById(userId) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT id, username, email, credits, created_at
        FROM users WHERE id = $1
      `;

      const result = await client.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateCredits(userId, creditsToDeduct) {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE users 
        SET credits = credits - $1
        WHERE id = $2 AND credits >= $1
        RETURNING credits
      `;

      const result = await client.query(query, [creditsToDeduct, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('Insufficient credits');
      }

      return result.rows[0].credits;
    } finally {
      client.release();
    }
  }

  async logUsage(userId, action, creditsUsed, description = '') {
    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO usage_log (user_id, action, credits_used, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;

      const result = await client.query(query, [userId, action, creditsUsed, description]);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async getUsageHistory(userId, limit = 10) {
    const client = await this.pool.connect();
    try {
      const query = `
        SELECT action, credits_used, description, created_at
        FROM usage_log 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;

      const result = await client.query(query, [userId, limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async addCredits(userId, creditsToAdd) {
    const client = await this.pool.connect();
    try {
      const query = `
        UPDATE users 
        SET credits = credits + $1
        WHERE id = $2
        RETURNING credits
      `;

      const result = await client.query(query, [creditsToAdd, userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      return result.rows[0].credits;
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Export constants and database instance
module.exports = {
  PostgresDatabase,
  INITIAL_CREDITS,
  CREDITS_PER_ENHANCEMENT
};
