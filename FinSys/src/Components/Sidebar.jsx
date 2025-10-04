import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

import { FiHome, FiUser, FiSettings, FiLogOut, FiMenu } from "react-icons/fi";

function Sidebar({ children }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/Dashboard", icon: <FiHome /> },
    { name: "Transactions", path: "/transactions", icon: <FiUser /> },
    { name: "Settings", path: "/settings", icon: <FiSettings /> },
  ];

  return (
    <div className="layout">
      {/* Sidebar (desktop) OR Bottom Nav (mobile) */}
      <aside
        className={`sidebar ${isOpen ? "open" : "collapsed"} ${
          isMobile ? "mobile" : ""
        }`}
      >
        {/* Show header only on desktop */}
        {!isMobile && (
          <div className="sidebar-header">
            <h2 className="logo">{isOpen ? "MyApp" : "MA"}</h2>
            <button className="toggle-btn" onClick={toggleSidebar}>
              <FiMenu />
            </button>
          </div>
        )}

        {/* Menu links (same for desktop & mobile) */}
        <nav className="menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `menu-item ${isActive ? "active" : ""}`
              }
            >
              <span className="icon">{item.icon}</span>
              {!isMobile && isOpen && <span className="label">{item.name}</span>}
              {isMobile && <span className="label">{item.name}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar footer with profile icon → navigate to TransactionsPage */}
        {!isMobile && (
          <div className="sidebar-footer">
            <button
              className="profile-btn"
              onClick={() => navigate("/TransactionsPage")}
            >
              <FiUser />
              {isOpen && <span>Profile</span>}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="content">
        {children ? children : <h1>Welcome to MyApp</h1>}
      </main>
    </div>
  );
}

export default Sidebar;
