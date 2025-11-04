# Transaction Uploader - Full Stack Application

A professional full-stack transaction management system built for Premier Software Enterprise, Inc technical assessment. Upload, validate, and manage transaction data with a modern, responsive interface.

![Tech Stack](https://img.shields.io/badge/React-19.1.1-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![MySQL](https://img.shields.io/badge/Database-MySQL-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Validation Rules](#validation-rules)
- [Testing](#testing)

## ✨ Features

### Core Functionality
- **CSV File Upload** - Upload transaction files with comprehensive validation
- **Real-time Validation** - Instant feedback on file format and data integrity
- **Transaction Management** - Full CRUD operations (Create, Read, Update, Delete)
- **Advanced Filtering** - Search by symbol, date range, order side, and status
- **Responsive Design** - Modern UI built with custom CSS (no frameworks)
- **Error Handling** - Detailed error messages and validation feedback

### Technical Highlights
- ✅ Atomic validation (entire file rejected if any record is invalid)
- ✅ Duplicate detection within files and database
- ✅ All mandatory field validation
- ✅ RESTful API architecture
- ✅ Connection pooling for database performance
- ✅ Request logging middleware
- ✅ Professional error handling

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 4.21.2
- **Database:** MySQL 8.0+
- **File Upload:** Multer 1.4.5-lts.1
- **CSV Parsing:** csv-parse 5.6.0
- **CORS:** cors 2.8.5

### Frontend
- **Framework:** React 19.1.1
- **Build Tool:** Vite 7.1.7
- **HTTP Client:** Axios 1.13.1
- **Styling:** Custom CSS (Teal & Dark theme)

### Development
- **Linting:** ESLint 9.36.0
- **Package Manager:** npm/yarn

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** - [Download](https://git-scm.com/)
- **npm** or **yarn** package manager

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd transaction-system
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=transaction_db
DB_PORT=3306

# Server Configuration
PORT=3001

# File Upload Configuration
MAX_FILE_SIZE=1048576
```

## 🗄 Database Setup

### Option 1: Using MySQL Workbench

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open the SQL script: `database/schema.sql`
4. Execute the script

### Option 2: Using Command Line

```bash
mysql -u root -p < database/schema.sql
```

### Database Schema

The database includes the following structure:

```sql
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reference_number VARCHAR(20) UNIQUE NOT NULL,
    quantity BIGINT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    name VARCHAR(255) NOT NULL,
    transaction_date DATETIME NOT NULL,
    symbol VARCHAR(5) NOT NULL,
    order_side ENUM('Buy', 'Sell') NOT NULL,
    order_status ENUM('Open', 'Matched', 'Cancelled') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_symbol (symbol),
    INDEX idx_date (transaction_date),
    INDEX idx_side (order_side),
    INDEX idx_status (order_status)
);
```

## 🏃 Running the Application

### Development Mode

**Terminal 1 - Backend Server:**
```bash
npm run dev
```
The backend will run on [http://localhost:3001](http://localhost:3001)

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will run on [http://localhost:5173](http://localhost:5173)

### Production Mode

**Build Frontend:**
```bash
cd frontend
npm run build
cd ..
```

**Start Production Server:**
```bash
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/transactions
```

### Endpoints

#### 1. Upload CSV File
```http
POST /api/transactions/upload
Content-Type: multipart/form-data

Body:
- file: CSV file (max 1MB)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "recordsImported": 150
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "File validation failed",
  "totalInvalid": 3,
  "invalidRecords": [
    {
      "row": 5,
      "errors": ["Reference number exceeds 20 characters", "Invalid symbol length"]
    }
  ]
}
```

#### 2. Get All Transactions (with filters)
```http
GET /api/transactions?symbol=AAPL&order_side=Buy&order_status=Open
```

**Query Parameters:**
- `reference_number` - Filter by reference number
- `symbol` - Filter by stock symbol
- `order_side` - Filter by Buy/Sell
- `order_status` - Filter by Open/Matched/Cancelled
- `name` - Filter by name
- `quantity` - Filter by quantity
- `amount` - Filter by amount
- `transaction_date` - Filter by date (format: dd/MM/yyyy)

**Response (200):**
```json
{
  "success": true,
  "count": 25,
  "transactions": [
    {
      "id": 1,
      "reference_number": "REF001",
      "quantity": 100,
      "amount": "1500.50",
      "name": "John Doe",
      "transaction_date": "2024-01-15 10:30:00",
      "symbol": "AAPL",
      "order_side": "Buy",
      "order_status": "Open"
    }
  ]
}
```

#### 3. Update Transaction
```http
PUT /api/transactions/:id
Content-Type: application/json

Body:
{
  "quantity": 200,
  "amount": 3000.00,
  "order_status": "Matched"
}
```

#### 4. Delete Transaction
```http
DELETE /api/transactions/:id
```

## 📁 Project Structure

```
transaction-system/
├── frontend/                  # React frontend application
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── App.css           # Custom styling (Teal & Dark theme)
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Global styles
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── database/
│   └── schema.sql            # MySQL database schema
├── src/
│   ├── config/
│   │   └── database.js       # MySQL connection pool
│   ├── middleware/
│   │   ├── upload.js         # Multer file upload config
│   │   └── logger.js         # Request logging
│   ├── routes/
│   │   └── transactions.js   # Transaction routes
│   ├── services/
│   │   └── csvParser.js      # CSV validation & parsing
│   └── app.js                # Express app setup
├── uploads/                   # Temporary CSV uploads
├── .env                       # Environment variables
├── .gitignore
├── package.json
├── server.js                  # Server entry point
└── README.md
```

## ✅ Validation Rules

### File Validation
- **Format:** CSV only
- **Size:** Maximum 1MB
- **Encoding:** UTF-8

### Field Validation

| Field | Rules |
|-------|-------|
| **Reference Number** | Alphanumeric, max 20 chars, unique |
| **Quantity** | Long integer, required |
| **Amount** | Decimal (15,2), required |
| **Name** | String, required, name validation |
| **Transaction Date** | Format: dd/MM/yyyy HH:mm:ss (UTC) |
| **Symbol** | Alphanumeric, 3-5 characters |
| **Order Side** | Must be "Buy" or "Sell" |
| **Order Status** | Must be "Open", "Matched", or "Cancelled" |

### Validation Logic
- All fields are **mandatory**
- Missing any field marks the entire record as **invalid**
- Any invalid record causes the **entire file** to be rejected
- All invalid records are **logged and returned** in the response
- Duplicate reference numbers within file or database are **rejected**

## 🧪 Testing

### Sample CSV File

Create `sample_transactions.csv`:

```csv
reference_number,quantity,amount,name,transaction_date,symbol,order_side,order_status
REF001,100,1500.50,John Doe,01/01/2024 10:30:00,AAPL,Buy,Open
REF002,200,2500.75,Jane Smith,02/01/2024 14:15:00,GOOGL,Sell,Matched
REF003,150,1800.00,Bob Johnson,03/01/2024 09:45:00,MSFT,Buy,Cancelled
```

### Manual Testing

1. **Upload Valid File:**
   - Upload `sample_transactions.csv`
   - Verify success message
   - Check transactions appear in the table

2. **Upload Invalid File:**
   - Create file with invalid reference (>20 chars)
   - Verify detailed error messages

3. **Filter Transactions:**
   - Test symbol filter (e.g., "AAPL")
   - Test date range filter
   - Test order side filter (Buy/Sell)
   - Test status filter (Open/Matched/Cancelled)

4. **Edit Transaction:**
   - Click Edit on any transaction
   - Modify quantity/amount/status
   - Verify changes saved

5. **Delete Transaction:**
   - Click Delete button
   - Confirm deletion
   - Verify record removed

## 🎨 Design Features

### Modern UI/UX
- **Dark Header** with teal accent (#14b8a6)
- **Clean Cards** with subtle shadows
- **Responsive Design** - works on mobile, tablet, desktop
- **Professional Typography** - Inter font family
- **Smooth Animations** - hover effects, transitions
- **Modern Alerts** - top-stripe notification style

### Key Design Elements
- Teal (#14b8a6) primary color
- Dark navy (#0f172a) for headers/footer
- White cards with subtle borders
- Pill-shaped badges for status
- Dark table headers with teal accent

## 🔒 Security Features

- ✅ File type validation (CSV only)
- ✅ File size limits (1MB max)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input sanitization
- ✅ CORS configuration
- ✅ Error handling without exposing internals

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** `ER_NOT_SUPPORTED_AUTH_MODE`
```bash
# Fix MySQL authentication
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Port Already in Use

**Error:** `Port 3001 already in use`
```bash
# Find process using port
netstat -ano | findstr :3001

# Kill process (Windows)
taskkill /PID <process_id> /F

# Or change port in .env file
PORT=3002
```

### File Upload Not Working

- Check `uploads/` directory exists
- Verify file permissions
- Check file size < 1MB
- Ensure CSV format is correct

## 📝 Git Best Practices

This project follows atomic commit practices:

```bash
# Example commit history
git commit -m "Add MySQL database schema and connection pool"
git commit -m "Implement CSV upload and validation service"
git commit -m "Add transaction CRUD API endpoints"
git commit -m "Create React frontend with modern UI"
git commit -m "Add filtering and search functionality"
```

## 📄 License

MIT License - feel free to use this project for learning and development.

## 👨‍💻 Author

**Laurence** - Premier Software Enterprise, Inc Technical Assessment Submission

---

## 🎯 Assessment Checklist

- ✅ CSV file upload with validation
- ✅ All mandatory fields validated
- ✅ Entire file rejected if any record invalid
- ✅ All invalid records identified and logged
- ✅ Duplicate detection (within file and database)
- ✅ File size limit (1MB)
- ✅ Field validation per specification
- ✅ API endpoints for filtering:
  - By symbol
  - By date range
  - By order side
  - By order status
- ✅ Database with proper schema and indexes
- ✅ Clean project structure
- ✅ Atomic git commits
- ✅ Modern responsive UI
- ✅ Professional error handling
- ✅ Request logging
- ✅ Connection pooling
- ✅ README documentation

---

**Built with ❤️ for Premier Software Enterprise, Inc Technical Assessment**
