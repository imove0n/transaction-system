import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:3001/api/transactions';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filters, setFilters] = useState({
    reference_number: '',
    symbol: '',
    order_side: '',
    order_status: '',
    name: '',
    quantity: '',
    amount: '',
    transaction_date: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

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

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadResult(null);
  };

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
      document.querySelector('input[type="file"]').value = '';
      fetchTransactions();
    } catch (error) {
      const errorData = error.response?.data;
      setUploadResult({
        success: false,
        message: errorData?.message || errorData?.error || 'Error uploading file. Please check the file format and try again.',
        ...(errorData?.invalidRecords && { invalidRecords: errorData.invalidRecords, totalInvalid: errorData.totalInvalid }),
        ...(errorData?.duplicates && { duplicates: errorData.duplicates }),
        ...(errorData?.existing && { existing: errorData.existing })
      });
    }

    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchTransactions();
    } catch (error) {
      alert('Error deleting transaction');
    }
  };

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      quantity: transaction.quantity,
      amount: transaction.amount,
      order_status: transaction.order_status
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      reference_number: '',
      symbol: '',
      order_side: '',
      order_status: '',
      name: '',
      quantity: '',
      amount: '',
      transaction_date: ''
    });
    setTimeout(fetchTransactions, 100);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <div className="logo">T</div>
              <div className="header-title">
                <h1>Transaction Management</h1>
                <p>Enterprise-grade transaction processing system</p>
              </div>
            </div>
            <div className="header-stats">
              <div className="stat-item">
                <span className="stat-label">Total Records</span>
                <span className="stat-value">{transactions.length}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container main-content">
        {/* Upload Section */}
        <section className="card">
          <div className="card-header">
            <h2>
              <span className="card-icon">↑</span>
              CSV File Upload
            </h2>
          </div>
          <div className="card-body">
            <div className="upload-container">
              <div className="upload-area">
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                </div>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Uploading...' : 'Upload File'}
                </button>
              </div>

              {uploadResult && (
                <div className={`alert ${uploadResult.success ? 'alert-success' : 'alert-error'}`}>
                  <strong>{uploadResult.message}</strong>

                  {uploadResult.recordsImported && (
                    <p>{uploadResult.recordsImported} records imported successfully</p>
                  )}

                  {uploadResult.invalidRecords && (
                    <div className="invalid-records">
                      <p><strong>Invalid Records ({uploadResult.totalInvalid}):</strong></p>
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
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="card">
          <div className="card-header">
            <h2>
              <span className="card-icon">⌕</span>
              Search & Filter
            </h2>
          </div>
          <div className="card-body">
            <div className="filters-container">
              <div className="filters">
                <div className="input-group">
                  <label className="input-label">Reference</label>
                  <input
                    type="text"
                    placeholder="Enter reference number"
                    value={filters.reference_number}
                    onChange={(e) => handleFilterChange('reference_number', e.target.value)}
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Symbol</label>
                  <input
                    type="text"
                    placeholder="Enter symbol"
                    value={filters.symbol}
                    onChange={(e) => handleFilterChange('symbol', e.target.value)}
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Name</label>
                  <input
                    type="text"
                    placeholder="Enter name"
                    value={filters.name}
                    onChange={(e) => handleFilterChange('name', e.target.value)}
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Quantity</label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={filters.quantity}
                    onChange={(e) => handleFilterChange('quantity', e.target.value)}
                    className="input"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Amount</label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={filters.amount}
                    onChange={(e) => handleFilterChange('amount', e.target.value)}
                    className="input"
                    step="0.01"
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Order Side</label>
                  <select
                    value={filters.order_side}
                    onChange={(e) => handleFilterChange('order_side', e.target.value)}
                    className="input"
                  >
                    <option value="">All Sides</option>
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Status</label>
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

                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input
                    type="text"
                    placeholder="Transaction date"
                    value={filters.transaction_date}
                    onChange={(e) => handleFilterChange('transaction_date', e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="filter-actions">
                <button onClick={fetchTransactions} className="btn btn-primary">
                  Apply Filters
                </button>
                <button onClick={clearFilters} className="btn btn-secondary">
                  Clear All
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Transactions Table */}
        <section className="card">
          <div className="card-header">
            <h2>
              <span className="card-icon">≡</span>
              Transaction Records
            </h2>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <p>No transactions found</p>
                <small>Upload a CSV file or adjust your filters to view transactions</small>
              </div>
            ) : (
              <div className="table-wrapper">
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Reference</th>
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
                          <td>
                            <span className="badge badge-symbol">{transaction.symbol}</span>
                          </td>

                          <td>
                            {editingId === transaction.id ? (
                              <input
                                type="number"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                                className="input-small"
                              />
                            ) : (
                              transaction.quantity.toLocaleString()
                            )}
                          </td>

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
                              `$${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            )}
                          </td>

                          <td>
                            <span className={`badge ${transaction.order_side === 'Buy' ? 'badge-success' : 'badge-danger'}`}>
                              {transaction.order_side}
                            </span>
                          </td>

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
                                transaction.order_status === 'Matched' ? 'info' : 'secondary'
                              }`}>
                                {transaction.order_status}
                              </span>
                            )}
                          </td>

                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {transaction.transaction_date}
                          </td>

                          <td>
                            {editingId === transaction.id ? (
                              <div className="action-buttons">
                                <button
                                  onClick={() => saveEdit(transaction.id)}
                                  className="btn-icon btn-success"
                                  title="Save Changes"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="btn-icon btn-cancel"
                                  title="Cancel"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="action-buttons">
                                <button
                                  onClick={() => startEdit(transaction)}
                                  className="btn-icon btn-edit"
                                  title="Edit Transaction"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(transaction.id)}
                                  className="btn-icon btn-danger"
                                  title="Delete Transaction"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>Transaction Management System v1.0 - Enterprise Edition</p>
      </footer>
    </div>
  );
}

export default App;
