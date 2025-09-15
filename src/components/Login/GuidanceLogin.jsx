import '../../css/GabayLogin.css';
import { useState } from 'react';
import schoolLogo from "../../assets/school-logo.png";

function GuidanceLogin() {
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

const handleLogin = async () => {
  setIsLoading(true);
  setError('');
  try {
    const response = await fetch('http://localhost:8080/user/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password.trim()
      })
    });
    
    if (!response.ok) {
      const errMsg = await response.text();
      throw new Error(errMsg || `HTTP error ${response.status}`);
    }

    let token = response.headers.get("Jwt-Token");;
    
    if (!token) {
      throw new Error("No authentication token found in response headers. Please check server configuration.");
    } else {
      
      localStorage.setItem("jwtToken", token);
      window.location.href = '/dashboard/MainPage'; 
    }
  } catch (error) {
    console.error("Login Error:", error);
    setError(error.message || "Something went wrong during login.");
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
          {error && <div className="error-message" style={{color: 'red', marginBottom: '10px'}}>{error}</div>}
          
          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            > 
              {isLoading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default GuidanceLogin;