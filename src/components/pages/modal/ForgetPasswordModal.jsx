import React, { useState } from 'react';
import "../../../css/ForgetPassword.css";

const ForgetPasswordModal = ({ isOpen, isClose }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  

  
  const handleForgetPassword = async () => {
    setError("");

    if (!username || !password || !confirmPassword) {
      setError("Required to fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:8080/user/forget-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Username not found");
      }

      const data = await response.json();
      
      alert("Password updated successfully! Check your email for confirmation.");
      
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setError("");
      isClose();

    } catch (error) {
      setError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='forget-password-modal-overlay'>
      <div className='forget-password-modal-content'>
        <h2>Recover Account</h2>
        <button onClick={isClose}>×</button>

        {error && <div className="error-messages">{error}</div>}

        <label>Username</label>
        <input 
          type="text" 
          value={username} 
          onChange={e => setUsername(e.target.value)}
          placeholder="Enter your username"
          disabled={isLoading}
        />

        <label>New Password</label>
        <input 
          type="password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter new password"
          disabled={isLoading}
        />

        <label>Confirm New Password</label>
        <input 
          type="password" 
          value={confirmPassword} 
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          disabled={isLoading}
        />

        <button 
          onClick={handleForgetPassword}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Confirm"}
        </button>
      </div>
    </div>
  );
};

export default ForgetPasswordModal;