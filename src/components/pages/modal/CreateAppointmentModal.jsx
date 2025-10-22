import "../../../css/CreateAppointmentModal.css";
import { useState } from "react";

const CreateAppointmentModal = ({ isOpen, isClose }) => {
    const [studentNumber, setStudentNumber] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [appointmentType, setAppointmentType] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");

    // ✅ Improved date validation
    const validateDates = (scheduled, end) => {
        if (scheduled && end) {
            const scheduledDateTime = new Date(scheduled);
            const endDateTime = new Date(end);
            const now = new Date();

            if (scheduledDateTime < now) {
                return "Scheduled date cannot be in the past";
            }

            if (endDateTime < now) {
                return "End date cannot be in the past";
            }

            if (scheduledDateTime >= endDateTime) {
                return "Scheduled date must be before end date";
            }

            const sameDay =
                scheduledDateTime.toDateString() === endDateTime.toDateString();
            if (sameDay) {
                const scheduledTime =
                    scheduledDateTime.getHours() * 60 + scheduledDateTime.getMinutes();
                const endTime =
                    endDateTime.getHours() * 60 + endDateTime.getMinutes();

                if (scheduledTime >= endTime) {
                    return "End time must be after start time on the same day";
                }
            }
        }
        return "";
    };

    // ✅ Handle start date change
    const handleScheduledDateChange = (e) => {
        const newScheduledDate = e.target.value;
        setScheduledDate(newScheduledDate);

        if (!endDate) {
            setEndDate(newScheduledDate);
        }

        if (endDate) {
            const validationError = validateDates(newScheduledDate, endDate);
            setError(validationError);
        } else {
            setError("");
        }
    };

    // ✅ Handle end time change
    const handleEndDateChange = (e) => {
        const time = e.target.value;

        if (!scheduledDate) {
            setError("Please set a start date first");
            return;
        }

        const scheduled = new Date(scheduledDate);
        const [hours, minutes] = time.split(":").map(Number);
        const newEndDate = new Date(
            scheduled.getFullYear(),
            scheduled.getMonth(),
            scheduled.getDate(),
            hours,
            minutes
        );

        const localEndDate = new Date(
            newEndDate.getTime() - newEndDate.getTimezoneOffset() * 60000
        )
            .toISOString()
            .slice(0, 16);

        setEndDate(localEndDate);

        const validationError = validateDates(scheduledDate, newEndDate);
        setError(validationError);
    };

    // ✅ Min date/time helpers
    const getMinScheduledDate = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    };

    const getMinEndDate = () => {
        if (!scheduledDate) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return now.toISOString().slice(0, 16);
        }

        const scheduled = new Date(scheduledDate);
        scheduled.setMinutes(scheduled.getMinutes() + 1);
        scheduled.setMinutes(scheduled.getMinutes() - scheduled.getTimezoneOffset());
        return scheduled.toISOString().slice(0, 16);
    };

    // ✅ Send appointment request
    const sendNotification = async () => {
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
        }
    };

    // ✅ Fetch student info by number
    const handleStudentNumberChange = async (e) => {
        const token = localStorage.getItem("jwtToken");
        const studentNumber = e.target.value;
        setStudentNumber(studentNumber);

        if (!studentNumber) {
            setFirstname("");
            setLastname("");
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

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Create Appointment</h2>
                <button onClick={isClose} className="set-appointment-button">
                    ×
                </button>

                {error && <div className="error-messages">{error}</div>}

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

                <label>
                    Start Date:
                    <input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={handleScheduledDateChange}
                        min={getMinScheduledDate()}
                    />
                </label>

                <label>
                    End Time:
                    <input
                        type="time"
                        value={endDate ? endDate.slice(11, 16) : ""}
                        onChange={handleEndDateChange}
                        min={getMinEndDate()}
                    />
                </label>

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
                    disabled={!!error}
                    style={{
                        opacity: error ? 0.6 : 1,
                        cursor: error ? "not-allowed" : "pointer",
                    }}
                >
                    Set Appointment
                </button>
            </div>
        </div>
    );
};

export default CreateAppointmentModal;
