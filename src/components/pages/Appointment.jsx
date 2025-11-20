import React, { useEffect, useState } from "react";
import "../../css/Appointment.css";
import { getAllCounselorAppointmentByStatus, getAllAppointmentByGuidanceStaff } from "../../service/counselor";
import { Search, X } from 'lucide-react';
import { formatAppointmentDateTime } from "../../helper/dateHelper";

function Appointments() {
  const [status, setStatus] = useState("All");
  const [appointmentType, setAppointmentType] = useState("All");
  const [dateRange, setDateRange] = useState("All");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const JWT_TOKEN = localStorage.getItem("jwtToken");

  const fetchAppointments = async (selectedStatus) => {
    if (!JWT_TOKEN) {
      window.location.href = "/GuidanceLogin";
      throw new Error("No JWT token found. Please log in again.");
    }

    try {
      setLoading(true);
      const guidanceStaffId = localStorage.getItem("guidanceStaffId");
      
      let fetchedData;
      if (selectedStatus === "All") {
        fetchedData = await getAllAppointmentByGuidanceStaff(guidanceStaffId);
      } else {
        fetchedData = await getAllCounselorAppointmentByStatus(guidanceStaffId, selectedStatus);
      }
      
      setAppointments(Array.isArray(fetchedData) ? fetchedData : []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(status);
  }, [status]);

  const applyAllFilters = () => {
    let filtered = [...appointments];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => {
        const studentName = appointment.student 
          ? `${appointment.student.person.firstName} ${appointment.student.person.middleName || ""} ${appointment.student.person.lastName}`.toLowerCase()
          : "";
        const studentNumber = appointment.student?.studentNumber || "";
        return studentName.includes(searchLower) || studentNumber.toString().toLowerCase().includes(searchLower);
      });
    }

    if (dateRange !== "All") {
      const now = new Date();
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.scheduledDate);
        
        switch(dateRange) {
          case "Today":
            return appointmentDate.toDateString() === now.toDateString();
          case "This Week":
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() + (6 - now.getDay()));
            weekEnd.setHours(23, 59, 59, 999);
            
            return appointmentDate >= weekStart && appointmentDate <= weekEnd;
          case "This Month":
            return appointmentDate.getMonth() === now.getMonth() && 
                   appointmentDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const filteredResults = applyAllFilters();

  const handleClearFilters = () => {
    setSearchTerm("");
    setAppointmentType("All");
    setDateRange("All");
  };

  const hasActiveFilters = searchTerm || appointmentType !== "All" || dateRange !== "All";

  return (
    <div className="page-container">
      <div className="advanced-filter-bar">
        <div className="filter-row">
          <div className="filter-group search-group">
            <label className="filter-label">
              <Search size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="filter-input"
                placeholder="Search by student name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="clear-filter-icon"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="filter-group status-group">
            <label className="filter-label">All Status</label>
            <select 
              className="filter-select" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELED">Canceled</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>

          <div className="filter-group date-group">
            <label className="filter-label">Date Range</label>
            <select 
              className="filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>

          <div className="filter-actions">
            {hasActiveFilters && (
              <button 
                className="filter-button secondary"
                onClick={handleClearFilters}
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="appointments-content">
        {loading ? (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            <p>Loading appointments...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="empty-message">
            {hasActiveFilters ? (
              <div>
                <div className="empty-icon">🔍</div>
                <h3 className="empty-title">No appointments found</h3>
                <p className="empty-description">
                  No appointments match your current filters
                </p>
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
                  <th>Created</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((appointment) => {
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