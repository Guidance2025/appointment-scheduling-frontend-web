import { useEffect, useState } from "react";
import "../../../../css/AppointmentModal.css";

const AppointmentsModal = ({ appointmentId, isOpen, isClose  }) => {
  
  const JWT_TOKEN = localStorage.getItem("jwtToken");
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && appointmentId) {
      const fetchStudentInformation = async () => {
        setLoading(true);
        try {
          const response = await fetch(`http://localhost:8080/counselor/${appointmentId}`, {
            method: "GET",
            headers: {
              Authorization: "Bearer " + JWT_TOKEN,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            setAppointment(data);
          } else {
            console.error("Fetch error:", response.statusText);
          }
        } catch (error) {
          console.error("Fetch error:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchStudentInformation();
    }
  }, [isOpen, appointmentId, JWT_TOKEN]);

  const formatAppointmentDateTime = (scheduledDate, endDate) => {
        if (!scheduledDate) return { date: "N/A", timeRange: "N/A" };

        const startDate = new Date(scheduledDate);
        const actualEndDate = endDate ? new Date(endDate) : null;

        const formattedDate = startDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const startTime = startDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        if (!actualEndDate) {
            return { date: formattedDate, timeRange: startTime };
        }

        const endTime = actualEndDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        return { date: formattedDate, timeRange: `${startTime} - ${endTime}` };
    };

  

  if (!isOpen) return null;

  return (
    <div className="appointment-modal-overlay">
      <div className="appointment-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="appointment-close-btn" onClick={isClose}>×</button>
        
        {loading && <p className="appointment-loading">Loading student info...</p>}

        {!loading && appointment && (
          <>
            <h1>Student Information</h1>
            
            <div className="student-info-section">
              <h2 className="student-number">Student Number: {appointment.student.studentNumber}</h2>
              <h2>
                Name: {appointment.student.firstName} {appointment.student.middleName} {appointment.student.lastName}
              </h2>
              <h3>Gender: {appointment.student.gender}</h3>
              <h3>Age: {appointment.student.age}</h3>
              <h3>Email: {appointment.student.email}</h3>
              <h3>Contact: {appointment.student.contactNumber}</h3>
              <h3>Section: {appointment.student.section.sectionName}</h3>
            </div>

            <hr />
            
            <div className="appointment-details-section">
              <h2>Appointment Details</h2>
              <h3>Type: {appointment.appointmentType}</h3>
              <h3>Status: {appointment.status}</h3>
              {(() => {
                const {date, timeRange} = formatAppointmentDateTime(
                  appointment.scheduledDate,
                  appointment.endDate
                );
                return (
                  <>
                      <h3>Scheduled Date: {date}</h3>
                      <h3>Time: {timeRange}</h3>
                  </>
                );
              })()}
              <h3>Notes: {appointment.notes}</h3>
            </div>

            <hr />

            <div className="guidance-staff-section">
              <h2>Guidance Staff</h2>
              <h3>
                {appointment.guidanceStaff.person.firstName}{" "}
                {appointment.guidanceStaff.person.lastName} (
                {appointment.guidanceStaff.positionInRc})
              </h3>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentsModal;