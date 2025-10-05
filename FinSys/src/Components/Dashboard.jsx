import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Plot from "react-plotly.js";

const API_BASE_URL = "https://finsys.onrender.com/api";

// --- START: Internal Components (Unchanged) ---

const SuccessToast = ({ message }) => {
  return (
    <div
      className="success-toast"
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "#10b981", // Emerald green
        color: "#fff",
        padding: "15px 30px",
        borderRadius: "8px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        zIndex: 10001,
        animation: "slideInUp 0.3s ease-out, fadeOut 0.5s ease-in 4.5s forwards",
      }}
    >
      <span>{message}</span>
      <style>{`
        @keyframes slideInUp {
          from {
            transform: translate(-50%, 100%);
          }
          to {
            transform: translate(-50%, 0);
          }
        }
        @keyframes fadeOut {
          to {
            opacity: 0;
            visibility: hidden;
          }
        }
      `}</style>
    </div>
  );
};


const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div
      className="confirmation-modal-overlay"
      onClick={onCancel}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10000,
      }}
    >
      <div
        className="confirmation-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "25px 30px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        <h3 style={{ fontSize: "1.2rem", color: "#111827", marginBottom: "15px" }}>
          Confirm Transaction
        </h3>
        <p style={{ marginBottom: "25px", color: "#4b5563" }}>
          {message}
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 20px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              backgroundColor: "#fff",
              cursor: "pointer",
              transition: "all 0.2s",
              fontWeight: 500,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "10px 20px",
              backgroundColor: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#059669")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#10b981")}
          >
            Confirm Add
          </button>
        </div>
      </div>
    </div>
  );
};


const MessageBox = ({ message, onClose }) => (
  <div
    className="message-box"
    style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      backgroundColor: "#fee2e2",
      color: "#b91c1c",
      padding: "12px 20px",
      borderRadius: "10px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      zIndex: 9999,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      minWidth: "250px",
    }}
  >
    <span>{message}</span>
    <button
      onClick={onClose}
      style={{
        marginLeft: "15px",
        background: "none",
        border: "none",
        fontSize: "1.2rem",
        cursor: "pointer",
        color: "#b91c1c",
      }}
    >
      &times;
    </button>
  </div>
);

const Card = ({ title, balance, fcBalance, color }) => (
  <div
    className={`card ${color}`}
    style={{
      backgroundColor: "#fff",
      padding: "20px",
      borderRadius: "16px",
      flex: 1,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      minWidth: "200px",
     
    }}
  >
    <h3 style={{ color: "#374151", fontWeight: 600 }}>{title}</h3>
    <p className="balance" style={{ fontSize: "1.25rem", fontWeight: 600 }}>
      {balance}
    </p>
    <p className="fc-balance" style={{ color: "#6b7280" }}>
      {fcBalance}
    </p>
  </div>
);

const Navbar = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState("User");

  useEffect(() => {
    try {
      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        setUserEmail(user.email || "User");
      }
    } catch (e) {
      console.error("Failed to parse user data for navbar.", e);
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
   <nav
  style={{
    position: "relative",
    top: "0",
    right: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    padding: "0.75rem 1rem",
    backgroundColor: "#f5f5f7",
    color: "#0f0f0fff",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    borderBottomLeftRadius: "0.75rem",
    zIndex: 1000,
  }}
>
  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
    <span
      style={{
        fontSize: "0.875rem",
        fontWeight: 500,
        color: "#141414ff",
      }}
    >
      <strong>{userEmail}</strong>
      </span>

    {/* Profile Circle */}
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#3b82f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 600,
        fontSize: "1rem",
        cursor: "pointer",
      }}
      title="Profile"
      
    >
      {userEmail?.charAt(0).toUpperCase() || "U"}
    </div>
  </div>
</nav>


  );
};
// --- END: Internal Components (Unchanged) ---


export default function Dashboard() {
  const navigate = useNavigate();

  const [tableData, setTableData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirm] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState(null);
  // 👇 NEW STATE: To hold the JWT Token
  const [authToken, setAuthToken] = useState(null); 

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    currency: "$",
    channel: "Entrées",
    motif: "",
    file: null,
    userID: "",
  });

  const [dollarsSum, setDollarsSum] = useState([0, 0]); // [Entrees, Sorties]
  const [fcSum, setFcSum] = useState([0, 0]); // [Entrees, Sorties]

  // --- Fetch transactions from backend ---
  const fetchTransactions = async (userId, token) => {
    if (!userId || !token) {
      console.log("No UserID or Token available for fetching.");
      setLoading(false);
      return;
    }
    
    try {
      // Pass the Authorization header for GET requests too
      const response = await axios.get(`${API_BASE_URL}/Transactions/user/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      setTableData(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
    }
  };

  // Correct Authentication Check and User ID Retrieval
  useEffect(() => {
    const userString = localStorage.getItem("user");
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!userString || !isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(userString);
      const userId = user?.id;
      // 👇 IMPORTANT: Get the token from the user object
      const token = user?.token; 

      if (!userId || !token) {
        localStorage.clear();
        navigate("/login");
        return;
      }

      setCurrentUserId(userId);
      setAuthToken(token); // 👇 Store the token
      setNewTransaction((prev) => ({ ...prev, userID: userId }));

      fetchTransactions(userId, token); // 👇 Pass the token to fetch
    } catch (e) {
      console.error("Error parsing user data:", e);
      setErrorMessage("Local user data corrupted. Please log in again.");
      localStorage.clear();
      navigate("/login");
    }
  }, [navigate]);

  // Update chart sums whenever tableData changes
 useEffect(() => {
  const totalDollarsEntrees = tableData
    .filter((tx) => tx.channel === "Entrées" && tx.currency === "$")
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalDollarsSorties = tableData
    .filter((tx) => tx.channel === "Sorties" && tx.currency === "$")
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalFcEntrees = tableData
    .filter((tx) => tx.channel === "Entrées" && tx.currency === "FC")
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  const totalFcSorties = tableData
    .filter((tx) => tx.channel === "Sorties" && tx.currency === "FC")
    .reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);

  setDollarsSum([totalDollarsEntrees, totalDollarsSorties]);
  setFcSum([totalFcEntrees, totalFcSorties]);
}, [tableData]);


  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setNewTransaction((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

const handleConfirmSubmit = async () => {
  setShowConfirm(false);
  
  if (!authToken) {
    setErrorMessage("Authorization token is missing. Please log in again.");
    return;
  }

  const formData = new FormData();
  formData.append("Date", newTransaction.date);
  formData.append("Amount", newTransaction.amount);
  formData.append("Currency", newTransaction.currency);
  formData.append("Channel", newTransaction.channel);
  formData.append("Motif", newTransaction.motif || "N/A");
  formData.append("User_Id", currentUserId);
  if (newTransaction.file) {
    formData.append("File", newTransaction.file);
  }
  
  // 👇 FIX: Include the Authorization header with the JWT token
  try {
    const response = await axios.post(`${API_BASE_URL}/Transactions`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Authorization": `Bearer ${authToken}`, // <--- THIS IS THE FIX
      },
    });

    console.log("Transaction added:", response.data);

    if (currentUserId && authToken) {
      fetchTransactions(currentUserId, authToken); // Re-fetch with token
    }

    // Show success banner
    setShowSuccessBanner(true);
    setTimeout(() => {
        setShowSuccessBanner(false);
    }, 5000);

    // Reset form and close the main modal
    setNewTransaction({
      date: new Date().toISOString().slice(0, 10),
      amount: "",
      currency: "$",
      channel: "Entrées",
      motif: "",
      file: null,
      userID: currentUserId,
    });
    setShowModal(false);
  } catch (error) {
    console.error("Error adding transaction:", error.response?.data || error.message);
    // Enhanced error message for 401
    if (error.response && error.response.status === 401) {
      setErrorMessage("Failed to add transaction: Unauthorized. Your session may have expired.");
    } else {
      setErrorMessage(error.response?.data?.message || "Failed to add transaction. Check console for details.");
    }
  }
};

const handleSubmit = (e) => {
  e.preventDefault();
  
  if (!newTransaction.amount || newTransaction.amount <= 0) {
    setErrorMessage("Please enter a valid amount.");
    return;
  }
  
  setShowConfirm(true);
};


  // --- Card balances & Calculations ---
  const entreesDollars = dollarsSum[0];
  const sortiesDollars = dollarsSum[1];
  const entreesFC = fcSum[0];
  const sortiesFC = fcSum[1];
 
  // Calculate Remaining Balances
  const remainingDollars = (entreesDollars - sortiesDollars).toFixed(2);
  const remainingFC = (entreesFC - sortiesFC).toFixed(2);

  // Display balances for the existing cards
  const entreesBalance = `$${entreesDollars.toFixed(2)}`;
  const sortiesBalance = `$${sortiesDollars.toFixed(2)}`;
  const entreesFCDisplay = `FC ${entreesFC.toFixed(2)}`;
  const sortiesFCDisplay = `FC ${sortiesFC.toFixed(2)}`;

  // Determine the transaction summary for the confirmation message
  const confirmationMessage = `Are you sure you want to add the transaction of ${newTransaction.currency} ${Number(newTransaction.amount).toFixed(2)} as an ${newTransaction.channel.toLowerCase()}? This action is permanent.`;


  return (
    <div
      className="dashboard"
      style={{
        padding: "8px",
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#f9fafb",
      }}
    >
      <Navbar />
      {errorMessage && (
        <MessageBox message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      {loading ? (
         <div style={{ padding: '40px', textAlign: 'center', fontSize: '1.2rem', color: '#6b7280' }}>
            Loading financial data...
         </div>
      ) : (
        <>
          {/* Transactions Cards Section */}
         <div className="transactions-section" style={{ marginTop: "0px" }}>
  <div
    className="transactions-header"
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "2px",
    }}
  >
    <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827" }}>
      Transactions
    </h2>
    <button
      className="add-btn"
      onClick={() => setShowModal(true)}
      style={{
        backgroundColor: "#4f46e5",
        color: "#fff",
        padding: "8px 16px",
        borderRadius: "8px",
        fontWeight: 500,
        cursor: "pointer",
        border: "none",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor = "#4338ca")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor = "#4f46e5")
      }
    >
      + Add
    </button>
  </div>

  <div
    className="transactions-cards-wrapper"
    style={{
      display: "flex",
      gap: "16px",
      minWidth: "100%",
      width: "100%",
      flexWrap: "nowrap",
      overflowX: "auto",
      paddingBottom: "0px",
      fontFamily: "'JetBrains Mono', monospace", // ✅ JetBrains-like font
    }}
  >
    <Card
      style={{
        minWidth: "300px", // ✅ Increased width
        flex: "0 0 auto",
        fontFamily: "'JetBrains Mono', monospace",
      }}
      title="ENTRÉES"
      balance={entreesBalance}
      fcBalance={entreesFCDisplay}
      color="card-entrees"
    />
    <Card
      style={{
        minWidth: "300px", // ✅ Increased width
        flex: "0 0 auto",
        fontFamily: "'JetBrains Mono', monospace",
      }}
      title="SORTIES"
      balance={sortiesBalance}
      fcBalance={sortiesFCDisplay}
      color="card-sorties"
    />
  </div>
</div>
 
          {/* 👇 NEW: Remaining Balance Display */}
 <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827" }}>
                Ecarts
              </h2>
          <div
            className="remaining-balance-div"
            style={{
              marginTop: "20px",
              padding: "20px",
              backgroundColor: "#22c55e", // Green background for remaining balance
              color: "#fff",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              textAlign: "center",
            }}
          >
           
            <div style={{ display: "flex", justifyContent: "space-around", gap: "20px" }}>
              <div style={{ flex: 1, borderRight: "1px solid rgba(255, 255, 255, 0.5)", paddingRight: "10px" }}>
                <p style={{ fontSize: "1.1rem", fontWeight: 500, opacity: 0.9 }}>$</p>
                <p style={{ fontSize: "1rem", fontWeight: 600 }}>
                  {remainingDollars}
                </p>
              </div>
              <div style={{ flex: 1, paddingLeft: "10px" }}>
                <p style={{ fontSize: "1.1rem", fontWeight: 500, opacity: 0.9 }}>FC</p>
                <p style={{ fontSize: "1rem", fontWeight: 600 }}>
                  {remainingFC}
                </p>
              </div>
            </div>
          </div>
          {/* 👆 END: Remaining Balance Display */}

          {/* Overview Charts Header */}
          <div className="transactions-header" style={{ marginTop: "10px" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#111827" }}>
              Overview
            </h2>
          </div>
          {/* ... Rest of the charts and table (unchanged) ... */}
          
         <div
  className="chart-carousel"
  style={{
    display: "flex",
    gap: "20px",
    flexWrap: "nowrap",
    overflowX: "auto",
    marginTop: "15px",
    paddingBottom: "10px",
  }}
>
  {/* Dollars Chart */}
  <div
    className="card chart-card"
    style={{
      flex: "0 0 auto",
      minWidth: "350px",
      padding: "10px",
      borderRadius: "16px",
      backgroundColor: "#fff",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    }}
  >
    <h3 style={{ color: "#374151", fontWeight: 600 }}>Dollars Summary</h3>
    <Plot
      data={[
        {
          x: ["Entrées", "Sorties"],
          y: dollarsSum,
          type: "bar",
          marker: { color: "#4f46e5" },
        },
      ]}
      layout={{
        autosize: true,
        margin: { t: 30, b: 50, l: 40, r: 20 },
        xaxis: { title: "Channel", automargin: true },
        yaxis: { title: "Amount ($)", automargin: true },
        showlegend: false,
        transition: { duration: 800, easing: "bounce" },
      }}
      style={{ width: "100%", height: "300px" }}
      useResizeHandler
      config={{ displayModeBar: false }}
    />
  </div>

  {/* FC Chart */}
  <div
    className="card chart-card"
    style={{
      flex: "0 0 auto",
     minWidth: "350px",
      padding: "10px",
      borderRadius: "16px",
      backgroundColor: "#fff",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    }}
  >
    <h3 style={{ color: "#374151", fontWeight: 600 }}>FC Summary</h3>
    <Plot
      data={[
        {
          x: ["Entrées", "Sorties"],
          y: fcSum,
          type: "bar",
          marker: { color: "#f59e0b" },
        },
      ]}
      layout={{
        autosize: true,
        margin: { t: 30, b: 50, l: 40, r: 20 },
        xaxis: { title: "Channel", automargin: true },
        yaxis: { title: "Amount (FC)", automargin: true },
        showlegend: false,
        transition: { duration: 800, easing: "bounce" },
      }}
      style={{ width: "100%", height: "300px" }}
      useResizeHandler
      config={{ displayModeBar: false }}
    />
  </div>
</div>


          {/* Transaction Table */}
          <div style={{ marginTop: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "15px",
                marginBottom: "15px",
              }}
            >
              <h2 style={{ fontSize: "1.6rem", fontWeight: 600, color: "#111827" }}>
                Transaction Table
              </h2>
             
            </div>

            <div
              style={{
                overflowX: "auto",
                backgroundColor: "#fff",
                borderRadius: "5px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "700px",
                }}
              >
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    backgroundColor: "#f9fafb",
                    zIndex: 10,
                  }}
                >
                  <tr>
                    {[
                      "No",
                      "Date",
                    
                      "Dollars",
                      "FC",
                      "Motif",
                      "Channel",
                      "File",
                    ].map((header) => (
                      <th
                        key={header}
                        style={{
                          padding: "12px 15px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: "#fff",
backgroundColor: "#111212ff",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((tx, i) => (
                    <tr
                      key={tx.id || i}
                      style={{
                        borderBottom: "1px solid #f3f4f6",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#f3f4f6")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "#fff")
                      }
                    >
                      <td style={{ padding: "10px 15px" }}>{i + 1}</td>
                      <td style={{ padding: "10px 15px" }}>
                        {tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : 'N/A'}
                      </td>
                      
                      <td style={{ padding: "10px 15px" }}>
  {tx.currency === "$" ? (Number(tx.amount) || 0).toFixed(2) : "0.00"}
</td>
<td style={{ padding: "10px 15px" }}>
  {tx.currency === "FC" ? (Number(tx.amount) || 0).toFixed(2) : "0.00"}
</td>

                      <td style={{ padding: "10px 15px" }}>{tx.motif}</td>
                      <td
                        style={{
                          padding: "10px 15px",
                          color: tx.channel === "Entrées" ? "#16a34a" : "#dc2626",
                        }}
                      >
                        {tx.channel}
                      </td>
                      <td>
  {tx.file ? (
    <a href={tx.file} target="_blank" rel="noopener noreferrer">
      View File
    </a>
  ) : "N/A"}
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Main Add Transaction Modal */}
      {showModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
            padding: "15px",
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "25px 30px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            <h3
              style={{
                fontSize: "1.5rem",
                marginBottom: "10px",
                color: "#111827",
              }}
            >
              Add Transaction
            </h3>
            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <input
                type="date"
                name="date"
                value={newTransaction.date}
                onChange={handleChange}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <input
                type="number"
                name="amount"
                placeholder="Amount"
                value={newTransaction.amount}
                onChange={handleChange}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <select
                name="currency"
                value={newTransaction.currency}
                onChange={handleChange}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="$">USD ($)</option>
                <option value="FC">FC</option>
              </select>
              <select
                name="channel"
                value={newTransaction.channel}
                onChange={handleChange}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              >
                <option value="Entrées">Entrées</option>
                <option value="Sorties">Sorties</option>
              </select>
              <input
                type="text"
                name="motif"
                placeholder="Motif (Description)"
                value={newTransaction.motif}
                onChange={handleChange}
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
              <input type="file" name="file" onChange={handleChange} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }} />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f3f4f6")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#fff")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#4f46e5",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4338ca")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#4f46e5")}
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Confirmation Modal Render */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        message={confirmationMessage}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirm(false)}
      />

      {/* Success Banner Render */}
      {showSuccessBanner && <SuccessToast message="Transaction added successfully! 🎉" />}
    </div>
  );
}