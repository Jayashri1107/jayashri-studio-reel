const mysql = require('mysql2');
require('dotenv').config();
const dbInfo = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASS || '',
  database: process.env.MYSQL_DB || 'ipshopy_reels',
  charset: 'utf8mb4',
  multipleStatements: false
};

// Create a connection pool instead of a single connection
const pool = mysql.createPool(dbInfo);

// Handle pool errors
pool.on('error', (err) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed. Reconnecting...');
  } else if (err.fatal) {
    console.error('Fatal database error:', err);
  }
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to database:', err);
    console.error('Database config:', {
      host: dbInfo.host,
      user: dbInfo.user,
      database: dbInfo.database,
      error: err.message
    });
  } else {
    console.log('✅ Connected to database:', dbInfo.database);
    connection.release(); // Release the connection back to the pool
  }
});

// Export the pool
module.exports = pool;