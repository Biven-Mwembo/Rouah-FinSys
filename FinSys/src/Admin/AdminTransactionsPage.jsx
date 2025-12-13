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
    const [usersLoaded, setUsersLoaded] = useState(false);
    const [banner, setBanner] = useState({ message: "", type: "" });
    const [editingTx, setEditingTx] = useState(null);
    const [confirmDeleteTxId, setConfirmDeleteTxId] = useState(null);
    const [montantDisponible, setMontantDisponible] = useState({ USD: 0, FC: 0 });

    const token = localStorage.getItem("token");

    // --- FETCH ALL USERS
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
                    throw new Error(`[Status ${res.status}] ${errorText || res.statusText}`);
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

    const getUserFullName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.name || ''} ${user.surname || ''}`.trim() : userId || "N/A";
    };

    // --- FETCH ALL TRANSACTIONS
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
                    throw new Error(`[Status ${res.status}] ${errorText || res.statusText}`);
                }
                return res.json();
            })
            .then((data) => {
                // Sort newest to oldest
                const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
                const mappedData = sortedData.map(tx => ({
                    ...tx,
                    userName: getUserFullName(tx.user_id),
                }));
                setTransactions(mappedData);
                calculateMontantDisponible(mappedData);
            })
            .catch((error) =>
                setBanner({ message: `Failed to fetch transactions: ${error.message}`, type: "error" })
            );
    };

    // --- CALCULATE MONTANT DISPONIBLE
    const calculateMontantDisponible = (txData) => {
        let USD = 0;
        let FC = 0;
        txData.forEach(tx => {
            const amount = parseFloat(tx.amount) || 0;
            if (tx.channel?.toLowerCase() === "entrées") {
                if (tx.currency === "$") USD += amount;
                else if (tx.currency === "FC") FC += amount;
            } else if (tx.channel?.toLowerCase() === "sorties") {
                if (tx.currency === "$") USD -= amount;
                else if (tx.currency === "FC") FC -= amount;
            }
        });
        setMontantDisponible({ USD, FC });
    };

    // --- DOWNLOAD PDF / CSV
    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.text("All Transactions", 20, 10);
        autoTable(doc, {
            head: [["User", "Date", "Amount", "Currency", "Channel", "Motif", "Status"]],
            body: transactions.map(tx => [
                tx.userName,
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
            tx.userName,
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

    const handleDownload = () => {
        if (!usersLoaded) {
            setBanner({ message: "⏳ Please wait for data to load before downloading.", type: "error" });
            setTimeout(() => setBanner({ message: "", type: "" }), 4000);
            return;
        }
        const format = window.confirm("Click OK for PDF, Cancel for CSV");
        if (format) downloadPDF();
        else downloadCSV();
    };

    // --- EDIT HANDLERS
    const handleEdit = (transaction) => {
        const dateValue = transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '';
        setEditingTx({ ...transaction, date: dateValue });
    };
    const handleCancelEdit = () => setEditingTx(null);
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingTx(prev => ({ ...prev, [name]: value }));
    };
    const handleUpdate = async (e) => {
        e.preventDefault();
        const { id, date, amount, currency, channel, motif } = editingTx;
        const updateData = { date, amount: parseFloat(amount), currency, channel, motif };
        try {
            const res = await axios.patch(`${API_BASE_URL}/transactions/item/${id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 204 || res.status === 200) {
                setBanner({ message: "✅ Transaction updated successfully!", type: "success" });
                setEditingTx(null);
                fetchAllTransactions();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Failed to update transaction.";
            setBanner({ message: `❌ Error updating: ${errorMessage}`, type: "error" });
        } finally { setTimeout(() => setBanner({ message: "", type: "" }), 4000); }
    };

    // --- DELETE HANDLERS
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
                calculateMontantDisponible(transactions.filter(tx => tx.id !== id));
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Failed to delete transaction.";
            setBanner({ message: `❌ Error deleting: ${errorMessage}`, type: "error" });
        } finally { setTimeout(() => setBanner({ message: "", type: "" }), 4000); }
    };

    useEffect(() => { fetchAllUsers(); fetchAllTransactions(); }, []);
    useEffect(() => { if (usersLoaded) setTransactions(prev => prev.map(tx => ({ ...tx, userName: getUserFullName(tx.user_id) }))); }, [usersLoaded, users]);

    return (
        <div className="transactions-container">
            {banner.message && <div className={`toast-notification ${banner.type}`}>{banner.message}</div>}
            <h1>Admin Transaction Management</h1>

            {/* Montant Disponible */}
            <div style={{ display: "flex", justifyContent: "center", margin: "1.5rem 0" }}>
                <div style={{
                    background: "#ffffff",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    borderRadius: "12px",
                    padding: "1.2rem 2rem",
                    maxWidth: "400px",
                    width: "100%",
                    textAlign: "center",
                }}>
                    <div style={{ fontSize: "0.95rem", color: "#555", marginBottom: "0.5rem" }}>Montant Disponible</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "700", display: "flex", justifyContent: "center", gap: "1rem" }}>
                        <span style={{ color: montantDisponible.USD >= 0 ? "#2ecc71" : "#e74c3c" }}>USD {montantDisponible.USD.toFixed(2)}</span>
                        <span style={{ color: montantDisponible.FC >= 0 ? "#3498db" : "#e74c3c" }}>FC {montantDisponible.FC.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingTx && (
                <div className="modal-overlay">
                    <form onSubmit={handleUpdate} className="edit-form modal-content">
                        <h3>Edit Transaction #{editingTx.id}</h3>
                        <label>Date:<input type="date" name="date" value={editingTx.date} onChange={handleEditChange} required /></label>
                        <label>Amount:<input type="number" step="0.01" name="amount" value={editingTx.amount} onChange={handleEditChange} required /></label>
                        <label>Currency:<input type="text" name="currency" value={editingTx.currency} onChange={handleEditChange} required /></label>
                        <label>Channel:<input type="text" name="channel" value={editingTx.channel} onChange={handleEditChange} required /></label>
                        <label>Motif:<input type="text" name="motif" value={editingTx.motif} onChange={handleEditChange} required /></label>
                        <div className="form-actions">
                            <button type="submit" className="action-btn save-btn">Save Changes</button>
                            <button type="button" onClick={handleCancelEdit} className="action-btn cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Modal */}
            {confirmDeleteTxId && (
                <div className="modal-overlay">
                    <div className="confirm-modal modal-content">
                        <span className="warning-icon">⚠️</span>
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to permanently delete transaction <strong>#{confirmDeleteTxId}</strong>? This action cannot be undone.</p>
                        <div className="form-actions">
                            <button className="action-btn delete-confirm-btn" onClick={() => handleDelete(confirmDeleteTxId)}>Yes, Delete</button>
                            <button type="button" className="action-btn cancel-btn" onClick={cancelDelete}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transactions Table */}
            <div className="card">
                <div className="table-header">
                    <h2>All Transactions</h2>
                    <button className="action-btn download-btn" onClick={handleDownload}>Télécharger</button>
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
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? transactions.map(tx => (
                                <tr key={tx.id}>
                                    <td><strong>{tx.userName}</strong></td>
                                    <td>{formatDate(tx.date)}</td>
                                    <td style={{ color: tx.channel?.toLowerCase() === "sorties" ? "#e74c3c" : "#2ecc71" }}>{tx.amount}</td>
                                    <td>{tx.currency}</td>
                                    <td>{tx.channel}</td>
                                    <td>{tx.motif}</td>
                                    <td>
                                        <span style={{
                                            padding: "0.2rem 0.6rem",
                                            borderRadius: "12px",
                                            color: "#fff",
                                            backgroundColor: tx.status?.toLowerCase() === "approved" ? "#2ecc71" : "#e74c3c",
                                            fontWeight: "600",
                                            fontSize: "0.85rem"
                                        }}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="action-btn edit-btn" onClick={() => handleEdit(tx)}>Edit</button>
                                        <button className="action-btn delete-btn" onClick={() => confirmDelete(tx.id)}>Delete</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="8" className="text-center">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
