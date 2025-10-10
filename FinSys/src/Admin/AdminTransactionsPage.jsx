import { useState, useEffect } from "react";
import "./Transactions.css";
import axios from "axios";

const API_BASE_URL = "https://finsys.onrender.com/api";

const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-GB', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
        }).format(date);
    } catch (e) {
        return dateString.split('T')[0] || dateString;
    }
};

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [users, setUsers] = useState([]); // ✅ NEW: Users state
    const [banner, setBanner] = useState({ message: "", type: "" });
    const [editingTx, setEditingTx] = useState(null);

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
                const mappedData = data.map(tx => {
                    const userObj = tx.userDetails || tx.user_id || tx.users;
                    const fullName = userObj ? `${userObj.name || ''} ${userObj.surname || ''}`.trim() : "Unknown User";
                    return {
                        ...tx,
                        userName: fullName,
                    };
                });
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
            .then((data) => setUsers(data))
            .catch((error) =>
                setBanner({ message: `Failed to fetch users: ${error.message}`, type: "error" })
            );
    };

    useEffect(() => {
        fetchAllTransactions();
        fetchAllUsers(); // ✅ NEW: Load users on mount
    }, []);

    // --- (Keep your existing edit, update, delete functions as they are) ---
    const handleEdit = (transaction) => {
        const dateValue = transaction.date ? transaction.date.split('T')[0] : '';
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
            const res = await axios.put(
                `${API_BASE_URL}/transactions/${id}`,
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

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this transaction?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setBanner({ message: "🗑️ Transaction deleted successfully!", type: "success" });
                setTransactions(prev => prev.filter(tx => tx.id !== id));
            } else {
                const errorText = await res.text();
                throw new Error(errorText || res.statusText || "Failed to delete transaction.");
            }
        } catch (error) {
            setBanner({ message: `❌ Error deleting: ${error.message}`, type: "error" });
        } finally {
            setTimeout(() => setBanner({ message: "", type: "" }), 4000);
        }
    };

    return (
        <div className="transactions-container">
            {banner.message && (
                <div className={`toast-notification ${banner.type}`}>
                    {banner.message}
                </div>
            )}

            <h1>Admin Transaction Management</h1>
            

            {/* Existing Transactions Table */}
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
                                            <button className="action-btn edit-btn" onClick={() => handleEdit(tx)}>Edit</button>
                                            <button className="action-btn delete-btn" onClick={() => handleDelete(tx.id)}>Delete</button>
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

            {/* ✅ NEW USERS TABLE */}
            <div className="card" style={{ marginTop: "2rem" }}>
                <div className="table-header">
                    <h2>All Registered Users</h2>
                </div>

                <div className="table-responsive">
                    <table className="transactions-table admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Date of Birth</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.name}</td>
                                        <td>{user.surname}</td>
                                        <td>{user.email}</td>
                                        <td>{user.address || "-"}</td>
                                        <td>{user.dob ? formatDate(user.dob) : "-"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center">
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
