import { getDaysInMonth, getFirstDayOfMonth } from '../../helper/validation/hooks/calendarHelper';
import * as PHTimeUtils from '../../utils/dateTime';
import "../../css/Calendar.css";

export default function CalendarGrid({
  currentDate,
  appointments = [],
  blockedPeriods = [],
  selectedDate,
  handleDateClick,
  daysOfWeek
}) {
  const isToday = (day) => {
    const today = PHTimeUtils.getCurrentPHTime();
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

  const isDateBlocked = (day) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return blockedPeriods.some(block => {
      const blockDate = PHTimeUtils.parseUTCToPH(block.scheduledDate);
      return (
        blockDate.getDate() === dayDate.getDate() &&
        blockDate.getMonth() === dayDate.getMonth() &&
        blockDate.getFullYear() === dayDate.getFullYear()
      );
    });
  };

  const getBlocksForDay = (day) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return blockedPeriods.filter(block => {
      const blockDate = PHTimeUtils.parseUTCToPH(block.scheduledDate);
      return (
        blockDate.getDate() === dayDate.getDate() &&
        blockDate.getMonth() === dayDate.getMonth() &&
        blockDate.getFullYear() === dayDate.getFullYear()
      );
    });
  };

  const getAppointmentsForDay = (day) => {
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return appointments.filter((appointment) => {
      if (!appointment.scheduledDate) return false;
      const date = PHTimeUtils.parseUTCToPH(appointment.scheduledDate);
      return (
        date.getDate() === dayDate.getDate() &&
        date.getMonth() === dayDate.getMonth() &&
        date.getFullYear() === dayDate.getFullYear()
      );
    });
  };

  const getStatusClass = (status) => {
    const normalizedStatus = status?.toUpperCase().trim();
    switch (normalizedStatus) {
      case 'SCHEDULED':
        return 'status-scheduled';
      case 'PENDING':
        return 'status-pending';
      case 'ONGOING':
        return 'status-ongoing';
      default:
        return 'status-default';
    }
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
      const dayBlocks = getBlocksForDay(day);
      const isBlocked = isDateBlocked(day);

      const classes = [
        'calendar-day',
        isToday(day) ? 'today' : '',
        isSelected(day) ? 'selected' : '',
        dayAppointments.length > 0 ? 'has-appointments' : '',
        isBlocked ? 'blocked' : ''
      ].filter(Boolean).join(' ');

      days.push(
        <div key={day} className={classes} onClick={() => handleDateClick(day)}>
          <div className="day-header">
            <span className="day-number">{day}</span>
            {isBlocked && <span className="blocked-indicator">🚫</span>}
          </div>

          <div className="day-appointments">
            {dayBlocks.map((block, i) => {
              const startTime = PHTimeUtils.formatTimePH(block.scheduledDate);
              const endTime = block.endDate ? PHTimeUtils.formatTimePH(block.endDate) : null;
              const timeRange = endTime ? `${startTime} - ${endTime}` : 'All Day';
              return (
                <div key={`block-${i}`} className="appointment-indicator blocked-slot">
                  <span>{timeRange}</span>
                  <span>{block.reason || 'Blocked'}</span>
                </div>
              );
            })}

            {dayAppointments.slice(0, isBlocked ? 2 : 3).map((appointment, i) => {
              const { timeRange } = PHTimeUtils.formatAppointmentDateTime(
                appointment.scheduledDate,
                appointment.endDate
              );
              const statusClass = getStatusClass(appointment.status);
              return (
                <div key={i} className={`appointment-indicator ${statusClass}`}>
                  <span>{timeRange.split(' - ')[0]}</span>
                  <span>
                    {appointment.student?.firstName} {appointment.student?.lastName}
                  </span>
                </div>
              );
            })}

            {(dayAppointments.length + dayBlocks.length) > 3 && (
              <div className="more-appointments">
                +{(dayAppointments.length + dayBlocks.length) - 3} more
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