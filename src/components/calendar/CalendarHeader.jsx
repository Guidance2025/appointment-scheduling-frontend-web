import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import "./../../css/Calendar.css";
import "./../../css/button/button.css";
import ManageAvailability from './modal/ManageAvailability';
import { useState } from 'react';

export default function CalendarHeader({
  currentDate,
  navigateMonth,
  setCurrentDate,
  setSelectedDate,
  setShowModal,
  onViewAll,
  onAvailabilityUpdate
}) {
  const [showManageAvailability, setShowManageAvailability] = useState(false);
  
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleCloseAvailability = () => {
    setShowManageAvailability(false);
    if (onAvailabilityUpdate) {
      onAvailabilityUpdate();
    }
  };

  return (
    <div className="calendar-header">
      <div className="calendar-nav">
        <button className="nav-button" onClick={() => navigateMonth(-1)}>
          <ChevronLeft size={18} />
        </button>

        <div className="current-month">
          {months[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>

        <button className="nav-button" onClick={() => navigateMonth(1)}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="calendar-actions">
        <button
          className="today-button"
          onClick={() => {
            setCurrentDate(new Date());
            setSelectedDate(new Date());
          }}
        >
          Today
        </button>
        
        <button 
          className='manage-availability' 
          onClick={() => setShowManageAvailability(true)}
        >
          Manage Availability
        </button>

        <ManageAvailability 
          onClose={handleCloseAvailability} 
          isOpen={showManageAvailability} 
        />

        <button className="create-button btn-color-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Create
        </button>
        
        <button className="view-all-button" onClick={onViewAll}>
          View All
        </button>
      </div>
    </div>
  );
}