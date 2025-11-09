import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./FinancierTransactionsPage.css";

// Fonction pour formater la date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    // Format français (DD/MM/YY)
    return new Intl.DateTimeFormat('fr-FR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch (e) {
    return dateString.split('T')[0] || dateString;
  }
};

// Composant Carte pour les totaux
const Card = ({ title, value }) => (
  <div className="summary-card">
    <h3 className="card-title">{title}</h3>
    <p className="card-value">{value.toFixed(2)}</p>
  </div>
);

// Composant pour le statut
const StatusBadge = ({ status }) => {
  const normalizedStatus = status ? status.toLowerCase() : 'unknown';
  let statusClass = 'status-unknown';

  if (normalizedStatus === 'approved') {
    statusClass = 'status-approved';
  } else if (normalizedStatus === 'pending') {
    statusClass = 'status-pending';
  } else if (normalizedStatus === 'rejected') {
    statusClass = 'status-rejected';
  }

  return (
    <span className={`status-badge ${statusClass}`}>
      {status || 'N/A'}
    </span>
  );
};

const FinancierTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [dollarsSum, setDollarsSum] = useState([0, 0]); // [Entrées, Sorties]
  const [fcSum, setFcSum] = useState([0, 0]); // [Entrées, Sorties]
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // NEW: Add state for users and loading flag
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // NEW: Function to fetch users
  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("https://finsys.onrender.com/api/users/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data);
      setUsersLoaded(true);  // ✅ Mark as loaded
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      setUsersLoaded(true);  // Still mark as loaded to avoid infinite loading
    }
  };

  // Récupérer les transactions (removed calculatePerformance call here)
  const fetchTransactions = async () => {
    try {
      const apiEndpoint = "https://finsys.onrender.com/api/transactions/all";
      const { data } = await axios.get(apiEndpoint, { 
          headers: { Authorization: `Bearer ${token}` } 
      });
      const sortedTx = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sortedTx);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des transactions:", err);
      setTransactions([]);
      setLoading(false);
    }
  };

  // Calculer les métriques de performance et les sommes
  const calculatePerformance = (txData) => {
    if (!txData || txData.length === 0 || !usersLoaded) return;  // ✅ Wait for users to load

    // Filter for approved transactions (case-insensitive)
    const approvedTx = txData.filter((tx) => tx.status?.toLowerCase() === "approved");
    
    // For sums, use approved if available, else all transactions
    const sumTx = approvedTx.length > 0 ? approvedTx : txData;

    // Calculate sums synchronously
    const totalDollarsEntrees = sumTx
      .filter((tx) => tx.channel === "Entrées" && tx.currency === "$")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalDollarsSorties = sumTx
      .filter((tx) => tx.channel === "Sorties" && tx.currency === "$")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalFcEntrees = sumTx
      .filter((tx) => tx.channel === "Entrées" && tx.currency === "FC")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalFcSorties = sumTx
      .filter((tx) => tx.channel === "Sorties" && tx.currency === "FC")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    setDollarsSum([totalDollarsEntrees, totalDollarsSorties]);
    setFcSum([totalFcEntrees, totalFcSorties]);

    const userTxCounts = {};
    // Calculate transaction count per user
    approvedTx.forEach(tx => {
      const userId = tx.user_id;
      if (userId) userTxCounts[userId] = (userTxCounts[userId] || 0) + 1;
    });

    const sortedUsers = Object.entries(userTxCounts)
      .map(([userId, count]) => {
        return {
          id: userId,
          name: getUserFullName(userId),  // ✅ Now uses loaded users
          txCount: count,
        };
      })
      .sort((a, b) => b.txCount - a.txCount);

    const topUsers = sortedUsers.slice(0, 3);

    setPerformanceData({
      sortedUsers,
      topUsers,
    });
  };

  // Télécharger en PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Table des Transactions", 20, 10);
    autoTable(doc, {
      head: [["ID", "Utilisateur", "Date", "Montant", "Devise", "Canal", "Motif", "Statut"]],
      body: transactions.map(tx => [
        tx.id,
        getUserFullName(tx.user_id),
        formatDate(tx.date),
        tx.amount,
        tx.currency,
        tx.channel,
        tx.motif,
        tx.status,
      ]),
    });
    doc.save("transactions.pdf");
  };

  // NEW: Helper function to get the full user name (with logging for debugging)
  const getUserFullName = (userId) => {
    const user = users.find(u => u.id === userId);
    const fullName = user ? `${user.name} ${user.surname}`.trim() : userId || "N/A";
    console.log(`getUserFullName(${userId}): ${fullName}`);  // ✅ Debug log (remove later)
    return fullName;
  };

  // ✅ FIXED: Add the missing getUserName function
  const getUserName = (tx) => {
    return getUserFullName(tx.user_id);
  };

  // UPDATED: useEffect to fetch both transactions and users
  useEffect(() => {
    fetchTransactions();
    fetchUsers();
  }, []);

  // ✅ NEW: Separate useEffect to calculate performance only after both are loaded
  useEffect(() => {
    if (transactions.length > 0 && usersLoaded) {
      calculatePerformance(transactions);
    }
  }, [transactions, usersLoaded]);

  if (loading) return <p className="loading-message">Chargement des données...</p>;

  return (
    <>
      <div className="financier-container">
        <h1 className="page-title">Transactions Financier</h1>

        {/* Cartes des totaux */}
        <div className="summary-cards-grid">
          <div className="summary-group">
            <h2>Entrées</h2>
            <div className="summary-values">
              <div className="summary-value">
                <span>USD</span>
                <span>{dollarsSum[0].toFixed(2)}</span>
              </div>
              <div className="summary-value">
                <span>FC</span>
                <span>{fcSum[0].toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="summary-group">
            <h2>Sorties</h2>
            <div className="summary-values">
              <div className="summary-value">
                <span>USD</span>
                <span>{dollarsSum[1].toFixed(2)}</span>
              </div>
              <div className="summary-value">
                <span>FC</span>
                <span>{fcSum[1].toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Métriques de Performance */}
        {performanceData && (
          <div className="performance-card">
            <h2 className="section-title">Métriques de Performance</h2>
            <div className="performance-layout">
              {/* --- Top 3 Contributeurs --- */}
              {performanceData.topUsers && performanceData.topUsers.length > 0 && (
                <div className="performance-section">
                  <h3>Top 3 Contributeurs</h3>
                  <ul className="ranking-list">
                    {performanceData.topUsers.map((user, index) => (
                      <li key={user.id} className="top-user-item">
                        <span className="rank-badge">{index + 1}</span>
                        <div className="user-info">
                          <strong>{user.name}</strong> {/* ✅ Now shows full name */}
                          <span>{user.txCount} transactions</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* --- Classement Complet --- */}
              <div className="performance-section">
                <h3>Classement Complet</h3>
                <ul className="ranking-list full-ranking-list">
                  {performanceData.sortedUsers.map((user, index) => (
                    <li key={user.id}>
                      <span className="rank-number">{index + 1}.</span>
                      <div className="user-info">
                        <strong>{user.name}</strong> {/* ✅ Now shows full name */}
                        <span>{user.txCount} transactions</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Bouton Télécharger PDF */}
        <div className="button-container">
          <button className="pdf-button" onClick={downloadPDF}>
            Télécharger PDF
          </button>
        </div>

        {/* Table des Transactions */}
        <div className="table-wrapper">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Utilisateur</th>
                <th>Date</th>
                <th>Montant</th>
                <th>Devise</th>
                <th>Canal</th>
                <th>Motif</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td data-label="ID">{tx.id}</td>
                  <td data-label="Utilisateur">{getUserName(tx)}</td>  {/* ✅ Now defined */}
                  <td data-label="Date">{formatDate(tx.date)}</td>
                  <td
                    data-label="Montant"
                    className={`amount-cell ${tx.channel === 'Entrées' ? 'amount-entrees' : 'amount-sorties'}`}
                  >
                    {tx.amount}
                  </td>
                  <td data-label="Devise">{tx.currency}</td>
                  <td data-label="Canal">{tx.channel}</td>
                  <td data-label="Motif">{tx.motif}</td>
                  <td data-label="Statut">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default FinancierTransactionsPage;
