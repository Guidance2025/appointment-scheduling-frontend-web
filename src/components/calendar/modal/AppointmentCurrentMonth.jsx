import React, { useEffect, useState } from "react";
import "../../../css/Calendar.css";
import "../../../css/GoogleCalendar.css";
import { MoveLeft } from "lucide-react";
import { getAllCounselorAppointmentByStatus } from "../../../service/counselor";
import ViewStudentInfoModal from "../../pages/modal/ViewStudentInfoModal";
import * as PHTimeUtils from "../../../utils/dateTime"; 

const AppointmentCurrentMonthModal = ({ isOpen, onClose, currentDate }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status] = useState("SCHEDULED");
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedAppointmentId, setIsSelectedAppointmentId] = useState(null);

  const fetchAppointments = async () => {
    const guidanceStaffId = localStorage.getItem("guidanceStaffId");
    if (!guidanceStaffId) return;

    try {
      setIsLoading(true);
      const data = await getAllCounselorAppointmentByStatus(guidanceStaffId, status);
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchAppointments();
  }, [isOpen]);

  const appointmentsForCurrentMonth = appointments.filter((appointment) => {
    const phDate = PHTimeUtils.parseUTCToPH(appointment.scheduledDate);
    if (!phDate) return false;
    return (
      phDate.getMonth() === currentDate.getMonth() &&
      phDate.getFullYear() === currentDate.getFullYear()
    );
  });

  if (!isOpen) return null;

  return (
    <div className="appointemnt-modal-overlay active">
      <div className="appointment-modal-container">
        <div className="appointment-modal-header">
          <h3 className="header-appointment-modal">Appointments</h3>
          <button className="back-button" onClick={onClose}>
            <MoveLeft size={40} />
          </button>
        </div>

        <ViewStudentInfoModal
          isOpen={isDetailsVisible}
          isClose={() => setIsDetailsVisible(false)}
          appointmentId={selectedAppointmentId}
        />

        <div className="appointment-modal-body">
          {isLoading ? (
            <p>Loading appointments...</p>
          ) : appointmentsForCurrentMonth.length === 0 ? (
            <p>No appointments found for this month.</p>
          ) : (
            <div className="appointment-list">
              {appointmentsForCurrentMonth.map((appointment) => {
                const { date, timeRange } = PHTimeUtils.formatAppointmentDateTime(
                  appointment.scheduledDate,
                  appointment.endDate
                );

                const studentName = appointment.student
                  ? `${appointment.student.person.firstName} ${appointment.student.person.lastName}`
                  : "Student info unavailable";

                const typeClass = appointment.appointmentType?.toLowerCase() || "";

                return (
                  <div
                    className="section-container"
                    key={appointment.appointmentId}
                    onClick={() => {
                      setIsDetailsVisible(true);
                      setIsSelectedAppointmentId(appointment.appointmentId);
                    }}
                  >
                    <div className="calendar-appointment-header">
                      <h2 className="calendar-appointment-date">{date}</h2>
                      <h3 className="calendar-appointment-time">{timeRange}</h3>
                    </div>
                    <div className="calendar-appointment-appointment-info">
                      <h2 className="calendar-appointment-appointment-details">{studentName}</h2>
                      <h2 className={`calendar-appointment-appointment-type ${typeClass}`}>
                        {appointment.appointmentType}
                      </h2>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCurrentMonthModal;
