import { ArrowLeft, X } from "lucide-react";
import "../../../css/CreateAppointmentModal.css";
import { useState, useRef, useEffect } from "react";
import { usePopUp } from "../../../helper/message/pop/up/provider/PopUpModalProvider";

const CreateAppointmentModal = ({ isOpen, isClose }) => {
    const [studentNumber, setStudentNumber] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [appointmentType, setAppointmentType] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingStudent, setIsLoadingStudent] = useState(false);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    const startPickerRef = useRef(null);
    const endPickerRef = useRef(null);
    const studentNumberTimeoutRef = useRef(null);
    const { showSuccess } = usePopUp();
    const errorRef = useRef(null); 

    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [error]);


    useEffect(() => {
        return () => {
            if (studentNumberTimeoutRef.current) {
                clearTimeout(studentNumberTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (startPickerRef.current && !startPickerRef.current.contains(event.target)) {
                setShowStartPicker(false);
            }
            if (endPickerRef.current && !endPickerRef.current.contains(event.target)) {
                setShowEndPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchBookedSlots = async (dateStr) => {
        if (!dateStr) {
            setBookedSlots([]);
            return;
        }
        
        const token = localStorage.getItem("jwtToken");
        if (!token) {
            setError("Authentication token not found. Please log in again.");
            return;
        }

        setIsLoadingSlots(true);
        try {
            const date = dateStr.split('T')[0]; 
            const response = await fetch(
                `http://localhost:8080/counselor/booked-slots?date=${date}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const slots = await response.json();
                setBookedSlots(Array.isArray(slots) ? slots : []);
            } else {
                console.error("Failed to fetch booked slots");
                setBookedSlots([]);
            }
        } catch (err) {
            console.error("Error fetching booked slots:", err);
            setBookedSlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const isTimeSlotBooked = (hours, minutes, isEndTime = false) => {
        if (!scheduledDate || bookedSlots.length === 0) return false;

        const selectedDate = new Date(scheduledDate);
        const slotTime = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            hours,
            minutes
        );

        return bookedSlots.some(slot => {
            const bookedStart = new Date(slot.scheduledDate);
            const bookedEnd = new Date(slot.endDate);

            if (isEndTime) {
                const startTime = new Date(scheduledDate);
                return (slotTime > bookedStart && startTime < bookedEnd) || 
                       (startTime < bookedEnd && slotTime > bookedStart);
            }
            return slotTime >= bookedStart && slotTime < bookedEnd;
        });
    };

    const validateDates = (scheduled, end) => {
        if (!scheduled || !end) return "";

        const scheduledDateTime = new Date(scheduled);
        const endDateTime = new Date(end);
        const now = new Date();
        now.setSeconds(0, 0);

        if (scheduledDateTime < now) return "Start time cannot be in the past";
        if (endDateTime <= scheduledDateTime) return "End time must be after start time";

        const startHour = scheduledDateTime.getHours();
        const endHour = endDateTime.getHours();
        const endMinute = endDateTime.getMinutes();

        if (startHour < 8 || startHour >= 17) return "Start time must be between 8:00 AM and 4:59 PM";
        if (endHour > 17 || (endHour === 17 && endMinute > 0)) return "End time must be no later than 5:00 PM";
        if (endHour < 8) return "End time must be after 8:00 AM";

        const hasConflict = bookedSlots.some(slot => {
            const bookedStart = new Date(slot.scheduledDate);
            const bookedEnd = new Date(slot.endDate);
            return scheduledDateTime < bookedEnd && endDateTime > bookedStart;
        });

        if (hasConflict) return "This time slot conflicts with an existing appointment";

        return "";
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${ampm}`;
    };

    const generateTimeSlots = () => {
        const slots = [];
        for (let h = 8; h <= 17; h++) {
            for (let m = 0; m < 60; m += 30) {
                if (h === 17 && m > 0) continue;
                
                const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
                const period = h >= 12 ? "PM" : "AM";
                slots.push({
                    value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
                    label: `${displayHour}:${String(m).padStart(2, "0")} ${period}`,
                    hours: h,
                    minutes: m
                });
            }
        }
        return slots;
    };

    const isWeekend = (dateStr) => {
        const day = new Date(dateStr).getDay();
        return day === 0 || day === 6;
    };

    const handleStartDateChange = async (e) => {
        const dateValue = e.target.value;
        if (!dateValue) {
            setScheduledDate("");
            setEndDate("");
            setBookedSlots([]);
            setError("");
            return;
        }
        
        if (isWeekend(dateValue)) {
            setError("Appointments cannot be scheduled on weekends");
            setScheduledDate("");
            setEndDate("");
            setBookedSlots([]);
            return;
        }

        const [year, month, day] = dateValue.split('-');
        const currentTime = scheduledDate ? new Date(scheduledDate) : new Date();
        const newDate = new Date(year, month - 1, day, currentTime.getHours(), currentTime.getMinutes());
        const localDate = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);

        setScheduledDate(localDate);
        setEndDate("");
        await fetchBookedSlots(localDate);
        setError("");
    };

    const handleStartTimeChange = (hours, minutes) => {
        if (isTimeSlotBooked(hours, minutes)) {
            setError("This time slot is already booked");
            return;
        }

        let newDate;
        if (!scheduledDate) {
            const today = new Date();
            newDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
        } else {
            const date = new Date(scheduledDate);
            newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes);
        }

        const localDate = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        setScheduledDate(localDate);
        setShowStartPicker(false);

        const endTime = new Date(newDate);
        const newEndHour = endTime.getHours() + 1;
        
        if (newEndHour > 17) {
            endTime.setHours(17, 0, 0, 0);
        } else {
            endTime.setHours(newEndHour);
        }

        const localEnd = new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        setEndDate(localEnd);

        const validationError = validateDates(localDate, localEnd);
        setError(validationError);
    };

    const handleEndTimeChange = (hours, minutes) => {
        if (!scheduledDate) {
            setError("Please select start date and time first");
            return;
        }

        if (isTimeSlotBooked(hours, minutes, true)) {
            setError("This time range conflicts with an existing appointment");
            return;
        }

        const startDate = new Date(scheduledDate);
        const endDateTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), hours, minutes);
        const localDate = new Date(endDateTime.getTime() - endDateTime.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);

        setEndDate(localDate);
        setShowEndPicker(false);

        const validationError = validateDates(scheduledDate, localDate);
        setError(validationError);
    };

    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const handleBackButton = () => {
            isClose();
            setStudentNumber("");
            setFirstname("");
            setLastname("");
            setAppointmentType("");
            setScheduledDate("");
            setEndDate("");
            setNotes("");
            setError("");
            setBookedSlots([]);
    }

    const sendNotification = async () => {
        if (isProcessing) return;
        
        setError("");

        if (!studentNumber?.trim()) {
            setError("Please enter a student number");
            return;
        }

        if (!firstname || !lastname) {
            setError("Student information not found. Please verify the student number.");
            return;
        }

        if (!appointmentType) {
            setError("Please select an appointment type");
            return;
        }

        if (!scheduledDate || !endDate) {
            setError("Please select appointment date and time");
            return;
        }

        const validationError = validateDates(scheduledDate, endDate);
        if (validationError) {
            setError(validationError);
            return;
        }

        const token = localStorage.getItem("jwtToken");
        if (!token) {
            setError("Authentication token not found. Please log in again.");
            return;
        }

        const requestData = {
            student: { studentNumber: studentNumber.trim() },
            scheduledDate,
            endDate,
            appointmentType,
            notes: notes.trim(),
        };

        try {
            setIsProcessing(true);
            const response = await fetch(
                "http://localhost:8080/counselor/create-appointment",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(requestData),
                }
            );

          if (!response.ok) {
        let errorText = await response.text();

    if (errorText.includes("STUDENT ALREADY HAS AN APPOINTMENT") ||
        errorText.includes("AppointmentAlreadyExistException")) {
        setError("Student already has a pending or scheduled appointment.");
        return;
    }
    
    setError("Failed to create appointment: " + errorText);
    return;
}


            setStudentNumber("");
            setFirstname("");
            setLastname("");
            setAppointmentType("");
            setScheduledDate("");
            setEndDate("");
            setNotes("");
            setError("");
            setBookedSlots([]);

            showSuccess('Appointment Created Successfully!', 'Please wait for the student\'s response', 3000);
            isClose();
        } catch (err) {
            console.error("Error during appointment creation:", err);
            setError(err.message || "Error creating appointment. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStudentNumberChange = async (e) => {
        const inputValue = e.target.value.trim();
        setStudentNumber(inputValue);

        if (studentNumberTimeoutRef.current) {
            clearTimeout(studentNumberTimeoutRef.current);
        }

        if (!inputValue) {
            setFirstname("");
            setLastname("");
            setError("");
            return;
        }

        studentNumberTimeoutRef.current = setTimeout(async () => {
            const token = localStorage.getItem("jwtToken");
            
            if (!token) {
                setError("Authentication token not found. Please log in again.");
                return;
            }

            setIsLoadingStudent(true);
            try {
                const response = await fetch(
                    `http://localhost:8080/student/findBy/${encodeURIComponent(inputValue)}`,
                    {
                        method: "GET",
                        headers: { 
                            "Content-Type": "application/json", 
                            Authorization: `Bearer ${token}` 
                        },
                    }
                );

                if (!response.ok) {
                    setFirstname("");
                    setLastname("");
                    if (response.status === 404) {
                        setError("Student not found");
                    } else {
                        setError("Error fetching student information");
                    }
                    return;
                }

                const responseText = await response.text();
                const data = responseText ? JSON.parse(responseText) : {};
                
                setFirstname(data.firstname || "");
                setLastname(data.lastName || "");
                setError("");
            } catch (err) {
                console.error("Error fetching student:", err);
                setFirstname("");
                setLastname("");
                setError("Error fetching student information");
            } finally {
                setIsLoadingStudent(false);
            }
        }, 500);
    };

    const handleAppointmentTypeChange = (e) => {
        setAppointmentType(e.target.value);
        if (error === "Please select an appointment type") {
            setError("");
        }
    };

    if (!isOpen) return null;

    const timeSlots = generateTimeSlots();
    const isFormValid = studentNumber?.trim() && firstname && lastname && appointmentType && scheduledDate && endDate && !error;

    return (
        <div className="create-modal-overlay">
            <div className="create-modal-content">
            <button className="back-button" onClick={isClose}> <ArrowLeft size={20}/></button>
                <h2>Create Appointment</h2>
                <button onClick={handleBackButton} className="create-set-appointment-button" aria-label="Close modal">
                    <X size={20} />
                </button>

                {error && <div ref={errorRef} className="create-error-messages" role="alert">{error}</div>}

                <label>
                    Student Number: <span style={{ color: 'red' }}>*</span>
                    <input 
                        type="text" 
                        value={studentNumber} 
                        onChange={handleStudentNumberChange} 
                        placeholder="Enter student number"
                        disabled={isProcessing}
                    />
                    {isLoadingStudent && <span style={{ fontSize: '12px', color: '#666' }}>Loading...</span>}
                </label>

                <label>
                    Firstname:
                    <input type="text" value={firstname} readOnly />
                </label>

                <label>
                    Lastname:
                    <input type="text" value={lastname} readOnly />
                </label>

                <label>
                    Appointment Type: <span style={{ color: 'red' }}>*</span>
                    <select 
                        value={appointmentType} 
                        onChange={handleAppointmentTypeChange}
                        disabled={isProcessing}
                    >
                        <option value="">Select Appointment Type</option>
                        <option value="Counseling">Counseling</option>
                        <option value="Academic Advising">Academic Advising</option>
                        <option value="Career Guidance">Career Guidance</option>
                        <option value="Personal Issue">Personal Issue</option>
                        <option value="Follow-Up">Follow-Up</option>
                    </select>
                </label>

                <div className="date-time-row">
                    <label className="half-width">
                        Start Date: <span style={{ color: 'red' }}>*</span>
                        <input 
                            type="date" 
                            value={scheduledDate ? scheduledDate.split('T')[0] : ''} 
                            onChange={handleStartDateChange} 
                            min={getMinDate()}
                            disabled={isProcessing || isLoadingSlots}
                        />
                    </label>

                    <label className="half-width">
                        Start Time: <span style={{ color: 'red' }}>*</span>
                        <div className="time-picker-wrapper" ref={startPickerRef}>
                            <input 
                                type="text" 
                                value={formatTime(scheduledDate)} 
                                onClick={() => scheduledDate && !isProcessing && setShowStartPicker(!showStartPicker)} 
                                readOnly 
                                placeholder="--:-- --" 
                                className="time-input"
                                disabled={!scheduledDate || isProcessing || isLoadingSlots}
                            />
                            {showStartPicker && scheduledDate && (
                                <div className="time-picker-dropdown">
                                    {isLoadingSlots ? (
                                        <div className="time-slot" style={{ textAlign: 'center', opacity: 0.6 }}>
                                            Loading available slots...
                                        </div>
                                    ) : (
                                        timeSlots.map((slot) => {
                                            const isBooked = isTimeSlotBooked(slot.hours, slot.minutes);
                                            return (
                                                <div 
                                                    key={slot.value} 
                                                    className={`time-slot ${isBooked ? 'time-slot-disabled' : ''}`}
                                                    onClick={() => !isBooked && handleStartTimeChange(slot.hours, slot.minutes)}
                                                    style={{
                                                        opacity: isBooked ? 0.4 : 1,
                                                        cursor: isBooked ? 'not-allowed' : 'pointer',
                                                        backgroundColor: isBooked ? '#f0f0f0' : '',
                                                        textDecoration: isBooked ? 'line-through' : 'none'
                                                    }}
                                                >
                                                    {slot.label} {isBooked && '(Booked)'}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </label>
                </div>

                {scheduledDate && (
                    <label>
                        End Time: <span style={{ color: 'red' }}>*</span>
                        <div className="time-picker-wrapper" ref={endPickerRef}>
                            <input 
                                type="text" 
                                value={formatTime(endDate)} 
                                onClick={() => !isProcessing && setShowEndPicker(!showEndPicker)} 
                                readOnly 
                                placeholder="--:-- --" 
                                className="time-input"
                                disabled={isProcessing}
                            />
                            {showEndPicker && (
                                <div className="time-picker-dropdown">
                                    {timeSlots.map((slot) => {
                                        const isBooked = isTimeSlotBooked(slot.hours, slot.minutes, true);
                                        const startTime = new Date(scheduledDate);
                                        const slotTime = new Date(startTime);
                                        slotTime.setHours(slot.hours, slot.minutes, 0, 0);
                                        const isBefore = slotTime <= startTime;
                                        const isDisabled = isBooked || isBefore;
                                        
                                        return (
                                            <div 
                                                key={slot.value} 
                                                className={`time-slot ${isDisabled ? 'time-slot-disabled' : ''}`}
                                                onClick={() => !isDisabled && handleEndTimeChange(slot.hours, slot.minutes)}
                                                style={{
                                                    opacity: isDisabled ? 0.4 : 1,
                                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                    backgroundColor: isDisabled ? '#f0f0f0' : '',
                                                    textDecoration: isDisabled ? 'line-through' : 'none'
                                                }}
                                            >
                                                {slot.label} {isBooked ? '(Conflict)' : isBefore ? '(Invalid)' : ''}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </label>
                )}

                <label>
                    Notes:
                    <textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)} 
                        placeholder="Additional notes (optional)" 
                        rows="3"
                        disabled={isProcessing}
                        maxLength={500}
                    />
                </label>

               

                    <button 
                        className="set-appointment-button" 
                        onClick={sendNotification} 
                        disabled={!isFormValid || isProcessing || isLoadingStudent} 
                        style={{ 
                            opacity: (!isFormValid || isProcessing || isLoadingStudent) ? 0.6 : 1, 
                            cursor: (!isFormValid || isProcessing || isLoadingStudent) ? "not-allowed" : "pointer"
                        }}
                    >
                        {isProcessing ? "Creating..." : "Set Appointment"}
                                </button>
            </div>

        </div>
    );
};

export default CreateAppointmentModal;