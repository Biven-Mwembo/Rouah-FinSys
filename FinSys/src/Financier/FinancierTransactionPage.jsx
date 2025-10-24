import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./FinancierTransactionsPage.css"; // 👈 Add the new stylesheet

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch (e) {
    return dateString.split("T")[0] || dateString;
  }
};

// Modified card layout: Entrées & Sorties each hold 2 currency lines
const MetricCard = ({ title, usd, fc }) => (
  <div className="metric-card">
    <h3>{title}</h3>
    <div className="metric-line">
      <span>USD ($):</span>
      <strong>{usd.toFixed(2)}</strong>
    </div>
    <div className="metric-line">
      <span>FC:</span>
      <strong>{fc.toFixed(2)}</strong>
    </div>
  </div>
);

const FinancierTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [dollarsSum, setDollarsSum] = useState([0, 0]);
  const [fcSum, setFcSum] = useState([0, 0]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/transactions/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const sortedTx = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sortedTx);
      calculatePerformance(sortedTx);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors de la récupération des transactions:", err);
      setLoading(false);
    }
  };

  const calculatePerformance = (txData) => {
    if (!txData || txData.length === 0) return;
    const approvedTx = txData.filter(
      (tx) => tx.status?.toLowerCase() === "approved"
    );
    const sumTx = approvedTx.length > 0 ? approvedTx : txData;
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
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Table des Transactions", 20, 10);
    autoTable(doc, {
      head: [
        [
          "ID",
          "Utilisateur",
          "Date",
          "Montant",
          "Devise",
          "Canal",
          "Motif",
          "Statut",
        ],
      ],
      body: transactions.map((tx) => [
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

  const getUserName = (tx) =>
    tx.user ? `${tx.user.name} ${tx.user.surname}` : tx.user_id || "N/A";

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) return <p className="loading">Chargement des données...</p>;

  return (
    <div className="financier-container">
      <h1>Transactions Financières</h1>

      {/* Metrics Section */}
      <div className="metrics-grid">
        <MetricCard
          title="Entrées"
          usd={dollarsSum[0]}
          fc={fcSum[0]}
        />
        <MetricCard
          title="Sorties"
          usd={dollarsSum[1]}
          fc={fcSum[1]}
        />
      </div>

      <button className="download-btn" onClick={downloadPDF}>
        Télécharger PDF
      </button>

      {/* Table */}
      <div className="table-container">
        <table>
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
                <td>{tx.id}</td>
                <td>{getUserName(tx)}</td>
                <td>{formatDate(tx.date)}</td>
                <td>{tx.amount}</td>
                <td>{tx.currency}</td>
                <td>{tx.channel}</td>
                <td>{tx.motif}</td>
                <td className={`status ${tx.status?.toLowerCase()}`}>
                  {tx.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancierTransactionsPage;
