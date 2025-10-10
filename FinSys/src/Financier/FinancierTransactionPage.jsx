import { useState, useEffect } from "react";
import "./Transactions.css";
import axios from "axios";

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
  } catch (e) {
    return dateString.split("T")[0] || dateString;
  }
};

export default function FinancierTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [banner, setBanner] = useState({ message: "", type: "" });
  const [totalEntrees, setTotalEntrees] = useState(0);
  const [totalSorties, setTotalSorties] = useState(0);

  const token = localStorage.getItem("token");

  // ✅ Fetch all users
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

  // ✅ Fetch all transactions (Read-only)
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

      // ✅ Calculate totals
      const entrees = data
        .filter((tx) => tx.amount > 0)
        .reduce((sum, tx) => sum + tx.amount, 0);
      const sorties = data
        .filter((tx) => tx.amount < 0)
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      setTotalEntrees(entrees);
      setTotalSorties(sorties);
    } catch (error) {
      setBanner({
        message: `Failed to fetch transactions: ${
          error.response?.data || error.message
        }`,
        type: "error",
      });
    }
  };

  // ✅ Combine both fetches
  useEffect(() => {
    fetchAllUsers();
    fetchAllTransactions();
  }, []);

  // ✅ Helper: find user full name by ID
  const getUserName = (userId, userDetails) => {
    // If backend already sends userDetails
    if (userDetails && (userDetails.name || userDetails.surname)) {
      return `${userDetails.name || ""} ${userDetails.surname || ""}`.trim();
    }

    // Otherwise, look up by userId from fetched users
    const user = users.find((u) => u.id === userId);
    if (user) return `${user.name || ""} ${user.surname || ""}`.trim();

    // Fallback
    return "Unknown";
  };

  // ✅ Export CSV function
  const downloadCSV = () => {
    if (transactions.length === 0) return;

    const csvHeader = [
      "User",
      "Date",
      "Amount",
      "Currency",
      "Channel",
      "Motif",
    ].join(",");

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

    const blob = new Blob([csvHeader + "\n" + csvRows.join("\n")], {
      type: "text/csv",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="transactions-container">
      {banner.message && (
        <div className={`toast-notification ${banner.type}`}>
          {banner.message}
        </div>
      )}

      <h1>Transaction Overview</h1>
      <p>View all financial records. Editing is disabled for your role.</p>

      {/* ✅ Summary Cards */}
      <div className="summary-row">
        <div className="summary-card entree">
          <h3>Entrées</h3>
          <p>{totalEntrees.toLocaleString()} FC</p>
        </div>
        <div className="summary-card sortie">
          <h3>Sorties</h3>
          <p>{totalSorties.toLocaleString()} FC</p>
        </div>
      </div>

      {/* ✅ Download Button */}
      <div className="actions-row">
        <button className="download-btn" onClick={downloadCSV}>
          📥 Download All Transactions (CSV)
        </button>
      </div>

      {/* ✅ Transactions Table */}
      <div className="card">
        <div className="table-header">
          <h2>All Transactions</h2>
        </div>

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
                    <td>
                      <strong>{getUserName(tx.userId, tx.userDetails)}</strong>
                    </td>
                    <td>{formatDate(tx.date)}</td>
                    <td>{tx.amount}</td>
                    <td>{tx.currency}</td>
                    <td>{tx.channel}</td>
                    <td>{tx.motif}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No transactions found.
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
