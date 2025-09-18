import { useEffect, useState } from 'react';  
import MainPage from './components/pages/MainPage';
import GuidanceLogin from './components/pages/GuidanceLogin';

function App() {
 
const [isLoggedIn, setIsLoggedIn] = useState(false);
  
useEffect(() => {

const token = localStorage.getItem("jwtToken"); 
 if (!token){
    setIsLoggedIn(false);
  }else {
    setIsLoggedIn(true);
  }

},[]);

  const handleLoginSuccess = () => {
    console.log("🎉 Login successful - showing appointment page");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    console.log("👋 Logging out - showing login page");
    localStorage.removeItem("jwtToken");
    setIsLoggedIn(false);
  };

  return (
    <>
      {isLoggedIn ? ( <MainPage onLogout={handleLogout} />) : ( <GuidanceLogin onLoginSuccess={handleLoginSuccess} />)}
   </>
  );
}

export default App;