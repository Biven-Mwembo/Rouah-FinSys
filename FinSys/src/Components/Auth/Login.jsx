import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { supabase } from "../supabaseClient";
import "./Login.css";

// ✅ Your backend API
const API_BASE_URL = "https://finsys.onrender.com/api";

// --- Decode Supabase JWT to extract role ---
const getUserRole = (session) => {
  const accessToken = session?.access_token;
  if (!accessToken) return "user";

  try {
    const payloadBase64 = accessToken.split(".")[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));
    // Assuming the role is stored in the JWT payload
    return decodedPayload.role || "user"; 
  } catch (e) {
    console.error("Error decoding Supabase token:", e);
    return "user";
  }
};

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({ show: false, type: "", message: "" });

  const navigate = useNavigate();

  // The roles that should be redirected to the Financier Transactions page
  // These must be lowercase to match the normalizedRole check
  const privilegedRoles = [
    "financier", 
    "pasteur", 
    "vice-president"
  ];

  // ✅ Centralized success handler
 const handleLoginSuccess = (user, session) => {
  const role = session ? getUserRole(session) : user.role || "user";
  const normalizedRole = role.toLowerCase();

  //  Determine redirect path
  let targetPath;

  if (normalizedRole === "admin") {
    targetPath = "/admin/transactions"; // 👈 Admin redirect
  } else if (["financier", "pasteur", "vice-president"].includes(normalizedRole)) {
    targetPath = "/financier/transactions";
  } else if (normalizedRole === "manager") {
    targetPath = "/manager/dashboard";
  } else if (normalizedRole === "finance") {
    targetPath = "/finance/home";
  } else {
    targetPath = "/dashboard";
  }

  // ✅ Store user locally
  const userToStore = session ? { ...user, role } : user;
  localStorage.setItem("isLoggedIn", "true");
  localStorage.setItem("user", JSON.stringify(userToStore));
  localStorage.setItem("userID", user.id);

  if (!session && user.token) {
    localStorage.setItem("token", user.token);
  }

  setBanner({
    show: true,
    type: "success",
    message: `✅ Welcome ${role}! Redirecting...`,
  });

  setTimeout(() => navigate(targetPath), 1200);
};


  // ✅ Supabase OAuth listener
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          handleLoginSuccess(session.user, session);
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  // ✅ Email/Password login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBanner({ show: false, type: "", message: "" });

    try {
      const response = await axios.post(`${API_BASE_URL}/Auth/login`, {
        email,
        password,
      });

      const { user, success, token } = response.data;

      if (!success || !user?.id || !token || !user.role) {
        throw new Error("Login data missing required fields.");
      }

      handleLoginSuccess({ ...user, token }, null);
    } catch (error) {
      const errorMessage =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message || "Login failed. Check credentials.";
      setBanner({ show: true, type: "error", message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google login (Supabase)
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      setBanner({ show: true, type: "error", message: error.message });
    }
  };

  // --- UI ---
  return (
    <div className="login-container">
      {banner.show && (
        <div className={`popup-banner ${banner.type}`}>{banner.message}</div>
      )}

      <div className="login-card">
        <h2 className="login-title">Welcome Back 👋</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="forgot-password">
            <a href="#">Forgot password?</a>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Logging In..." : "Login"}
          </button>
        </form>

        <p className="signup-link">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
