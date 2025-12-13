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

    const token = localStorage.getItem("token");

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

    const getUserFullName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? `${user.name || ''} ${user.surname || ''}`.trim() : userId || "N/A";
    };

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

    // Calculate Montant Disponible
    const montantDisponible = transactions.reduce((acc, tx) => {
        if (tx.channel?.toLowerCase() === "entrées") {
            if (tx.currency === "$") acc.USD += parseFloat(tx.amount) || 0;
            if (tx.currency === "FC") acc.FC += parseFloat(tx.amount) || 0;
        } else if (tx.channel?.toLowerCase() === "sorties") {
            if (tx.currency === "$") acc.USD -= parseFloat(tx.amount) || 0;
            if (tx.currency === "FC") acc.FC -= parseFloat(tx.amount) || 0;
        }
        return acc;
    }, { USD: 0, FC: 0 });

    // --- EDIT / DELETE HANDLERS OMITTED (same as your code) ---

    return (
        <div className="transactions-container">
            {banner.message && (
                <div className={`toast-notification ${banner.type}`}>
                    {banner.message}
                </div>
            )}
            
            <h1>Admin Transaction Management</h1>

            {/* Montant Disponible Card */}
            <div className="card montant-disponible-card" style={{ margin: "1rem 0", padding: "1rem", borderRadius: "8px", backgroundColor: "#e6f7ff", textAlign: "center" }}>
                <h2>Montant Disponible</h2>
                <p>USD: <strong>${montantDisponible.USD.toFixed(2)}</strong></p>
                <p>FC: <strong>{montantDisponible.FC.toFixed(2)} FC</strong></p>
            </div>

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

            {/* Users Table OMITTED for brevity (keep your existing logic) */}
        </div>
    );
}
