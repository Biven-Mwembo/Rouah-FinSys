import React, { useEffect, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- STYLES INLINE AMÉLIORÉS ET RESPONSIVES ---
const styles = {
  // Styles de base et utilitaires pour la réactivité
  mobileBreakpoint: '600px', 
  
  // Conteneur principal
  financierContainer: {
    padding: '15px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Roboto, Arial, sans-serif',
    backgroundColor: '#f4f7f9', // Fond propre
    overflowX: 'hidden', // Empêche le défilement horizontal de la page entière
    minHeight: '100vh',
  },
  pageTitle: {
    textAlign: 'center',
    color: '#1e3c72',
    marginBottom: '35px',
    fontSize: '2.2rem',
    fontWeight: '700',
  },
  loadingMessage: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '1.2rem',
    color: '#666',
  },

  // --- CARTE DE SOLDE DISPONIBLE (Design Moderne) ---
  availableBalanceCard: {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: 'white',
    padding: '25px 35px',
    borderRadius: '16px', // Rayon plus grand
    boxShadow: '0 8px 20px rgba(30, 60, 114, 0.4)', // Ombre plus prononcée
    marginBottom: '30px',
    width: '100%',
    maxWidth: '850px',
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '1.6rem',
    fontWeight: '600',
    marginBottom: '15px',
    borderBottom: '2px solid rgba(255, 255, 255, 0.4)',
    paddingBottom: '8px',
    margin: '0',
    width: '100%',
    textAlign: 'center',
  },
  balanceValuesContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '40px',
    width: '100%',
    marginTop: '15px',
  },
  balanceItem: {
    textAlign: 'center',
    flexGrow: '1',
    padding: '10px 0',
    borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
    ':first-child': { borderLeft: 'none' } // Non applicable en style inline
  },
  balanceCurrencyLabel: {
    display: 'block',
    fontSize: '0.9rem',
    opacity: '0.9',
    marginBottom: '8px',
  },
  balanceValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: '0',
  },
  positiveBalance: {
    color: '#34d399', // Vert clair moderne
  },
  negativeBalance: {
    color: '#ef4444', // Rouge vif
  },

  // --- CARTES SOMMAIRES (Entrées / Sorties) ---
  summaryCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', // Réactif par défaut
    gap: '20px',
    marginBottom: '30px',
    maxWidth: '850px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  summaryGroup: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    textAlign: 'center',
    borderBottom: '4px solid',
    transition: 'transform 0.2s',
  },
  summaryEntrees: {
    borderColor: '#34d399', // Vert moderne
  },
  summarySorties: {
    borderColor: '#ef4444', // Rouge moderne
  },
  summaryGroupTitle: {
    fontSize: '1.3rem',
    color: '#333',
    margin: '0 0 15px 0',
    fontWeight: '600',
  },
  summaryValues: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  summaryValue: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  summaryValueLabel: {
    display: 'block',
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '5px',
  },
  summaryValueAmount: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    color: '#1e3c72',
  },

  // --- MÉTRIQUES DE PERFORMANCE ---
  performanceCard: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.08)',
    marginBottom: '30px',
    maxWidth: '850px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#1e3c72',
    borderBottom: '1px solid #ddd',
    paddingBottom: '10px',
    marginBottom: '20px',
    fontWeight: '600',
  },
  performanceLayout: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  performanceSection: {
    flex: '1',
    minWidth: '280px',
    padding: '10px',
  },
  performanceSectionTitle: {
    fontSize: '1.2rem',
    color: '#333',
    marginBottom: '15px',
    fontWeight: '600',
  },
  rankingList: {
    listStyleType: 'none',
    padding: '0',
    margin: '0',
  },
  topUserItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  rankBadge: {
    background: '#1e3c72',
    color: 'white',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    textAlign: 'center',
    lineHeight: '28px',
    fontSize: '0.9rem',
    marginRight: '15px',
    fontWeight: 'bold',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  },
  userinfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  rankNumber: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginRight: '10px',
    color: '#666',
  },

  // --- BOUTON PDF ---
  buttonContainer: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  pdfButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '12px 25px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'background-color 0.3s, transform 0.1s',
    boxShadow: '0 4px 6px rgba(0, 123, 255, 0.3)',
  },
  pdfButtonHover: {
    backgroundColor: '#0056b3',
  },
  pdfButtonActive: {
    transform: 'scale(0.98)',
  },

  // --- TABLEAU ---
  tableWrapper: {
    overflowX: 'auto', // Permet au tableau de défiler horizontalement SEULEMENT
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  transactionsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '750px', // Assure un minimum de largeur pour l'affichage des colonnes
  },
  tableHeader: {
    backgroundColor: '#eef1f6',
    color: '#1e3c72',
    textAlign: 'left',
    padding: '15px 15px',
    borderBottom: '2px solid #ddd',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: '0.9rem',
  },
  tableCell: {
    padding: '12px 15px',
    borderBottom: '1px solid #eee',
    color: '#444',
    fontSize: '0.9rem',
  },
  amountEntrees: {
    color: '#34d399',
    fontWeight: 'bold',
  },
  amountSorties: {
    color: '#ef4444',
    fontWeight: 'bold',
  }
};
// --- FIN DES STYLES INLINE ---


// Fonction pour formater la date (Inchangé)
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

// Composant pour la carte "Montant disponible" (Solde)
const AvailableBalanceCard = ({ dollarsBalance, fcBalance }) => {
    const dollarStyle = dollarsBalance >= 0 ? styles.positiveBalance : styles.negativeBalance;
    const fcStyle = fcBalance >= 0 ? styles.positiveBalance : styles.negativeBalance;

    return (
        <div style={styles.availableBalanceCard}>
            <h3 style={styles.cardTitle}>Montant disponible</h3>
            <div style={styles.balanceValuesContainer}>
                <div style={styles.balanceItem}>
                    <span style={styles.balanceCurrencyLabel}>USD</span>
                    <p style={{ ...styles.balanceValue, ...dollarStyle }}>
                        {dollarsBalance.toFixed(2)} $
                    </p>
                </div>
                <div style={styles.balanceItem}>
                    <span style={styles.balanceCurrencyLabel}>FC</span>
                    <p style={{ ...styles.balanceValue, ...fcStyle }}>
                        {fcBalance.toFixed(2)} FC
                    </p>
                </div>
            </div>
        </div>
    );
};


// Composant pour le statut (Garde les classes CSS pour la couleur conditionnelle)
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

  // NOTE: Ces classes doivent toujours être définies dans votre fichier CSS externe
  // car les styles en ligne ne gèrent pas la couleur conditionnelle basée sur la classe
  // sans utiliser de code React supplémentaire.
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

  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [buttonHover, setButtonHover] = useState(false); // État pour l'effet de survol du bouton
  const [buttonActive, setButtonActive] = useState(false); // État pour l'effet d'activation du bouton

  // Logique inchangée (fetchUsers, fetchTransactions, calculatePerformance, getUserFullName, getUserName, useEffects...)
  
  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("https://finsys.onrender.com/api/users/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data);
      setUsersLoaded(true);
    } catch (err) {
      console.error("Erreur lors de la récupération des utilisateurs:", err);
      setUsersLoaded(true);
    }
  };

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

  const calculatePerformance = (txData) => {
    if (!txData || txData.length === 0 || !usersLoaded) return;

    const approvedTx = txData.filter((tx) => tx.status?.toLowerCase() === "approved");
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

    const userTxCounts = {};
    approvedTx.forEach(tx => {
      const userId = tx.user_id;
      if (userId) userTxCounts[userId] = (userTxCounts[userId] || 0) + 1;
    });

    const sortedUsers = Object.entries(userTxCounts)
      .map(([userId, count]) => {
        return {
          id: userId,
          name: getUserFullName(userId),
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

  // Télécharger en PDF (Inchangé)
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    
    doc.text("Table des Transactions", 20, y);
    y += 10;

    const dollarsBalance = dollarsSum[0] - dollarsSum[1];
    const fcBalance = fcSum[0] - fcSum[1];

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Montant Disponible (Solde)", 20, y);
    y += 7;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`USD Entrées: ${dollarsSum[0].toFixed(2)} $`, 20, y);
    doc.text(`USD Sorties: ${dollarsSum[1].toFixed(2)} $`, 80, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(dollarsBalance >= 0 ? 0 : 255, dollarsBalance >= 0 ? 0 : 0, 0); 
    doc.text(`Solde USD: ${dollarsBalance.toFixed(2)} $`, 140, y);
    doc.setTextColor(0, 0, 0); 
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.text(`FC Entrées: ${fcSum[0].toFixed(2)} FC`, 20, y);
    doc.text(`FC Sorties: ${fcSum[1].toFixed(2)} FC`, 80, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(fcBalance >= 0 ? 0 : 255, fcBalance >= 0 ? 0 : 0, 0); 
    doc.text(`Solde FC: ${fcBalance.toFixed(2)} FC`, 140, y);
    doc.setTextColor(0, 0, 0); 
    y += 10;

    autoTable(doc, {
      startY: y,
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

  const getUserFullName = (userId) => {
    const user = users.find(u => u.id === userId);
    const fullName = user ? `${user.name} ${user.surname}`.trim() : userId || "N/A";
    return fullName;
  };

  const getUserName = (tx) => {
    return getUserFullName(tx.user_id);
  };

  // UPDATED: useEffect to fetch both transactions and users
  useEffect(() => {
    fetchTransactions();
    fetchUsers();
  }, []);

  // UPDATED: Separate useEffect to calculate performance only after both are loaded
  useEffect(() => {
    if (transactions.length > 0 && usersLoaded) {
      calculatePerformance(transactions);
    }
  }, [transactions, usersLoaded]);
  
  if (loading) return <p style={styles.loadingMessage}>Chargement des données...</p>;

  // Calcul du Montant Disponible pour l'affichage
  const dollarsBalance = dollarsSum[0] - dollarsSum[1];
  const fcBalance = fcSum[0] - fcSum[1];

  // Gestion des styles dynamiques pour le bouton PDF
  const pdfButtonStyle = {
    ...styles.pdfButton,
    ...(buttonHover ? styles.pdfButtonHover : {}),
    ...(buttonActive ? styles.pdfButtonActive : {}),
  };

  return (
    <>
      <div style={styles.financierContainer}>
        <h1 style={styles.pageTitle}>Transactions Financier</h1>

        {/* Carte Montant Disponible */}
        <AvailableBalanceCard 
          dollarsBalance={dollarsBalance} 
          fcBalance={fcBalance} 
        />

        {/* Cartes des totaux (Entrées et Sorties) */}
        <div style={styles.summaryCardsGrid}>
          {/* Entrées */}
          <div style={{ ...styles.summaryGroup, ...styles.summaryEntrees }}>
            <h2 style={styles.summaryGroupTitle}>Entrées</h2>
            <div style={styles.summaryValues}>
              <div style={styles.summaryValue}>
                <span style={styles.summaryValueLabel}>USD</span>
                <span style={styles.summaryValueAmount}>{dollarsSum[0].toFixed(2)}</span>
              </div>
              <div style={styles.summaryValue}>
                <span style={styles.summaryValueLabel}>FC</span>
                <span style={styles.summaryValueAmount}>{fcSum[0].toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Sorties */}
          <div style={{ ...styles.summaryGroup, ...styles.summarySorties }}>
            <h2 style={styles.summaryGroupTitle}>Sorties</h2>
            <div style={styles.summaryValues}>
              <div style={styles.summaryValue}>
                <span style={styles.summaryValueLabel}>USD</span>
                <span style={styles.summaryValueAmount}>{dollarsSum[1].toFixed(2)}</span>
              </div>
              <div style={styles.summaryValue}>
                <span style={styles.summaryValueLabel}>FC</span>
                <span style={styles.summaryValueAmount}>{fcSum[1].toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Métriques de Performance */}
        {performanceData && (
          <div style={styles.performanceCard}>
            <h2 style={styles.sectionTitle}>Métriques de Performance</h2>
            <div style={styles.performanceLayout}>
              {/* --- Top 3 Contributeurs --- */}
              {performanceData.topUsers && performanceData.topUsers.length > 0 && (
                <div style={styles.performanceSection}>
                  <h3 style={styles.performanceSectionTitle}>Top 3 Contributeurs</h3>
                  <ul style={styles.rankingList}>
                    {performanceData.topUsers.map((user, index) => (
                      <li key={user.id} style={styles.topUserItem}>
                        <span style={styles.rankBadge}>{index + 1}</span>
                        <div style={styles.userinfo}>
                          <strong>{user.name}</strong>
                          <span style={{ fontSize: '0.9rem', color: '#666' }}>{user.txCount} transactions</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* --- Classement Complet --- */}
              <div style={styles.performanceSection}>
                <h3 style={styles.performanceSectionTitle}>Classement Complet</h3>
                <ul style={styles.rankingList}>
                  {performanceData.sortedUsers.map((user, index) => (
                    <li key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: index < performanceData.sortedUsers.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <span style={styles.rankNumber}>{index + 1}.</span>
                      <div style={styles.userinfo}>
                        <strong>{user.name}</strong>
                        <span style={{ fontSize: '0.9rem', color: '#666' }}>{user.txCount} transactions</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Bouton Télécharger PDF */}
        <div style={styles.buttonContainer}>
          <button 
            style={pdfButtonStyle} 
            onClick={downloadPDF}
            onMouseEnter={() => setButtonHover(true)}
            onMouseLeave={() => setButtonHover(false)}
            onMouseDown={() => setButtonActive(true)}
            onMouseUp={() => setButtonActive(false)}
          >
            Télécharger PDF
          </button>
        </div>

        {/* Table des Transactions */}
        <div style={styles.tableWrapper}>
          <table style={styles.transactionsTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>ID</th>
                <th style={styles.tableHeader}>Utilisateur</th>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Montant</th>
                <th style={styles.tableHeader}>Devise</th>
                <th style={styles.tableHeader}>Canal</th>
                <th style={styles.tableHeader}>Motif</th>
                <th style={styles.tableHeader}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={styles.tableCell}>{tx.id}</td>
                  <td style={styles.tableCell}>{getUserName(tx)}</td>
                  <td style={styles.tableCell}>{formatDate(tx.date)}</td>
                  <td
                    style={{ 
                        ...styles.tableCell, 
                        ...(tx.channel === 'Entrées' ? styles.amountEntrees : styles.amountSorties) 
                    }}
                  >
                    {tx.amount}
                  </td>
                  <td style={styles.tableCell}>{tx.currency}</td>
                  <td style={styles.tableCell}>{tx.channel}</td>
                  <td style={styles.tableCell}>{tx.motif}</td>
                  <td style={styles.tableCell}>
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
