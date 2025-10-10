import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, LogOut } from "lucide-react";

const AdminSidebar = () => {
  const menuItems = [
    { name: "Transactions", icon: LayoutDashboard, path: "/admin/transactions" },
    { name: "Users", icon: Users, path: "/admin/users" },
    { name: "Requests", icon: FileText, path: "/admin/requests" },
  ];

  return (
    <div className="fixed top-0 left-0 h-screen w-64 bg-[#1e293b] text-white flex flex-col justify-between shadow-xl z-50">
      {/* Header / Logo */}
      <div className="p-6 text-center border-b border-gray-700">
        <h1 className="text-2xl font-bold text-blue-400">Admin Panel</h1>
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex flex-col gap-2">
        {menuItems.map(({ name, icon: Icon, path }) => (
          <NavLink
            key={name}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 mx-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            <Icon size={20} />
            <span className="font-medium">{name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-6 border-t border-gray-700">
        <button className="flex items-center gap-3 px-4 py-2 w-full text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
