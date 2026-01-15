import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import '../../css/AppointmentSummary.css';

const AppointmentSummary = ({ totalCount, todayCount }) => {
  return (
    <div className="appointment-summary-card">
      <div className="appointment-summary-stats">
        <div className="stat-item-1">
          <div className="stat-icon">
            <Calendar size={18} />
          </div>
          <div className="stat-content-2">
            <h4>{totalCount}</h4>
            <p>This Month</p>
          </div>
        </div>

        <div className="stat-item-2">
          <div className="stat-icon-clock">
            <Clock size={18} />
          </div>
          <div className="stat-content-2">
            <h4>{todayCount}</h4>
            <p>Today</p>
          </div>
        </div>
      </div>

      <div className="status-legend">
        <div className="legend-item-inline">
          <div className="legend-color-box scheduled"></div>
          <span className="legend-text">Scheduled</span>
        </div>
        <div className="legend-item-inline">
          <div className="legend-color-box pending"></div>
          <span className="legend-text">Pending</span>
        </div>
        <div className="legend-item-inline">
          <div className="legend-color-box blocked"></div>
          <span className="legend-text">Blocked</span>
        </div>
      </div>
    </div>
  );
};

export default AppointmentSummary;