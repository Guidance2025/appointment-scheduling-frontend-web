import { formatAppointmentDateTime } from '../utils/dateHelper';

export default function AppointmentList({
  appointments,
  isLoading,
  selectedDate,
  status,
  handleModalClick,
}) {
  const getFilteredAppointments = () => {
    if (!selectedDate) return appointments;
    return appointments.filter((appointment) => {
      if (!appointment.scheduledDate) return false;
      const date = new Date(appointment.scheduledDate);
      return (
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading appointments...</p>
      </div>
    );
  }

  const filtered = getFilteredAppointments();

  if (filtered.length === 0) {
    return (
      <div className="no-appointments">
        <p>
          {selectedDate
            ? `No appointments found for ${selectedDate.toLocaleDateString()}`
            : `No appointments found for status: ${status}`}
        </p>
      </div>
    );
  }

  return (
    <>
      {filtered.map((appointment) => {
        const { date, timeRange } = formatAppointmentDateTime(
          appointment.scheduledDate,
          appointment.endDate
        );

        return (
          <div
            className="section-container"
            key={appointment.appointmentId}
            onClick={() => handleModalClick(appointment.appointmentId)}
          >
            <div className="calendar-appointment-header">
              <h2 className="calendar-appointment-date">{date}</h2>
              <h3 className="calendar-appointment-time">{timeRange}</h3>
            </div>
            <div className="calendar-appointment-appointment-info">
              <h2 className="calendar-appointment-appointment-details">
                {appointment.student
                  ? `${appointment.student.person.firstName} ${appointment.student.person.lastName}`
                  : 'Student info unavailable'}
              </h2>
              <h2
                className={`calendar-appointment-appointment-type ${
                  appointment.appointmentType?.toLowerCase() || ''
                }`}
              >
                {appointment.appointmentType}
              </h2>
            </div>
          </div>
        );
      })}
    </>
  );
}
