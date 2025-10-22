import { useState, useEffect } from "react";
import axios from "axios";
import "./Transactions.css";

const API_BASE_URL = "https://finsys.onrender.com/api";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return dateString.split("T")[0] || dateString;
  }
};

export default function FinancierTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [banner, setBanner] = useState({ message: "", type: "" });
  const [totalsByChannel, setTotalsByChannel] = useState({ entrees: {}, sorties: {} });

  const token = localStorage.getItem("token");

  const fetchAllUsers = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchAllTransactions = async () => {
    if (!token) {
      setBanner({ message: "Authentication token missing.", type: "error" });
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/transactions/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data || [];
      setTransactions(data);

      // ✅ Calculate totals by channel
      const entrees = {};
      const sorties = {};

      data.forEach((tx) => {
        const ch = tx.channel || "Unknown";
        if (tx.amount > 0) {
          entrees[ch] = (entrees[ch] || 0) + tx.amount;
        } else if (tx.amount < 0) {
          sorties[ch] = (sorties[ch] || 0) + Math.abs(tx.amount);
        }
      });

      setTotalsByChannel({ entrees, sorties });
    } catch (error) {
      setBanner({
        message: `Failed to fetch transactions: ${error.response?.data || error.message}`,
        type: "error",
      });
    }
  };

  useEffect(() => {
    fetchAllUsers();
    fetchAllTransactions();
  }, []);

  const getUserName = (userId, userDetails) => {
    if (userDetails && (userDetails.name || userDetails.surname)) {
      return `${userDetails.name || ""} ${userDetails.surname || ""}`.trim();
    }
    const user = users.find((u) => u.id === userId);
    return user ? `${user.name || ""} ${user.surname || ""}`.trim() : "Unknown";
  };

  const downloadCSV = () => {
    if (!transactions.length) return;

    const csvHeader = ["User", "Date", "Amount", "Currency", "Channel", "Motif"].join(",");
    const csvRows = transactions.map((tx) =>
      [
        `"${getUserName(tx.userId, tx.userDetails)}"`,
        `"${formatDate(tx.date)}"`,
        `"${tx.amount}"`,
        `"${tx.currency}"`,
        `"${tx.channel}"`,
        `"${tx.motif}"`,
      ].join(",")
    );

    const blob = new Blob([csvHeader + "\n" + csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderCards = (totalsObj, title) => {
    return Object.entries(totalsObj).map(([channel, amount]) => (
      <div key={channel} className={`summary-card ${title.toLowerCase()}`}>
        <h3>{title} - {channel}</h3>
        <p>{amount.toLocaleString()} FC</p>
      </div>
    ));
  };

  return (
    <div className="transactions-container">
      {banner.message && <div className={`toast-notification ${banner.type}`}>{banner.message}</div>}

      <header className="transactions-header">
        <h1>Transaction Overview</h1>
        <p>View all financial records. Editing is disabled for your role.</p>
      </header>

      {/* ✅ Summary Cards By Channel */}
      <div className="summary-row">
        {renderCards(totalsByChannel.entrees, "Entrées")}
        {renderCards(totalsByChannel.sorties, "Sorties")}
      </div>

      {/* ✅ Download Button */}
      <div className="actions-row">
        <button className="download-btn" onClick={downloadCSV}>
          📥 Download Transactions (CSV)
        </button>
      </div>

      {/* ✅ Transactions Table */}
      <div className="transactions-card card">
        <h2>All Transactions</h2>
        <div className="table-responsive">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Currency</th>
                <th>Channel</th>
                <th>Motif</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td><strong>{getUserName(tx.userId, tx.userDetails)}</strong></td>
                    <td>{formatDate(tx.date)}</td>
                    <td>{tx.amount}</td>
                    <td>{tx.currency}</td>
                    <td>{tx.channel}</td>
                    <td>{tx.motif}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
