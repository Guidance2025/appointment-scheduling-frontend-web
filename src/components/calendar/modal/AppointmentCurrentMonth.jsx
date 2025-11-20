import React, { useEffect, useState } from "react";
import "../../../css/Calendar.css";
import "../../../css/GoogleCalendar.css";
import { MoveLeft } from "lucide-react";
import { getAllCounselorAppointmentByStatus } from "../../../service/counselor";
import { formatAppointmentDateTime } from "../../utils/dateHelper";
import ViewStudentInfoModal from "../../pages/modal/ViewStudentInfoModal";

const AppointmentCurrentMonthModal = ({ isOpen, onClose , currentDate }) => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status] = useState("SCHEDULED"); 
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedAppointmentId, setIsSelectedAppointmentId] = useState(null);

  const filteredAppointments = async () => {
    const guidanceStaffId = localStorage.getItem("guidanceStaffId");

    try {
      setIsLoading(true);
      const filteredData = await getAllCounselorAppointmentByStatus(
        guidanceStaffId,
        status
      );
      setAppointments(filteredData);
    } catch (error) {
      console.error("Error fetching filtered appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      filteredAppointments();
    }
  }, [isOpen]); 

  const appointmentCurrentMonth = () => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.scheduledDate);
      return (
        appointmentDate.getMonth() === currentDate.getMonth() &&
        appointmentDate.getFullYear() === currentDate.getFullYear()
      );
    });
  };

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
          ) : appointmentCurrentMonth().length === 0 ? (
            <p>No appointments found for this month.</p>
          ) : (
            <div className="appointment-list">
              {appointmentCurrentMonth().map((appointment) => {
                const { date, timeRange } = formatAppointmentDateTime(
                  appointment.scheduledDate,
                  appointment.endDate
                );

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
                      <h2 className="calendar-appointment-appointment-details">
                        {appointment.student
                          ? `${appointment?.student?.person?.firstName} ${appointment.student.person.lastName}`
                          : "Student info unavailable"}
                      </h2>
                      <h2
                        className={`calendar-appointment-appointment-type ${
                          appointment.appointmentType?.toLowerCase() || ""
                        }`}
                      >
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