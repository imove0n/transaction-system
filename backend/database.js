// database.js
const mysql = require('mysql2');

// Create MySQL connection pool (handles reconnections automatically)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',          // Change this to your MySQL username
  password: '',          // Change this to your MySQL password
  database: 'transaction_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('✅ Connected to MySQL database');
  connection.release();
});

// Create tables if they don't exist
const createTables = () => {
  // Transactions table
  const transactionsTable = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      reference_number VARCHAR(20) UNIQUE NOT NULL,
      quantity BIGINT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      name VARCHAR(255) NOT NULL,
      transaction_date VARCHAR(50) NOT NULL,
      symbol VARCHAR(5) NOT NULL,
      order_side ENUM('Buy', 'Sell') NOT NULL,
      order_status ENUM('Open', 'Matched', 'Cancelled') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Invalid records log table
  const invalidRecordsTable = `
    CREATE TABLE IF NOT EXISTS invalid_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_name VARCHAR(255) NOT NULL,
      row_number INT NOT NULL,
      error_message TEXT NOT NULL,
      record_data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  pool.query(transactionsTable, (err) => {
    if (err) console.error('Error creating transactions table:', err);
    else console.log('✅ Transactions table ready');
  });

  pool.query(invalidRecordsTable, (err) => {
    if (err) console.error('Error creating invalid_records table:', err);
    else console.log('✅ Invalid records table ready');
  });
};

createTables();

module.exports = pool;