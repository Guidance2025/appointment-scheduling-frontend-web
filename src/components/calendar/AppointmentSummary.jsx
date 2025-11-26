import React from 'react';
import { Calendar, Clock, ArrowRight, CalendarCheck, Check } from 'lucide-react';
import '../../css/AppointmentSummary.css';

const AppointmentSummary = ({ totalCount, todayCount, onViewAll }) => {
  return (
    <div className="appointment-summary-card">
      <div className="appointment-summary-stats">
        <div className="stat-item">
          <div className="stat-icon">
            <Calendar size={18} />
          </div>
          <div className="stat-content">
            <h4>{totalCount}</h4>
            <p>This Month</p>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon-clock">
            <Clock size={18} />
          </div>
          <div className="stat-content">
            <h4>{todayCount}</h4>
            <p>Today</p>
          </div>
        </div>
      </div>

      <button className="view-all-button" onClick={onViewAll}>
            View All
      </button>
    </div>
  );
};

export default AppointmentSummary;