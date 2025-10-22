import React from 'react'
import AdminSideBar from './layout/AdminSideBar';
import { useState } from 'react';
import Accounts from './Accounts';
import StudentInformation from './StudentInformation';
const AdminDashboard = ({onLogout}) => {
   const [currentPage, setCurrentPage] = useState("Calendar");
    

  const handleNavigation = (page) => {
    setCurrentPage(page); 
  };  

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "Accounts":
        return <Accounts/>
      case "Registration":
        return <StudentInformation />;
        default:
        return <Accounts />;
    }
  
  };

  return (
    <div className="main-page">
      {/* <Navbar/> */}
      <AdminSideBar onNavigate={handleNavigation} currentPage={currentPage} />
      <div className="main-content">
        {renderCurrentPage()}
        <button onClick={onLogout}></button>
      </div>
    </div>
  )
}

export default AdminDashboard
