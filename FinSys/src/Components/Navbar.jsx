import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import "./Navbar.css";

function Navbar({ transactions }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showAlert, setShowAlert] = useState(false);

  // Handle search input change
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = transactions.filter((t) => {
      return (
        t.date.toLowerCase().includes(query) ||
        t.amount.toString().includes(query) ||
        t.userID.toLowerCase().includes(query)
      );
    });

    setFilteredTransactions(filtered);
  };

  // Bell notification logic (once a week)
  useEffect(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0: Sunday, 1: Monday, ...
    // Show alert on Mondays (example)
    setShowAlert(dayOfWeek === 1);
  }, []);

  return (
    <nav className="navbar">
     
      {/* Center: Search */}
      <div className="navbar-center">
        <input
          type="text"
          placeholder="Search by Date, Amount, or UserID..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {/* Right: Icons */}
      <div className="navbar-right">
        <button className={`icon-btn ${showAlert ? "alert" : ""}`}>
          <Bell size={20} />
        </button>
        <div className="profile">
          <img src="https://i.pravatar.cc/40" alt="Profile" />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
