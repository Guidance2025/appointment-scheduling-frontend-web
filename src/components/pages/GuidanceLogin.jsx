import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import schoolLogo from "../../assets/school-logo.png";
import "../../css/GabayLogin.css";
import { registerFcmToken } from "../../service/fcm";
import { login } from "../../service/auth";
import ForgetPasswordModal from "./modal/login/forget/password/ForgetPasswordModal";
import { usePopUp } from "../../helper/message/pop/up/provider/PopUpModalProvider";

function GuidanceLogin({ onLoginSuccess }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null); 
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPermanentLock, setIsPermanentLock] = useState(false); 
  
  const lockTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const ALLOWED_ROLES = {
    ADMIN: "ADMIN_ROLE",
    GUIDANCE: "GUIDANCE_ROLE"
  };

  const ROLE_ROUTES = {
    [ALLOWED_ROLES.ADMIN]: "/admin/pages/AdminDashboard",
    [ALLOWED_ROLES.GUIDANCE]: "/dashboard/MainPage"
  };

  // FIXED: Check for both temporary and permanent locks on component mount
  useEffect(() => {
    const savedLockTime = localStorage.getItem('accountLockTime');
    const savedPermanentLock = localStorage.getItem('isPermanentLock');
    
    // Check for permanent lock first
    if (savedPermanentLock === 'true') {
      setIsLocked(true);
      setIsPermanentLock(true);
      setLockTimer(null);
      setError("Your account has been locked by an administrator. Please contact support to unlock your account.");
      return;
    }
    
    // Then check for temporary lock
    if (savedLockTime) {
      const lockTime = parseInt(savedLockTime, 10);
      const now = Date.now();
      
      if (lockTime > now) {
        setIsLocked(true);
        setLockTimer(lockTime);
        setIsPermanentLock(false);
        setError("Your account has been locked due to multiple failed login attempts. Please wait 3 minutes or use 'Forgot Password' to unlock your account.");
      } else {
        localStorage.removeItem('accountLockTime');
      }
    }
  }, []);

  // FIXED: Improved timer management with proper cleanup
  useEffect(() => {
    // Clear any existing interval first to prevent race conditions
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (isLocked && lockTimer && !isPermanentLock) {
      countdownIntervalRef.current = setInterval(() => {
        const remaining = lockTimer - Date.now();
        
        if (remaining <= 0) {
          setIsLocked(false);
          setLockTimer(null);
          setRemainingTime(null);  
          setError("");
          localStorage.removeItem('accountLockTime');
          console.log("✅ Account automatically unlocked");
          
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setRemainingTime(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
    } else {
      if (isPermanentLock) {
        setRemainingTime(null);
      }
    }
    
    // Cleanup function
    return () => {
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
        lockTimeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isLocked, lockTimer, isPermanentLock]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (!isLocked || !isPermanentLock) {
      setError("");
    }
  };

  const validateForm = () => {
    const { username, password } = formData;
    
    if (!username.trim()) {
      setError("Username is required");
      return false;
    }
    
    if (!password.trim()) {
      setError("Password is required");
      return false;
    }
    
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
      if (typeof roles === "string") {
        roles = [roles];
      }
    }

    const validRole = roles.find(r => 
      r === ALLOWED_ROLES.ADMIN || r === ALLOWED_ROLES.GUIDANCE
    );

    if (!validRole) {
      console.error("❌ No valid role found in:", roles);
    }

    return validRole || null;
  };

  const storeUserSession = (userId, guidanceStaffId, jwtToken, role) => {
    localStorage.setItem("userId", userId);
    localStorage.setItem("role", role);
    
    if (guidanceStaffId) {
      localStorage.setItem("guidanceStaffId", guidanceStaffId);
    }
    
    if (jwtToken) {
      localStorage.setItem("jwtToken", jwtToken);
    }
  };

  const handleRoleBasedRedirect = (role) => {
    const route = ROLE_ROUTES[role];
    
    if (!route) {
      throw new Error(`Unauthorized role: ${role}`);
    }

    onLoginSuccess();
    navigate(route);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const lockTime = localStorage.getItem('accountLockTime');
      const permanentLock = localStorage.getItem('isPermanentLock');
      localStorage.clear();
      if (lockTime) {
        localStorage.setItem('accountLockTime', lockTime);
      }
      if (permanentLock) {
        localStorage.setItem('isPermanentLock', permanentLock);
      }
      
      const response = await login(formData.username, formData.password);
      console.log("✅ Login response:", response);

      if (!response || !response.data) {
        throw new Error("Invalid response from server");
      }

      const { data, jwtToken, guidanceStaffId } = response;
      const { userId, role } = data;

      if (!userId) throw new Error("No user ID received from server");
      if (!role) throw new Error("No role information received");

      const userRole = extractUserRole(role);
      
      if (!userRole) {
        throw new Error("You don't have permission to access this system");
      }

      storeUserSession(userId, guidanceStaffId, jwtToken, userRole);
      
      // FIXED: Clear all lock-related storage on successful login
      localStorage.removeItem('accountLockTime');
      localStorage.removeItem('isPermanentLock');

      try {
        await registerFcmToken(userId);
      } catch (fcmError) {
        console.warn("⚠️ Failed to register FCM token:", fcmError);
      }
      
      handleRoleBasedRedirect(userRole);

    } catch (err) {
      console.error("❌ Login failed:", err);
      console.error("❌ Error status:", err.status);
      console.error("❌ Error message:", err.message);
      
      let errorMessage = "Login failed. Please try again.";
      let accountLocked = false;
      let isAdminLocked = false;
      
      // FIXED: Check for structured error response first
      if (err.lockType) {
        if (err.lockType === 'ADMIN_LOCK' || err.lockType === 'DISABLED') {
          errorMessage = err.message || "Your account has been locked by an administrator. Please contact support to unlock your account.";
          isAdminLocked = true;
          accountLocked = true;
          console.log("🔒 Admin lock detected (structured response)");
        } else if (err.lockType === 'FAILED_ATTEMPTS') {
          errorMessage = err.message || "Your account has been locked due to multiple failed login attempts. Please wait 3 minutes or use 'Forgot Password' to unlock your account.";
          accountLocked = true;
          console.log("🔒 Failed-attempt lock detected (structured response)");
        }
      } else {
        // Fallback to string matching if structured response not available
        const errorMsg = (err.message || "").toUpperCase();
        
        // Check for admin lock (permanent lock)
        if (
          errorMsg.includes("LOCKED BY ADMINISTRATOR") ||
          errorMsg.includes("ACCOUNT HAS BEEN LOCKED BY ADMINISTRATOR")
        ) {
          errorMessage = "Your account has been locked by an administrator. Please contact support to unlock your account.";
          isAdminLocked = true;
          accountLocked = true;
          console.log("🔒 Admin lock detected");
        }
        // Check for disabled account
        else if (err.status === 403 || errorMsg.includes("DISABLED") || errorMsg.includes("ACCOUNT HAS BEEN DISABLED")) {
          errorMessage = "Your account has been disabled. Please contact support.";
          accountLocked = true;
          isAdminLocked = true;
          console.log("🔒 Account disabled detected");
        }
        // Check for failed-attempt lock (temporary lock)
        else if (
          err.status === 423 ||
          errorMsg.includes("MULTIPLE FAILED LOGIN ATTEMPTS") ||
          errorMsg.includes("ACCOUNT LOCKED DUE TO MULTIPLE FAILED LOGIN ATTEMPTS") ||
          errorMsg.includes("TOO MANY") ||
          errorMsg.includes("MAX LOGIN ATTEMPTS")
        ) {
          // FIXED: Removed hardcoded "5 failed" reference
          errorMessage = "Your account has been locked due to multiple failed login attempts. Please wait 3 minutes or use 'Forgot Password' to unlock your account.";
          accountLocked = true;
          console.log("🔒 Failed-attempt lock detected");
        }
        else if (
          err.status === 401 || 
          errorMsg.includes("INCORRECT") || 
          errorMsg.includes("USERNAME/PASSWORD") ||
          errorMsg.includes("BAD CREDENTIALS")
        ) {
          errorMessage = "Incorrect username or password. Please try again.";
          console.log("❌ Invalid credentials");
        }
        else if (errorMsg.includes("NETWORK") || errorMsg.includes("FETCH")) {
          errorMessage = "Network error. Please check your connection.";
          console.log("❌ Network error");
        }
        else if (err.message && err.message.length < 100) {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      
      if (accountLocked && !isLocked) {
        if (isAdminLocked) {
          // FIXED: Store permanent lock state in localStorage
          setIsLocked(true);
          setIsPermanentLock(true);
          setLockTimer(null);
          setRemainingTime(null);
          localStorage.setItem('isPermanentLock', 'true');
          localStorage.removeItem('accountLockTime');
          console.log("🔒 Permanent lock activated (admin)");
        } else {
          // FIXED: Updated timer to 3 minutes consistently
          const unlockTime = Date.now() + (3 * 60 * 1000);
          localStorage.setItem('accountLockTime', unlockTime.toString());
          localStorage.removeItem('isPermanentLock');
          setLockTimer(unlockTime);
          setIsLocked(true);
          setIsPermanentLock(false);
          console.log("⏱️ Temporary lock activated. Unlock time:", new Date(unlockTime));
        }
      }
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setIsResetModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsResetModalOpen(false);
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
              <div 
                className={`error-message ${
                  error.toLowerCase().includes('locked') ? 'error-locked' : ''
                }`}
                role="alert" 
                aria-live="polite"
              >
                {error}
                {isLocked && remainingTime && !isPermanentLock && (
                  <div className="lock-timer">
                    Unlock in: {remainingTime}
                  </div>
                )}
              </div>
            )}

            <form className="login-form" onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  className="form-input"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading || isLocked}
                  autoComplete="username"
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  className="form-input"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading || isLocked}
                  autoComplete="current-password"
                  required
                  aria-required="true"
                  aria-invalid={!!error}
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading || isLocked}
                className="login-button"
                aria-busy={isLoading}
              >
                {isLoading 
                  ? "LOGGING IN..." 
                  : isLocked 
                    ? isPermanentLock
                      ? "ACCOUNT LOCKED"
                      : `ACCOUNT LOCKED ${remainingTime ? `(${remainingTime})` : ''}`
                    : "LOGIN"
                }
              </button>
            </form>

            <button
              type="button"
              className="forget-password-button"
              onClick={handleForgotPassword}
              disabled={isLoading}
            >
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      <ForgetPasswordModal
        isOpen={isResetModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}

export default GuidanceLogin;