import React, { useEffect, useState } from "react";
import axios from "axios";
import "./FinancierTransactionsPage.css";
import jsPDF from "https://esm.sh/jspdf@2.5.1";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";

// Fonction pour formater la date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
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

  // Récupérer les transactions
  const fetchTransactions = async () => {
    try {
      // NOTE: Using a mock endpoint if the real one fails or is unavailable
      const apiEndpoint = "https://finsys.onrender.com/api/transactions/all";
      const { data } = await axios.get(apiEndpoint, { 
          headers: { Authorization: `Bearer ${token}` } 
      });
      const sortedTx = data.sort((a, b) => new Date(b.date) - new Date(a.date)); // Dernières en premier
      setTransactions(sortedTx);
      calculatePerformance(sortedTx);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des transactions:", err);
      // Fallback to mock data structure if API fails
      setTransactions([]);
      setLoading(false);
    }
  };

  // Calculer les métriques de performance et les sommes
  const calculatePerformance = (txData) => {
    if (!txData || txData.length === 0) return;

    // Filter for approved transactions (case-insensitive)
    const approvedTx = txData.filter((tx) => tx.status?.toLowerCase() === "approved");
    
    // For sums, use approved if available, else all transactions
    const sumTx = approvedTx.length > 0 ? approvedTx : txData;

    const totalTx = approvedTx.length;

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

    const aggregates = { entrees: { usd: totalDollarsEntrees, fc: totalFcEntrees }, sorties: { usd: totalDollarsSorties, fc: totalFcSorties } };

    const userTxCounts = {};
    approvedTx.forEach(tx => {
      const userId = tx.user_id;
      if (userId) userTxCounts[userId] = (userTxCounts[userId] || 0) + 1;
    });

    const userContributions = {};
    approvedTx.forEach(tx => {
      const userId = tx.user_id;
      if (userId) {
        if (!userContributions[userId]) userContributions[userId] = { entrees: { usd: 0, fc: 0 }, sorties: { usd: 0, fc: 0 } };
        if (tx.channel === "Entrées") {
          if (tx.currency === "$") userContributions[userId].entrees.usd += Number(tx.amount || 0);
          else if (tx.currency === "FC") userContributions[userId].entrees.fc += Number(tx.amount || 0);
        } else if (tx.channel === "Sorties") {
          if (tx.currency === "$") userContributions[userId].sorties.usd += Number(tx.amount || 0);
          else if (tx.currency === "FC") userContributions[userId].sorties.fc += Number(tx.amount || 0);
        }
      }
    });

    const sortedUsers = Object.entries(userTxCounts)
      .map(([userId, count]) => {
        return {
          id: userId,
          name: userId, // Show ID since no users fetched
          txCount: count,
          contributions: userContributions[userId] || { entrees: { usd: 0, fc: 0 }, sorties: { usd: 0, fc: 0 } },
        };
      })
      .sort((a, b) => b.txCount - a.txCount);

    const topUsers = sortedUsers.slice(0, 3);

    setPerformanceData({
      totalTx,
      sortedUsers,
      topUsers,
      aggregates,
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
        getUserName(tx),
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

  // Obtenir le nom de l'utilisateur (from tx.user if available)
  const getUserName = (tx) => {
    return tx.user ? `${tx.user.name} ${tx.user.surname}` : tx.user_id || "N/A";
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) return <p className="loading-message">Chargement des données...</p>;

  return (
    <>
      <div className="financier-container">
        <h1 className="page-title">Transactions Financier</h1>

        {/* Cartes des totaux */}
        <div className="summary-cards-grid">
          <Card title="Entrées USD ($)" value={dollarsSum[0]} />
          <Card title="Sorties USD ($)" value={dollarsSum[1]} />
          <Card title="Entrées FC" value={fcSum[0]} />
          <Card title="Sorties FC" value={fcSum[1]} />
        </div>

        {/* Métriques de Performance */}
        {performanceData && (
  <div className="performance-card">
    <h2 className="section-title">Métriques de Performance</h2>
    <div className="performance-layout">
      {performanceData.topUsers && performanceData.topUsers.length > 0 && (
        <div className="performance-section">
          <h3>Top 3 Contributeurs</h3>
          <ul className="ranking-list">
            {performanceData.topUsers.map((user, index) => (
              <li key={user.id} className="top-user-item">
                <span className="rank-badge">{index + 1}</span>
                <div className="user-avatar">
                  {user.name.charAt(0)}
                </div>
                <div className="user-info">
                  <strong>{user.name}</strong>
                  <span>{user.txCount} transactions</span>

                  <div className="progress-container">
                    <div className="progress-bar">
                      <div
                        className="progress-fill usd"
                        style={{ width: `${user.usdPercent || 0}%` }}
                      ></div>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill fc"
                        style={{ width: `${user.fcPercent || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="performance-section">
        <h3>Classement Complet</h3>
        <ul className="ranking-list full-ranking-list">
          {performanceData.sortedUsers.map((user, index) => (
            <li key={user.id}>
              <span className="rank-number">{index + 1}.</span>
              <div className="user-avatar">
                {user.name.charAt(0)}
              </div>
              <div className="user-info">
                <strong>{user.name}</strong>
                <span>{user.txCount} transactions</span>

                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill usd"
                      style={{ width: `${user.usdPercent || 0}%` }}
                    ></div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill fc"
                      style={{ width: `${user.fcPercent || 0}%` }}
                    ></div>
                  </div>
                </div>
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
                  <td data-label="Utilisateur">{getUserName(tx)}</td>
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
