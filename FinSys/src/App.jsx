import React from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
// Standard Imports
import Login from "./Components/Auth/Login";
import SignUp from "./Components/Auth/SignUp";
import Dashboard from "./Components/Dashboard";
import TransactionsPage from "./Components/TransactionsPage";
import Sidebar from "./Components/Sidebar";

// 🔑 ADMIN IMPORTS
import AdminLayout from "./Admin/AdminLayout.jsx";
import AdminTransactionsPage from "./Admin/AdminTransactionsPage.jsx";
import AdminUsersPage from "./Admin/AdminUsersPage.jsx";
import AdminRequestsPage from "./Admin/AdminRequestsPage.jsx";
import AdminUpdatePage from "./Admin/AdminUpdatePage.jsx"; // ✅ NEW PAGE

// 🚀 NEW FINANCIER IMPORT
import FinancierTransactionsPage from "./Financier/FinancierTransactionPage.jsx";

// 🔑 AUTH HOOK IMPORT
import { useUserRole } from "./hooks/useAuth";

// ------------------------------------------------------------------
// 🔑 AUTH GUARD COMPONENT
// ------------------------------------------------------------------
const AuthGuard = ({ requiredRole }) => {
  const { role, isLoggedIn } = useUserRole();
  const normalizedRole = role.toLowerCase();

  if (!isLoggedIn) return <Navigate to="/" replace />;

  const financierRoles = ["financier", "pasteur", "vice-president"];

  if (requiredRole === "admin" && normalizedRole !== "admin") return <Navigate to="/dashboard" replace />;
  if (requiredRole === "user" && financierRoles.includes(normalizedRole)) return <Navigate to="/financier/transactions" replace />;
  if (requiredRole === "financierGroup" && !financierRoles.includes(normalizedRole)) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
};

// ------------------------------------------------------------------
// 🔑 PROTECTED LAYOUT
// ------------------------------------------------------------------
function ProtectedLayout() {
  return (
    <Sidebar>
      <Outlet />
    </Sidebar>
  );
}

// ------------------------------------------------------------------
// APP COMPONENT
// ------------------------------------------------------------------
function App() {
  return (
    <Routes>
      {/* 1. PUBLIC ROUTES */}
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />

      {/* 2. REGULAR USER PROTECTED ROUTES */}
      <Route element={<AuthGuard requiredRole="user" />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Route>
      </Route>

      {/* 3. FINANCIER GROUP PROTECTED ROUTE */}
      <Route element={<AuthGuard requiredRole="financierGroup" />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/financier/transactions" element={<FinancierTransactionsPage />} />
        </Route>
      </Route>

      {/* 4. ADMIN PROTECTED ROUTES */}
      <Route element={<AuthGuard requiredRole="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/requests" element={<AdminRequestsPage />} />
          {/* ✅ NEW UPDATE PAGE ROUTE */}
          <Route path="/admin/update/:id" element={<AdminUpdatePage />} />
        </Route>
      </Route>

      {/* 5. FALLBACK ROUTE */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
