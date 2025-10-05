import { useState, useEffect } from "react";
import "./Transactions.css";
import axios from "axios"; // 👈 NEW: Import Axios for reliable PUT requests

// ✅ Set your backend API base URL here
// ✅ Set your backend API base URL here
const API_BASE_URL = "https://finsys.onrender.com/api";


// Function to format date as dd/mm/yy
const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
        const date = new Date(dateString);
        // Fix: Use 'yyyy' for 4-digit year, or keep '2-digit' for 'yy'
        return new Intl.DateTimeFormat('en-GB', {
            year: '2-digit', 
            month: '2-digit',
            day: '2-digit',
        }).format(date);
    } catch (e) {
        return dateString.split('T')[0] || dateString; 
    }
};

// --- Helper function to download data as CSV (Reusable) ---
const downloadGroupedCSVWithTotals = (data, filename) => {
    // Split transactions by channel
    const entrees = data.filter(tx => tx.channel.toLowerCase() === "entrées");
    const sorties = data.filter(tx => tx.channel.toLowerCase() === "sorties");

    const maxRows = Math.max(entrees.length, sorties.length);

    // Header rows
    // Using semicolon (;) as a separator is often better for Excel compatibility
    const headerRow1 = [
        "ENTRÉES", "", "", "", "",
        "SORTIES", "", "", "", ""
    ];
    const headerRow2 = [
        "No", "Date", "Dollars (USD)", "FC", "Motif",
        "No", "Date", "Dollars (USD)", "FC", "Motif"
    ];

    // Data rows
    const dataRows = [];
    let totalEntreeUSD = 0, totalEntreeFC = 0;
    let totalSortieUSD = 0, totalSortieFC = 0;

    for (let i = 0; i < maxRows; i++) {
        const entree = entrees[i] || {};
        const sortie = sorties[i] || {};

        // 🚀 FIX 1: Change currency check from "$" to "USD" to match database/frontend
        const entreeUSD = entree.currency === "USD" ? entree.amount || 0 : 0;
        const entreeFC = entree.currency === "FC" ? entree.amount || 0 : 0;
        totalEntreeUSD += parseFloat(entreeUSD);
        totalEntreeFC += parseFloat(entreeFC);

        // 🚀 FIX 1: Change currency check from "$" to "USD" to match database/frontend
        const sortieUSD = sortie.currency === "USD" ? sortie.amount || 0 : 0;
        const sortieFC = sortie.currency === "FC" ? sortie.amount || 0 : 0;
        totalSortieUSD += parseFloat(sortieUSD);
        totalSortieFC += parseFloat(sortieFC);

        dataRows.push([
            i + 1,
            entree.date ? formatDate(entree.date) : "",
            entreeUSD || "",
            entreeFC || "",
            entree.motif || "",

            i + 1,
            sortie.date ? formatDate(sortie.date) : "",
            sortieUSD || "",
            sortieFC || "",
            sortie.motif || ""
        ]);
    }

    // Totals row
    const totalsRow = [
        "TOTAL",
        "",
        // Ensure totals are formatted correctly (to two decimal places is common)
        totalEntreeUSD.toFixed(2), 
        totalEntreeFC.toFixed(2),
        "",
        "TOTAL",
        "",
        totalSortieUSD.toFixed(2),
        totalSortieFC.toFixed(2),
        ""
    ];

    // Combine everything, using semicolon (;) as the delimiter for better Excel compatibility
    const allRows = [headerRow1, headerRow2, ...dataRows, totalsRow];
    const csvContent =
        // 🚀 FIX 2: Use text/csv for content type, but use a delimiter Excel understands (e.g., semicolon)
        "data:text/csv;charset=utf-8," + 
        allRows.map(e => e.join(";")).join("\n"); // Use join(";")

    // Trigger download
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    
    // 🚀 FIX 3: Change the file extension to .xls (Excel)
    // This trick makes Excel open the CSV file in the expected format automatically.
    const excelFilename = filename.replace(/\.csv$/i, ".xls");
    link.download = excelFilename; 
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// -----------------------------------------------------------

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState([]);
    const [banner, setBanner] = useState({ message: "", type: "" });
    const [editingTx, setEditingTx] = useState(null); 
    
    const token = localStorage.getItem("token");

    // Fetch ALL transactions 
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
                // Read the response body for better error details
                const errorText = await res.text(); 
                // Status 401/403 often means "Access Denied" due to bad token/role
                const status = res.status;
                throw new Error(`[Status ${status}] Access Denied or API error: ${errorText || res.statusText}`);
            }
            return res.json();
          })
          .then((data) => {
            
            const mappedData = data.map(tx => {
                // 🚀 CRITICAL FIX: The joined object is now likely named 'userDetails' 
                // (lowercase of the C# property) or 'user_id' (from Supabase/PostgREST).
                // We check all possibilities for robustness.
                const userObj = tx.userDetails || tx.user_id || tx.users;
                
                // Determine the full name: User object has 'name' and 'surname'
                const fullName = userObj 
                    ? `${userObj.name || ''} ${userObj.surname || ''}`.trim() 
                    : "Unknown User";
                
                return {
                    ...tx,
                    // Add the display name property required by the table/CSV
                    userName: fullName, 
                };
            });
            setTransactions(mappedData);
          })
          .catch((error) =>
            setBanner({ 
                message: `Failed to fetch data: ${error.message}`, 
                type: "error" 
            })
          );
    };

    useEffect(() => {
        fetchAllTransactions();
        // NOTE: useEffect depends on fetchAllTransactions if it were defined outside, 
        // but here it correctly runs only once after component mount (and after token is available/changed).
    }, []);


    // Handler for opening the edit form/modal
    const handleEdit = (transaction) => {
        // Ensure the date is formatted for the input type="date"
        const dateValue = transaction.date ? transaction.date.split('T')[0] : '';
        setEditingTx({
            ...transaction,
            date: dateValue // Set the date property for the form input
        }); 
    };

    // Handler for closing the edit form/modal
    const handleCancelEdit = () => {
        setEditingTx(null);
    };

    // Handler for changing form fields during edit
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditingTx((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // Handler for executing the update API call
    const handleUpdate = async (e) => {
        e.preventDefault();
        
        // Use the date from the form, which is already in 'YYYY-MM-DD' format
        const { id, date, amount, currency, channel, motif } = editingTx;
        
        // Data payload must match C# TransactionUpdateRequest DTO
        const updateData = { 
            date: date, 
            // 🚀 IMPORTANT: Convert amount to a number for C# decimal type
            amount: parseFloat(amount), 
            currency: currency, 
            channel: channel, 
            motif: motif 
        };

        try {
            // 🚀 FIX: Switching to axios for reliable PUT request handling
            const res = await axios.put(
                `${API_BASE_URL}/transactions/${id}`, 
                updateData, // Data payload
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Axios treats 204 (NoContent from your C# controller) as a success
            if (res.status === 204 || res.status === 200) {
                setBanner({ message: "✅ Transaction updated successfully!", type: "success" });
                setEditingTx(null); 
                fetchAllTransactions(); 
            }
        } catch (error) {
            // Axios error handling: get the specific error message from the response
            const errorMessage = error.response?.data?.message 
                || error.response?.data 
                || error.message 
                || "Failed to update transaction.";

            setBanner({ message: `❌ Error updating: ${errorMessage}`, type: "error" });
        } finally {
            setTimeout(() => setBanner({ message: "", type: "" }), 4000);
        }
    }; // 👈 End of handleUpdate function

    // Handler for deleting a transaction
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (res.ok) {
                setBanner({ message: "🗑️ Transaction deleted successfully!", type: "success" });
                // Optimistically update the UI
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
            {/* Toast Notification */}
            {banner.message && (
                <div className={`toast-notification ${banner.type}`}> 
                    {banner.message}
                </div>
            )}

            <h1>Admin Transaction Management</h1>
            <p>View, update, and delete all financial records across all users.</p>
            
            {/* Edit Form/Modal */}
            {editingTx && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Transaction #{editingTx.id}</h3>
                        <form onSubmit={handleUpdate} className="admin-edit-form">
                            <label>Date: <input type="date" name="date" 
                                value={editingTx.date} // This is already in 'YYYY-MM-DD' from handleEdit
                                onChange={handleEditChange} required /></label>
                            <label>Amount: <input type="number" name="amount" value={editingTx.amount} onChange={handleEditChange} required /></label>
                            <label>Currency: 
                                <select name="currency" value={editingTx.currency} onChange={handleEditChange}>
                                    <option value="USD">USD</option>
                                    <option value="FC">FC</option>
                                </select>
                            </label>
                            <label>Channel: 
                                <select name="channel" value={editingTx.channel} onChange={handleEditChange}>
                                    <option value="Entrées">Entrées</option>
                                    <option value="Sorties">Sorties</option>
                                </select>
                            </label>
                            <label className="full-width">Motif: <input type="text" name="motif" value={editingTx.motif} onChange={handleEditChange} required /></label>
                            
                            <div className="modal-actions">
                                <button type="button" onClick={handleCancelEdit} className="btn-cancel">Cancel</button>
                                <button type="submit" className="btn-confirm">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="card">
                <div className="table-header">
                    <h2>All Transactions</h2>
                    <button 
    className="download-btn-small" 
    onClick={() => downloadGroupedCSVWithTotals(transactions, 'admin_transactions_grouped.csv')}
    disabled={transactions.length === 0}
>
    ⬇ Download All CSV
</button>

                </div>

                {/* ✅ Scrollable container */}
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
                                            <button className="action-btn edit-btn" onClick={() => handleEdit(tx)}>
                                                Edit
                                            </button>
                                            <button className="action-btn delete-btn" onClick={() => handleDelete(tx.id)}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center">
                                        {banner.message.includes("Access Denied") ? (
                                            <>Access Denied. You may not have administrative privileges.</>
                                        ) : (
                                            <>No transactions found or data is loading...</>
                                        )}
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