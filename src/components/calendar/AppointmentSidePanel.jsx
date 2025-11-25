import React from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import '../../css/AppointmentSummary.css';
import { formatAppointmentDateTime } from '../../helper/dateHelper';

const AppointmentSidePanel = ({ 
  isOpen, 
  onClose, 
  appointments, 
  isLoading, 
  currentDate,
  selectedDate, // NEW PROP
  onAppointmentClick 
}) => {
  // Display selected date or full month
  const displayTitle = selectedDate 
    ? selectedDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric' 
      })
    : currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });

  return (
    <>
      <div 
        className={`side-panel-overlay ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <div className={`appointment-side-panel ${isOpen ? 'open' : ''}`}>
        <div className="side-panel-header">
          <h3>{displayTitle}</h3>
          <button className="close-panel-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="side-panel-body">
          {isLoading ? (
            <div className="side-panel-loading">
              <p>Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="side-panel-empty">
              <Calendar size={48} />
              <h4>No Appointments</h4>
              <p>
                {selectedDate 
                  ? 'No appointments scheduled for this day.' 
                  : 'No appointments scheduled for this month.'}
              </p>
            </div>
          ) : (
            appointments.map((appointment) => {
              const { date, timeRange } = formatAppointmentDateTime(
                appointment.scheduledDate,
                appointment.endDate
              );

              return (
                <div
                  key={appointment.appointmentId}
                  className="side-panel-appointment-card"
                  onClick={() => onAppointmentClick(appointment.appointmentId)}
                >
                  <div className="appointment-card-date">{date}</div>
                  <div className="appointment-card-time">
                    <Clock size={14} />
                    {timeRange}
                  </div>
                  <div className="appointment-card-student">
                    {appointment.student
                      ? `${appointment.student.person.firstName} ${appointment.student.person.lastName}`
                      : 'Student info unavailable'}
                  </div>
                  <span
                    className={`appointment-card-type ${
                      appointment.appointmentType?.toLowerCase() || 'academic'
                    }`}
                  >
                    {appointment.appointmentType || 'Academic'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default AppointmentSidePanel;