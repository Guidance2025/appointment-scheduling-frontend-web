import React from 'react';
import '../../css/AppointmentLegend.css';

const AppointmentLegend = () => {
  return (
    <div className="appointment-legend">
      <div className="legend-items">
        <div className="legend-item">
          <div className="legend-color scheduled"></div>
          <span className="legend-label">Scheduled</span>
        </div>
        <div className="legend-item">
          <div className="legend-color pending"></div>
          <span className="legend-label">Pending</span>
        </div>
        <div className="legend-item">
          <div className="legend-color ongoing"></div>
          <span className="legend-label">Ongoing</span>
        </div>
        <div className="legend-item">
          <div className="legend-color blocked"></div>
          <span className="legend-label">Blocked</span>
        </div>
      </div>
    </div>
  );
};

export default AppointmentLegend;