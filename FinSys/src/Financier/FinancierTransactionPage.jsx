import React, { useEffect, useState } => "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ⚠️ ATTENTION : Les styles sont maintenant définis ci-dessous dans l'objet `styles`
// et sont appliqués en ligne (inline) aux éléments JSX.
// Nous conservons les classes pour les badges de statut car ce sont des composants conditionnels.

// --- STYLES INLINE ---
const styles = {
  // Conteneur principal
  financierContainer: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif',
  },
  pageTitle: {
    textAlign: 'center',
    color: '#1e3c72',
    marginBottom: '30px',
    fontSize: '2rem',
  },
  loadingMessage: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '1.2rem',
    color: '#666',
  },

  // --- CARTE DE SOLDE DISPONIBLE ---
  availableBalanceCard: {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: 'white',
    padding: '20px 30px',
    borderRadius: '12px',
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
    marginBottom: '25px',
    width: '100%',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  cardTitle: {
    fontSize: '1.4rem',
    fontWeight: '600',
    marginBottom: '15px',
    borderBottom: '2px solid rgba(255, 255, 255, 0.3)',
    paddingBottom: '5px',
    margin: '0',
  },
  balanceValuesContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    gap: '20px',
  },
  balanceItem: {
    textAlign: 'center',
    flexGrow: '1',
  },
  balanceCurrencyLabel: {
    display: 'block',
    fontSize: '0.9rem',
    opacity: '0.8',
    marginBottom: '5px',
  },
  balanceValue: {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    margin: '0',
    padding: '5px 0',
  },
  positiveBalance: {
    color: '#4cd964', // Vert
  },
  negativeBalance: {
    color: '#ff3b30', // Rouge
  },

  // --- CARTES SOMMAIRES (Entrées / Sorties) ---
  summaryCardsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '30px',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  summaryGroup: {
    backgroundColor: '#f7f7f7',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    borderLeft: '5px solid',
  },
  summaryEntrees: {
    borderColor: '#4cd964', // Vert
  },
  summarySorties: {
    borderColor: '#ff3b30', // Rouge
  },
  summaryGroupTitle: {
    fontSize: '1.2rem',
    color: '#333',
    margin: '0 0 15px 0',
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
    fontSize: '0.85rem',
    color: '#666',
  },
  summaryValueAmount: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e3c72',
  },

  // --- MÉTRIQUES DE PERFORMANCE ---
  performanceCard: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    marginBottom: '30px',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  sectionTitle: {
    fontSize: '1.5rem',
    color: '#1e3c72',
    borderBottom: '2px solid #eee',
    paddingBottom: '10px',
    marginBottom: '20px',
  },
  performanceLayout: {
    display: 'flex',
    gap: '30px',
    flexWrap: 'wrap',
  },
  performanceSection: {
    flex: '1',
    minWidth: '250px',
  },
  performanceSectionTitle: {
    fontSize: '1.1rem',
    color: '#333',
    marginBottom: '15px',
  },
  rankingList: {
    listStyleType: 'none',
    padding: '0',
  },
  topUserItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  rankBadge: {
    background: '#1e3c72',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    textAlign: 'center',
    lineHeight: '24px',
    fontSize: '0.8rem',
    marginRight: '15px',
    fontWeight: 'bold',
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
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'background-color 0.3s',
  },
  pdfButtonHover: {
    backgroundColor: '#0056b3',
  },

  // --- TABLEAU ---
  tableWrapper: {
    overflowX: 'auto',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  transactionsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '700px',
  },
  tableHeader: {
    backgroundColor: '#f1f1f1',
    color: '#333',
    textAlign: 'left',
    padding: '12px 15px',
    borderBottom: '2px solid #ddd',
  },
  tableCell: {
    padding: '12px 15px',
    borderBottom: '1px solid #eee',
    color: '#444',
  },
  amountEntrees: {
    color: '#4cd964',
    fontWeight: 'bold',
  },
  amountSorties: {
    color: '#ff3b30',
    fontWeight: 'bold',
  }
};
// --- FIN DES STYLES INLINE ---


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

// Composant Carte pour les totaux (N'est plus utilisé, mais gardé en cas de besoin futur)
// const Card = ({ title, value }) => (
//   <div style={styles.summaryCard}>
//     <h3 style={styles.cardTitle}>{title}</h3>
//     <p style={styles.cardValue}>{value.toFixed(2)}</p>
//   </div>
// );

// NOUVEAU: Composant pour la carte "Montant disponible" (Solde)
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

  // NOTE: Ces classes doivent être définies dans un fichier CSS (ou un style global)
  // car la couleur de fond et la couleur du texte dépendent de la condition.
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

  // Add state for users and loading flag
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);

  // Function to fetch users
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

  // Récupérer les transactions
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
    if (!txData || txData.length === 0 || !usersLoaded) return;

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

  // Télécharger en PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 10;
    
    doc.text("Table des Transactions", 20, y);
    y += 10; // Espace

    // Ajout du Montant Disponible dans le PDF
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
    // Couleur conditionnelle pour le solde USD
    doc.setTextColor(dollarsBalance >= 0 ? 0 : 255, dollarsBalance >= 0 ? 0 : 0, 0); // Green/Red color
    doc.text(`Solde USD: ${dollarsBalance.toFixed(2)} $`, 140, y);
    doc.setTextColor(0, 0, 0); // Reset color
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.text(`FC Entrées: ${fcSum[0].toFixed(2)} FC`, 20, y);
    doc.text(`FC Sorties: ${fcSum[1].toFixed(2)} FC`, 80, y);
    doc.setFont("helvetica", "bold");
    // Couleur conditionnelle pour le solde FC
    doc.setTextColor(fcBalance >= 0 ? 0 : 255, fcBalance >= 0 ? 0 : 0, 0); // Green/Red color
    doc.text(`Solde FC: ${fcBalance.toFixed(2)} FC`, 140, y);
    doc.setTextColor(0, 0, 0); // Reset color
    y += 10; // Espace avant le tableau

    // Tableau des transactions
    autoTable(doc, {
      startY: y, // Commence après les informations du solde
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

  // Helper function to get the full user name
  const getUserFullName = (userId) => {
    const user = users.find(u => u.id === userId);
    const fullName = user ? `${user.name} ${user.surname}`.trim() : userId || "N/A";
    return fullName;
  };

  // Function to get user name for table row
  const getUserName = (tx) => {
    return getUserFullName(tx.user_id);
  };

  // useEffect to fetch both transactions and users
  useEffect(() => {
    fetchTransactions();
    fetchUsers();
  }, []);

  // Separate useEffect to calculate performance only after both are loaded
  useEffect(() => {
    if (transactions.length > 0 && usersLoaded) {
      calculatePerformance(transactions);
    }
  }, [transactions, usersLoaded]);

  if (loading) return <p style={styles.loadingMessage}>Chargement des données...</p>;

  // Calcul du Montant Disponible pour l'affichage
  const dollarsBalance = dollarsSum[0] - dollarsSum[1];
  const fcBalance = fcSum[0] - fcSum[1];

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
                          <span>{user.txCount} transactions</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* --- Classement Complet --- */}
              <div style={styles.performanceSection}>
                <h3 style={styles.performanceSectionTitle}>Classement Complet</h3>
                <ul style={{ ...styles.rankingList, paddingLeft: '15px' }}>
                  {performanceData.sortedUsers.map((user, index) => (
                    <li key={user.id} style={{ display: 'flex', alignItems: 'center', padding: '5px 0' }}>
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
            style={styles.pdfButton} 
            onClick={downloadPDF}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.pdfButtonHover.backgroundColor}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.pdfButton.backgroundColor}
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
                    {/* StatusBadge garde sa dépendance à un fichier CSS pour la couleur */}
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
