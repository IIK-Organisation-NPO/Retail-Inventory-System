const mysql = require('mysql2/promise'); // <-- CHANGED TO PROMISE VERSION
require('dotenv').config();

const db = mysql.createPool({ // <-- CHANGED TO POOL
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'RuralDigitalRetailDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test the connection
db.getConnection()
  .then(connection => {
    console.log('Connected to MySQL database.');
    connection.release();
  })
  .catch(err => console.error('Database connection failed: ' + err.stack));

module.exports = db;