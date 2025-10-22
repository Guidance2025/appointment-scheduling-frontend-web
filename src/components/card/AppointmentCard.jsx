import React, { useEffect, useState } from "react";
import "../../css/AppointmentCard.css";
import { formatAppointmentDateTime } from "../utils/dateHelper";
import { getAllAppointmentByGuidanceStaff } from "../../service/counselor";
function AppointmentCard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
 const fetchAppointments = async () => {
  setLoading(true);
  setError(null);
  try {

    const guidanceStaffId = localStorage.getItem("guidanceStaffId");

    console.log("Guidance Id from LocalStorage ", guidanceStaffId)
    console.log("All LocalStorage" , localStorage);
    if(!guidanceStaffId) {
      console.error("No GUidance ID Recieved")
       setError("No GuidanceId Recieved ");
       setLoading(false);
       return;
    }

    
    const appointments = await getAllAppointmentByGuidanceStaff(guidanceStaffId);
    setAppointments(appointments);
  } catch (err) {
    setError("Failed to fetch appointments");
    console.log(err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchAppointments();
  }, []);

  const searchFilteredAppointments = appointments.filter(appointment => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    const studentName = appointment.student 
      ? `${appointment.student.person.firstName} ${appointment.student.person.middleName || ""} ${appointment.student.person.lastName}`.toLowerCase()
      : "";
    
    const studentNumber = appointment.student?.studentNumber || appointment.student?.studentId || "";
    
    return studentName.includes(searchLower) || 
studentNumber.toString().toLowerCase().includes(searchLower);
  });

  if (loading) {
    return (
      <div className="loading-message">
        <div className="loading-spinner"></div>
        <p>Loading appointments...</p>
      </div>
    );
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div>
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

      {/* Content Area */}
      {searchFilteredAppointments.length === 0 && searchTerm ? (
        <div className="empty-message">
          <div className="empty-icon">🔍</div>
          <h3 className="empty-title">No appointments found</h3>
          <p className="empty-description">No appointments found matching "{searchTerm}"</p>
          <button 
            className="clear-search-btn clear-search-main"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </button>
        </div>
      ) : searchFilteredAppointments.length === 0 ? (
        <div className="empty-message">
          <div className="empty-icon">📅</div>
          <h3 className="empty-title">No appointments found</h3>
          <p className="empty-description">There are no appointments available.</p>
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
  );
}

export default AppointmentCard;