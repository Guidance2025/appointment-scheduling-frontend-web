import { useEffect, useState } from 'react';
import '../../css/Calendar.css';
import '../../css/GoogleCalendar.css'; 
import CalendarHeader from './CalendarHeader';
import AppointmentList from './AppointmentList';

import CalendarGrid from './CalendarGrid';
import CreateAppointmentModal from '../pages/modal/CreateAppointmentModal';
import ViewStudentInfoModal from '../pages/modal/ViewStudentInfoModal';
import { GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF } from './../../../constants/api';
import { getAllAppointmentByGuidanceStaff, getAllCounselorAppointmentByStatus } from '../../service/counselor';

function Calendar() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('SCHEDULED');
  const [showModal, setShowModal] = useState(false);
  const [selectedAppointmentId, setIsSelectedAppointmentId] = useState(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const JWT_TOKEN = localStorage.getItem('jwtToken');
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
      const guidanceStaffId = localStorage.getItem("guidanceStaffId");
        const appointmentList = await getAllCounselorAppointmentByStatus(guidanceStaffId,status);
        setAppointments(Array.isArray(appointmentList) ? appointmentList : []);
      } catch (error) {
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, [JWT_TOKEN, status]);

  const handleModalClick = (appointmentId) => {
    setIsSelectedAppointmentId(appointmentId);
    setIsDetailsVisible(true);
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

          <CalendarGrid
            currentDate={currentDate}
            appointments={appointments}
            selectedDate={selectedDate}
            handleDateClick={handleDateClick}
            daysOfWeek={daysOfWeek}
          />
        </div>
      </div>

      <div className="bottom-container">
        <ViewStudentInfoModal
          isOpen={isDetailsVisible}
          isClose={() => setIsDetailsVisible(false)}
          appointmentId={selectedAppointmentId}
        />

        <AppointmentList
          appointments={appointments}
          isLoading={isLoading}
          selectedDate={selectedDate}
          status={status}
          handleModalClick={handleModalClick}
        />
      </div>

      <CreateAppointmentModal
        isOpen={showModal}
        isClose={() => setShowModal(false)}
      />
    </div>
  );
}

export default Calendar;
