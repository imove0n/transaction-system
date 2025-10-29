import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3001/api/transactions';

function App() {
  // State
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filters, setFilters] = useState({
    reference_number: '',
    symbol: '',
    order_side: '',
    order_status: '',
    name: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`${API_URL}?${params}`);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadResult(null);
  };

  // Upload CSV
  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setLoading(true);
    setUploadResult(null);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setUploadResult(response.data);
      setSelectedFile(null);
      
      // Clear file input
      document.querySelector('input[type="file"]').value = '';
      
      // Refresh transactions
      fetchTransactions();
    } catch (error) {
      setUploadResult(error.response?.data || { 
        success: false, 
        message: 'Error uploading file' 
      });
    }

    setLoading(false);
  };

  // Delete transaction
  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchTransactions();
    } catch (error) {
      alert('Error deleting transaction');
    }
  };

  // Start editing
  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      quantity: transaction.quantity,
      amount: transaction.amount,
      order_status: transaction.order_status
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Save edit
  const saveEdit = async (id) => {
    try {
      await axios.put(`${API_URL}/${id}`, editForm);
      setEditingId(null);
      setEditForm({});
      fetchTransactions();
    } catch (error) {
      alert('Error updating transaction');
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      reference_number: '',
      symbol: '',
      order_side: '',
      order_status: '',
      name: ''
    });
    setTimeout(fetchTransactions, 100);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <h1>📊 Transaction Management System</h1>
          <p>Upload, validate, and manage transaction data</p>
        </div>
      </header>

      <div className="container">
        {/* Upload Section */}
        <section className="card">
          <h2>📤 Upload CSV File</h2>
          <div className="upload-area">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file-input"
            />
            <button 
              onClick={handleUpload} 
              disabled={!selectedFile || loading}
              className="btn btn-primary"
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`alert ${uploadResult.success ? 'alert-success' : 'alert-error'}`}>
              <strong>{uploadResult.message}</strong>
              
              {uploadResult.recordsImported && (
                <p>✅ {uploadResult.recordsImported} records imported</p>
              )}

              {uploadResult.invalidRecords && (
                <div className="invalid-records">
                  <p><strong>❌ Invalid Records ({uploadResult.totalInvalid}):</strong></p>
                  <div className="error-list">
                    {uploadResult.invalidRecords.slice(0, 10).map((record, idx) => (
                      <div key={idx} className="error-item">
                        <strong>Row {record.row}:</strong> {record.errors.join(', ')}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResult.duplicates && (
                <p><strong>Duplicates:</strong> {uploadResult.duplicates.join(', ')}</p>
              )}

              {uploadResult.existing && (
                <p><strong>Already exist:</strong> {uploadResult.existing.join(', ')}</p>
              )}
            </div>
          )}
        </section>

        {/* Filters Section */}
        <section className="card">
          <h2>🔍 Search & Filter</h2>
          <div className="filters">
            <input
              type="text"
              placeholder="Reference Number"
              value={filters.reference_number}
              onChange={(e) => handleFilterChange('reference_number', e.target.value)}
              className="input"
            />
            
            <input
              type="text"
              placeholder="Symbol"
              value={filters.symbol}
              onChange={(e) => handleFilterChange('symbol', e.target.value)}
              className="input"
            />
            
            <input
              type="text"
              placeholder="Name"
              value={filters.name}
              onChange={(e) => handleFilterChange('name', e.target.value)}
              className="input"
            />
            
            <select
              value={filters.order_side}
              onChange={(e) => handleFilterChange('order_side', e.target.value)}
              className="input"
            >
              <option value="">All Sides</option>
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
            </select>
            
            <select
              value={filters.order_status}
              onChange={(e) => handleFilterChange('order_status', e.target.value)}
              className="input"
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="Matched">Matched</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={fetchTransactions} className="btn btn-primary">
              Search
            </button>
            <button onClick={clearFilters} className="btn btn-secondary">
              Clear
            </button>
          </div>
        </section>

        {/* Transactions Table */}
        <section className="card">
          <h2>📋 Transactions ({transactions.length})</h2>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions found</p>
              <small>Upload a CSV file to get started</small>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Ref #</th>
                    <th>Name</th>
                    <th>Symbol</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th>Side</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td><code>{transaction.reference_number}</code></td>
                      <td>{transaction.name}</td>
                      <td><span className="badge">{transaction.symbol}</span></td>
                      
                      {/* Editable Quantity */}
                      <td>
                        {editingId === transaction.id ? (
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                            className="input-small"
                          />
                        ) : (
                          transaction.quantity
                        )}
                      </td>
                      
                      {/* Editable Amount */}
                      <td>
                        {editingId === transaction.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.amount}
                            onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                            className="input-small"
                          />
                        ) : (
                          `$${parseFloat(transaction.amount).toFixed(2)}`
                        )}
                      </td>
                      
                      <td>
                        <span className={`badge ${transaction.order_side === 'Buy' ? 'badge-success' : 'badge-danger'}`}>
                          {transaction.order_side}
                        </span>
                      </td>
                      
                      {/* Editable Status */}
                      <td>
                        {editingId === transaction.id ? (
                          <select
                            value={editForm.order_status}
                            onChange={(e) => setEditForm({...editForm, order_status: e.target.value})}
                            className="input-small"
                          >
                            <option value="Open">Open</option>
                            <option value="Matched">Matched</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span className={`badge badge-${
                            transaction.order_status === 'Open' ? 'warning' :
                            transaction.order_status === 'Matched' ? 'success' : 'secondary'
                          }`}>
                            {transaction.order_status}
                          </span>
                        )}
                      </td>
                      
                      <td><small>{transaction.transaction_date}</small></td>
                      
                      {/* Actions */}
                      <td>
                        {editingId === transaction.id ? (
                          <div className="action-buttons">
                            <button 
                              onClick={() => saveEdit(transaction.id)}
                              className="btn-icon btn-success"
                              title="Save"
                            >
                              ✓
                            </button>
                            <button 
                              onClick={cancelEdit}
                              className="btn-icon btn-secondary"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button 
                              onClick={() => startEdit(transaction)}
                              className="btn-icon btn-primary"
                              title="Edit"
                            >
                              ✎
                            </button>
                            <button 
                              onClick={() => handleDelete(transaction.id)}
                              className="btn-icon btn-danger"
                              title="Delete"
                            >
                              🗑
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>Transaction Management System - Full Stack CRUD Application</p>
      </footer>
    </div>
  );
}

export default App;