const { Database } = require('./database');
const { PostgresDatabase } = require('./postgres');

// Database configuration
const getDatabase = () => {
  const usePostgres = process.env.DATABASE_URL && process.env.NODE_ENV === 'production';
  
  if (usePostgres) {
    console.log('Using PostgreSQL database');
    return new PostgresDatabase();
  } else {
    console.log('Using SQLite database');
    return new Database();
  }
};

// Export the database instance
module.exports = {
  getDatabase,
  INITIAL_CREDITS: 10,
  CREDITS_PER_ENHANCEMENT: 1
};
