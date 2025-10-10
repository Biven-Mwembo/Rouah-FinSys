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
    <div className="fixed top-0 left-0 h-screen w-64 bg-[#0f172a] text-white flex flex-col justify-between shadow-xl">
      {/* Header / Logo */}
      <div className="p-6 text-center border-b border-gray-700">
        <h1 className="text-2xl font-bold text-blue-400">Admin Panel</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col mt-6 gap-2">
        {menuItems.map(({ name, icon: Icon, path }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-4 transition-all duration-200 mx-4 rounded-lg ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            <Icon size={24} />
            <span className="text-sm font-medium">{name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-6 border-t border-gray-700">
        <button className="flex flex-col items-center gap-1 w-full text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg py-4 transition">
          <LogOut size={24} />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
