import React, { useEffect, useState } from "react";
import "./AdminLayout.css";

const API_BASE_URL = "https://finsys.onrender.com/api";

const AdminRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch requests from backend
  const fetchRequests = async () => {
  try {
    setLoading(true);
    const response = await fetch(`${API_BASE_URL}/transactions/pending`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}` // Add your JWT here
      }
    });
    const data = await response.json();
    setRequests(data);
  } catch (error) {
    console.error("Error fetching requests:", error);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchRequests();
  }, []);

 const handleAction = async (id, action) => {
  try {
    const url = `${API_BASE_URL}/transactions/${id}/${action.toLowerCase()}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
    });

    if (response.ok) {
      setRequests(prev =>
        prev.map(req => (req.id === id ? { ...req, status: action } : req))
      );
    }
  } catch (error) {
    console.error(`Error ${action} request:`, error);
  }
};


  return (
    <div className="admin-container">
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
