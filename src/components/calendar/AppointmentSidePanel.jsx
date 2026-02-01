import React, { useState } from 'react';
import { X, Calendar, Clock, Edit2, Trash2, Edit } from 'lucide-react';
import '../../css/AppointmentSummary.css';
import * as PHTimeUtils from '../../utils/dateTime';

const AppointmentSidePanel = ({ 
  isOpen, 
  onClose, 
  appointments, 
  isLoading, 
  currentDate,
  selectedDate,
  onAppointmentClick,
  onUpdateAppointment, 
  onDeleteAppointment,
  isBlockedDay = false, 
  blockReason = '' 
}) => {
  const [deletingId, setDeletingId] = useState(null);
  const [activeTab, setActiveTab] = useState('scheduled');

  const displayTitle = selectedDate 
    ? PHTimeUtils.formatDatePH(selectedDate, {
        weekday: 'long',
        month: 'long', 
        day: 'numeric',
        year: 'numeric'
      })
    : PHTimeUtils.formatDatePH(currentDate, {
        month: 'long', 
        year: 'numeric'
      });

  const filteredAppointments = appointments.filter(appointment => {
    if (!appointment || !appointment.status) return false;
    
    const status = appointment.status.toUpperCase().trim();
    
    if (activeTab === 'scheduled') {
      return status === 'SCHEDULED' || status === 'ONGOING';
    }
    if (activeTab === 'pending') {
      return status === 'PENDING' || status === 'RESCHEDULE_PENDING';
    }
    return false;
  });

  const handleUpdate = (e, appointment) => {
    e.stopPropagation();
    if (onUpdateAppointment) onUpdateAppointment(appointment);
  };

  const handleDelete = async (e, appointment) => {
    e.stopPropagation(); 
    
    setDeletingId(appointment.appointmentId);
    if (onDeleteAppointment) {
      try {
        await onDeleteAppointment(appointment.appointmentId);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const scheduledCount = appointments.filter(a => {
    if (!a || !a.status) return false;
    const status = a.status.toUpperCase().trim();
    return status === 'SCHEDULED' || status === 'ONGOING';
  }).length;
  
  const pendingCount = appointments.filter(a => {
    if (!a || !a.status) return false;
    const status = a.status.toUpperCase().trim();
    return status === 'PENDING' || status === 'RESCHEDULE_PENDING';
  }).length;

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

        <div className="status-tabs">
          <button
            className={`status-tab ${activeTab === 'scheduled' ? 'active' : ''}`}
            onClick={() => setActiveTab('scheduled')}
          >
            Scheduled
            <span className="tab-count">{scheduledCount}</span>
          </button>
          <button
            className={`status-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
            <span className="tab-count">{pendingCount}</span>
          </button>
        </div>

        <div className="side-panel-body">
          {isLoading ? (
            <div className="side-panel-loading">
              <p>Loading appointments...</p>
            </div>
          ) : isBlockedDay ? (
            <div className="side-panel-blocked">
              <div className="blocked-icon">🚫</div>
              <h4>Day Unavailable</h4>
              <p>{blockReason || 'This day has been blocked and is not available for appointments.'}</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="side-panel-empty">
              <Calendar size={48} />
              <h4>No {activeTab === 'scheduled' ? 'Scheduled' : 'Pending'} Appointments</h4>
              <p>
                {selectedDate 
                  ? `No ${activeTab} appointments for this day.` 
                  : `No ${activeTab} appointments for this month.`}
              </p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => {
              const { date, timeRange } = PHTimeUtils.formatAppointmentDateTime(
                appointment.scheduledDate,
                appointment.endDate
              );

              const isDeleting = deletingId === appointment.appointmentId;
              const status = appointment.status?.toUpperCase() || 'UNKNOWN';

              return (
                <div
                  key={appointment.appointmentId}
                  className={`side-panel-appointment-card ${isDeleting ? 'deleting' : ''} ${status === 'ONGOING' ? 'ongoing' : ''}`}
                  onClick={() => onAppointmentClick(appointment.appointmentId)}
                >
                  <div className="appointment-card-content">
                    <div className="appointment-card-header">
                      <div className="appointment-card-date">{date}</div>
                      {status === 'ONGOING' && (
                        <span className="ongoing-badge">ONGOING</span>
                      )}
                    </div>
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
                      className={`appointment-card-type ${appointment.appointmentType?.toLowerCase() || 'academic'}`}
                    >
                      {appointment.appointmentType || 'Academic'}
                    </span>
                  </div>

                  <div className="appointment-card-actions">
                    {status === 'SCHEDULED' && (
                      <>
                        <button
                          className="action-button update-button"
                          onClick={(e) => handleUpdate(e, appointment)}
                          disabled={isDeleting}
                          title="Update appointment"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-button delete-button"
                          onClick={(e) => handleDelete(e, appointment)}
                          disabled={isDeleting}
                          title="Delete appointment"
                        >
                          {isDeleting ? (
                            <span className="spinner-small"></span>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </>
                    )}
                    
                    {status === 'ONGOING' && (
                      <button
                        className="action-button delete-button"
                        onClick={(e) => handleDelete(e, appointment)}
                        disabled={isDeleting}
                        title="Delete appointment"
                      >
                        {isDeleting ? (
                          <span className="spinner-small"></span>
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}
                    
                  </div>
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