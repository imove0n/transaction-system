// routes/transactions.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const db = require('../database');
const { validateRecord, checkDuplicates } = require('../validator');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Upload and process CSV
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const fileName = req.file.originalname;
  const records = [];
  const invalidRecords = [];
  let rowNumber = 0;

  // Parse CSV
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => {
      rowNumber++;
      
      // Validate each record
      const validation = validateRecord(data, rowNumber);
      
      if (validation.valid) {
        records.push(data);
      } else {
        invalidRecords.push({
          rowNumber: validation.rowNumber,
          errors: validation.errors,
          data
        });
      }
    })
    .on('end', () => {
      // Delete uploaded file
      fs.unlinkSync(filePath);

      // If there are invalid records, reject entire file
      if (invalidRecords.length > 0) {
        // Log invalid records to database
        const logQuery = `
          INSERT INTO invalid_records (file_name, row_number, error_message, record_data)
          VALUES (?, ?, ?, ?)
        `;

        invalidRecords.forEach(record => {
          db.query(logQuery, [
            fileName,
            record.rowNumber,
            record.errors.join('; '),
            JSON.stringify(record.data)
          ], (err) => {
            if (err) console.error('Error logging invalid record:', err);
          });
        });

        return res.status(400).json({
          success: false,
          message: 'File contains invalid records. No data imported.',
          invalidRecords: invalidRecords.map(r => ({
            row: r.rowNumber,
            errors: r.errors
          })),
          totalInvalid: invalidRecords.length
        });
      }

      // Check for duplicates within file
      const duplicateCheck = checkDuplicates(records);
      if (duplicateCheck.hasDuplicates) {
        return res.status(400).json({
          success: false,
          message: 'File contains duplicate reference numbers',
          duplicates: duplicateCheck.duplicates
        });
      }

      // Check for duplicates in database
      const refNumbers = records.map(r => r.reference_number);
      const placeholders = refNumbers.map(() => '?').join(',');
      
      db.query(
        `SELECT reference_number FROM transactions WHERE reference_number IN (${placeholders})`,
        refNumbers,
        (err, existingRecords) => {
          if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
          }

          if (existingRecords.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'Some reference numbers already exist in database',
              existing: existingRecords.map(r => r.reference_number)
            });
          }

          // All validations passed - insert records
          const insertQuery = `
            INSERT INTO transactions (
              reference_number, quantity, amount, name, transaction_date,
              symbol, order_side, order_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;

          let insertedCount = 0;
          let errors = [];

          records.forEach((record, index) => {
            db.query(insertQuery, [
              record.reference_number,
              parseInt(record.quantity),
              parseFloat(record.amount),
              record.name,
              record.transaction_date,
              record.symbol,
              record.order_side,
              record.order_status
            ], (err) => {
              if (err) {
                errors.push(err);
              } else {
                insertedCount++;
              }

              // Check if all records processed
              if (index === records.length - 1) {
                if (errors.length > 0) {
                  return res.status(500).json({
                    success: false,
                    message: 'Error inserting some records',
                    errors: errors.map(e => e.message)
                  });
                }

                res.json({
                  success: true,
                  message: 'File processed successfully',
                  recordsImported: insertedCount
                });
              }
            });
          });
        }
      );
    })
    .on('error', (error) => {
      fs.unlinkSync(filePath);
      res.status(500).json({ error: 'Error processing CSV', details: error.message });
    });
});

// Get all transactions (with optional filters)
router.get('/', (req, res) => {
  const { 
    reference_number, 
    symbol, 
    order_side, 
    order_status,
    name 
  } = req.query;

  let query = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (reference_number) {
    query += ' AND reference_number LIKE ?';
    params.push(`%${reference_number}%`);
  }

  if (symbol) {
    query += ' AND symbol = ?';
    params.push(symbol);
  }

  if (order_side) {
    query += ' AND order_side = ?';
    params.push(order_side);
  }

  if (order_status) {
    query += ' AND order_status = ?';
    params.push(order_status);
  }

  if (name) {
    query += ' AND name LIKE ?';
    params.push(`%${name}%`);
  }

  query += ' ORDER BY created_at DESC';

  db.query(query, params, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json({ transactions: results, total: results.length });
  });
});

// Get single transaction
router.get('/:id', (req, res) => {
  db.query('SELECT * FROM transactions WHERE id = ?', [req.params.id], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(results[0]);
  });
});

// Update transaction
router.put('/:id', (req, res) => {
  const { quantity, amount, order_status } = req.body;
  
  db.query(
    `UPDATE transactions SET quantity = ?, amount = ?, order_status = ? WHERE id = ?`,
    [quantity, amount, order_status, req.params.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ message: 'Transaction updated', id: req.params.id });
    }
  );
});

// Delete transaction
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM transactions WHERE id = ?', [req.params.id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted' });
  });
});

// Get invalid records log
router.get('/logs/invalid', (req, res) => {
  db.query(
    'SELECT * FROM invalid_records ORDER BY created_at DESC LIMIT 100',
    [],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ invalidRecords: results });
    }
  );
});

module.exports = router;