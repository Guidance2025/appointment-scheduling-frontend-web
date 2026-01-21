import { ArrowLeft, X, ChevronUp, ChevronDown, Calendar } from "lucide-react";
import "../../../css/CreateAppointmentModal.css";
import { useState, useRef, useEffect } from "react";
import { usePopUp } from "../../../helper/message/pop/up/provider/PopUpModalProvider";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as PHTimeUtils from '../../../utils/dateTime';

const CreateAppointmentModal = ({ isOpen, isClose }) => {
  const [studentNumber, setStudentNumber] = useState("CT");
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
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
  const [fullyBlockedDates, setFullyBlockedDates] = useState([]);

  const [startPickerValue, setStartPickerValue] = useState({ hour: "8", minute: "00", period: "AM" });
  const [endPickerValue, setEndPickerValue] = useState({ hour: "9", minute: "00", period: "AM" });

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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (scheduledDate) {
      const date = new Date(scheduledDate);
      let h = date.getHours();
      const m = date.getMinutes();
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      setStartPickerValue({ hour: String(displayHour), minute: String(m).padStart(2, "0"), period });
    }
  }, [scheduledDate]);

  useEffect(() => {
    if (endDate) {
      const date = new Date(endDate);
      let h = date.getHours();
      const m = date.getMinutes();
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
      setEndPickerValue({ hour: String(displayHour), minute: String(m).padStart(2, "0"), period });
    }
  }, [endDate]);

  useEffect(() => {
    if (isOpen) {
      fetchAllBlockedDates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scheduledDate && endDate) {
      const validationError = validateDates(scheduledDate, endDate);
      setError(validationError);
    }
  }, [scheduledDate, endDate, bookedSlots]);

  const fetchAllBlockedDates = async () => {
    const token = localStorage.getItem("jwtToken");
    const guidanceStaffId = localStorage.getItem("guidanceStaffId");
    
    if (!token || !guidanceStaffId) {
      console.error("Missing token or guidanceStaffId");
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/counselor/availability/blocks/${guidanceStaffId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch blocked dates", response.status);
        return;
      }

      const blocks = await response.json();
      
      const fullDayBlocks = blocks.filter(block => {
        const hasNullEnd = !block.endDate || block.endDate === null || block.endDate === "";
        return hasNullEnd;
      });
      
      const fullyBlocked = fullDayBlocks
        .map(block => {
          const dateStr = block.scheduledDate;
          if (!dateStr) return null;
          
          const phDate = PHTimeUtils.parseUTCToPH(dateStr);
          if (!phDate) return null;
          
          return {
            year: phDate.getFullYear(),
            month: phDate.getMonth(),
            day: phDate.getDate()
          };
        })
        .filter(date => date !== null);

      setFullyBlockedDates(fullyBlocked);
    } catch (err) {
      console.error("Error fetching blocked dates:", err);
    }
  };

  const fetchBookedSlots = async (date) => {
    setBookedSlots([]);
    if (!date) return;

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    setIsLoadingSlots(true);
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateParam = `${year}-${month}-${day}`;

      const res = await fetch(`http://localhost:8080/counselor/booked-slots?date=${encodeURIComponent(dateParam)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch booked slots:", res.status);
        setBookedSlots([]);
        return;
      }

      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
      setBookedSlots(arr);
    } catch (err) {
      console.error("Error fetching booked slots:", err);
      setBookedSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const isFullDayBlocked = () => {
    if (!selectedDate || bookedSlots.length === 0) return false;
    
    return bookedSlots.some((slot) => {
      const bookedStart = slot.scheduledDate ? new Date(slot.scheduledDate) : null;
      const bookedEnd = slot.endDate;
      
      if (!bookedStart) return false;
      
      const isSameDay = bookedStart.getFullYear() === selectedDate.getFullYear() &&
                        bookedStart.getMonth() === selectedDate.getMonth() &&
                        bookedStart.getDate() === selectedDate.getDate();
      
      return isSameDay && bookedEnd === null;
    });
  };

  const isTimeSlotBooked = (hours, minutes, isEndTime = false) => {
    if (!scheduledDate || bookedSlots.length === 0) return false;

    const selectedPH = PHTimeUtils.parseUTCToPH(scheduledDate);
    if (!selectedPH) return false;

    const slotPH = new Date(
      selectedPH.getFullYear(),
      selectedPH.getMonth(),
      selectedPH.getDate(),
      hours,
      minutes,
      0,
      0
    );

    return bookedSlots.some((slot) => {
      const bs = PHTimeUtils.parseUTCToPH(slot.scheduledDate);
      const be = slot.endDate ? PHTimeUtils.parseUTCToPH(slot.endDate) : null;

      if (!bs) return false;
      if (!be) return true; 

      return slotPH >= bs && slotPH < be;
    });
  };

  const doesRangeConflict = (startISO, endISO) => {
    if (!startISO || !endISO || bookedSlots.length === 0) return false;
    const start = new Date(startISO);
    const end = new Date(endISO);
    return bookedSlots.some((slot) => {
      const bs = slot.scheduledDate ? new Date(slot.scheduledDate) : null;
      const be = slot.endDate ? new Date(slot.endDate) : null;
      if (!bs) return false;
      if (!be) return true;
      return start < be && end > bs;
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

    const durationMinutes = (endDateTime - scheduledDateTime) / (1000 * 60);
    if (durationMinutes > 60) return "Appointment duration cannot exceed 1 hour";

    const startHour = scheduledDateTime.getHours();
    const endHour = endDateTime.getHours();
    const endMinute = endDateTime.getMinutes();

    if (startHour < 8 || startHour >= 17) return "Start time must be between 8:00 AM and 4:59 PM";
    if (endHour > 17 || (endHour === 17 && endMinute > 0)) return "End time must be no later than 5:00 PM";
    if (endHour < 8) return "End time must be after 8:00 AM";

    const hasConflict = doesRangeConflict(scheduled, end);
    if (hasConflict) return "This time slot conflicts with an existing appointment or availability block";

    return "";
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const filterAvailableDates = (date) => {
    if (isWeekend(date)) {
      return false;
    }
    
    const year = date.getFullYear(); 
    const month = date.getMonth();
    const day = date.getDate();
    
    const isBlocked = fullyBlockedDates.some(blockedDate => {
      return year === blockedDate.year && 
             month === blockedDate.month && 
             day === blockedDate.day;
    });
    
    return !isBlocked;
  };

  const handleDateChange = async (date) => {
    if (!date) {
      setSelectedDate(null);
      setScheduledDate("");
      setEndDate("");
      setBookedSlots([]);
      setError("");
      return;
    }

    setSelectedDate(date);
    setError("");

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    const startDate = new Date(year, month - 1, day, 8, 0);
    const localStartDate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    const endDateObj = new Date(year, month - 1, day, 9, 0);
    const localEndDate = new Date(endDateObj.getTime() - endDateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setScheduledDate(localStartDate);
    setEndDate(localEndDate);
    
    await fetchBookedSlots(date);
  };

  const convertTo24Hour = (hour, period) => {
    let h24 = parseInt(hour, 10);
    if (period === "PM" && h24 !== 12) h24 += 12;
    if (period === "AM" && h24 === 12) h24 = 0;
    return h24;
  };

  const handleBackButton = () => {
    isClose();
    setStudentNumber("CT");
    setFirstname("");
    setLastname("");
    setAppointmentType("");
    setSelectedDate(null);
    setScheduledDate("");
    setEndDate("");
    setNotes("");
    setError("");
    setBookedSlots([]);
  };

  const sendNotification = async () => {
    if (isProcessing) return;
    
    if (!studentNumber?.trim() || studentNumber === "CT") {
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

    if (isFullDayBlocked()) {
      setError("This entire day is blocked. Please select another date.");
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

    setIsProcessing(true);
    try {
      const res = await fetch("http://localhost:8080/counselor/create-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (typeof window.refreshCalendar === "function") {
        window.refreshCalendar();
      }
      
      if (res.ok) {
        setStudentNumber("CT");
        setFirstname("");
        setLastname("");
        setAppointmentType("");
        setSelectedDate(null);
        setScheduledDate("");
        setEndDate("");
        setNotes("");
        setBookedSlots([]);
        setError("");
    
        showSuccess("Appointment Created Successfully!", "Please wait for the student's response", 3000);
        isClose();
        return;
      }

      const contentType = res.headers.get("content-type") || "";
      let errMessage = `Failed to create appointment (status ${res.status})`;
      if (contentType.includes("application/json")) {
        const j = await res.json();
        errMessage = j?.message || j?.error || JSON.stringify(j);
      } else {
        const txt = await res.text();
        errMessage = txt || errMessage;
      }
      if (/Student already has an appointment|AppointmentAlreadyExistException|STUDENT ALREADY HAS AN APPOINTMENT/i.test(errMessage)) {
        setError("Student already has a pending or scheduled appointment.");
      } else if (/Counselor not available|not available for time|blocked/i.test(errMessage)) {
        setError("Selected time is not available. Please choose another time.");
      } else if (/DEVICE TOKEN DOES NOT EXIST/i.test(errMessage)) {
        setError("Appointment created, but failed to send notification to the student. App not yet installed or logged in.");
      } else if (/YOU ALREADY HAVE AN APPOINTMENT WITH THIS COUNSELOR FOR THIS DAY/i.test(errMessage)) {
        setError("Already have an appointment with this counselor for this day. Maximum of one appointment per day.");
      } else if (res.status === 400) {
        setError(errMessage || "Bad request. Please check the data and try again.");
      } else if (res.status === 401 || res.status === 403) {
        setError("You are not authorized. Please log in again.");
      } else {
        setError(errMessage);
      }
    } catch (err) {
      console.error("Error during appointment creation:", err);
      setError(err.message || "Error creating appointment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStudentNumberChange = async (e) => {
    let inputValue = e.target.value.toUpperCase();
    
    if (!inputValue.startsWith('CT')) {
      inputValue = 'CT' + inputValue;
    }
    
    if (inputValue.length > 2) {
      const afterCT = inputValue.slice(2).replace(/[^0-9-]/g, '');
      inputValue = 'CT' + afterCT;
    }
    
    setStudentNumber(inputValue);

    if (studentNumberTimeoutRef.current) {
      clearTimeout(studentNumberTimeoutRef.current);
    }

    if (inputValue === 'CT' || inputValue.length <= 2) {
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
        const res = await fetch(`http://localhost:8080/student/findBy/${encodeURIComponent(inputValue)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setFirstname("");
          setLastname("");
          setError(res.status === 404 ? "Student not found" : "Network Problem. Please Check you internet connection");
          return;
        }

        const txt = await res.text();
        const data = txt ? JSON.parse(txt) : {};
        setFirstname(data.firstname || data.firstName || "");
        setLastname(data.lastName || data.lastname || data.last_name || "");
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
    if (error === "Please select an appointment type") setError("");
  };

  const updateActualTime = (pickerValue, isStartTime) => {
    const h24 = convertTo24Hour(pickerValue.hour, pickerValue.period);
    const minutes = parseInt(pickerValue.minute, 10);
    
    let baseDate;
    if (isStartTime) {
      baseDate = selectedDate || new Date();
    } else {
      baseDate = scheduledDate ? new Date(scheduledDate) : new Date();
    }
    
    const newDate = new Date(
      baseDate.getFullYear(), 
      baseDate.getMonth(), 
      baseDate.getDate(), 
      h24, 
      minutes
    );
    const localDate = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    if (isStartTime) {
      setScheduledDate(localDate);
      
      const endTime = new Date(newDate);
      const newEndHour = endTime.getHours() + 1;
      if (newEndHour > 17) {
        endTime.setHours(17, 0, 0, 0);
      } else {
        endTime.setHours(newEndHour, 0, 0, 0);
      }
      const localEnd = new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setEndDate(localEnd);
      
    } else {
      setEndDate(localDate);
    }
  };

  const IOSTimePicker = ({ value, onChange, isStart }) => {
    const hourOptions = ["8", "9", "10", "11", "12", "1", "2", "3", "4", "5"];
    const minuteOptions = ["00", "15","20","30", "45","50"];

    const incrementValue = (type) => {
      const newValue = { ...value };
      if (type === "hour") {
        const currentIndex = hourOptions.indexOf(value.hour);
        newValue.hour = hourOptions[(currentIndex + 1) % hourOptions.length];
      } else if (type === "minute") {
        const currentIndex = minuteOptions.indexOf(value.minute);
        newValue.minute = minuteOptions[(currentIndex + 1) % minuteOptions.length];
      } else if (type === "period") {
        newValue.period = value.period === "AM" ? "PM" : "AM";
      }
      onChange(newValue);
      updateActualTime(newValue, isStart);
    };

    const decrementValue = (type) => {
      const newValue = { ...value };
      if (type === "hour") {
        const currentIndex = hourOptions.indexOf(value.hour);
        newValue.hour = hourOptions[(currentIndex - 1 + hourOptions.length) % hourOptions.length];
      } else if (type === "minute") {
        const currentIndex = minuteOptions.indexOf(value.minute);
        newValue.minute = minuteOptions[(currentIndex - 1 + minuteOptions.length) % minuteOptions.length];
      } else if (type === "period") {
        newValue.period = value.period === "AM" ? "PM" : "AM";
      }
      onChange(newValue);
      updateActualTime(newValue, isStart);
    };

    const fullDayBlocked = isFullDayBlocked();
    const blockedRanges = bookedSlots
      .filter((s) => s.scheduledDate)
      .map((s) => {
        const startPH = PHTimeUtils.parseUTCToPH(s.scheduledDate);
        const endPH = s.endDate ? PHTimeUtils.parseUTCToPH(s.endDate) : null;

        if (!startPH) return null;

        if (!endPH) {
          return "8:00 AM - 5:00 PM (Full Day)";
        }

        return `${PHTimeUtils.formatTimePH(startPH)} - ${PHTimeUtils.formatTimePH(endPH)}`;
      })
      .filter(Boolean);

    return (
      <div className="create-ios-time-picker">
        {fullDayBlocked && (
          <div className="create-full-day-blocked-warning">
            This entire day is blocked (8:00 AM - 5:00 PM)
          </div>
        )}
        
        <div className="create-ios-picker-columns">
          <div className="create-ios-picker-column">
            <button 
              className="create-ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); incrementValue("hour"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronUp size={20} />
            </button>
            <div className="create-ios-picker-value">{value.hour}</div>
            <button 
              className="create-ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); decrementValue("hour"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="create-ios-picker-separator">:</div>

          <div className="create-ios-picker-column">
            <button 
              className="create-ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); incrementValue("minute"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronUp size={20} />
            </button>
            <div className="create-ios-picker-value">{value.minute}</div>
            <button 
              className="create-ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); decrementValue("minute"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronDown size={20} />
            </button>
          </div>

          <div className="create-ios-picker-column">
            <button 
              className="create-ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); incrementValue("period"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronUp size={20} />
            </button>
            <div className="create-ios-picker-value">{value.period}</div>
            <button 
              className="create-ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); decrementValue("period"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </div>

        {blockedRanges.length > 0 && (
          <div className="create-blocked-times-info">
            <div className="create-blocked-times-label">Blocked times this day</div>
            {blockedRanges.map((r, i) => (
              <div key={i} className="create-blocked-time-item">{r}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const isFormValid = studentNumber?.trim() && 
                      studentNumber !== "CT" && 
                      firstname && 
                      lastname && 
                      appointmentType && 
                      scheduledDate && 
                      endDate && 
                      !error && 
                      !isFullDayBlocked();

  return (
    <div className="create-modal-overlay">
      <div className="create-modal-content">
        <h2>Create Appointment</h2>
        <button onClick={handleBackButton} className="create-set-appointment-button" aria-label="Close modal">
          <X size={20} />
        </button>

        {error && (
          <div ref={errorRef} className="create-error-messages" role="alert" aria-live="assertive">
            {error}
          </div>
        )}

        <label>
          Student Number: <span style={{ color: "red" }}>*</span>
          <input
            type="text"
            value={studentNumber}
            onChange={handleStudentNumberChange}
            placeholder="CT-XX-XXXX"
            disabled={isProcessing}
            className={error && error.includes("student number") ? "error" : ""}
            aria-required="true"
            aria-invalid={error && error.includes("student number") ? "true" : "false"}
          />
          {isLoadingStudent && <span style={{ fontSize: "12px", color: "#666" }}>Loading...</span>}
        </label>

        <label>
          Firstname:
          <input 
            type="text" 
            value={firstname} 
            readOnly 
            className={error && error.includes("Student information") ? "error" : ""} 
            aria-readonly="true"
          />
        </label>

        <label>
          Lastname:
          <input 
            type="text" 
            value={lastname} 
            readOnly 
            className={error && error.includes("Student information") ? "error" : ""} 
            aria-readonly="true"
          />
        </label>

        <label>
          Appointment Type: <span style={{ color: "red" }}>*</span>
          <select 
            value={appointmentType} 
            onChange={handleAppointmentTypeChange} 
            disabled={isProcessing} 
            className={error && error.includes("appointment type") ? "error" : ""}
            aria-required="true"
            aria-invalid={error && error.includes("appointment type") ? "true" : "false"}
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
          Start Date: <span style={{ color: "red" }}>*</span>
          <div className="date-picker-wrapper">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              minDate={new Date()}
              filterDate={filterAvailableDates}
              dateFormat="MM/dd/yyyy"
              placeholderText="Select date"
              disabled={isProcessing || isLoadingSlots}
              onChangeRaw={(e) => e.preventDefault()}  
              className={`date-picker-input ${error && error.includes("date") ? "error" : ""}`}
              calendarClassName="custom-calendar"
              dayClassName={(date) => {
                if (isWeekend(date)) return "weekend-day";
                
                const year = date.getFullYear();
                const month = date.getMonth();
                const day = date.getDate();
                
                const isBlocked = fullyBlockedDates.some(blockedDate => {
                  return year === blockedDate.year && 
                         month === blockedDate.month && 
                         day === blockedDate.day;
                });
                
                return isBlocked ? "blocked-day" : undefined;
              }}
              aria-required="true"
              aria-invalid={error && error.includes("date") ? "true" : "false"}
            />
            <Calendar className="calendar-icon" size={18} />
          </div>
          {isLoadingSlots && (
            <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>
              Loading availability...
            </div>
          )}
        </label>

        {scheduledDate && (
          <label>
            Start Time: <span style={{ color: "red" }}>*</span>
            <div className={`create-time-picker-wrapper ${showStartPicker ? 'picker-open' : ''}`} ref={startPickerRef}>
              <input
                type="text"
                value={formatTime(scheduledDate)}
                onClick={() => scheduledDate && !isProcessing && !isLoadingSlots && setShowStartPicker(!showStartPicker)}
                readOnly
                placeholder="--:-- --"
                className={error && (error.includes("time") || error.includes("past") || error.includes("booked") || error.includes("conflicts")) ? "time-input error" : "time-input"}
                disabled={!scheduledDate || isProcessing || isLoadingSlots}
                aria-required="true"
                aria-invalid={error && error.includes("time") ? "true" : "false"}
              />
              {showStartPicker && scheduledDate && (
                <div className="create-time-picker-dropdown">
                  {isLoadingSlots ? (
                    <div style={{ textAlign: "center", padding: "20px", opacity: 0.6 }}>Loading available slots...</div>
                  ) : (
                    <IOSTimePicker value={startPickerValue} onChange={setStartPickerValue} isStart={true} />
                  )}
                </div>
              )}
            </div>
          </label>
        )}

        {scheduledDate && (
          <label>
            End Time: <span style={{ color: "red" }}>*</span>
            <div className={`create-time-picker-wrapper ${showEndPicker ? 'picker-open' : ''}`} ref={endPickerRef}>
              <input
                type="text"
                value={formatTime(endDate)}
                onClick={() => !isProcessing && !isLoadingSlots && setShowEndPicker(!showEndPicker)}
                readOnly
                placeholder="--:-- --"
                className={error && (error.includes("End time") || error.includes("after") || error.includes("conflicts")) ? "time-input error" : "time-input"}
                disabled={isProcessing || isLoadingSlots}
                aria-required="true"
                aria-invalid={error && error.includes("End time") ? "true" : "false"}
              />
              {showEndPicker && (
                <div className="create-time-picker-dropdown">
                  {isLoadingSlots ? (
                    <div style={{ textAlign: "center", padding: "20px", opacity: 0.6 }}>Loading available slots...</div>
                  ) : (
                    <IOSTimePicker value={endPickerValue} onChange={setEndPickerValue} isStart={false} />
                  )}
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
            aria-label="Additional notes (optional)"
          />
        </label>

        <div className="create-modal-actions">
          <button
            type="button"
            onClick={handleBackButton}
            className="button button-secondary"
            disabled={isProcessing || isLoadingStudent}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={sendNotification}
            disabled={!isFormValid || isProcessing || isLoadingStudent}
            aria-label={isProcessing ? "Creating appointment" : "Set appointment"}
          >
            {isProcessing ? "Creating..." : "Set Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAppointmentModal;