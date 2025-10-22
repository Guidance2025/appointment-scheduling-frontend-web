import { useState } from "react";
import schoolLogo from "../../assets/school-logo.png";
import "../../css/GabayLogin.css";
import { registerFcmToken } from "../../service/fcm";
import ForgetPasswordModal from './modal/ForgetPasswordModal';
import { login } from "../../service/auth";

function GuidanceLogin({ onLoginSuccess }) {  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleClose = () => {
    setShowModal(false);
    setUsername("");
    setPassword("");
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      localStorage.clear();

      const { data, jwtToken,guidanceStaffId } = await login(username, password);
      const { userId, role } = data;


      if (!userId) throw new Error("No user ID received from server");
      if (!role) throw new Error("No role information received");
      
      localStorage.setItem("userId", userId);
      console.log( "GUIDANCE STAFF ID ",guidanceStaffId);
      localStorage.setItem("guidanceStaffId",guidanceStaffId)
      alert("Succces Login");

      if (jwtToken) localStorage.setItem("jwtToken", jwtToken);

      await registerFcmToken(userId);

      if (role.includes("ADMIN_ROLE")) {
        localStorage.setItem("role", "ADMIN_ROLE");
        onLoginSuccess();  
        window.location.href = "/admin/pages/AdminDashboard";
      } else if (role.includes("GUIDANCE_ROLE")) {
        localStorage.setItem("role", "GUIDANCE_ROLE");
        onLoginSuccess();  
        window.location.href = "/dashboard/MainPage";
      } else {
        setError("Unauthorized role");
      }

    } catch (err) {
      console.error("Login failed:", err);
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
            <div className="error-message">
              {error}
            </div>
          )}

          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button type="submit" disabled={isLoading} className="login-button">
              {isLoading ? "LOGGING IN..." : "LOGIN"}
            </button>
          </form>

          <button className="forget-password-button" onClick={() => setShowModal(true)}>
            Forget Password?
          </button>

          <ForgetPasswordModal isOpen={showModal} isClose={handleClose} />
        </div>
      </div>
    </div>
  );
}

export default GuidanceLogin;