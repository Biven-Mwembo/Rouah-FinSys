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
    const [banner, setBanner] = useState({ message: "", type: "" });
    const [editingUser, setEditingUser] = useState(null); // For edit modal
    const [confirmDeleteId, setConfirmDeleteId] = useState(null); // For delete modal

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

    useEffect(() => {
        fetchAllUsers();
    }, []);

    // Handle edit
    const handleEdit = (user) => {
        const dateValue = user.dob ? new Date(user.dob).toISOString().split('T')[0] : '';
        setEditingUser({ ...user, dob: dateValue });
    };

    const handleCancelEdit = () => setEditingUser(null);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingUser((prev) => ({
            ...prev,
            [name]: value,
        }));
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
            const res = await axios.patch(
                `${API_BASE_URL}/users/${id}`,
                updateData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (res.status === 204) {
                setBanner({ message: "✅ User updated successfully!", type: "success" });
                setEditingUser(null);
                fetchAllUsers();
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.response?.data ||
                error.message ||
                "Failed to update user.";
            setBanner({ message: `❌ Error updating: ${errorMessage}`, type: "error" });
        } finally {
            setTimeout(() => setBanner({ message: "", type: "" }), 4000);
        }
    };

    // Handle delete
    const confirmDelete = (id) => setConfirmDeleteId(id);
    const cancelDelete = () => setConfirmDeleteId(null);

    const handleDelete = async (id) => {
        setConfirmDeleteId(null);
        try {
            const res = await axios.delete(
                `${API_BASE_URL}/users/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (res.status === 204) {
                setBanner({ message: "🗑️ User deleted successfully!", type: "success" });
                setUsers(prev => prev.filter(user => user.id !== id));
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message ||
                error.message ||
                "Failed to delete user.";
            setBanner({ message: `❌ Error deleting: ${errorMessage}`, type: "error" });
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

            <h1>Admin User Management</h1>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="modal-overlay">
                    <form onSubmit={handleUpdate} className="edit-form modal-content">
                        <h3>Edit User #{editingUser.id}</h3>

                        <label>
                            Name:
                            <input
                                type="text"
                                name="name"
                                value={editingUser.name}
                                onChange={handleEditChange}
                                required
                            />
                        </label>
                        <label>
                            Surname:
                            <input
                                type="text"
                                name="surname"
                                value={editingUser.surname}
                                onChange={handleEditChange}
                                required
                            />
                        </label>
                        <label>
                            Email:
                            <input
                                type="email"
                                name="email"
                                value={editingUser.email}
                                onChange={handleEditChange}
                                required
                            />
                        </label>
                        <label>
                            Address:
                            <input
                                type="text"
                                name="address"
                                value={editingUser.address || ""}
                                onChange={handleEditChange}
                            />
                        </label>
                        <label>
                            Date of Birth:
                            <input
                                type="date"
                                name="dob"
                                value={editingUser.dob}
                                onChange={handleEditChange}
                            />
                        </label>
                        <label>
                            Role:
                            <select
                                name="role"
                                value={editingUser.role}
                                onChange={handleEditChange}
                                required
                            >
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
                        <p>
                            Are you sure you want to permanently delete user 
                            <strong> #{confirmDeleteId}</strong>? 
                            This action cannot be undone.
                        </p>
                        <div className="form-actions">
                            <button 
                                className="action-btn delete-confirm-btn" 
                                onClick={() => handleDelete(confirmDeleteId)} 
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

            {/* Users Table */}
            <div className="card">
                <div className="table-header">
                    <h2>All Registered Users</h2>
                </div>

                <div className="table-responsive">
                    <table className="transactions-table admin-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Email</th>
                                <th>Address</th>
                                <th>Date of Birth</th>
                                <th>Role</th>
                                <th>Actions</th>
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
                                        <td>{user.role}</td>
                                        <td>
                                            <button className="action-btn edit-btn" onClick={() => handleEdit(user)}>Edit</button>
                                            <button className="action-btn delete-btn" onClick={() => confirmDelete(user.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="8" className="text-center">No users found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsersPage;
