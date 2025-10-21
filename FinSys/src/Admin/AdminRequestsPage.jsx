import React, { useEffect, useState } from "react";
import "./AdminRequests.css";

const API_BASE_URL = "https://finsys.onrender.com/api";

const AdminRequestsPage = () => {
    // State for data
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for Modals and Toasts
    const [showModal, setShowModal] = useState(false);
    const [actionDetails, setActionDetails] = useState({ id: null, action: "" });
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState("success"); // 'success' or 'error'

    const token = localStorage.getItem("token");

    // --- Helper Functions ---

    const showNotification = (message, type) => {
        setToastMessage(message);
        setToastType(type);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000); // Hide after 3 seconds
    };

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/transactions/pending`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorBody || response.statusText}`);
            }

            const data = await response.json();
            setRequests(data);
        } catch (error) {
            console.error("Error fetching requests:", error);
            showNotification(`Failed to load requests. Details: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // 1. Initial click sets up the modal
    const handleAction = (id, action) => {
        setActionDetails({ id, action });
        setShowModal(true);
    };

    

// 2. Confirmation from the modal triggers the API call
const confirmAction = async () => {
    const { id, action } = actionDetails;
    if (!id || !action) return;

    setShowModal(false); // Close modal immediately

    try {
        // ⭐ CRITICAL FIX: Add 'item' segment to the URL path
        const url = `${API_BASE_URL}/transactions/item/${id}/${action.toLowerCase()}`; // <--- ROUTE FIX HERE
        
        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`
            },
        });

        if (response.ok) {
            // Update Frontend State on Success
            setRequests(prev =>
                prev.filter(req => req.id !== id) // Remove transaction from pending list
            );
            showNotification(`✅ Transaction successfully ${action.toLowerCase()}.`, 'success');

        } else {
            const errorText = await response.text();
            throw new Error(`Status: ${response.status}. Message: ${errorText || response.statusText}`);
        }
    } catch (error) {
        console.error(`Error ${action} request:`, error);
        showNotification(`❌ Failed to ${action.toLowerCase()} the request. Details: ${error.message}`, 'error');
    } finally {
        setActionDetails({ id: null, action: "" }); // Reset details
    }
};


    // --- Component JSX ---

    // Simple Modal Component
    const ConfirmationModal = () => {
        const actionText = actionDetails.action.toLowerCase();
        return (
            <div className="modal-overlay" style={modalStyles.overlay}>
                <div className="modal-content" style={modalStyles.content}>
                    <h3>Confirm Action</h3>
                    <p>Are you sure you want to **{actionText}** this transaction?</p>
                    <div style={modalStyles.actions}>
                        <button 
                            className="btn decline" 
                            onClick={() => setShowModal(false)}
                            style={{ ...modalStyles.button, backgroundColor: '#f44336' }}
                        >
                            Cancel
                        </button>
                        <button 
                            className="btn approve" 
                            onClick={confirmAction}
                            style={{ ...modalStyles.button, backgroundColor: '#4CAF50' }}
                        >
                            {actionDetails.action}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Simple Toast Component
    const Toast = () => (
        <div 
            className={`toast ${toastType}`} 
            style={{ 
                ...toastStyles.base, 
                ...(showToast ? toastStyles.show : toastStyles.hide),
                backgroundColor: toastType === 'success' ? '#4CAF50' : '#f44336'
            }}
        >
            {toastMessage}
        </div>
    );


    return (
        <div className="admin-container">
            {showModal && <ConfirmationModal />}
            <Toast />
            
            <h2>Requests</h2>
            <div className="card">
                <p>Approve or reject transaction requests.</p>

                {loading ? (
                    <p className="loading">Loading requests...</p>
                ) : requests.length === 0 ? (
                    <p className="loading">No requests available.</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="requests-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>User</th>
                                    <th>Date</th>
                                    <th>Amount ($)</th>
                                    <th>Amount (FC)</th>
                                    <th>Motif</th>
                                    <th>Channel</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((tx, i) => (
                                    <tr key={tx.id || i}>
                                        <td>{i + 1}</td>
                                        <td>{tx.user_id || "N/A"} </td>
                                        <td>{tx.date ? new Date(tx.date).toLocaleDateString("en-GB") : "N/A"}</td>
                                        <td>{tx.currency === "$" ? (Number(tx.amount) || 0).toFixed(2) : "0.00"}</td>
                                        <td>{tx.currency === "FC" ? (Number(tx.amount) || 0).toFixed(2) : "0.00"}</td>
                                        <td>{tx.motif || "N/A"}</td>
                                        <td className={tx.channel === "Entrées" ? "channel green" : "channel red"}>
                                            {tx.channel}
                                        </td>
                                        <td className="status">{tx.status}</td>
                                        <td>
                                            {tx.status === "Pending" && (
                                                <>
                                                    <button className="btn approve" onClick={() => handleAction(tx.id, "Approved")}>
                                                        Approve
                                                    </button>
                                                    <button className="btn decline" onClick={() => handleAction(tx.id, "Declined")}>
                                                        Decline
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminRequestsPage;

// --- Basic Inline Styles (Should be moved to AdminLayout.css for production) ---

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    content: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
        maxWidth: '400px',
        textAlign: 'center',
    },
    actions: {
        marginTop: '20px',
        display: 'flex',
        justifyContent: 'space-around',
    },
    button: {
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '5px',
        cursor: 'pointer',
        fontSize: '16px',
    }
};

const toastStyles = {
    base: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        color: 'white',
        padding: '15px 25px',
        borderRadius: '5px',
        zIndex: 1001,
        transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
        opacity: 0,
        transform: 'translateX(100%)',
    },
    show: {
        opacity: 1,
        transform: 'translateX(0)',
    },
    hide: {
        opacity: 0,
        transform: 'translateX(100%)',
    }
};
