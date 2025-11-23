import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../../../../../../css/VerificationSucessMessage.css";

const API_BASE_URL = "http://localhost:8080";

/**
 * Page that handles password reset verification link
 * Automatically verifies token and completes password reset
 */
function VerificationSuccessPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); 
  const [message, setMessage] = useState("Verifying your password reset...");
  const [countdown, setCountdown] = useState(5);
  const hasRun = useRef(false);

  useEffect(() => {
    const verifyPasswordReset = async () => {
      if(hasRun.current) return;
       hasRun.current = true;

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token found.");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/user/password-reset/verify?token=${token}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Verification failed");
        }

        const data = await response.json();

        setStatus("success");
        setMessage(
          data.success || "Password successfully changed! You can now login."
        );

        startCountdown();
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage(
          err.message ||
            "Failed to verify password reset. The link may have expired or already been used."
        );
      }
    };

    verifyPasswordReset();
  }, []);

  const startCountdown = () => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/login");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleManualRedirect = () => {
    navigate("/login");
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        {status === "verifying" && (
          <>
            <div className="spinner"></div>
            <h2>Verifying...</h2>
            <p>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="success-icon">✓</div>
            <h2>Success!</h2>
            <p>{message}</p>
            <p className="countdown-text">
              Redirecting to login in {countdown} seconds...
            </p>
            <button className="btn-primary" onClick={handleManualRedirect}>
              Go to Login Now
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="error-icon">✕</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <button className="btn-primary" onClick={handleManualRedirect}>
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default VerificationSuccessPage;
