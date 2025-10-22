import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Transactions.css";

const API_BASE_URL = "https://finsys.onrender.com/api";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch (e) {
    return dateString.split("T")[0] || dateString;
  }
};

export default function AdminUpdatePage() {
  const { id } = useParams(); // grab :id from URL
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [transaction, setTransaction] = useState(null);
  const [banner, setBanner] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(true);

  // Fetch single transaction by ID
  useEffect(() => {
    if (!token) {
      setBanner({ message: "Authentication token missing.", type: "error" });
      return;
    }

    const fetchTransaction = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/transactions/item/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTransaction({
          ...res.data,
          date: res.data.date ? new Date(res.data.date).toISOString().split("T")[0] : "",
        });
      } catch (error) {
        const msg = error.response?.data?.message || error.message || "Failed to load transaction.";
        setBanner({ message: `❌ ${msg}`, type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!transaction) return;

    const updateData = {
      date: transaction.date,
      amount: parseFloat(transaction.amount),
      currency: transaction.currency,
      channel: transaction.channel,
      motif: transaction.motif,
    };

    try {
      const res = await axios.patch(`${API_BASE_URL}/transactions/item/${id}`, updateData, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      setBanner({ message: "✅ Transaction updated successfully!", type: "success" });
      setTimeout(() => navigate("/admin/transactions"), 1500); // go back after success
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Failed to update transaction.";
      setBanner({ message: `❌ ${msg}`, type: "error" });
    }
  };

  if (loading) return <div>Loading transaction...</div>;
  if (!transaction) return <div>No transaction found.</div>;

  return (
    <div className="transactions-container">
      {banner.message && <div className={`toast-notification ${banner.type}`}>{banner.message}</div>}

      <h1>Edit Transaction #{transaction.id}</h1>

      <form onSubmit={handleSave} className="edit-form">
        <label>
          Date:
          <input type="date" name="date" value={transaction.date} onChange={handleChange} required />
        </label>
        <label>
          Amount:
          <input type="number" name="amount" value={transaction.amount} onChange={handleChange} step="0.01" required />
        </label>
        <label>
          Currency:
          <input type="text" name="currency" value={transaction.currency} onChange={handleChange} required />
        </label>
        <label>
          Channel:
          <input type="text" name="channel" value={transaction.channel} onChange={handleChange} required />
        </label>
        <label>
          Motif:
          <input type="text" name="motif" value={transaction.motif} onChange={handleChange} required />
        </label>
        <div className="form-actions">
          <button type="submit" className="action-btn save-btn">Save Changes</button>
          <button type="button" className="action-btn cancel-btn" onClick={() => navigate("/admin/transactions")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
