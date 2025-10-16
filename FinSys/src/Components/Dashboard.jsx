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
  // 👇 NEW STATE: 
  const [successMessage, setSuccessMessage] = useState("");

  // NEW STATE: For the transaction details being confirmed
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().slice(0, 10), // Today's date
    amount: "",
    currency: "USD",
    channel: "Sorties", // Default to Sorties for safety/convenience
    motif: "",
    file: null, // File object
  });

  useEffect(() => {
    try {
      const userString = localStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        setCurrentUserId(user.id);
        // Optionally fetch data here if needed, but not strictly required for the `Post` logic
      } else {
        navigate("/login");
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
      navigate("/login");
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setNewTransaction((prev) => ({ ...prev, file: e.target.files[0] }));
  };

  const handleShowConfirm = (e) => {
    e.preventDefault();
    // Basic validation before showing confirm modal
    if (!newTransaction.date || !newTransaction.amount || !newTransaction.currency || !newTransaction.channel || !newTransaction.motif) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }
    setShowConfirm(true);
  };

  // 🔑 UPDATED FUNCTION TO HANDLE 202 STATUS FOR 'SORTIES'
  const handleAddTransaction = async () => {
    setShowConfirm(false);
    setErrorMessage(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("Date", newTransaction.date);
    formData.append("Amount", newTransaction.amount);
    formData.append("Currency", newTransaction.currency);
    formData.append("Channel", newTransaction.channel);
    formData.append("Motif", newTransaction.motif);

    if (newTransaction.file) {
      formData.append("File", newTransaction.file);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/transactions`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 🛑 CORE LOGIC CHANGE FOR SORTIES APPROVAL
      if (response.status === 202 && newTransaction.channel.toLowerCase() === "sorties") {
        setSuccessMessage(
          "Sortie request sent successfully! Awaiting Admin approval. It will appear once approved."
        );
      } else {
        setSuccessMessage("Transaction added successfully!");
      }
      
      setShowSuccessBanner(true);
      setShowModal(false);
      
      // Reset the form data after successful submission
      setNewTransaction({
        date: new Date().toISOString().slice(0, 10),
        amount: "",
        currency: "USD",
        channel: "Sorties",
        motif: "",
        file: null,
      });

    } catch (error) {
      console.error("Error creating transaction:", error);
      const msg =
        error.response?.data?.Message ||
        "An error occurred while adding the transaction.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccessBanner(false), 5000);
    }
  };


  // --- MOCK DATA (to be replaced by actual data fetching) ---
  const mockData = {
    totalBalance: "12,500.00 MAD",
    fcBalance: "1,200.00 FC",
    totalIncome: "15,000.00 MAD",
    totalExpenses: "2,500.00 MAD",
    chartLayout: {
      title: "Monthly Cash Flow",
      xaxis: { title: "Month" },
      yaxis: { title: "Amount (MAD)" },
      margin: { t: 40, b: 40, l: 40, r: 40 },
    },
    chartData: [
      {
        x: ["Jan", "Feb", "Mar", "Apr", "May"],
        y: [5000, 6000, 4500, 7000, 8000],
        name: "Income",
        type: "bar",
        marker: { color: "#10b981" },
      },
      {
        x: ["Jan", "Feb", "Mar", "Apr", "May"],
        y: [1000, 1500, 1200, 2000, 1800],
        name: "Expenses",
        type: "bar",
        marker: { color: "#ef4444" },
      },
    ],
    mockTransactions: [
      {
        id: 1,
        date: "2024-05-01",
        amount: "1000.00",
        currency: "MAD",
        channel: "Sorties",
        motif: "Rent Payment",
        status: "Approved"
      },
      {
        id: 2,
        date: "2024-05-05",
        amount: "500.00",
        currency: "USD",
        channel: "Entrées",
        motif: "Offering",
        status: "Approved"
      },
      {
        id: 3,
        date: "2024-05-10",
        amount: "200.00",
        currency: "MAD",
        channel: "Sorties",
        motif: "Office Supplies",
        status: "Pending" // Mock pending status for illustration
      },
    ],
  };
  // --- END MOCK DATA ---


  return (
    <div
      className="dashboard-container"
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "25px",
      }}
    >
      {errorMessage && (
        <MessageBox message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}
      {showSuccessBanner && <SuccessToast message={successMessage} />}

      <Navbar />

      <h1 style={{ color: "#111827", fontSize: "2rem", fontWeight: 700 }}>
        Financial Dashboard
      </h1>

      {/* Cards Section */}
      <div
        className="cards-section"
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <Card
          title="Total Balance"
          balance={mockData.totalBalance}
          fcBalance={mockData.fcBalance}
          color="blue"
        />
        <Card
          title="Total Income"
          balance={mockData.totalIncome}
          fcBalance="2,000.00 FC"
          color="green"
        />
        <Card
          title="Total Expenses"
          balance={mockData.totalExpenses}
          fcBalance="800.00 FC"
          color="red"
        />
      </div>

      {/* Main Content Area */}
      <div
        className="main-content"
        style={{
          display: "flex",
          gap: "25px",
          flexWrap: "wrap",
        }}
      >
        {/* Chart */}
        <div
          className="chart-container"
          style={{
            flex: "2",
            minWidth: "400px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            padding: "10px",
          }}
        >
          <Plot
            data={mockData.chartData}
            layout={mockData.chartLayout}
            style={{ width: "100%", height: "400px" }}
          />
        </div>

        {/* Transaction History and Add Button */}
        <div
          className="history-container"
          style={{
            flex: "1",
            minWidth: "300px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2
              style={{
                color: "#111827",
                fontSize: "1.5rem",
                fontWeight: 600,
              }}
            >
              Recent Transactions
            </h2>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "8px 15px",
                backgroundColor: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              + Add Transaction
            </button>
          </div>

          {/* Transaction List */}
          <div
            className="transaction-list"
            style={{ overflowY: "auto", maxHeight: "300px" }}
          >
            {mockData.mockTransactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "10px 0",
                  borderBottom: "1px solid #e5e7eb",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#1f2937",
                    }}
                  >
                    {tx.motif}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                    {tx.date} | {tx.channel}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    color:
                      tx.channel === "Sorties" ? "#ef4444" : "#10b981",
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  {tx.channel === "Sorties" ? "-" : "+"}
                  {tx.amount} {tx.currency}
                  {tx.status === "Pending" && (
                    <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 500 }}>
                      (Pending)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal for adding transaction */}
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
            zIndex: 9000,
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              padding: "30px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
            }}
          >
            <h2
              style={{
                marginBottom: "20px",
                color: "#111827",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "10px",
              }}
            >
              Add New Transaction
            </h2>
            <form
              onSubmit={handleShowConfirm}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              {/* Date */}
              <label style={{ fontWeight: 500, color: "#374151" }}>Date</label>
              <input
                type="date"
                name="date"
                value={newTransaction.date}
                onChange={handleInputChange}
                required
                style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
              />

              {/* Amount */}
              <label style={{ fontWeight: 500, color: "#374151" }}>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="e.g., 500.00"
                value={newTransaction.amount}
                onChange={handleInputChange}
                required
                min="0.01"
                step="0.01"
                style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
              />

              {/* Currency */}
              <label style={{ fontWeight: 500, color: "#374151" }}>Currency</label>
              <select
                name="currency"
                value={newTransaction.currency}
                onChange={handleInputChange}
                required
                style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
              >
                <option value="USD">USD</option>
                <option value="MAD">MAD</option>
                <option value="FC">FC</option>
              </select>

              {/* Channel */}
              <label style={{ fontWeight: 500, color: "#374151" }}>Channel (Type)</label>
              <select
                name="channel"
                value={newTransaction.channel}
                onChange={handleInputChange}
                required
                style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
              >
                <option value="Entrées">Entrées (Income)</option>
                <option value="Sorties">Sorties (Expense - Requires Approval)</option>
              </select>

              {/* Motif */}
              <label style={{ fontWeight: 500, color: "#374151" }}>Motif (Description)</label>
              <input
                type="text"
                name="motif"
                placeholder="e.g., Office Rent, Tithes"
                value={newTransaction.motif}
                onChange={handleInputChange}
                required
                style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
              />

              {/* File */}
              <label style={{ fontWeight: 500, color: "#374151" }}>
                Supporting File (Receipt/Invoice)
              </label>
              <input
                type="file"
                name="file"
                onChange={handleFileChange}
                style={{ padding: "10px", border: "1px solid #d1d5db", borderRadius: "8px" }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "10px",
                  padding: "12px 20px",
                  backgroundColor: loading ? "#9ca3af" : "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                {loading ? "Processing..." : "Submit Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        message={`Are you sure you want to add this transaction? ${
          newTransaction.channel.toLowerCase() === "sorties"
            ? " (If 'Sorties', it will require Admin approval first.)"
            : ""
        }`}
        onConfirm={handleAddTransaction}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}