const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || '',
  password: process.env.MYSQL_PASS || '',
  database: process.env.MYSQL_DB || 'ipshopy_reels',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();