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
    return new Intl.DateTimeFormat('fr-FR', {  // Changed to fr-FR for French date format if needed
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
        ["Date", "Montant", "Devise", "Canal", "Motif", "Fichier"],  // Translated headers
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
      console.error("Impossible d'analyser les données utilisateur depuis localStorage:", e);
    }
  }

  // Fetch transactions for the logged-in user
  useEffect(() => {
    if (!userId) {
      setBanner({ message: "Utilisateur non connecté.", type: "error" });
      return;
    }

    fetch(`${API_BASE_URL}/transactions/user/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Échec de récupération des transactions");
        return res.json();
      })
      .then(setTransactions)
      .catch(() =>
        setBanner({ message: "Échec de récupération des transactions.", type: "error" })
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
    downloadCSV(transactions, 'toutes_les_transactions.csv');
  };

  // Helper to render status icon
  const renderStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return <span style={{ color: "green", fontSize: "18px" }}>✅</span>; // Green checkmark
      case "pending":
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <span className="floating-yolk" style={{ color: "orange", fontSize: "18px" }}>●</span>
            En Attente..
          </span>
        ); // Floating orange dot with text
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
      <h1>Tableaux de Données de Transactions</h1>
      
   
      
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
            ⬇ Télécharger Entrées CSV
          </button>
        </div>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Montant</th>
              <th>Devise</th>
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
                <td colSpan="5" className="text-center">Aucune Entrée pour le moment.</td>
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
            ⬇ Télécharger Sorties CSV
          </button>
        </div>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Montant</th>
              <th>Devise</th>
              <th>Motif</th>
              <th>Statut</th> {/* Translated to French */}
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
                  <td>{renderStatusIcon(tx.status)}</td> {/* Status with floating animation and text */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">Aucune Sortie pour le moment.</td> {/* Updated colSpan and translated */}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="download-section">
        <button className="download-btn" onClick={handleDownloadAll} disabled={transactions.length === 0}>
          ⬇ Télécharger Tout en CSV
        </button>
      </div>

      {/* Inline styles for floating yolk animation (move to Transactions.css for production) */}
      <style>
        {`
          .floating-yolk {
            animation: float 2s ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-3px) rotate(5deg); }
            50% { transform: translateY(0) rotate(0deg); }
            75% { transform: translateY(3px) rotate(-5deg); }
          }
        `}
      </style>
    </div>
  );
}

// 🚫 NOTE: The ConfirmationModal component is no longer needed and can be deleted from the file.
