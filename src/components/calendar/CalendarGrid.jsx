import { getDaysInMonth, getFirstDayOfMonth } from '../../helper/validation/hooks/calendarHelper';
import { formatAppointmentDateTime } from '../../helper/dateHelper';
import "./../../css/Calendar.css";
export default function CalendarGrid({
  currentDate,
  appointments,
  selectedDate,
  handleDateClick,
  daysOfWeek
}) { 
  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const getAppointmentsForDay = (day) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return appointments.filter((appointment) => {
      if (!appointment.scheduledDate) return false;
      const date = new Date(appointment.scheduledDate);
      return (
        date.getDate() === dayDate.getDate() &&
        date.getMonth() === dayDate.getMonth() &&
        date.getFullYear() === dayDate.getFullYear()
      );
    });
  };

  const renderCalendarDays = () => {
    const days = [];
    const firstDay = getFirstDayOfMonth(currentDate);
    const totalDays = getDaysInMonth(currentDate);

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let day = 1; day <= totalDays; day++) {
      const dayAppointments = getAppointmentsForDay(day);
      const classes = [
        'calendar-day',
        isToday(day) ? 'today' : '',
        isSelected(day) ? 'selected' : '',
        dayAppointments.length > 0 ? 'has-appointments' : '',
      ]
        .filter(Boolean)
        .join(' ');

      days.push(
        <div key={day} className={classes} onClick={() => handleDateClick(day)}>
          <div className="day-header">
            <span className="day-number">{day}</span>
          </div>
          <div className="day-appointments">
            {dayAppointments.slice(0, 3).map((appointment, i) => {
              const { timeRange } = formatAppointmentDateTime(
                appointment.scheduledDate,
                appointment.endDate
              );
              const type = appointment.appointmentType?.toLowerCase() || 'default';
              return (
                <div key={i} className={`appointment-indicator ${type}`}>
                  <span>{timeRange.split(' - ')[0]}</span>
                  <span>
                    {appointment.student?.firstName} {appointment.student?.lastName}
                  </span>
                </div>
              );
            })}
            {dayAppointments.length > 3 && (
              <div className="more-appointments">
                +{dayAppointments.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <>
      <div className="calendar-weekdays">
        {daysOfWeek.map((day) => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">{renderCalendarDays()}</div>
    </>
  );
}
