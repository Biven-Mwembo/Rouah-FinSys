
import React from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
// Standard Imports
import Login from "./Components/Auth/Login";
import SignUp from "./Components/Auth/SignUp";
import Dashboard from "./Components/Dashboard";
import TransactionsPage from "./Components/TransactionsPage";
import Sidebar from "./Components/Sidebar";

// 🔑 NEW ADMIN IMPORT
import AdminTransactionsPage from "./Admin/AdminTransactionsPage"; 

// 🔑 NEW IMPORT: The helper function created above (assume it's in a path you can import)
import { useUserRole } from "./hooks/useAuth"; 

// ------------------------------------------------------------------
// 🔑 AUTH GUARD COMPONENT: Checks login status and role before rendering
// ------------------------------------------------------------------
const AuthGuard = ({ requiredRole }) => {
    const { role, isLoggedIn } = useUserRole();

    if (!isLoggedIn) {
        // 1. Not logged in: Redirect to login page
        // Use '/' as the default login path based on your routes
        return <Navigate to="/" replace />; 
    }

    if (requiredRole === 'Admin' && role !== 'Admin') {
        // 2. Logged in, but trying to access Admin page without Admin role: Redirect to Dashboard
        return <Navigate to="/dashboard" replace />;
    }

    // 3. Authorized (Either regular user or Admin accessing the correct area)
    return <Outlet />;
};


// ------------------------------------------------------------------
// 🔑 PROTECTED LAYOUT (UPDATED)
// ------------------------------------------------------------------
// Layout for pages with sidebar (now nested under AuthGuard)
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

            {/* 3. ADMIN PROTECTED ROUTE (Requires Admin role) */}
            <Route element={<AuthGuard requiredRole="Admin" />}>
                {/* Note: Admin pages often don't use the standard sidebar, 
                    but you can wrap it in ProtectedLayout if desired. */}
                <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
            </Route>
            
            {/* 4. FALLBACK ROUTE: Redirect unknown routes to login */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
}

export default App;