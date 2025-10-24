import { useState, useEffect } from "react";
import "./Transactions.css";

// ✅ Set your backend API base URL here

const API_BASE_URL = "https://finsys.onrender.com/api";


// Function to format date as dd/mm/yy (Correct)
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    // Use Intl.DateTimeFormat for a reliable format: DD/MM/YY
    return new Intl.DateTimeFormat('en-GB', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch (e) {
    // Fallback in case of invalid date string
    return dateString.split('T')[0] || dateString; 
  }
};

// --- Helper function to download data as CSV ---
const downloadCSV = (data, filename) => {
    // Define the column headers for the CSV
    const csvRows = [
        ["Date", "Amount", "Currency", "Channel", "Motif", "File"],
        // Map the array of transaction objects to an array of CSV row arrays
        ...data.map((t) => [
            formatDate(t.date),
            t.amount,
            t.currency,
            t.channel,
            // Ensure motifs with commas don't break the CSV format by wrapping in quotes
            `"${t.motif.replace(/"/g, '""')}"`, 
            t.file || "",
        ]),
    ];
    
    // Combine rows into a single CSV content string
    const csvContent =
        "data:text/csv;charset=utf-8," +
        csvRows.map((e) => e.join(",")).join("\n");
    
    // Create, trigger, and remove a temporary link element to prompt download
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
// ------------------------------------

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  // Removed form state: form, showModal, isSubmitting
  
  const [banner, setBanner] = useState({ message: "", type: "" });

  // Changed to look for the correct user ID key stored in localStorage
  const userString = localStorage.getItem("user");
  let userId = null;
  if (userString) {
    try {
      userId = JSON.parse(userString)?.id;
    } catch (e) {
      console.error("Could not parse user data from localStorage:", e);
    }
  }

  // Fetch transactions for the logged-in user
  useEffect(() => {
    if (!userId) {
      setBanner({ message: "User not logged in.", type: "error" });
      return;
    }

    fetch(`${API_BASE_URL}/transactions/user/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch transactions");
        return res.json();
      })
      .then(setTransactions)
      .catch(() =>
        setBanner({ message: "Failed to fetch transactions.", type: "error" })
      );
  }, [userId]);

  // Updated generic download function to handle any table's data
  const handleDownloadTable = (data, channelName) => { 
    downloadCSV(data, `${channelName.toLowerCase()}_transactions.csv`);
  };

  // Filtering for the exact accented string "Entrées"
  const entrees = transactions.filter(
    (t) => t.channel === "Entrées"
  );
  // Filtering for the exact non-accented string "Sorties"
  const sorties = transactions.filter(
    (t) => t.channel === "Sorties"
  );
  
  // New handler for the "Download All" button
  const handleDownloadAll = () => {
    downloadCSV(transactions, 'all_transactions.csv');
  };

  // Helper to render status icon
  const renderStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <span style={{ color: "green", fontSize: "18px" }}>✅</span>; // Green checkmark
      case "pending":
        return <span className="blinking-dot" style={{ color: "orange", fontSize: "18px" }}>●</span>; // Blinking orange dot
      case "declined":
      case "rejected":
        return <span style={{ color: "red", fontSize: "18px" }}>❌</span>; // Red X
      default:
        return <span>N/A</span>;
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

      {/* Title Updated */}
      <h1>Transaction Data Tables</h1>
      
   
      
      {/* Transactions Recent Tables */}
      
      {/* Entrées Table */}
      <div className="card">
        <div className="table-header">
          <h2>Entrées</h2>
          {/* Download button for Entrées data only */}
          <button 
            className="download-btn-small" 
            onClick={() => handleDownloadTable(entrees, 'Entrees')}
            disabled={entrees.length === 0}
          >
            ⬇ Telecharger Entrées CSV
          </button>
        </div>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Motif</th>
              
            </tr>
          </thead>
          <tbody>
            {entrees.length > 0 ? (
              entrees.map((tx, i) => (
                <tr key={i}>
                  <td>{formatDate(tx.date)}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.currency}</td>
                  <td>{tx.motif}</td>
                  
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">No Entrées yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Sorties Table */}
      <div className="card">
        <div className="table-header">
          <h2>Sorties</h2>
          {/* Download button for Sorties data only */}
          <button 
            className="download-btn-small" 
            onClick={() => handleDownloadTable(sorties, 'Sorties')}
            disabled={sorties.length === 0}
          >
            ⬇ Telecharger Sorties CSV
          </button>
        </div>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Montant</th>
              <th>Currency</th>
              <th>Motif</th>
              <th>Status</th> {/* New Status column */}
            </tr>
          </thead>
          <tbody>
            {sorties.length > 0 ? (
              sorties.map((tx, i) => (
                <tr key={i}>
                  <td>{formatDate(tx.date)}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.currency}</td>
                  <td>{tx.motif}</td>
                  <td>{renderStatusIcon(tx.status)}</td> {/* New Status cell */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">No Sorties yet.</td> {/* Updated colSpan */}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="download-section">
        <button className="download-btn" onClick={handleDownloadAll} disabled={transactions.length === 0}>
          ⬇ Download All as CSV
        </button>
      </div>

      {/* Inline styles for blinking dot (move to Transactions.css for production) */}
      <style>
        {`
          .blinking-dot {
            animation: blink 1s infinite;
          }
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
          }
        `}
      </style>
    </div>
  );
}

// 🚫 NOTE: The ConfirmationModal component is no longer needed and can be deleted from the file.
