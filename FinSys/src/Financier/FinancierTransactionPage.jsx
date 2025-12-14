import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./FinancierTransactionsPage.css";

/* ===========================
   Helpers
=========================== */
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
    return dateString?.split("T")[0] || "-";
  }
};

/* ===========================
   Status Badge
=========================== */
const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase();
  let cls = "status-unknown";
  if (s === "approved") cls = "status-approved";
  else if (s === "pending") cls = "status-pending";
  else if (s === "rejected") cls = "status-rejected";

  return <span className={`status-badge ${cls}`}>{status || "N/A"}</span>;
};

/* ===========================
   Main Component
=========================== */
const FinancierTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);

  const [dollarsSum, setDollarsSum] = useState([0, 0]); // [Entrées, Sorties]
  const [fcSum, setFcSum] = useState([0, 0]); // [Entrées, Sorties]

  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  /* ===========================
     Fetch Users
  =========================== */
  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(
        "https://finsys.onrender.com/api/users/all",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoaded(true);
    }
  };

  /* ===========================
     Fetch Transactions
  =========================== */
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     Calculations
  =========================== */
  const calculatePerformance = (txs) => {
    if (!txs.length || !usersLoaded) return;

    const approved = txs.filter(
      (t) => t.status?.toLowerCase() === "approved"
    );

    const src = approved.length ? approved : txs;

    const sum = (filter) =>
      src.filter(filter).reduce((s, t) => s + Number(t.amount || 0), 0);

    const usdIn = sum((t) => t.channel === "Entrées" && t.currency === "$");
    const usdOut = sum((t) => t.channel === "Sorties" && t.currency === "$");
    const fcIn = sum((t) => t.channel === "Entrées" && t.currency === "FC");
    const fcOut = sum((t) => t.channel === "Sorties" && t.currency === "FC");

    setDollarsSum([usdIn, usdOut]);
    setFcSum([fcIn, fcOut]);

    const counts = {};
    approved.forEach((t) => {
      if (t.user_id) counts[t.user_id] = (counts[t.user_id] || 0) + 1;
    });

    const ranked = Object.entries(counts)
      .map(([id, c]) => ({
        id,
        name: getUserFullName(id),
        txCount: c,
      }))
      .sort((a, b) => b.txCount - a.txCount);

    setPerformanceData({
      sortedUsers: ranked,
      topUsers: ranked.slice(0, 3),
    });
  };

  /* ===========================
     PDF
  =========================== */
  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.text("Rapport Financier", 20, 15);

    doc.text(
      `Montant Disponible USD : ${(dollarsSum[0] - dollarsSum[1]).toFixed(2)}`,
      20,
      25
    );
    doc.text(
      `Montant Disponible FC : ${(fcSum[0] - fcSum[1]).toFixed(2)}`,
      20,
      32
    );

    autoTable(doc, {
      startY: 40,
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
      body: transactions.map((t) => [
        t.id,
        getUserFullName(t.user_id),
        formatDate(t.date),
        t.amount,
        t.currency,
        t.channel,
        t.motif,
        t.status,
      ]),
    });

    doc.save("transactions.pdf");
  };

  /* ===========================
     Helpers
  =========================== */
  const getUserFullName = (id) => {
    const u = users.find((x) => x.id === id);
    return u ? `${u.name} ${u.surname}` : id || "N/A";
  };

  /* ===========================
     Effects
  =========================== */
  useEffect(() => {
    fetchTransactions();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (transactions.length && usersLoaded) {
      calculatePerformance(transactions);
    }
  }, [transactions, usersLoaded]);

  if (loading) return <p className="loading-message">Chargement...</p>;

  /* ===========================
     Render
  =========================== */
  return (
    <div className="financier-container">
      <h1 className="page-title">Transactions Financier</h1>

      {/* Totaux */}
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
            <div className="summary-value sorties">
              <span>USD</span>
              <span>{dollarsSum[1].toFixed(2)}</span>
            </div>
            <div className="summary-value sorties">
              <span>FC</span>
              <span>{fcSum[1].toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Montant Disponible */}
      <div className="available-balance-card">
        <h2>Montant Disponible</h2>
        <div className="available-values">
          <div>
            <span>USD</span>
            <strong>{(dollarsSum[0] - dollarsSum[1]).toFixed(2)}</strong>
          </div>
          <div>
            <span>FC</span>
            <strong>{(fcSum[0] - fcSum[1]).toFixed(2)}</strong>
          </div>
        </div>
      </div>

      {/* Performance */}
      {performanceData && (
        <div className="performance-card">
          <h2>Métriques de Performance</h2>
          {/* unchanged */}
        </div>
      )}

      <div className="button-container">
        <button className="pdf-button" onClick={downloadPDF}>
          Télécharger PDF
        </button>
      </div>

      {/* Table */}
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
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{getUserFullName(t.user_id)}</td>
                <td>{formatDate(t.date)}</td>
                <td
                  className={`amount-cell ${
                    t.channel === "Entrées"
                      ? "amount-entrees"
                      : "amount-sorties"
                  }`}
                >
                  {t.amount}
                </td>
                <td>{t.currency}</td>
                <td>{t.channel}</td>
                <td>{t.motif}</td>
                <td>
                  <StatusBadge status={t.status} />
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
