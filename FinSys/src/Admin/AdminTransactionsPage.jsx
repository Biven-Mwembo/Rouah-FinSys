import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Transactions.css";
import axios from "axios";

const API_BASE_URL = "https://finsys.onrender.com/api";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date).replace(/-/g, '/');
  } catch (e) {
    return dateString.split('T')[0] || dateString;
  }
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [banner, setBanner] = useState({ message: "", type: "" });
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch all transactions
  const fetchAllTransactions = () => {
    if (!token) {
      setBanner({ message: "Authentication token missing.", type: "error" });
      return;
    }

    fetch(`${API_BASE_URL}/transactions/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          const status = res.status;
          throw new Error(`[Status ${status}] Access Denied or API error: ${errorText || res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        const mappedData = data.map(tx => {
          const userObj = tx.user || tx.userDetails || tx.users;
          const fullName = userObj
            ? `${userObj.name || ''} ${userObj.surname || ''}`.trim()
            : tx.user_id || "Unknown User";
          return { ...tx, userName: fullName };
        });
        setTransactions(mappedData);
      })
      .catch((error) =>
        setBanner({ message: `Failed to fetch data: ${error.message}`, type: "error" })
      );
  };

  // Fetch all users
  const fetchAllUsers = () => {
    if (!token) {
      setBanner({ message: "Authentication token missing.", type: "error" });
      return;
    }

    fetch(`${API_BASE_URL}/users/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          const status = res.status;
          throw new Error(`[Status ${status}] Access Denied or API error: ${errorText || res.statusText}`);
        }
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch((error) =>
        setBanner({ message: `Failed to fetch users: ${error.message}`, type: "error" })
      );
  };

  useEffect(() => {
    fetchAllTransactions();
    fetchAllUsers();
  }, []);

  // Navigate to AdminUpdatePage
  const handleEditClick = (tx) => {
    navigate(`/admin/update/${tx.id}`);
  };

  // Delete handlers
  const confirmDelete = (id) => setConfirmDeleteTxId(id);
  const cancelDelete = () => setConfirmDeleteTxId(null);

  const handleDelete = async (id) => {
    setConfirmDeleteTxId(null);
    try {
      const res = await axios.delete(`${API_BASE_URL}/transactions/item/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if ([200, 202, 204].includes(res.status)) {
        setBanner({ message: "🗑️ Transaction deleted successfully!", type: "success" });
        setTransactions(prev => prev.filter(tx => tx.id !== id));
      } else {
        throw new Error("Unexpected response deleting transaction.");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete transaction.";
      setBanner({ message: `❌ Error deleting: ${errorMessage}`, type: "error" });
    } finally {
      setTimeout(() => setBanner({ message: "", type: "" }), 4000);
    }
  };

  return (
    <div className="transactions-container">
      {banner.message && <div className={`toast-notification ${banner.type}`}>{banner.message}</div>}

      <h1>Admin Transaction Management</h1>

      {/* Transactions Table */}
      <div className="card">
        <div className="table-header">
          <h2>All Transactions</h2>
        </div>
        <div className="table-responsive">
          <table className="transactions-table admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Channel</th>
                <th>Motif</th>
                <th>File</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td><strong>{tx.userName}</strong></td>
                    <td>{formatDate(tx.date)}</td>
                    <td>{tx.amount}</td>
                    <td>{tx.currency}</td>
                    <td>{tx.channel}</td>
                    <td>{tx.motif}</td>
                    <td>{tx.file ? <a href={tx.file} target="_blank" rel="noopener noreferrer">View</a> : "-"}</td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => handleEditClick(tx)}>Edit</button>
                      <button className="action-btn delete-btn" onClick={() => confirmDelete(tx.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="8" className="text-center">No transactions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteTxId && (
        <div className="modal-overlay">
          <div className="confirm-modal modal-content">
            <span className="warning-icon">⚠️</span>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to permanently delete transaction 
              <strong> #{confirmDeleteTxId}</strong>? This action cannot be undone.
            </p>
            <div className="form-actions">
              <button className="action-btn delete-confirm-btn" onClick={() => handleDelete(confirmDeleteTxId)}>Yes, Delete</button>
              <button type="button" className="action-btn cancel-btn" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="table-header"><h2>All Registered Users</h2></div>
        <div className="table-responsive">
          <table className="transactions-table admin-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Nom</th>
                <th>Post-Nom</th>
                <th>Email</th>
                <th>Address</th>
                <th>Date de Naissance</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map(user => (
                  <tr key={user.id}>
                    <td><strong>{user.id}</strong></td>
                    <td>{user.name}</td>
                    <td>{user.surname}</td>
                    <td>{user.email}</td>
                    <td>{user.address || "-"}</td>
                    <td>{user.dob ? formatDate(user.dob) : "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    {banner.message.includes("Access Denied") 
                      ? "Access Denied. Admin privileges required." 
                      : "No users found or data is loading..."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
