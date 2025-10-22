import { useEffect, useState } from 'react';  
import GuidanceLogin from './components/pages/GuidanceLogin';
import MainPage from './components/pages/MainPage';
import AdminDashboard from './components/admin/pages/AdminDashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [page, setPage] = useState("");
  
  useEffect(() => {
    const token = localStorage.getItem("jwtToken"); 
    const role = localStorage.getItem("role"); 
    
    if (token && role) {  
      setIsLoggedIn(true); 
      
      if (role === "ADMIN_ROLE") {
        setPage("admin");
      } else if (role === "GUIDANCE_ROLE") {
        setPage("guidance");
      }
    }
  }, []);

  const handleLoginSuccess = () => {
    console.log("🎉 Login successful - showing appointment page");
    const role = localStorage.getItem("role");
    
    setIsLoggedIn(true);  
    
    if (role === "ADMIN_ROLE") {
      setPage("admin");
    } else if (role === "GUIDANCE_ROLE") {
      setPage("guidance");
    }
  };

  const handleLogout = () => {
    console.log("👋 Logging out - showing login page");
    localStorage.clear();
    setIsLoggedIn(false);
    setPage("");
  };

  return (
    <>
      {!isLoggedIn ? (
        <GuidanceLogin onLoginSuccess={handleLoginSuccess} />
      ) : page === "admin" ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : page === "guidance" ? (
        <MainPage onLogout={handleLogout} />
      ) : (
        <div>Loading...</div> 
      )}
    </>
  );
}

export default App;