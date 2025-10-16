import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut } from "lucide-react";
import "./AdminLayout.css";

const AdminSidebar = () => {
  const menuItems = [
    { name: "Transactions", icon: LayoutDashboard, path: "/admin/transactions" },
    { name: "Users", icon: Users, path: "/admin/users" },
    { name: "Requests", icon: FileText, path: "/admin/requests" },
  ];

  return (
    <div className="sidebar">
      {/* Header / Logo */}
      <div className="sidebar-header">
        <h1>Admin Panel</h1>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {menuItems.map(({ name, icon: Icon, path }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              isActive ? "nav-item active" : "nav-item"
            }
          >
            <Icon size={24} />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <button className="logout-btn">
          <LogOut size={24} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
