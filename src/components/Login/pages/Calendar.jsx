import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import '../../../css/Calendar.css';
import '../../../css/GoogleCalendar.css'; 
import CreateAppointmentModal from './modal/CreateAppointmentModal';
import AppointmentsModal from './modal/AppointmentsModal';


function Calendar() {
    const [appointments, setAppointments] = useState([]);7
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('SCHEDULED');
    const [showModal,setShowModal] = useState(false);
    const [selectedAppointmentId , setIsSelectedAppointmentId ] = useState(null);
    const [isDetailsVisible, setIsDetailsVisible ] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);


    const URL_APPOINTMENTS = `http://localhost:8080/counselor/appointment/${status}`;
    const jwtToken = localStorage.getItem("jwtToken");

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const formatAppointmentDateTime = (scheduledDate, endDate) => {
        if (!scheduledDate) return { date: "N/A", timeRange: "N/A" };

        const startDate = new Date(scheduledDate);
        const actualEndDate = endDate ? new Date(endDate) : null;

        const formattedDate = startDate.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

        const startTime = startDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        if (!actualEndDate) {
            return { date: formattedDate, timeRange: startTime };
        }

        const endTime = actualEndDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        return { date: formattedDate, timeRange: `${startTime} - ${endTime}` };
    };

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clickedDate);
        
        const selectedAppointments = appointments.filter(appointment => {
            if (!appointment.scheduledDate) return false;
            const appointmentDate = new Date(appointment.scheduledDate);
            return (
                appointmentDate.getDate() === clickedDate.getDate() &&
                appointmentDate.getMonth() === clickedDate.getMonth() &&
                appointmentDate.getFullYear() === clickedDate.getFullYear()
            );
        });

    };

    const isToday = (day) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear()
        );
    };

    const isSelected = (day) => {
        if (!selectedDate) return false;
        return (
            day === selectedDate.getDate() &&
            currentDate.getMonth() === selectedDate.getMonth() &&
            currentDate.getFullYear() === selectedDate.getFullYear()
        );
    };

    const getAppointmentsForDay = (day) => {
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        return appointments.filter(appointment => {
            if (!appointment.scheduledDate) return false;
            const appointmentDate = new Date(appointment.scheduledDate);
            return (
                appointmentDate.getDate() === dayDate.getDate() &&
                appointmentDate.getMonth() === dayDate.getMonth() &&
                appointmentDate.getFullYear() === dayDate.getFullYear()
            );
        });
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(
                <div key={`empty-${i}`} className="calendar-day empty"></div>
            );
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayAppointments = getAppointmentsForDay(day);
            
            const dayClasses = [
                'calendar-day',
                isToday(day) ? 'today' : '',
                isSelected(day) ? 'selected' : '',
                dayAppointments.length > 0 ? 'has-appointments' : ''
            ].filter(Boolean).join(' ');

            days.push(
                <div
                    key={day}
                    className={dayClasses}
                    onClick={() => handleDateClick(day)}
                >
                    <div className="day-header">
                        <span className="day-number">{day}</span>
                    </div>
                    <div className="day-appointments">
                        {dayAppointments.slice(0, 3).map((appointment, index) => {
                            const { timeRange } = formatAppointmentDateTime(appointment.scheduledDate, appointment.endDate);
                            const appointmentTypeClass = appointment.appointmentType?.toLowerCase() || 'default';
                            
                            return (
                                <div 
                                    key={index} 
                                    className={`appointment-indicator ${appointmentTypeClass}`}
                                    title={`${timeRange} - ${appointment.student?.firstName} ${appointment.student?.lastName}`}
                                >
                                    <span className="appointment-time">{timeRange.split(' - ')[0]}</span>
                                    <span className="appointment-title">
                                        {appointment.student?.firstName} {appointment.student?.lastName}
                                    </span>
                                </div>
                            );
                        })}
                        {dayAppointments.length > 3 && (
                            <div className="more-appointments">
                                +{dayAppointments.length - 3} more
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return days;
    };

    const getFilteredAppointments = () => {
        if (!selectedDate) return appointments;
        
        return appointments.filter(appointment => {
            if (!appointment.scheduledDate) return false;
            const appointmentDate = new Date(appointment.scheduledDate);
            return (
                appointmentDate.getDate() === selectedDate.getDate() &&
                appointmentDate.getMonth() === selectedDate.getMonth() &&
                appointmentDate.getFullYear() === selectedDate.getFullYear()
            );
        });
    };
        const handlesModalClick = (appointmentId) => {
                    setIsSelectedAppointmentId(appointmentId);
                    setIsDetailsVisible(true);
        }

        

    useEffect(() => {
        const fetchAppointmentByStatusScheduled = async () => {
            setIsLoading(true);
            try {
                if (!jwtToken) {
                    window.location.href = "/GuidanceLogin";
                    return;
                }

                const response = await fetch(URL_APPOINTMENTS, {
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + jwtToken,
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('API Response:', data);

                setAppointments(Array.isArray(data) ? data : []);
                setIsLoading(false);
            } catch (error) {
                setIsLoading(false);
                setAppointments([]);
            }
        };
        fetchAppointmentByStatusScheduled(status);
    }, [jwtToken, status, URL_APPOINTMENTS]);

    return (
        <>
            <div className="page-container">
                {/* <h2 className="page-title">Calendar</h2> */}
                
                <div className="calendar-container">
                    <div className="google-calendar-wrapper">
                        <div className="calendar-header">
                            <div className="calendar-nav">
                                <button 
                                    className="nav-button" 
                                    onClick={() => navigateMonth(-1)}
                                    aria-label="Previous month"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                
                                <div className="current-month">
                                    {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </div>
                                
                                <button 
                                    className="nav-button" 
                                    onClick={() => navigateMonth(1)}
                                    aria-label="Next month"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>

                            <div className="calendar-actions">
                                <button className="today-button" onClick={() => {
                                    setCurrentDate(new Date());
                                    setSelectedDate(new Date());
                                }}>
                                    Today
                                </button>
                                <button className="create-button" onClick={() => setShowModal(true)} >
                                    <Plus size={16} />
                                    Create
                                </button>
                                    <CreateAppointmentModal isOpen={showModal} isClose={() => setShowModal(false)}  />
                            </div>
                        </div>

                        <div className="calendar-weekdays">
                            {daysOfWeek.map(day => (
                                <div key={day} className="weekday-header">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="calendar-grid">
                            {renderCalendarDays()}
                        </div>
                    </div>
                </div>
                <div className="bottom-container"> 
                    
                    <AppointmentsModal isOpen={isDetailsVisible} isClose={() => setIsDetailsVisible(false)} appointmentId={selectedAppointmentId}  />
                    <div className="appointment-filter-info">
                        {selectedDate ? (
                            <p>Showing appointments for {selectedDate.toLocaleDateString()}</p>
                        ) : (
                            <p>Showing all scheduled appointments</p>
                        )}
                    </div>
                    {isLoading ? (
                        <div className="loading-container">
                            <p>Loading appointments...</p>
                        </div>
                    ) : (() => {
                        const displayAppointments = getFilteredAppointments();
                        return displayAppointments.length > 0 ? (
                            displayAppointments.map((appointment) => {
                                const { date, timeRange } = formatAppointmentDateTime(
                                    appointment.scheduledDate,
                                    appointment.endDate
                                );

                                return (
                                    <div 
                                        className="section-container"
                                        key={appointment.appointmentId}
                                        onClick={ () => handlesModalClick(appointment.appointmentId)}  
                                    >
                                        <div className="calendar-appointment-header">
                                            <h2 className="calendar-appointment-date">{date}</h2>
                                            <h3 className="calendar-appointment-time">{timeRange}</h3>
                                        </div>
                                        <div className="calendar-appointment-appointment-info">
                                            <h2 className="calendar-appointment-appointment-details">
                                                {appointment.student ? 
                                                    `${appointment.student.firstName} ${appointment.student.lastName}` : 
                                                    'Student info unavailable'
                                                }
                                            </h2>
                                            <h2 className={`calendar-appointment-appointment-type ${appointment.appointmentType?.toLowerCase() || ''}`}>
                                                {appointment.appointmentType}
                                            </h2>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="no-appointments">
                                <p>
                                    {selectedDate 
                                        ? `No appointments found for ${selectedDate.toLocaleDateString()}`
                                        : `No appointments found for status: ${status}`
                                    }
                                </p>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </>
    );
}

export default Calendar;