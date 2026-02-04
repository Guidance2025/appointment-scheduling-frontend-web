import { useState } from "react";
import "../../../../../../css/ForgetPassword.css";
import { API_BASE_URL } from "../../../../../../../constants/api";


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

    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long");
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
      const response = await fetch(
        `${API_BASE_URL}/user/password-reset/initiate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: formData.username.trim(),
            newPassword: formData.newPassword
          })
        }
      );

      if (!response.ok) {
        let errorMessage = "Something went wrong. Please try again.";
        try {
          const errorData = await response.json();
          
          if (response.status === 404) {
            if (errorData.message?.includes("USER DOES NOT EXIST") || 
                errorData.reason === "NOT FOUND") {
              errorMessage = "No account found with this username. Please check and try again.";
            } else {
              errorMessage = errorData.message || "User does not exist.";
            }
          } else if (response.status === 400) {
            errorMessage = errorData.message || "Invalid request. Please check your information.";
          } else if (response.status === 500) {
            errorMessage = "Server error. Please try again later.";
          } else {
            errorMessage = errorData.message || errorMessage;
          }
        } catch (parseError) {
    
          try {
            const textError = await response.text();
            if (textError) {
              errorMessage = textError;
            }
          } catch (textError) {
            console.error("Error parsing response:", textError);
          }
        }
        
        throw new Error(errorMessage);
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
        setDisableSubmit(false);
        onClose();
      }, 3000);

    } catch (err) {
      console.error("Password reset error:", err);
      setError(err.message || "Failed to send reset email. Please try again.");
      setDisableSubmit(false);
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
    setDisableSubmit(false);
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
              disabled={isLoading || disableSubmit}
              placeholder="Enter your username"
              autoComplete="username"
              required
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
              disabled={isLoading || disableSubmit}
              placeholder="Enter new password (min. 6 characters)"
              autoComplete="new-password"
              required
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
              required
            />
          </label>

          <button 
            className="forget-password-submit-button"
            type="submit"
            disabled={isLoading || disableSubmit}
          >
            {isLoading ? "Sending..." : disableSubmit ? "Sent" : "Submit"}
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