import { useState, useEffect } from "react";
import "./Transactions.css";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = "https://finsys.onrender.com/api";

const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        // Using 'en-CA' format for YYYY-MM-DD
        return new Intl.DateTimeFormat('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(date).replace(/-/g, '/'); // Format for display
    } catch (e) {
        return dateString.split('T')[0] || dateString;
    }
};

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [users, setUsers] = useState([]);
    const [usersLoaded, setUsersLoaded] = useState(false);
    const [banner, setBanner] = useState({ message: "", type: "" });
    const [editingTx, setEditingTx] = useState(null);
    const [confirmDeleteTxId, setConfirmDeleteTxId] = useState(null);

    const token = localStorage.getItem("token");

    // ✅ FETCH ALL TRANSACTIONS
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
                const mappedData = data.map(tx => ({
                    ...tx,
                    userName: getUserFullName(tx.user_id),
                }));
                setTransactions(mappedData);
            })
            .catch((error) =>
                setBanner({ message: `Failed to fetch data: ${error.message}`, type: "error" })
            );
    };

    // ✅ FETCH ALL USERS
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
            .then((data) => {
                setUsers(data);
                setUsersLoaded(true);
            })
            .catch((error) =>
                setBanner({ message: `Failed to fetch users: ${error.message}`, type: "error" })
            );
    };

    // ✅ Helper function to get full user name
    const getUserFullName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.name || ''} ${user.surname || ''}`.trim() : userId || "N/A";
    };

    // ✅ DOWNLOAD FUNCTIONS
    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text("All Transactions", 20, 10);
        autoTable(doc, {
            head: [["User", "Date", "Amount", "Currency", "Channel", "Motif", "Status"]],
            body: transactions.map(tx => [
                tx.userName,  // ✅ Full name
                formatDate(tx.date),
                tx.amount,
                tx.currency,
                tx.channel,
                tx.motif,
                tx.status,
            ]),
        });
        doc.save("all_transactions.pdf");
    };

    const downloadCSV = () => {
        const csvHeaders = ["User", "Date", "Amount", "Currency", "Channel", "Motif", "Status"];
        const csvRows = transactions.map(tx => [
            tx.userName,  // ✅ Full name
            formatDate(tx.date),
            tx.amount,
            tx.currency,
            tx.channel,
            tx.motif,
            tx.status,
        ]);
        const csvContent = [csvHeaders, ...csvRows].map(row => row.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "all_transactions.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    // ✅ UPDATED: Check if users are loaded before downloading
    const handleDownload = () => {
        if (!usersLoaded) {
            setBanner({ message: "⏳ Please wait for data to load before downloading.", type: "error" });
            setTimeout(() => setBanner({ message: "", type: "" }), 4000);
            return;
        }
        const format = window.confirm("Click OK for PDF, Cancel for CSV");
        if (format) {
            downloadPDF();
        } else {
            downloadCSV();
        }
    };

    useEffect(() => {
        fetchAllTransactions();
        fetchAllUsers();
    }, []);

    useEffect(() => {
        if (usersLoaded && transactions.length > 0) {
            setTransactions(prev => prev.map(tx => ({
                ...tx,
                userName: getUserFullName(tx.user_id),
            })));
        }
    }, [usersLoaded, users]);

    // --- EDIT HANDLERS ---
    const handleEdit = (transaction) => {
        console.log("Editing transaction ID:", transaction.id);
        const dateValue = transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '';
        setEditingTx({ ...transaction, date: dateValue });
    };
    const handleCancelEdit = () => setEditingTx(null);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingTx((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const { id, date, amount, currency, channel, motif } = editingTx;

        const updateData = {
            date: date,
            amount: parseFloat(amount),
            currency: currency,
            channel: channel,
            motif: motif,
        };

        try {
            console.log(`PATCH URL: ${API_BASE_URL}/transactions/item/${id}`);
            const res = await axios.patch(
                `${API_BASE_URL}/transactions/item/${id}`,
                updateData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.status === 204 || res.status === 200) {
                setBanner({ message: "✅ Transaction updated successfully!", type: "success" });
                setEditingTx(null);
                fetchAllTransactions();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data ||
                error.message ||
                "Failed to update transaction.";
            setBanner({ message: `❌ Error updating: ${errorMessage}`, type: "error" });
        } finally {
            setTimeout(() => setBanner({ message: "", type: "" }), 4000);
        }
    };
    
    // --- DELETE HANDLERS ---
    const confirmDelete = (id) => {
        setConfirmDeleteTxId(id);
    };

    const cancelDelete = () => {
        setConfirmDeleteTxId(null);
    };
    
    const handleDelete = async (id) => {
        setConfirmDeleteTxId(null);

        try {
            const res = await axios.delete(
                `${API_BASE_URL}/transactions/item/${id}`,
                {
                    headers: { 
                        Authorization: `Bearer ${token}` 
                    },
                }
            );

            if (res.status === 204 || res.status === 200 || res.status === 202) {
                setBanner({ message: "🗑️ Transaction deleted successfully!", type: "success" });
                setTransactions(prev => prev.filter(tx => tx.id !== id));
            } else {
                throw new Error("Failed to delete transaction with an unexpected response.");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.message || 
                "Failed to delete transaction. Please check API/database logs.";
            setBanner({ message: `❌ Error deleting: ${errorMessage}`, type: "error" });
        } finally {
            setTimeout(() => setBanner({ message: "", type: "" }), 4000);
        }
    };

    // --- RENDER ---
    return (
        <div className="transactions-container">
            {banner.message && (
                <div className={`toast-notification ${banner.type}`}>
                    {banner.message}
                </div>
            )}
            
            <h1>Admin Transaction Management</h1>

            {/* 📝 EDIT TRANSACTION MODAL */}
            {editingTx && (
                <div className="modal-overlay">
                    <form onSubmit={handleUpdate} className="edit-form modal-content">
                        <h3>Edit Transaction #{editingTx.id}</h3>
                        
                        <label>
                            Date:
                            <input
                                type="date"
                                name="date"
                                value={editingTx.date}
                                onChange={handleEditChange}
                                required
                            />
                        </label>
                        <label>
                            Amount:
                            <input
                                type="number"
                                name="amount"
                                value={editingTx.amount}
                                onChange={handleEditChange}
                                step="0.01"
                                required
                            />
                        </label>
                        <label>
                            Currency:
                            <input
                                type="text"
                                name="currency"
                                value={editingTx.currency}
                                onChange={handleEditChange}
                                required
                            />
                        </label>
                        <label>
                            Channel:
                            <input
                                type="text"
                                name="channel"
                                value={editingTx.channel}
                                onChange={handleEditChange}
                                required
                            />
                        </label>
                        <label>
                            Motif:
                            <input
                                type="text"
                                name="motif"
                                value={editingTx.motif}
                                onChange={handleEditChange}
                                required
                            />
                        </label>
                        <div className="form-actions">
                            <button type="submit" className="action-btn save-btn">Save Changes</button>
                            <button type="button" onClick={handleCancelEdit} className="action-btn cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* 🗑️ DELETE CONFIRMATION MODAL */}
            {confirmDeleteTxId && (
                <div className="modal-overlay">
                    <div className="confirm-modal modal-content">
                        <span className="warning-icon">⚠️</span>
                        <h3>Confirm Deletion</h3>
                        <p>
                            Are you sure you want to permanently delete transaction 
                            <strong> #{confirmDeleteTxId}</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="form-actions">
                            <button 
                                className="action-btn delete-confirm-btn" 
                                onClick={() => handleDelete(confirmDeleteTxId)} 
                            >
                                Yes, Delete
                            </button>
                            <button 
                                type="button" 
                                className="action-btn cancel-btn" 
                                onClick={cancelDelete} 
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Existing Transactions Table */}
            <div className="card">
                <div className="table-header">
                    <h2>All Transactions</h2>
                    <button className="action-btn download-btn" onClick={handleDownload}>
                        Télécharger
                    </button>
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
                                            <button className="action-btn edit-btn" onClick={() => handleEdit(tx)}>Edit</button>
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

            {/* All Registered Users Table (Unchanged logic) */}
            <div className="card" style={{ marginTop: "2rem" }}>
                <div className="table-header">
                    <h2>All Registered Users</h2>
                </div>
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
                                users.map((user) => (
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
