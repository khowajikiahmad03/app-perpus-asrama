require('dotenv').config();
const mysql = require('mysql2');

// === KONEKSI DB ===
const db = mysql.createConnection({
  host:     process.env.MYSQLHOST,
  port:     process.env.MYSQLPORT || 3306,
  user:     process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE
});

db.connect(err => {
  if (err) {
    console.error('[DB] Koneksi gagal:', err.message);
  } else {
    console.log('[DB] Database connected!');
  }
});

module.exports = db;