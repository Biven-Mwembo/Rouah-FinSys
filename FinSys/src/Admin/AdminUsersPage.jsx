import { useState, useEffect } from "react";
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

const AdminUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [performanceData, setPerformanceData] = useState(null);
    const [banner, setBanner] = useState({ message: "", type: "" });
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const token = localStorage.getItem("token");

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
                    throw new Error(`[Status ${res.status}] ${errorText || res.statusText}`);
                }
                return res.json();
            })
            .then((data) => setUsers(data))
            .catch((error) =>
                setBanner({ message: `Failed to fetch users: ${error.message}`, type: "error" })
            );
    };

    // Fetch transactions and calculate performance data
    const fetchPerformanceData = () => {
        if (!token) return;

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
                setTransactions(data);
                calculatePerformance(data);
            })
            .catch((error) =>
                setBanner({ message: `Failed to fetch transactions: ${error.message}`, type: "error" })
            );
    };

    // Calculate performance metrics (MODIFIED)
    const calculatePerformance = (txData) => {
        if (!txData || txData.length === 0) {
            setPerformanceData(null);
            return;
        }

        // --- FILTER FOR APPROVED TRANSACTIONS FOR BALANCE CALCULATION ---
        const approvedTxData = txData.filter(tx => tx.status?.toLowerCase() === 'approved');
        
        const totalTx = txData.length; // Count ALL transactions (approved or not) for general performance stats

        // Count transactions per user (using ALL transactions)
        const userTxCounts = {};
        txData.forEach(tx => {
            const userId = tx.user_id || tx.user?.id;
            if (userId) {
                userTxCounts[userId] = (userTxCounts[userId] || 0) + 1;
            }
        });

        // Find top user
        let topUser = null;
        let maxCount = 0;
        Object.entries(userTxCounts).forEach(([userId, count]) => {
            if (count > maxCount) {
                maxCount = count;
                const user = users.find(u => u.id === userId);
                topUser = user ? { ...user, txCount: count } : { id: userId, name: "Unknown", surname: "", txCount: count };
            }
        });

        // Aggregate amounts by channel and currency (using ONLY APPROVED transactions for aggregates/balance)
        const aggregates = { entrees: { usd: 0, fc: 0 }, sorties: { usd: 0, fc: 0 } };
        const userContributions = {}; // This stat will also use APPROVED transactions to show effective contribution

        approvedTxData.forEach(tx => {
            const userId = tx.user_id || tx.user?.id;
            const channel = tx.channel?.toLowerCase();
            const currency = tx.currency;
            const amount = parseFloat(tx.amount) || 0;

            if (channel === "entrées") {
                if (currency === "$") aggregates.entrees.usd += amount;
                else if (currency === "FC") aggregates.entrees.fc += amount;
            } else if (channel === "sorties") {
                if (currency === "$") aggregates.sorties.usd += amount;
                else if (currency === "FC") aggregates.sorties.fc += amount;
            }

            // User contributions (using APPROVED data for accurate performance)
            if (userId) {
                if (!userContributions[userId]) userContributions[userId] = { entrees: { usd: 0, fc: 0 }, sorties: { usd: 0, fc: 0 } };
                if (channel === "entrées") {
                    if (currency === "$") userContributions[userId].entrees.usd += amount;
                    else if (currency === "FC") userContributions[userId].entrees.fc += amount;
                } else if (channel === "sorties") {
                    if (currency === "$") userContributions[userId].sorties.usd += amount;
                    else if (currency === "FC") userContributions[userId].sorties.fc += amount;
                }
            }
        });

        // Recalculate Top User Contributions based on the new APPROVED logic
        const topUserContributions = topUser ? userContributions[topUser.id] || { entrees: { usd: 0, fc: 0 }, sorties: { usd: 0, fc: 0 } } : null;

        setPerformanceData({
            totalTx,
            topUser,
            aggregates,
            topUserContributions,
        });
    };

    useEffect(() => {
        fetchAllUsers();
        fetchPerformanceData();
    }, []);

    // Re-run performance calculation if users or all transactions data changes
    useEffect(() => {
        if (transactions.length > 0 && users.length > 0) {
            calculatePerformance(transactions);
        }
    }, [users, transactions]);

    // Montant Disponible = Entrées (Approved) - Sorties (Approved)
    const montantDisponible = {
        USD: (performanceData?.aggregates?.entrees?.usd || 0) - (performanceData?.aggregates?.sorties?.usd || 0),
        FC: (performanceData?.aggregates?.entrees?.fc || 0) - (performanceData?.aggregates?.sorties?.fc || 0),
    };

    // Handle edit (Unchanged)
    const handleEdit = (user) => {
        const dateValue = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
        setEditingUser({ ...user, dob: dateValue });
    };

    const handleCancelEdit = () => setEditingUser(null);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingUser((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        const { id, name, surname, email, address, dob, role } = editingUser;

        const updateData = {
            id,
            name,
            surname,
            email,
            address,
            dob: dob ? new Date(dob).toISOString() : null,
            role,
        };

        try {
            const res = await axios.patch(`${API_BASE_URL}/users/${id}`, updateData, {
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });

            if (res.status === 204) {
                setBanner({ message: "✅ User updated successfully!", type: "success" });
                setEditingUser(null);
                fetchAllUsers(); // Re-fetch users
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.response?.data || error.message || "Failed to update user.";
            setBanner({ message: `❌ Error updating: ${errorMessage}`, type: "error" });
        } finally {
            setTimeout(() => setBanner({ message: "", type: "" }), 4000);
        }
    };

    // Handle delete (Unchanged)
    const confirmDelete = (id) => setConfirmDeleteId(id);
    const cancelDelete = () => setConfirmDeleteId(null);

    const handleDelete = async (id) => {
        setConfirmDeleteId(null);
        try {
            const res = await axios.delete(`${API_BASE_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 204) {
                setBanner({ message: "🗑️ User deleted successfully!", type: "success" });
                setUsers(prev => prev.filter(user => user.id !== id));
                // Note: The transaction performance will automatically update via the useEffect hook triggered by user change
                // For immediate update, we'd need to re-fetch transactions, but relying on the useEffect chain is cleaner.
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Failed to delete user.";
            setBanner({ message: `❌ Error deleting: ${errorMessage}`, type: "error" });
        } finally {
            setTimeout(() => setBanner({ message: "", type: "" }), 4000);
        }
    };

    return (
        <div className="transactions-container">
            {banner.message && <div className={`toast-notification ${banner.type}`}>{banner.message}</div>}

            <h1>Admin User Management</h1>

            {/* Performance Card */}
            {performanceData && (
                <div className="card" style={{ marginBottom: "2rem" }}>
                    <div className="table-header"><h2>Performance Metrics</h2></div>
                    <div style={{ padding: "1rem" }}>
                        {/* Top Contributor */}
                        <div style={{ marginBottom: "1rem" }}>
                            <h3>Top Contributor</h3>
                            {performanceData.topUser ? (
                                <p>
                                    <strong>{performanceData.topUser.name} {performanceData.topUser.surname}</strong> added the most transactions (total): 
                                    {performanceData.topUser.txCount} out of {performanceData.totalTx}.
                                </p>
                            ) : (
                                <p>No transactions found.</p>
                            )}
                        </div>

                        {/* Montant Disponible Card (UPDATED TEXT) */}
                        <div className="card montant-disponible-card" style={{ marginBottom: "1rem", backgroundColor: "#e6f7ff", padding: "1rem", borderRadius: "8px", textAlign: "center" }}>
                            <h3>Montant Disponible (Approuvé)</h3>
                            <p>USD: <strong>${montantDisponible.USD.toFixed(2)}</strong></p>
                            <p>FC: <strong>{montantDisponible.FC.toFixed(2)} FC</strong></p>
                        </div>

                        {/* Entrées (MODIFIED TEXT) */}
                        <div style={{ marginBottom: "1rem" }}>
                            <h3>Entrées (Approuvées)</h3>
                            <p>Total: ${performanceData.aggregates.entrees.usd.toFixed(2)} | {performanceData.aggregates.entrees.fc.toFixed(2)} FC</p>
                            {performanceData.topUser && performanceData.topUserContributions ? (
                                <>
                                    <p><strong>{performanceData.topUser.name}'s Contribution (Approuvée):</strong></p>
                                    <div>
                                        <label>$: {performanceData.topUserContributions.entrees.usd.toFixed(2)} / ${performanceData.aggregates.entrees.usd.toFixed(2)}</label>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${performanceData.aggregates.entrees.usd > 0 ? (performanceData.topUserContributions.entrees.usd / performanceData.aggregates.entrees.usd) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label>FC: {performanceData.topUserContributions.entrees.fc.toFixed(2)} / {performanceData.aggregates.entrees.fc.toFixed(2)} FC</label>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${performanceData.aggregates.entrees.fc > 0 ? (performanceData.topUserContributions.entrees.fc / performanceData.aggregates.entrees.fc) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                </>
                            ) : <p>No approved contributions.</p>}
                        </div>

                        {/* Sorties (MODIFIED TEXT) */}
                        <div>
                            <h3>Sorties (Approuvées)</h3>
                            <p>Total: ${performanceData.aggregates.sorties.usd.toFixed(2)} | {performanceData.aggregates.sorties.fc.toFixed(2)} FC</p>
                            {performanceData.topUser && performanceData.topUserContributions ? (
                                <>
                                    <p><strong>{performanceData.topUser.name}'s Contribution (Approuvée):</strong></p>
                                    <div>
                                        <label>$: {performanceData.topUserContributions.sorties.usd.toFixed(2)} / ${performanceData.aggregates.sorties.usd.toFixed(2)}</label>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${performanceData.aggregates.sorties.usd > 0 ? (performanceData.topUserContributions.sorties.usd / performanceData.aggregates.sorties.usd) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label>FC: {performanceData.topUserContributions.sorties.fc.toFixed(2)} / {performanceData.aggregates.sorties.fc.toFixed(2)} FC</label>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${performanceData.aggregates.sorties.fc > 0 ? (performanceData.topUserContributions.sorties.fc / performanceData.aggregates.sorties.fc) * 100 : 0}%` }}></div>
                                        </div>
                                    </div>
                                </>
                            ) : <p>No approved contributions.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal-overlay">
                    <form onSubmit={handleUpdate} className="edit-form modal-content">
                        <h3>Edit User #{editingUser.id}</h3>
                        <label>Name:<input type="text" name="name" value={editingUser.name} onChange={handleEditChange} required /></label>
                        <label>Surname:<input type="text" name="surname" value={editingUser.surname} onChange={handleEditChange} required /></label>
                        <label>Email:<input type="email" name="email" value={editingUser.email} onChange={handleEditChange} required /></label>
                        <label>Address:<input type="text" name="address" value={editingUser.address || ""} onChange={handleEditChange} /></label>
                        <label>Date of Birth:<input type="date" name="dob" value={editingUser.dob} onChange={handleEditChange} /></label>
                        <label>Role:
                            <select name="role" value={editingUser.role} onChange={handleEditChange} required>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="financier">Financier</option>
                                <option value="vice-president">Vice-President</option>
                                <option value="pasteur">Pasteur</option>
                            </select>
                        </label>
                        <div className="form-actions">
                            <button type="submit" className="action-btn save-btn">Save Changes</button>
                            <button type="button" onClick={handleCancelEdit} className="action-btn cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="modal-overlay">
                    <div className="confirm-modal modal-content">
                        <span className="warning-icon">⚠️</span>
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to permanently delete user <strong>#{confirmDeleteId}</strong>? This action cannot be undone.</p>
                        <div className="form-actions">
                            <button className="action-btn delete-confirm-btn" onClick={() => handleDelete(confirmDeleteId)}>Yes, Delete</button>
                            <button type="button" className="action-btn cancel-btn" onClick={cancelDelete}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="card">
                <div className="table-header"><h2>All Registered Users</h2></div>
                <div className="table-responsive">
                    <table className="transactions-table admin-table">
                        <thead>
                            <tr>
                                <th>User ID</th><th>Name</th><th>Surname</th><th>Email</th><th>Address</th><th>Date of Birth</th><th>Role</th><th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? users.map(user => (
                                <tr key={user.id}>
                                    <td><strong>{user.id}</strong></td>
                                    <td>{user.name}</td>
                                    <td>{user.surname}</td>
                                    <td>{user.email}</td>
                                    <td>{user.address || "-"}</td>
                                    <td>{user.dob ? formatDate(user.dob) : "-"}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <button className="action-btn edit-btn" onClick={() => handleEdit(user)}>Edit</button>
                                        <button className="action-btn delete-btn" onClick={() => confirmDelete(user.id)}>Delete</button>
                                    </td>
                                </tr>
                            )) : <tr><td colSpan="8" className="text-center">No users found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersPage;
