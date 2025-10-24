import React, { useEffect, useState } from "react";
import "./FinancierTransactionsPage.css";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  <div className="card p-4 shadow rounded bg-white">
    <h3 className="font-bold mb-2">{title}</h3>
    <p className="text-lg">{value.toFixed(2)}</p>
  </div>
);

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
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/transactions/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sortedTx = data.sort((a, b) => new Date(b.date) - new Date(a.date)); // Dernières en premier
      setTransactions(sortedTx);
      calculatePerformance(sortedTx);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des transactions:", err);
      setLoading(false);
    }
  };

  // Calculer les métriques de performance et les sommes
  const calculatePerformance = (txData) => {
    if (!txData || txData.length === 0) return;

    console.log("Statuses in transactions:", txData.map(tx => tx.status));

    // Filter for approved transactions (case-insensitive)
    const approvedTx = txData.filter((tx) => tx.status?.toLowerCase() === "approved");
    console.log("Approved transactions count:", approvedTx.length);

    // For sums, use approved if available, else all transactions
    const sumTx = approvedTx.length > 0 ? approvedTx : txData;
    console.log("Using transactions for sums:", sumTx.length);

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

    console.log("Sums calculated:", { totalDollarsEntrees, totalDollarsSorties, totalFcEntrees, totalFcSorties });

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

  if (loading) return <p>Chargement des données...</p>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Transactions Financier</h1>

      {/* Cartes des totaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="Entrées USD ($)" value={dollarsSum[0]} />
        <Card title="Sorties USD ($)" value={dollarsSum[1]} />
        <Card title="Entrées FC" value={fcSum[0]} />
        <Card title="Sorties FC" value={fcSum[1]} />
      </div>

      {/* Métriques de Performance */}
      {performanceData && (
        <div className="card p-4 shadow rounded mb-6">
          <h2 className="text-xl font-bold mb-4">Métriques de Performance</h2>
          {performanceData.topUsers && performanceData.topUsers.length > 0 && (
            <div className="mb-4">
              <h3>Top 3 Contributeurs</h3>
              <ul>
                {performanceData.topUsers.map((user, index) => (
                  <li key={user.id}>
                    {index + 1}. <strong>{user.name}</strong> - {user.txCount} transactions
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="mb-4">
            <h3>Classement Complet des Utilisateurs</h3>
            <ul>
              {performanceData.sortedUsers.map((user, index) => (
                <li key={user.id}>
                  {index + 1}. {user.name} - {user.txCount} transactions
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Bouton Télécharger PDF */}
      <div className="mb-4">
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={downloadPDF}>
          Télécharger PDF
        </button>
      </div>

      {/* Table des Transactions */}
      <table className="table-auto w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Utilisateur</th>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Montant</th>
            <th className="border px-4 py-2">Devise</th>
            <th className="border px-4 py-2">Canal</th>
            <th className="border px-4 py-2">Motif</th>
            <th className="border px-4 py-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="border px-4 py-2">{tx.id}</td>
              <td className="border px-4 py-2">{getUserName(tx)}</td>
              <td className="border px-4 py-2">{formatDate(tx.date)}</td>
              <td className="border px-4 py-2">{tx.amount}</td>
              <td className="border px-4 py-2">{tx.currency}</td>
              <td className="border px-4 py-2">{tx.channel}</td>
              <td className="border px-4 py-2">{tx.motif}</td>
              <td className="border px-4 py-2">{tx.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinancierTransactionsPage;
