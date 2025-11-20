import { useEffect, useState } from 'react';
import '../../css/Calendar.css';
import '../../css/GoogleCalendar.css'; 
import CalendarHeader from './CalendarHeader';
import CalendarGrid from './CalendarGrid';
import CreateAppointmentModal from '../pages/modal/CreateAppointmentModal';
import ViewStudentInfoModal from '../pages/modal/ViewStudentInfoModal';
import { getAllCounselorAppointmentByStatus } from '../../service/counselor';
import AppointmentSidePanel from './AppointmentSidePanel';
import AppointmentSummary from './AppointmentSummary';


function Calendar() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status] = useState('SCHEDULED');
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

  const JWT_TOKEN = localStorage.getItem('jwtToken');
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const guidanceStaffId = localStorage.getItem("guidanceStaffId");
        const appointmentList = await getAllCounselorAppointmentByStatus(guidanceStaffId, status);
        setAppointments(Array.isArray(appointmentList) ? appointmentList : []);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, [JWT_TOKEN, status]);

  const appointmentsThisMonth = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.scheduledDate);
    return (
      appointmentDate.getMonth() === currentDate.getMonth() &&
      appointmentDate.getFullYear() === currentDate.getFullYear()
    );
  });

  const today = new Date();
  const appointmentsToday = appointments.filter((appointment) => {
    const appointmentDate = new Date(appointment.scheduledDate);
    return (
      appointmentDate.getDate() === today.getDate() &&
      appointmentDate.getMonth() === today.getMonth() &&
      appointmentDate.getFullYear() === today.getFullYear()
    );
  });

  const handleAppointmentClick = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setIsDetailsVisible(true);
    setShowSidePanel(false);
  };

  return (
    <div className="page-container">
      <div className="calendar-container">
        <div className="google-calendar-wrapper">
          <CalendarHeader
            currentDate={currentDate}
            navigateMonth={navigateMonth}
            setCurrentDate={setCurrentDate}
            setSelectedDate={setSelectedDate}
            setShowModal={setShowModal}
          />

          <AppointmentSummary
            totalCount={appointmentsThisMonth.length}
            todayCount={appointmentsToday.length}
            onViewAll={() => setShowSidePanel(true)}
          />

          <AppointmentSidePanel
            isOpen={showSidePanel}
            onClose={() => setShowSidePanel(false)}
            appointments={appointmentsThisMonth}
            isLoading={isLoading}
            currentDate={currentDate}
            onAppointmentClick={handleAppointmentClick}
          />

          <CalendarGrid
            currentDate={currentDate}
            appointments={appointments}
            selectedDate={selectedDate}
            handleDateClick={handleDateClick}
            daysOfWeek={daysOfWeek}
          />
        </div>
      </div>

      <CreateAppointmentModal
        isOpen={showModal}
        isClose={() => setShowModal(false)}
      />

      <ViewStudentInfoModal
        isOpen={isDetailsVisible}
        isClose={() => setIsDetailsVisible(false)}
        appointmentId={selectedAppointmentId}
      />
    </div>
  );
}

export default Calendar;
