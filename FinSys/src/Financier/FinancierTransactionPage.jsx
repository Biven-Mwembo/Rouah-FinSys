import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

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
  const [users, setUsers] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [dollarsSum, setDollarsSum] = useState([0, 0]); // [Entrées, Sorties]
  const [fcSum, setFcSum] = useState([0, 0]); // [Entrées, Sorties]
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  // Récupérer les transactions
  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/transactions",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sortedTx = data.sort((a, b) => new Date(b.date) - new Date(a.date)); // Trier par date descendante
      setTransactions(sortedTx);
      calculateSums(sortedTx);
      calculatePerformance(sortedTx);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des transactions:", err);
      setLoading(false);
    }
  };

  // Récupérer les utilisateurs
  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/users/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
    }
  };

  // Calculer les sommes par devise et canal
  const calculateSums = (transactions) => {
    const approvedTx = transactions.filter((tx) => tx.status === "Approved");

    const totalDollarsEntrees = approvedTx
      .filter((tx) => tx.channel === "Entrées" && tx.currency === "$")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalDollarsSorties = approvedTx
      .filter((tx) => tx.channel === "Sorties" && tx.currency === "$")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalFcEntrees = approvedTx
      .filter((tx) => tx.channel === "Entrées" && tx.currency === "FC")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalFcSorties = approvedTx
      .filter((tx) => tx.channel === "Sorties" && tx.currency === "FC")
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    setDollarsSum([totalDollarsEntrees, totalDollarsSorties]);
    setFcSum([totalFcEntrees, totalFcSorties]);
  };

  // Calculer les métriques de performance
  const calculatePerformance = (txData) => {
    const approvedTx = txData.filter((tx) => tx.status === "Approved");
    const totalTx = approvedTx.length;

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

    const aggregates = { entrees: { usd: dollarsSum[0], fc: fcSum[0] }, sorties: { usd: dollarsSum[1], fc: fcSum[1] } };

    const sortedUsers = Object.entries(userTxCounts)
      .map(([userId, count]) => {
        const user = users.find(u => u.id === userId);
        return {
          id: userId,
          name: user ? `${user.name} ${user.surname}` : "Inconnu",
          txCount: count,
          contributions: userContributions[userId] || { entrees: { usd: 0, fc: 0 }, sorties: { usd: 0, fc: 0 } },
        };
      })
      .sort((a, b) => b.txCount - a.txCount);

    const topUser = sortedUsers[0];

    setPerformanceData({
      totalTx,
      sortedUsers,
      topUser,
      aggregates,
    });
  };

  // Télécharger en PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Table des Transactions", 20, 10);
    doc.autoTable({
      head: [["ID", "Utilisateur", "Date", "Montant", "Devise", "Canal", "Motif", "Statut"]],
      body: transactions.map(tx => [
        tx.id,
        getUserName(tx.user_id),
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

  // Télécharger en Excel
  const downloadExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      transactions.map(tx => ({
        ID: tx.id,
        Utilisateur: getUserName(tx.user_id),
        Date: formatDate(tx.date),
        Montant: tx.amount,
        Devise: tx.currency,
        Canal: tx.channel,
        Motif: tx.motif,
        Statut: tx.status,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, "transactions.xlsx");
  };

  // Supprimer une transaction
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `https://finsys.onrender.com/api/transactions/item/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = transactions.filter((tx) => tx.id !== id);
      setTransactions(updated);
      calculateSums(updated);
      calculatePerformance(updated);
    } catch (err) {
      console.error("Échec de la suppression:", err);
    }
  };

  // Modifier une transaction
  const handleEdit = async (id, updatedData) => {
    try {
      await axios.patch(
        `https://finsys.onrender.com/api/transactions/item/${id}`,
        updatedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updated = transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updatedData } : tx
      );
      setTransactions(updated);
      calculateSums(updated);
      calculatePerformance(updated);
    } catch (err) {
      console.error("Échec de la modification:", err);
    }
  };

  // Obtenir le nom de l'utilisateur
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.name} ${user.surname}` : userId || "N/A";
  };

  useEffect(() => {
    fetchTransactions();
    fetchUsers();
  }, []);

  if (loading) return <p>Chargement des transactions...</p>;

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
          {performanceData.topUser && (
            <div className="mb-4">
              <h3>Meilleur Contributeur</h3>
              <p><strong>{performanceData.topUser.name}</strong> a ajouté le plus de transactions: {performanceData.topUser.txCount} sur {performanceData.totalTx} total.</p>
            </div>
          )}
          <div className="mb-4">
            <h3>Classement des Utilisateurs</h3>
            <ul>
              {performanceData.sortedUsers.map((user, index) => (
                <li key={user.id}>
                  {index + 1}. {user.name} - {user.txCount} transactions
                </li>
              ))}
            </ul>
          </div>
          {/* Ajouter des barres de progression si nécessaire */}
        </div>
      )}

      {/* Table des Transactions */}
      <div className="mb-4 flex gap-2">
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={downloadPDF}>
          Télécharger PDF
        </button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={downloadExcel}>
          Télécharger Excel
        </button>
      </div>
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
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id}>
              <td className="border px-4 py-2">{tx.id}</td>
              <td className="border px-4 py-2">{getUserName(tx.user_id)}</td>
              <td className="border px-4 py-2">{formatDate(tx.date)}</td>
              <td className="border px-4 py-2">{tx.amount}</td>
              <td className="border px-4 py-2">{tx.currency}</td>
              <td className="border px-4 py-2">{tx.channel}</td>
              <td className="border px-4 py-2">{tx.motif}</td>
              <td className="border px-4 py-2">{tx.status}</td>
              <td className="border px-4 py-2 flex gap-2">
                <button
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                  onClick={() =>
                    handleEdit(tx.id, {
                      status: tx.status === "Approved" ? "Pending" : "Approved",
                    })
                  }
                >
                  Modifier
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => handleDelete(tx.id)}
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinancierTransactionsPage;
