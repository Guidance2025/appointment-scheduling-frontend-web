import "../../../css/CreateAppointmentModal.css";
import { useState, useRef, useEffect } from "react";

const CreateAppointmentModal = ({ isOpen, isClose }) => {
    const [studentNumber, setStudentNumber] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [appointmentType, setAppointmentType] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");
    const [isProssesing, setIsProcessing] = useState(false);
    
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    
    const startPickerRef = useRef(null);
    const endPickerRef = useRef(null);

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

    const validateDates = (scheduled, end) => {
        if (!scheduled || !end) return "";
        
        const scheduledDateTime = new Date(scheduled);
        const endDateTime = new Date(end);
        const now = new Date();
        now.setSeconds(0, 0);

        if (scheduledDateTime < now) {
            return "Start time cannot be in the past";
        }

        if (endDateTime <= scheduledDateTime) {
            return "End time must be after start time";
        }

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
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
                const period = h >= 12 ? 'PM' : 'AM';
                slots.push({
                    value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
                    label: `${displayHour}:${String(m).padStart(2, '0')} ${period}`,
                    hours: h,
                    minutes: m
                });
            }
        }
        return slots;
    };

    const handleStartDateChange = (e) => {
        const dateValue = e.target.value;
        if (!dateValue) return;
        
        const [year, month, day] = dateValue.split('-');
        const currentTime = scheduledDate ? new Date(scheduledDate) : new Date();
        const newDate = new Date(year, month - 1, day, currentTime.getHours(), currentTime.getMinutes());
        const localDate = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
        
        setScheduledDate(localDate);
        
        if (endDate) {
            const validationError = validateDates(localDate, endDate);
            setError(validationError);
        } else {
            setError("");
        }
    };

    const handleStartTimeChange = (hours, minutes) => {
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
        
        if (endDate) {
            const validationError = validateDates(localDate, endDate);
            setError(validationError);
        } else {
            setError("");
        }
    };

    const handleEndTimeChange = (hours, minutes) => {
        if (!scheduledDate) {
            setError("Please select start date and time first");
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

    const sendNotification = async () => {
        if (isProssesing) return;
        
        setError("");

        if (!studentNumber || !scheduledDate || !endDate || !appointmentType) {
            setError("Please fill in all required fields");
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
            student: { studentNumber },
            scheduledDate,
            endDate,
            appointmentType,
            notes,
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

            const responseText = await response.text();
            
            if (!response.ok) {
                throw new Error(
                    `Failed to create appointment: ${response.status} ${response.statusText}`
                );
            }

            if (responseText.includes("Student already have an appointment")) {
                setError("Student already has a pending or scheduled appointment.");
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

            alert("Appointment created successfully!");
            isClose();
        } catch (err) {
            console.error("Error during appointment creation:", err);
            if (err.name === "TypeError" && err.message.includes("Failed to fetch")) {
                setError("Network error: Could not connect to server. Is the backend running?");
            } else {
                setError("Error creating appointment: " + err.message);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleStudentNumberChange = async (e) => {
        const token = localStorage.getItem("jwtToken");
        const studentNumber = e.target.value;
        setStudentNumber(studentNumber);

        if (!studentNumber) {
            setFirstname("");
            setLastname("");
            setError("");
            return;
        }

        if (!token) {
            setError("Authentication token not found. Please log in again.");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:8080/student/findBy/${studentNumber}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const responseText = await response.text();
            
            if (!response.ok) {
                setFirstname("");
                setLastname("");
                setError("Student not found");
                return;
            }

            const data = responseText ? JSON.parse(responseText) : {};
            setFirstname(data.firstname || "");
            setLastname(data.lastName || "");
            setError("");
        } catch (err) {
            console.error("Error fetching student:", err);
            setFirstname("");
            setLastname("");
            setError("Error fetching student information");
        }
    };

    if (!isOpen) return null;

    const timeSlots = generateTimeSlots();

    return (
        <div className="create-modal-overlay">
            <div className="create-modal-content">
                <h2>Create Appointment</h2>
                <button onClick={isClose} className="create-set-appointment-button" aria-label="Close">
                    x
                </button>

                {error && <div className="create-error-messages">{error}</div>}

                <label>
                    Student Number:
                    <input
                        type="text"
                        value={studentNumber}
                        onChange={handleStudentNumberChange}
                        placeholder="Enter student number"
                    />
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
                    Appointment Type:
                    <select
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value)}
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
                        Start Date:
                        <input
                            type="date"
                            value={scheduledDate ? scheduledDate.split('T')[0] : ''}
                            onChange={handleStartDateChange}
                            min={getMinDate()}
                        />
                    </label>

                    <label className="half-width">
                        Start Time:
                        <div className="time-picker-wrapper" ref={startPickerRef}>
                            <input
                                type="text"
                                value={formatTime(scheduledDate)}
                                onClick={() => setShowStartPicker(!showStartPicker)}
                                readOnly
                                placeholder="--:-- --"
                                className="time-input"
                            />
                            {showStartPicker && (
                                <div className="time-picker-dropdown">
                                    {timeSlots.map((slot) => (
                                        <div
                                            key={slot.value}
                                            className="time-slot"
                                            onClick={() => handleStartTimeChange(slot.hours, slot.minutes)}
                                        >
                                            {slot.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </label>
                </div>

                {scheduledDate && (
                    <label>
                        End Time:
                        <div className="time-picker-wrapper" ref={endPickerRef}>
                            <input
                                type="text"
                                value={formatTime(endDate)}
                                onClick={() => setShowEndPicker(!showEndPicker)}
                                readOnly
                                placeholder="--:-- --"
                                className="time-input"
                            />
                            {showEndPicker && (
                                <div className="time-picker-dropdown">
                                    {timeSlots.map((slot) => (
                                        <div
                                            key={slot.value}
                                            className="time-slot"
                                            onClick={() => handleEndTimeChange(slot.hours, slot.minutes)}
                                        >
                                            {slot.label}
                                        </div>
                                    ))}
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
                    />
                </label>

                <button
                    className="set-appointment-button"
                    onClick={sendNotification}
                    disabled={!!error || isProssesing}
                    style={{
                        opacity: error || isProssesing ? 0.6 : 1,
                        cursor: error || isProssesing ? "not-allowed" : "pointer",
                    }}
                >
                    {isProssesing ? "Sending..." : "Set Appointment"}
                </button>
            </div>
        </div>
    );
};

export default CreateAppointmentModal;