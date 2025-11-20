import React from 'react'
import AdminSideBar from './layout/AdminSideBar';
import { useState } from 'react';
import Accounts from './Accounts';
import StudentInformation from './StudentInformation';
import AdminNavbar from './layout/AdminNavbar';
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
      <AdminNavbar/>
      <AdminSideBar onNavigate={handleNavigation} currentPage={currentPage} />
      <div className="main-content">
        {renderCurrentPage()}
      </div>
    </div>
  )
}

export default AdminDashboard
