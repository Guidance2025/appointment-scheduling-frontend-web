import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import "./../../css/Calendar.css";

export default function CalendarHeader({
  currentDate,
  navigateMonth,
  setCurrentDate,
  setSelectedDate,
  setShowModal,
}) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

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

        <button className="create-button" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Create
        </button>
      </div>
    </div>
  );
}
