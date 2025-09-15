import React, { useState } from "react";
import "../../../css/MainPage.css";
import Sidebar from "./Sidebar";
import Appointment from "./Appointment";
import Calendar from "./Calendar";
import Navbar from "./Navbar";

const Dashboard = () => (
  <div className="page-container">
    <h2 className="page-title">Dashboard</h2>
    <p className="page-content">Dashboard component content here...</p>
  </div>
);

const StudentRecords = () => (
  <div className="page-container">
    <h2 className="page-title">Student Records</h2>
    <p className="page-content">Student records component content here...</p>
  </div>
);

const ContentHub = () => (
  <div className="page-container">
    <h2 className="page-title">Content Hub</h2>
    <p className="page-content">Content hub component content here...</p>
  </div>
);

const ExitInterview = () => (
  <div className="page-container">
    <h2 className="page-title">Exit Interview</h2>
    <p className="page-content">Exit interview component content here...</p>
  </div>
);

function MainPage() {
  const [currentPage, setCurrentPage] = useState("Calendar");

  const handleNavigation = (page) => {
    setCurrentPage(page);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "Calendar":
        return <Calendar />;
      case "Dashboard":
        return <Dashboard />;
      case "Appointments":
        return <Appointment />;
      case "StudentRecords":
        return <StudentRecords />;
      case "ContentHub":
        return <ContentHub />;
      case "ExitInterview":
        return <ExitInterview />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="main-page">
      <Sidebar onNavigate={handleNavigation} currentPage={currentPage} />
      <div className="main-content">
        {renderCurrentPage()}
        {/* <Navbar /> */}
      </div>
    </div>
  );
}

export default MainPage;
