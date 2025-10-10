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

// 🚀 NEW FINANCIER IMPORT
import FinancierTransactionsPage from "./Financier/FinancierTransactionPage.jsx";

// 🔑 AUTH HOOK IMPORT
import { useUserRole } from "./hooks/useAuth";

// ------------------------------------------------------------------
// 🔑 AUTH GUARD COMPONENT: Checks login status and role before rendering
// ------------------------------------------------------------------
const AuthGuard = ({ requiredRole }) => {
  const { role, isLoggedIn } = useUserRole();
  const normalizedRole = role.toLowerCase();

  // 1. Not logged in: Redirect to login page
  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  // Define roles that are restricted to the FinancierTransactions page
  const financierRoles = ["financier", "pasteur", "vice-president"];

  // 2. Authorization Check
  if (requiredRole === "admin" && normalizedRole !== "admin") {
    // Logged in, but trying to access Admin page without Admin role: Redirect to Dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // Check if a Financier-type user is trying to access a regular user route
  if (requiredRole === "user" && financierRoles.includes(normalizedRole)) {
    return <Navigate to="/financier/transactions" replace />;
  }

  // Check if the required role is one of the financier roles
  if (requiredRole === "financierGroup" && !financierRoles.includes(normalizedRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Authorized
  return <Outlet />;
};

// ------------------------------------------------------------------
// 🔑 PROTECTED LAYOUT
// ------------------------------------------------------------------
function ProtectedLayout() {
  return (
    <Sidebar>
      <Outlet /> {/* nested routes render here */}
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

      {/* 2. REGULAR USER PROTECTED ROUTES (Requires any logged-in user) */}
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

      {/* 4. ADMIN PROTECTED ROUTES (Requires Admin role) */}
      <Route element={<AuthGuard requiredRole="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/requests" element={<AdminRequestsPage />} />
        </Route>
      </Route>

      {/* 5. FALLBACK ROUTE */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
