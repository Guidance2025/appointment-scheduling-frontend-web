import React, { useEffect, useState } from "react";
import "../../css/Appointment.css";
import { getAllCounselorAppointmentByStatus, getAllAppointmentByGuidanceStaff } from "../../service/counselor";
import { Search, X } from 'lucide-react';
import * as PHTimeUtils from "../../utils/dateTime";

function Appointments() {
  const [status, setStatus] = useState("All");
  const [appointmentType, setAppointmentType] = useState("All");
  const [dateRange, setDateRange] = useState("All");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const JWT_TOKEN = localStorage.getItem("jwtToken");

  const fetchAppointments = async () => {
    if (!JWT_TOKEN) {
      window.location.href = "/GuidanceLogin";
      throw new Error("No JWT token found. Please log in again.");
    }

    try {
      setLoading(true);
      const guidanceStaffId = localStorage.getItem("guidanceStaffId");
      
      const fetchedData = await getAllAppointmentByGuidanceStaff(guidanceStaffId);

      const filteredData = Array.isArray(fetchedData) 
        ? fetchedData.filter(appointment => {
            const isBlocked = appointment.appointmentType?.toUpperCase() === 'AVAILABILITY_BLOCK' || 
                             appointment.status?.toUpperCase() === 'BLOCKED';
            return !isBlocked; 
          })
        : [];
      
      setAppointments(filteredData);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const applyAllFilters = () => {
    let filtered = [...appointments];

    if (status !== "All") {
      filtered = filtered.filter(appointment => 
        appointment.status?.toUpperCase() === status.toUpperCase()
      );
    }

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
      const nowPH = PHTimeUtils.getCurrentPHTime();

      filtered = filtered.filter(appointment => {
        const appointmentDatePH = PHTimeUtils.parseUTCToPH(appointment.scheduledDate);
        if (!appointmentDatePH) return false;

        switch(dateRange) {
          case "Today":
            return PHTimeUtils.isTodayPH(appointmentDatePH);

          case "This Week":
            return PHTimeUtils.isThisWeekPH(appointmentDatePH);

          case "This Month":
            return PHTimeUtils.isThisMonthPH(appointmentDatePH);

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
    setStatus("All");
    setAppointmentType("All");
    setDateRange("All");
  };

  const hasActiveFilters = searchTerm || status !== "All" || appointmentType !== "All" || dateRange !== "All";

  return (
    <div className="page-container">
      <div className="appointments-filter-bar">
        <div className="appointments-filter-row">
          <div className="appointments-filter-group appointments-search-group">
            <label className="appointments-filter-label">
              <Search size={12} style={{ marginRight: '4px' }} />
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="appointments-filter-input"
                placeholder="Search by student name or number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="appointments-clear-filter-icon"
                  onClick={() => setSearchTerm("")}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="appointments-filter-group appointments-status-group">
            <label className="appointments-filter-label">Status</label>
            <select 
              className="appointments-filter-select" 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>

          <div className="appointments-filter-group appointments-date-group">
            <label className="appointments-filter-label">Date Range</label>
            <select 
              className="appointments-filter-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
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
                <p className="empty-description">No appointments match your current filters</p>
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
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((appointment) => {
                  const { date, timeRange } = PHTimeUtils.formatAppointmentDateTime(
                    appointment.scheduledDate,
                    appointment.endDate
                  );
                  const createdDate = appointment.dateCreated 
                    ? PHTimeUtils.formatShortDatePH(appointment.dateCreated)
                    : "N/A";

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
                              <span className="student-number-table">{appointment.student.studentNumber}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="type-cell">{appointment.appointmentType || "N/A"}</td>
                      <td className="date-cell">{date}</td>
                      <td className="time-cell">{timeRange}</td>
                      <td className="status-cell">
                        <span className={`status-badge-table ${appointment.status?.toLowerCase() || 'pending'}`}>
                          {appointment.status || "PENDING"}
                        </span>
                      </td>
                      <td className="created-cell">{createdDate}</td>
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