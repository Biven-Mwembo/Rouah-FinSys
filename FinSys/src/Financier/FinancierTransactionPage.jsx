import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./FinancierTransactionsPage.css";

/* =========================
   Utilities
========================= */

const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("fr-FR", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return dateString.split("T")[0] || dateString;
  }
};

const StatusBadge = ({ status }) => {
  const normalized = status?.toLowerCase();
  let cls = "status-unknown";

  if (normalized === "approved") cls = "status-approved";
  else if (normalized === "pending") cls = "status-pending";
  else if (normalized === "rejected") cls = "status-rejected";

  return <span className={`status-badge ${cls}`}>{status || "N/A"}</span>;
};

/* =========================
   Component
========================= */

const FinancierTransactionsPage = () => {
  const token = localStorage.getItem("token");

  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  const [dollarsSum, setDollarsSum] = useState([0, 0]); // [Entrées, Sorties]
  const [fcSum, setFcSum] = useState([0, 0]); // [Entrées, Sorties]

  /* =========================
     Data Fetching
  ========================= */

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/users/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(data);
    } catch (err) {
      console.error("Erreur utilisateurs:", err);
    } finally {
      setUsersLoaded(true);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/transactions/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const sorted = data.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

      setTransactions(sorted);
    } catch (err) {
      console.error("Erreur transactions:", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     Calculations
  ========================= */

  const calculateSums = (txData) => {
    const approved = txData.filter(
      (tx) => tx.status?.toLowerCase() === "approved"
    );

    const sum = (channel, currency) =>
      approved
        .filter(
          (tx) => tx.channel === channel && tx.currency === currency
        )
        .reduce((acc, tx) => acc + Number(tx.amount || 0), 0);

    setDollarsSum([sum("Entrées", "$"), sum("Sorties", "$")]);
    setFcSum([sum("Entrées", "FC"), sum("Sorties", "FC")]);
  };

  const montantDisponibleUSD = dollarsSum[0] - dollarsSum[1];
  const montantDisponibleFC = fcSum[0] - fcSum[1];

  /* =========================
     Helpers
  ========================= */

  const getUserFullName = (userId) => {
    const u = users.find((x) => x.id === userId);
    return u ? `${u.name} ${u.surname}` : userId || "N/A";
  };

  /* =========================
     PDF Export
  ========================= */

  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text("Rapport Financier", 20, 15);

    doc.setFontSize(11);
    doc.text(`Montant Disponible USD : ${montantDisponibleUSD.toFixed(2)}`, 20, 25);
    doc.text(`Montant Disponible FC : ${montantDisponibleFC.toFixed(2)}`, 20, 32);

    autoTable(doc, {
      startY: 40,
      head: [
        ["ID", "Utilisateur", "Date", "Montant", "Devise", "Canal", "Motif", "Statut"],
      ],
      body: transactions.map((tx) => [
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

    doc.save("transactions_financier.pdf");
  };

  /* =========================
     Effects
  ========================= */

  useEffect(() => {
    fetchUsers();
    fetchTransactions();
  }, []);

  useEffect(() => {
    if (transactions.length && usersLoaded) {
      calculateSums(transactions);
    }
  }, [transactions, usersLoaded]);

  if (loading) return <p className="loading-message">Chargement...</p>;

  /* =========================
     Render
  ========================= */

  return (
    <div className="financier-container">
      <h1 className="page-title">Transactions Financier</h1>

      {/* ===== Montant Disponible Card ===== */}
      <div className="balance-card">
        <h2>Montant Disponible</h2>
        <div className="balance-values">
          <div className={`balance-item ${montantDisponibleUSD >= 0 ? "positive" : "negative"}`}>
            <span>USD</span>
            <strong>{montantDisponibleUSD.toFixed(2)}</strong>
          </div>
          <div className={`balance-item ${montantDisponibleFC >= 0 ? "positive" : "negative"}`}>
            <span>FC</span>
            <strong>{montantDisponibleFC.toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* ===== Download PDF ===== */}
      <div className="button-container">
        <button className="pdf-button" onClick={downloadPDF}>
          Télécharger PDF
        </button>
      </div>

      {/* ===== Transactions Table ===== */}
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
                <td>{tx.id}</td>
                <td>{getUserFullName(tx.user_id)}</td>
                <td>{formatDate(tx.date)}</td>
                <td
                  className={`amount-cell ${
                    tx.channel === "Entrées" ? "amount-entrees" : "amount-sorties"
                  }`}
                >
                  {tx.amount}
                </td>
                <td>{tx.currency}</td>
                <td>{tx.channel}</td>
                <td>{tx.motif}</td>
                <td>
                  <StatusBadge status={tx.status} />
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
