import { useState } from "react";
import "../../../../../../css/ForgetPassword.css";

const API_BASE_URL = "http://localhost:8080";

/**
 * Modal component for password reset
 * Allows user to enter username and new password
 * Sends reset request to backend which emails verification link
 */
function ForgetPasswordModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    username: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [disableSubmit, setDisableSubmit] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError("");
  };

  

  const validateForm = () => {
    const { username, newPassword, confirmPassword } = formData;

    if (!username.trim()) {
      setError("Username is required");
      return false;
    }

    if (!newPassword || !confirmPassword) {
      setError("All password fields are required");
      return false;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disableSubmit) return;
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
        setDisableSubmit(true);
      const response = await fetch(
        `${API_BASE_URL}/user/password-reset/initiate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: formData.username,
            newPassword: formData.newPassword
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to initiate password reset");
      }

      const data = await response.json();
      setSuccessMessage(
        data.message || 
        "Password reset email sent! Please check your inbox and click the verification link."
      );
         setDisableSubmit(true);


      setTimeout(() => {
        setFormData({
          username: "",
          newPassword: "",
          confirmPassword: ""
        });
        setSuccessMessage("");
        onClose();
      }, 3000);

    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      username: "",
      newPassword: "",
      confirmPassword: ""
    });
    setError("");
    setSuccessMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="forget-password-modal-overlay" onClick={handleClose}>
      <div className="forget-password-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Reset Password</h2>
        
        <button 
          onClick={handleClose}
          aria-label="Close modal"
          className="forget-password-close-button"
        >
          ×
        </button>

        {successMessage && (
          <div className="success-message" role="alert">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">
            Username
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Enter your username"
              autoComplete="username"
            />
          </label>

          <label htmlFor="newPassword">
            New Password
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="Enter new password"
              autoComplete="new-password"
            />
          </label>

          <label htmlFor="confirmPassword">
            Confirm New Password
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={isLoading || disableSubmit}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </label>

          <button className="forget-password-submit-button"
            type="submit"
            disabled={isLoading || disableSubmit}
          >
            {isLoading  ? "Sending..." : disableSubmit ? "Sent" : "Submit"}
          </button>
        </form>

        <p className="modal-info">
          After clicking Submit, you will receive an email with a 
          verification link. Click the link to complete your password reset.
        </p>
      </div>
    </div>
  );
}

export default ForgetPasswordModal;