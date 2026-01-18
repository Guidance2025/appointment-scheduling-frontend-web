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
import AppointmentLegend from './AppointmentLegend';
import UpdateAppointmentModal from './modal/UpdateAppointmentModal';
import { API_BASE_URL } from '../../../constants/api';
import { usePopUp } from '../../helper/message/pop/up/provider/PopUpModalProvider';

function Calendar() {
  const [appointments, setAppointments] = useState([]);
  const [blockedPeriods, setBlockedPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status] = useState('SCHEDULED');
  const [showModal, setShowModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [appointmentToUpdate, setAppointmentToUpdate] = useState(null);
  const [isBlockedDay, setIsBlockedDay] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const JWT_TOKEN = localStorage.getItem('jwtToken');
  const guidanceStaffId = localStorage.getItem("guidanceStaffId");
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const { showSuccess, showError, showWarning, showConfirm } = usePopUp();
  

  const navigateMonth = (direction) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const checkIfDayIsBlocked = (clickedDate) => {
    const dayStart = new Date(clickedDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(clickedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const fullDayBlock = blockedPeriods.find((block) => {
      const blockStart = new Date(block.scheduledDate);
      const blockEnd = block.endDate ? new Date(block.endDate) : null;

      if (!blockEnd) {
        const blockDate = new Date(blockStart);
        blockDate.setHours(0, 0, 0, 0);
        return blockDate.getTime() === dayStart.getTime();
      }

      return blockStart <= dayStart && blockEnd >= dayEnd;
    });

    return fullDayBlock;
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    
    const blockedInfo = checkIfDayIsBlocked(clickedDate);
    
    if (blockedInfo) {
      setIsBlockedDay(true);
      setBlockReason(blockedInfo.notes || 'No specific reason provided');
      setFilteredAppointments([]);
    } else {
      setIsBlockedDay(false);
      setBlockReason('');
      
      const appointmentsForDay = appointments.filter((appointment) => {
        if (!appointment || !appointment.scheduledDate) return false;
        
        const appointmentDate = new Date(appointment.scheduledDate);
        const matchesDay = appointmentDate.getDate() === day &&
                          appointmentDate.getMonth() === currentDate.getMonth() &&
                          appointmentDate.getFullYear() === currentDate.getFullYear();
        
        if (!matchesDay) return false;
        
        const status = appointment.status?.toUpperCase().trim();
        return status === 'PENDING' || status === 'SCHEDULED' || status === 'ONGOING';
      });
      
      console.log('Filtered appointments for day:', appointmentsForDay);
      setFilteredAppointments(appointmentsForDay);
    }
    
    setShowSidePanel(true); 
  };

  const handleUpdateAppointment = (appointment) => {
    setAppointmentToUpdate(appointment);
    setShowUpdateModal(true);
  };

  const handleUpdateSubmit = async (appointmentId, updatedData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/counselor/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: appointmentId,
          scheduledDate: updatedData.scheduledDate,
          endDate: updatedData.endDate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update appointment');
      }

      const updatedAppointment = await response.json();

      setAppointments(prev =>
        prev.map(apt =>
          apt.appointmentId === appointmentId ? updatedAppointment : apt
        )
      );

      setFilteredAppointments(prev =>
        prev.map(apt =>
          apt.appointmentId === appointmentId ? updatedAppointment : apt
        )
      );

      setShowUpdateModal(false);
      setAppointmentToUpdate(null);
      
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Update error:', error);
      throw error;
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    showConfirm({
      type: 'error',
      title: 'Delete Appointment?',
      message: 'Are you sure you want to delete this appointment? The student will be notified. This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setIsLoading(true);

          const response = await fetch(
            `${API_BASE_URL}/counselor/delete/${appointmentId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to delete appointment (Status: ${response.status})`);
          }

          setAppointments(prev => 
            prev.filter(apt => apt.appointmentId !== appointmentId)
          );

          setFilteredAppointments(prev =>
            prev.filter(apt => apt.appointmentId !== appointmentId)
          );

          showSuccess(
            'Appointment Deleted!',
            'The appointment has been cancelled successfully. Student has been notified.',
            4000
          );

          setRefreshTrigger(prev => prev + 1);
        } catch (error) {
          console.error('Error deleting appointment:', error);
          showError(
            'Deletion Failed',
            error.message || 'Unable to delete appointment. Please try again.',
            5000
          );
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const fetchBlockedPeriods = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/counselor/availability/blocks/${guidanceStaffId}`,
        {
          headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
          }
        }
      );

      if (response.ok) {
        const blocks = await response.json();
        setBlockedPeriods(Array.isArray(blocks) ? blocks : []);
      }
    } catch (error) {
      console.error("Error fetching blocked periods:", error);
      setBlockedPeriods([]);
    }
  };

  useEffect(() => {
    window.refreshCalendar = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    
    return () => {
      delete window.refreshCalendar;
    };
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const appointmentList = await getAllCounselorAppointmentByStatus(guidanceStaffId);
        console.log('Fetched appointments:', appointmentList);
        
        const filteredList = Array.isArray(appointmentList) 
          ? appointmentList.filter(apt => {
              const status = apt.status?.toUpperCase().trim();
              return status === 'PENDING' || status === 'SCHEDULED' || status === 'ONGOING';
            })
          : [];
        
        console.log('Filtered appointments (PENDING, SCHEDULED, ONGOING):', filteredList);
        setAppointments(filteredList);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        setAppointments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
    fetchBlockedPeriods();
  }, [JWT_TOKEN, refreshTrigger, guidanceStaffId]);

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

  const handleViewAllAppointments = () => {
    setFilteredAppointments(appointmentsThisMonth);
    setSelectedDate(null);
    setIsBlockedDay(false);
    setBlockReason('');
    setShowSidePanel(true);
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
            onViewAll={handleViewAllAppointments}
            onAvailabilityUpdate={fetchBlockedPeriods}
          />

          <AppointmentSummary
            totalCount={appointmentsThisMonth.length}
            todayCount={appointmentsToday.length}
          />

          <AppointmentSidePanel
            isOpen={showSidePanel}
            onClose={() => setShowSidePanel(false)}
            appointments={filteredAppointments} 
            isLoading={isLoading}
            currentDate={currentDate}
            selectedDate={selectedDate} 
            onAppointmentClick={handleAppointmentClick}
            onDeleteAppointment={handleDeleteAppointment}
            onUpdateAppointment={handleUpdateAppointment}
            isBlockedDay={isBlockedDay}
            blockReason={blockReason}
          />

          <CalendarGrid
            currentDate={currentDate}
            appointments={appointments}
            blockedPeriods={blockedPeriods}
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

      <UpdateAppointmentModal
        isOpen={showUpdateModal}
        isClose={() => {
          setShowUpdateModal(false);
          setAppointmentToUpdate(null);
        }}
        appointment={appointmentToUpdate}
        onSubmit={handleUpdateSubmit}
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