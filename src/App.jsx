import { useEffect, useState } from 'react';  
import GuidanceLogin from './components/Login/GuidanceLogin';
import MainPage from './components/Login/pages/Mainpage';

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