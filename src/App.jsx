import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';  
import GuidanceLogin from './components/pages/GuidanceLogin';
import MainPage from './components/pages/MainPage';
import AdminDashboard from './components/admin/pages/AdminDashboard';
import VerificationSuccessPage from './components/pages/modal/login/forget/password/message/VerificationSuccessMessage';
import { registerFirebaseSW } from './utils/registerSW';
import { useEffect } from 'react';
function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("jwtToken");
  const role = localStorage.getItem("role");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  const handleLoginSuccess = () => {
    console.log("Login successful");
  };

    useEffect(() => {
    registerFirebaseSW();
  }, []);

  const handleLogout = () => {
    console.log("👋 Logging out");
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuidanceLogin onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/verification-success" element={<VerificationSuccessPage />} />
        
        <Route 
          path="/dashboard/MainPage" 
          element={
            <ProtectedRoute allowedRole="GUIDANCE_ROLE">
              <MainPage onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/pages/AdminDashboard" 
          element={
            <ProtectedRoute allowedRole="ADMIN_ROLE">
              <AdminDashboard onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;