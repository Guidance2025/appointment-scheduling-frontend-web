import React, { useEffect, useState } from "react";
import "../../css/Appointment.css";
import AppointmentCard from './../card/AppointmentCard';
import { formatAppointmentDateTime } from "../utils/dateHelper";


function Appointments() {
  const [status, setStatus] = useState("All");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const JWT_TOKEN = localStorage.getItem("jwtToken");


  const filteredAppointments = async (status) => {
    if (!JWT_TOKEN) {
      window.location.href = "/GuidanceLogin";
      throw new Error("No JWT token found. Please log in again.");
    }

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8080/counselor/appointment/${status}`,
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + JWT_TOKEN,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const filteredData = await response.json();
      setAppointments(filteredData);
    } catch (error) {
      console.error("Error fetching filtered appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== "All") {
      filteredAppointments(status); 
    }
  }, [status]);

  const searchFilteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    const studentName = appointment.student 
      ? `${appointment.student.firstName} ${appointment.student.middleName || ""} ${appointment.student.lastName}`.toLowerCase()
      : "";
    
    const studentNumber = appointment.student?.studentNumber || appointment.student?.studentId || "";
    
    return studentName.includes(searchLower) || studentNumber.toString().toLowerCase().includes(searchLower);
  });

  return (
    <div className="page-container">
      <div className="appointments-header">
        {/* <h2 className="page-title">Appointments</h2> */}
        <div className="filter-container">
          <select 
            className="filter-select" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="SCHEDULED">Scheduled</option>
          </select>
        </div>
      </div>

      {status !== "All" && (
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search by student name or student number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}/>
        {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
              title="Clear search">
              ✕
            </button>
          )}
        </div>
      )}

      <div className="appointments-content">
        {status === "All" ? (
          <AppointmentCard/>
        ) : loading ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading appointments...</p>
          </div>
        ) : searchFilteredAppointments.length === 0 ? (
          <div className="empty-message">
            {searchTerm ? (
              <div>
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No appointments found</h3>
                <p className="empty-description">No appointments found matching "{searchTerm}"</p>
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}>
                  Clear search
                </button>
              </div>
            ) : (
              <div>
                <div className="empty-icon">📅</div>
                <h3 className="empty-title">No appointments found</h3>
                <p className="empty-description">There are no appointments with the selected status.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="appointments-table-container">
            <table className="appointments-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Counselor</th>
                  <th>Created</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {searchFilteredAppointments.map((appointment) => {
                  const { date, timeRange } = formatAppointmentDateTime(
                    appointment.scheduledDate,
                    appointment.endDate
                  );
                  
                  return (
                    <tr key={appointment.appointmentId} className="appointment-row">
                      <td className="student-cell">
                        <div className="student-info-table">
                          <div className="student-details-table">
                            <span className="student-name-table">
                              {appointment.student
                                ? `${appointment.student.person.firstName} ${appointment.student.person.middleName || ""} ${appointment.student.person.lastName}`.trim()
                                : "N/A"}
                            </span>
                            {appointment.student?.studentNumber && (
                              <span className="student-number-table">
                                {appointment.student.studentNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="type-cell">
                        {appointment.appointmentType || "N/A"}
                      </td>
                      
                      <td className="date-cell">
                        {date}
                      </td>
                      
                      <td className="time-cell">
                        {timeRange}
                      </td>
                      
                      <td className="status-cell">
                        <span className={`status-badge-table ${appointment.status?.toLowerCase() || 'pending'}`}>
                          {appointment.status || "PENDING"}
                        </span>
                      </td>
                      
                      <td className="counselor-cell">
                        {appointment.guidanceStaff?.person?.firstName || "TBA"} {appointment.guidanceStaff?.person?.lastName || ""}
                      </td>
                      
                      <td className="created-cell">
                        {appointment.dateCreated 
                          ? new Date(appointment.dateCreated).toLocaleDateString()
                          : "N/A"}
                      </td>
                      
                      <td className="notes-cell">
                        {appointment.notes ? (
                          <div className="notes-preview-table" title={appointment.notes}>
                            {appointment.notes.length > 30 
                              ? `${appointment.notes.substring(0, 30)}...` 
                              : appointment.notes}
                          </div>
                        ) : (
                          <span className="no-notes">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Appointments;