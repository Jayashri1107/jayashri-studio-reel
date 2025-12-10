const mysql = require('mysql2');
require('dotenv').config();

// Configuration for the sagar database (source database)
const sagarDbConfig = {
  host: process.env.SAGAR_MYSQL_HOST || 'localhost',
  user: process.env.SAGAR_MYSQL_USER || 'root',
  password: process.env.SAGAR_MYSQL_PASS || '',
  database: process.env.SAGAR_MYSQL_DB || 'sagar',
  charset: 'utf8mb4',
  multipleStatements: false
};

// Handle database connection errors
const sagarConn = mysql.createConnection(sagarDbConfig);

sagarConn.on('error', (err) => {
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Sagar database connection was closed. Reconnecting...');
  } else if (err.fatal) {
    console.error('Fatal sagar database error:', err);
  }
});

// Test connection
sagarConn.connect((err) => {
  if (err) {
    console.error('Error connecting to sagar database:', err);
    console.error('Sagar database config:', {
      host: sagarDbConfig.host,
      user: sagarDbConfig.user,
      database: sagarDbConfig.database,
      error: err.message
    });
  } else {
    console.log('✅ Connected to sagar database:', sagarDbConfig.database);
  }
});

module.exports = sagarConn;