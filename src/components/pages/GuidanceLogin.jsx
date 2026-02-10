import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import schoolLogo from "../../assets/school-logo.png";
import "../../css/GabayLogin.css";
import { login } from "../../service/auth";
import ForgetPasswordModal from "./modal/login/forget/password/ForgetPasswordModal";
import NotificationPrompt from "./modal/prompt/NotificationPrompt";

function GuidanceLogin({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // ✅ useRef — updates instantly, no race condition
  const loggedInUserIdRef = useRef(null);

  const ALLOWED_ROLES = {
    ADMIN: "ADMIN_ROLE",
    GUIDANCE: "GUIDANCE_ROLE"
  };

  const ROLE_ROUTES = {
    [ALLOWED_ROLES.ADMIN]: "/admin/pages/AdminDashboard",
    [ALLOWED_ROLES.GUIDANCE]: "/dashboard/MainPage"
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = () => {
    const { username, password } = formData;
    if (!username.trim()) { setError("Username is required"); return false; }
    if (!password.trim()) { setError("Password is required"); return false; }
    return true;
  };

  const extractUserRole = (roleData) => {
    let roles = [];
    if (Array.isArray(roleData)) {
      roles = roleData;
    } else if (typeof roleData === "string") {
      roles = [roleData];
    } else if (roleData && typeof roleData === "object") {
      roles = roleData.roles || roleData.role || [];
      if (typeof roles === "string") roles = [roles];
    }
    const validRole = roles.find(r =>
      r === ALLOWED_ROLES.ADMIN || r === ALLOWED_ROLES.GUIDANCE
    );
    if (!validRole) console.error("❌ No valid role found in:", roles);
    return validRole || null;
  };

  const storeUserSession = (userId, guidanceStaffId, jwtToken, role) => {
    localStorage.setItem("userId", userId);
    localStorage.setItem("role", role);
    if (guidanceStaffId) localStorage.setItem("guidanceStaffId", guidanceStaffId);
    if (jwtToken) localStorage.setItem("jwtToken", jwtToken);
  };

  const handleRoleBasedRedirect = (role) => {
    const route = ROLE_ROUTES[role];
    if (!route) throw new Error(`Unauthorized role: ${role}`);
    onLoginSuccess();
    navigate(route);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      localStorage.clear();

      const response = await login(formData.username, formData.password);
      console.log("✅ Login response:", response);

      if (!response || !response.data) throw new Error("Invalid response from server");

      const { data, jwtToken, guidanceStaffId } = response;
      const { userId, role } = data;

      if (!userId) throw new Error("No user ID received from server");
      if (!role) throw new Error("No role information received");

      const userRole = extractUserRole(role);
      if (!userRole) throw new Error("You don't have permission to access this system");

      storeUserSession(userId, guidanceStaffId, jwtToken, userRole);

      console.log("🔔 Notification permission:", "Notification" in window ? Notification.permission : "not supported");

      if ("Notification" in window && Notification.permission !== "granted") {
        // ✅ ref is set instantly — no race condition
        loggedInUserIdRef.current = userId;
        setShowNotificationPrompt(true);
      } else {
        handleRoleBasedRedirect(userRole);
      }

    } catch (err) {
      console.error("❌ Login failed:", err);
      console.error("❌ Error status:", err.status);
      console.error("❌ Error message:", err.message);

      let errorMessage = "Login failed. Please try again.";
      const errorMsg = (err.message || "").toUpperCase();

      if (err.status === 401 || errorMsg.includes("INCORRECT") || errorMsg.includes("USERNAME/PASSWORD") || errorMsg.includes("BAD CREDENTIALS")) {
        errorMessage = "Incorrect username or password. Please try again.";
        console.log("❌ Invalid credentials");
      } else if (err.status === 403) {
        errorMessage = "Access denied. Please check your credentials.";
        console.log("❌ Access forbidden");
      } else if (errorMsg.includes("NETWORK") || errorMsg.includes("FETCH")) {
        errorMessage = "Network error. Please check your connection.";
        console.log("❌ Network error");
      } else if (err.message && err.message.length < 100) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationPromptClose = () => {
    setShowNotificationPrompt(false);
    const role = localStorage.getItem("role");
    const route = ROLE_ROUTES[role];
    if (route) {
      onLoginSuccess();
      navigate(route);
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="left-section">
          <div className="logo-container">
            <img src={schoolLogo} alt="School Logo" className="school-logo" />
            <h1 className="brand-name">GABAY</h1>
          </div>
        </div>

        <div className="right-section">
          <div className="login-form-container">
            <h2 className="login-title">Login</h2>

            {error && (
              <div className="error-message" role="alert" aria-live="polite">
                {error}
              </div>
            )}

            <form className="login-form" onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  id="username"
                  name="username"
                  className="form-input"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="username"
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  name="password"
                  className="form-input"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="login-button"
                aria-busy={isLoading}
              >
                {isLoading ? "LOGGING IN..." : "LOGIN"}
              </button>
            </form>

            <button
              type="button"
              className="forget-password-button"
              onClick={() => setIsResetModalOpen(true)}
              disabled={isLoading}
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      <ForgetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

      {/* ✅ FIXED: removed && loggedInUserId — was causing race condition
          userId is now stored in a ref, always available instantly        */}
      {showNotificationPrompt && (
        <NotificationPrompt
          userId={loggedInUserIdRef.current}
          onClose={handleNotificationPromptClose}
        />
      )}
    </>
  );
}

export default GuidanceLogin;