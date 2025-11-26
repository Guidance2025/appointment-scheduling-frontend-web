import React, { useState } from "react";
import "../../css/MainPage.css";
import Appointment from "./Appointment";
import Sidebar from "../layout/Sidebar";
import Calendar from "../calendar/Calendar";
import Navbar from './../layout/Navbar';

import Dashboard from "./Dashboard";
import MoodTrend from "./MoodTrend";
import ExitInterview from "./ExitInterview";

function MainPage() {
  const [currentPage, setCurrentPage] = useState("Dashboard");

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "Calendar":
        return <Calendar/>
      case "Dashboard":
        return <Dashboard />;
      case "Appointments":
        return <Appointment />;
      case "MoodTrend":
        return <MoodTrend />;
      case "ExitInterview":
        return <ExitInterview />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="main-page">
      <Navbar/>
      <Sidebar onNavigate={handleNavigation} currentPage={currentPage} />
      <div className="main-content"> 
        {renderCurrentPage()}
      </div>
    </div>
  );
}

export default MainPage;
