import React, { useEffect, useState } from "react";
import "../../../../css/AppointmentCard.css";

const formatAppointmentDateTime = (scheduledDate, endDate) => {
  if (!scheduledDate) return { date: "N/A", timeRange: "N/A" };
  
  const startDate = new Date(scheduledDate);
  const actualEndDate = endDate ? new Date(endDate) : null;
  
  const formattedDate = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });
  
  const startTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  if (!actualEndDate) {
    return { 
      date: formattedDate, 
      timeRange: startTime,
    };
  }
  
  const endTime = actualEndDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  return { 
    date: formattedDate, 
    timeRange: `${startTime} - ${endTime}`,
  };
};

function AppointmentCard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("No JWT token found in local storage.");
        setError("No JWT token found. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:8080/counselor/retrieve-appointment", {
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setAppointments(data);
        setError(null);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setError("Failed to load appointments: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const searchFilteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search by student name
    const studentName = appointment.student 
      ? `${appointment.student.firstName} ${appointment.student.middleName || ""} ${appointment.student.lastName}`.toLowerCase()
      : "";
    
    const studentNumber = appointment.student?.studentNumber || appointment.student?.studentId || "";
    
    return studentName.includes(searchLower) || 
           studentNumber.toString().toLowerCase().includes(searchLower);
  });

  if (loading) {
    return <p>Loading appointments...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="appointment-card-container">
      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by student name or student number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            className="clear-search-btn"
            onClick={() => setSearchTerm("")}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      {searchFilteredAppointments.length === 0 && searchTerm ? (
        <div className="empty-message">
          <p>No appointments found matching "{searchTerm}"</p>
          <button 
            className="clear-search-btn clear-search-main"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </button>
        </div>
      ) : (
        <ul className="appointments-list">
          {searchFilteredAppointments.map((appointment) => {
            const { date, timeRange} = formatAppointmentDateTime(
              appointment.scheduledDate,
              appointment.endDate 
            );
            return (
              <li key={appointment.appointmentId} className="appointment-item">
                <div className="appointment-header">
                  <h3 className="student-name">
                    {appointment.student
                      ? `${appointment.student.firstName} ${appointment.student.middleName || ""} ${appointment.student.lastName}`.trim()
                      : "N/A"}
                      {appointment.student?.studentNumber && (
                    <p>{appointment.student.studentNumber}</p>
                  )}
                  </h3>
                  <span className={`status-badge ${appointment.status?.toLowerCase() || 'pending'}`}>
                    {appointment.status || "PENDING"}
                  </span>
                </div>
                <div className="appointment-details">
                  <p><strong>Type:</strong> {appointment.appointmentType || "N/A"}</p>
                  
                  <p><strong>Date:</strong> {date}</p>
                  <p className="appointment-time"><strong>Time:</strong> {timeRange}</p>
                  {appointment.notes && (
                    <p><strong>Notes:</strong> {appointment.notes}</p>
                  )}
                </div>
                <div className="appointment-meta">
                  <small>
                      <strong>Counselor:</strong> {appointment.employee?.person?.firstName || "TBA"} {appointment.employee?.person?.lastName || ""}
                  </small>
                  <small>
                    Created: {appointment.dateCreated 
                      ? new Date(appointment.dateCreated).toLocaleDateString()
                      : "N/A"}
                  </small>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default AppointmentCard;