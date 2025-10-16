import React from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import "./AdminLayout.css";

const AdminLayout = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar is fixed, so main content needs padding-left */}
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto ml-64">
  <Outlet />
</main>

    </div>
  );
};

export default AdminLayout;
