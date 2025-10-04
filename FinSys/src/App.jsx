import React from "react";
import { Routes, Route, Outlet, Navigate, BrowserRouter } from "react-router-dom";
// Standard Imports
import Login from "./Components/Auth/Login";
import SignUp from "./Components/Auth/SignUp";
import Dashboard from "./Components/Dashboard";
import TransactionsPage from "./Components/TransactionsPage";
import Sidebar from "./Components/Sidebar";

// 🔑 ADMIN IMPORT
import AdminTransactionsPage from "./Admin/AdminTransactionsPage"; 

// 🔑 Auth helper
import { useUserRole } from "./hooks/useAuth"; 

// ------------------------------------------------------------------
// 🔑 AUTH GUARD COMPONENT: Checks login status and role before rendering
// ------------------------------------------------------------------
const AuthGuard = ({ requiredRole }) => {
    const { role, isLoggedIn } = useUserRole();

    if (!isLoggedIn) {
        // Not logged in → redirect to login
        return <Navigate to="/" replace />; 
    }

    if (requiredRole === 'Admin' && role !== 'Admin') {
        // Logged in, trying to access Admin page without Admin role → redirect to Dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // Authorized → render nested routes
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
// 🔑 APP COMPONENT
// ------------------------------------------------------------------
function App() {
    return (
        <BrowserRouter basename={import.meta.env.BASE_URL || "/"}>
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

                {/* 3. ADMIN PROTECTED ROUTES */}
                <Route element={<AuthGuard requiredRole="Admin" />}>
                    <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
                </Route>
                
                {/* 4. FALLBACK ROUTE */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
