import React, { useEffect, useState } from "react";
import "../../css/Appointment.css";
import { getAllCounselorAppointmentByStatus, getAllAppointmentByGuidanceStaff } from "../../service/counselor";
import { Search, X, Download } from 'lucide-react';
import * as PHTimeUtils from "../../utils/dateTime";
import { formatFullDateTimePH } from "../../utils/dateTime";

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

  // ═══════════════════════════════════════════════════════════════════════
  // EXPORT FUNCTIONALITY - Similar to Exit Interview Export
  // ═══════════════════════════════════════════════════════════════════════
  
  /**
   * Export a single student's appointment history
   * This function creates an Excel file (.xls) containing all appointments for a specific student
   * 
   * HOW IT WORKS:
   * 1. Filters all appointments to get only this student's appointments
   * 2. Sorts them by date (newest first)
   * 3. Creates an HTML table with appointment details
   * 4. Converts the HTML to a downloadable Excel file
   * 5. Triggers automatic download in the browser
   */
  const exportStudentAppointments = async (studentId, studentName) => {
    try {
      // Filter appointments for this specific student
      const studentAppointments = appointments
        .filter(apt => apt.student?.id === studentId)
        .sort((a, b) => new Date(b.scheduledDate) - new Date(a.scheduledDate));

      // Check if student has any appointments
      if (!studentAppointments.length) {
        alert(`No appointments found for ${studentName}.`);
        return;
      }

      // Get student details from first appointment
      const studentInfo = studentAppointments[0].student;
      const studentNumber = studentInfo?.studentNumber || 'N/A';

      // Build HTML table with appointment data
      const html = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Appointments – ${studentName}</title>
            <style>
              table { 
                border-collapse: collapse; 
                width: 100%; 
                font-family: Arial, sans-serif; 
              }
              th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
              }
              th { 
                background-color: #f2f2f2; 
                font-weight: bold;
              }
              .header-row { 
                background-color: #16a34a; 
                color: white; 
              }
              .status-pending { color: #f59e0b; }
              .status-completed { color: #10b981; }
              .status-cancelled { color: #ef4444; }
              .status-scheduled { color: #3b82f6; }
            </style>
          </head>
          <body>
            <h2>Appointment History Report</h2>
            
            <table>
              <!-- Student Information Section -->
              <tr class="header-row">
                <td colspan="6"><strong>Student Information</strong></td>
              </tr>
              <tr>
                <td><strong>Name:</strong></td>
                <td>${studentName}</td>
                <td><strong>Student No.:</strong></td>
                <td>${studentNumber}</td>
                <td><strong>Export Date:</strong></td>
                <td>${formatFullDateTimePH(new Date().toISOString())}</td>
              </tr>
              <tr>
                <td><strong>Total Appointments:</strong></td>
                <td>${studentAppointments.length}</td>
                <td colspan="4">&nbsp;</td>
              </tr>
              <tr><td colspan="6">&nbsp;</td></tr>
              
              <!-- Appointments Table -->
              <tr class="header-row">
                <th>#</th>
                <th>Type</th>
                <th>Scheduled Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
              ${studentAppointments.map((apt, index) => {
                const { date, timeRange } = PHTimeUtils.formatAppointmentDateTime(
                  apt.scheduledDate,
                  apt.endDate
                );
                const createdDate = apt.dateCreated 
                  ? formatFullDateTimePH(apt.dateCreated)
                  : 'N/A';
                
                return `
                  <tr>
                    <td>${studentAppointments.length - index}</td>
                    <td>${apt.appointmentType || 'N/A'}</td>
                    <td>${date}</td>
                    <td>${timeRange}</td>
                    <td class="status-${apt.status?.toLowerCase() || 'pending'}">
                      ${apt.status || 'PENDING'}
                    </td>
                    <td>${createdDate}</td>
                  </tr>
                `;
              }).join('')}
            </table>
            
            <p><em>Generated on ${formatFullDateTimePH(new Date().toISOString())}</em></p>
          </body>
        </html>
      `;

      // Create a Blob (binary large object) from the HTML
      // This is like creating a file in memory
      const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
      
      // Create a temporary download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob); // Create a temporary URL for the blob
      link.download = `${studentName.replace(/\s+/g, '_')}_Appointments_${new Date().toISOString().split('T')[0]}.xls`;
      link.style.display = 'none';
      
      // Add link to page, click it, then remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the temporary URL
      URL.revokeObjectURL(link.href);
      
    } catch (error) {
      console.error('Error exporting appointments:', error);
      alert('Failed to export appointments. Please try again.');
    }
  };

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
                  <th>Action</th>
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

                  const studentName = appointment.student
                    ? `${appointment.student.person.firstName} ${appointment.student.person.middleName || ""} ${appointment.student.person.lastName}`.trim()
                    : "N/A";

                  return (
                    <tr key={appointment.appointmentId} className="appointment-row">
                      <td className="student-cell">
                        <div className="student-info-table">
                          <div className="student-details-table">
                            <span className="student-name-table">{studentName}</span>
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
                      <td className="action-cell">
                        <button
                          className="export-button"
                          onClick={() => exportStudentAppointments(appointment.student?.id, studentName)}
                          title="Export this student's appointment history"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            backgroundColor: '#16a34a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          <Download size={14} /> Export
                        </button>
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