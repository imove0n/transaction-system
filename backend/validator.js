// validator.js

// Validate individual record
function validateRecord(record, rowNumber) {
  const errors = [];

  // 1. Reference Number: alphanumeric, max 20 chars
  if (!record.reference_number || record.reference_number.trim() === '') {
    errors.push('Reference number is required');
  } else if (!/^[a-zA-Z0-9]+$/.test(record.reference_number)) {
    errors.push('Reference number must be alphanumeric');
  } else if (record.reference_number.length > 20) {
    errors.push('Reference number must not exceed 20 characters');
  }

  // 2. Quantity: must be a valid integer (long)
  if (!record.quantity || record.quantity.trim() === '') {
    errors.push('Quantity is required');
  } else if (isNaN(record.quantity) || !Number.isInteger(Number(record.quantity))) {
    errors.push('Quantity must be a valid integer');
  }

  // 3. Amount: must be decimal
  if (!record.amount || record.amount.trim() === '') {
    errors.push('Amount is required');
  } else if (isNaN(record.amount)) {
    errors.push('Amount must be a valid number');
  }

  // 4. Name: validate text (not empty, reasonable length)
  if (!record.name || record.name.trim() === '') {
    errors.push('Name is required');
  } else if (record.name.length > 255) {
    errors.push('Name must not exceed 255 characters');
  } else if (!/^[a-zA-Z0-9\s\-\.]+$/.test(record.name)) {
    errors.push('Name contains invalid characters');
  }

  // 5. Transaction Date: format dd/MM/yyyy hh:mm:ss
  if (!record.transaction_date || record.transaction_date.trim() === '') {
    errors.push('Transaction date is required');
  } else if (!isValidDate(record.transaction_date)) {
    errors.push('Transaction date must be in format dd/MM/yyyy hh:mm:ss');
  }

  // 6. Symbol: alphanumeric, 3-5 chars
  if (!record.symbol || record.symbol.trim() === '') {
    errors.push('Symbol is required');
  } else if (!/^[a-zA-Z0-9]+$/.test(record.symbol)) {
    errors.push('Symbol must be alphanumeric');
  } else if (record.symbol.length < 3 || record.symbol.length > 5) {
    errors.push('Symbol must be between 3 and 5 characters');
  }

  // 7. Order Side: Buy or Sell
  if (!record.order_side || record.order_side.trim() === '') {
    errors.push('Order side is required');
  } else if (!['Buy', 'Sell'].includes(record.order_side)) {
    errors.push('Order side must be "Buy" or "Sell"');
  }

  // 8. Order Status: Open, Matched, or Cancelled
  if (!record.order_status || record.order_status.trim() === '') {
    errors.push('Order status is required');
  } else if (!['Open', 'Matched', 'Cancelled'].includes(record.order_status)) {
    errors.push('Order status must be "Open", "Matched", or "Cancelled"');
  }

  return {
    valid: errors.length === 0,
    errors,
    rowNumber
  };
}

// Validate date format: dd/MM/yyyy hh:mm:ss
function isValidDate(dateString) {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/;
  if (!regex.test(dateString)) return false;

  const [, day, month, year, hour, minute, second] = dateString.match(regex);
  
  // Check valid ranges
  const d = parseInt(day);
  const m = parseInt(month);
  const h = parseInt(hour);
  const min = parseInt(minute);
  const s = parseInt(second);
  
  if (d < 1 || d > 31) return false;
  if (m < 1 || m > 12) return false;
  if (h < 0 || h > 23) return false;
  if (min < 0 || min > 59) return false;
  if (s < 0 || s > 59) return false;
  
  return true;
}

// Check for duplicate reference numbers
function checkDuplicates(records) {
  const refNumbers = records.map(r => r.reference_number);
  const duplicates = refNumbers.filter((item, index) => refNumbers.indexOf(item) !== index);
  
  return {
    hasDuplicates: duplicates.length > 0,
    duplicates: [...new Set(duplicates)]
  };
}

module.exports = {
  validateRecord,
  checkDuplicates,
  isValidDate
};