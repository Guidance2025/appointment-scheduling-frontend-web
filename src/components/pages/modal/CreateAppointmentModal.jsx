import { ArrowLeft, X, ChevronUp, ChevronDown } from "lucide-react";
import "../../../css/CreateAppointmentModal.css";
import "../../../css/button/button.css";
import { useState, useRef, useEffect } from "react";
import { usePopUp } from "../../../helper/message/pop/up/provider/PopUpModalProvider";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as PHTimeUtils from '../../../utils/dateTime';
import { API_BASE_URL } from "../../../../constants/api";

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
  const [timeError, setTimeError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingStudent, setIsLoadingStudent] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [fullyBlockedDates, setFullyBlockedDates] = useState([]);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Autocomplete states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  const [startPickerValue, setStartPickerValue] = useState({ hour: "9", minute: "00", period: "AM" });
  const [endPickerValue, setEndPickerValue] = useState({ hour: "10", minute: "00", period: "AM" });

  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);
  const datePickerRef = useRef(null);
  const studentNumberTimeoutRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const { showSuccess } = usePopUp();
  const errorRef = useRef(null);
  const timeErrorRef = useRef(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [error]);

  useEffect(() => {
    if (timeError && timeErrorRef.current) {
      timeErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [timeError]);

  useEffect(() => {
    return () => {
      if (studentNumberTimeoutRef.current) {
        clearTimeout(studentNumberTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
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
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowAutocomplete(false);
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
      setTimeError(validationError);
    }
  }, [scheduledDate, endDate, bookedSlots]);

  useEffect(() => {
    if (isDatePickerOpen) {
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, [isDatePickerOpen]);

  // Autocomplete search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowAutocomplete(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        setIsSearching(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/student/search/${encodeURIComponent(searchQuery)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSearchResults(data || []);
          setShowAutocomplete(data && data.length > 0);
        } else {
          setSearchResults([]);
          setShowAutocomplete(false);
        }
      } catch (err) {
        console.error("Error searching students:", err);
        setSearchResults([]);
        setShowAutocomplete(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, [searchQuery]);

  const fetchAllBlockedDates = async () => {
    const token = localStorage.getItem("jwtToken");
    const guidanceStaffId = localStorage.getItem("guidanceStaffId");
    
    if (!token || !guidanceStaffId) {
      console.error("Missing token or guidanceStaffId");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/counselor/availability/blocks/${guidanceStaffId}`, {
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

      const res = await fetch(`${API_BASE_URL}/counselor/booked-slots?date=${encodeURIComponent(dateParam)}`, {
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

  const isTimeRelatedError = (errorMsg) => {
    if (!errorMsg) return false;
    const timeKeywords = [
      "time",
      "past",
      "after",
      "before",
      "duration",
      "hour",
      "conflicts",
      "blocked",
      "available",
      "slot",
      "8:00 AM",
      "5:00 PM",
      "4:59 PM"
    ];
    const lowerMsg = errorMsg.toLowerCase();
    return timeKeywords.some(keyword => lowerMsg.includes(keyword));
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
      setTimeError("");
      return;
    }

    setSelectedDate(date);
    setError("");
    setTimeError("");

    const startTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      9,
      0,
      0,
      0
    );
    
    const endTime = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      10,
      0,
      0,
      0
    );

    const localStartDate = new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    const localEndDate = new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setScheduledDate(localStartDate);
    setEndDate(localEndDate);
    setStartPickerValue({ hour: "9", minute: "00", period: "AM" });
    setEndPickerValue({ hour: "10", minute: "00", period: "AM" });

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
    setSearchQuery("");
    setFirstname("");
    setLastname("");
    setAppointmentType("");
    setSelectedDate(null);
    setScheduledDate("");
    setEndDate("");
    setNotes("");
    setError("");
    setTimeError("");
    setBookedSlots([]);
    setSearchResults([]);
    setShowAutocomplete(false);
  };

  const handleSelectStudent = (student) => {
    setStudentNumber(student.studentNumber);
    setSearchQuery(student.studentNumber);
    setFirstname(student.person?.firstName || student.person?.firstname || "");
    setLastname(student.person?.lastName || student.person?.lastname || "");
    setShowAutocomplete(false);
    setSelectedAutocompleteIndex(-1);
    setError("");
  };

  const handleAutocompleteKeyDown = (e) => {
    if (!showAutocomplete || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedAutocompleteIndex >= 0 && searchResults[selectedAutocompleteIndex]) {
          handleSelectStudent(searchResults[selectedAutocompleteIndex]);
        }
        break;
      case 'Escape':
        setShowAutocomplete(false);
        setSelectedAutocompleteIndex(-1);
        break;
      default:
        break;
    }
  };

  const sendNotification = async () => {
    if (isProcessing) return;
    
    if (!studentNumber?.trim() || studentNumber === "CT") {
      setError("Please enter a student number");
      return;
    }

    if (!firstname || !lastname) {
      setError("Student not found");
      return;
    }

    if (!appointmentType || appointmentType.trim() === "") {
      setError("Please select an appointment type");
      return;
    }

    if (!scheduledDate || !endDate) {
      setError("Please select appointment date and time");
      return;
    }

    if (isFullDayBlocked()) {
      setTimeError("This entire day is blocked. Please select another date.");
      return;
    }

    const validationDateError = validateDates(scheduledDate, endDate);
    if (validationDateError) {
      setTimeError(validationDateError);
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
      const res = await fetch(`${API_BASE_URL}/counselor/create-appointment`, {
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
        setSearchQuery("");
        setFirstname("");
        setLastname("");
        setAppointmentType("");
        setSelectedDate(null);
        setScheduledDate("");
        setEndDate("");
        setNotes("");
        setBookedSlots([]);
        setError("");
        setTimeError("");
        setSearchResults([]);
        setShowAutocomplete(false);
    
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
      
      if (isTimeRelatedError(errMessage)) {
        if (/Counselor not available|not available for time|blocked/i.test(errMessage)) {
          setTimeError("Selected time is not available. Please choose another time.");
        } else {
          setTimeError(errMessage);
        }
      } else {
        if (/Student already has an appointment|AppointmentAlreadyExistException|STUDENT ALREADY HAS AN APPOINTMENT/i.test(errMessage)) {
          setError("Student already has a pending or scheduled appointment.");
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
      }
    } catch (err) {
      console.error("Error during appointment creation:", err);
      setError(err.message || "Error creating appointment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setStudentNumber(value.toUpperCase());
    
    // Clear student info when typing
    if (value.length < 2) {
      setFirstname("");
      setLastname("");
      setError("");
    }
  };

  const handleAppointmentTypeChange = (e) => {
    setAppointmentType(e.target.value);
    if (e.target.value && error === "Please select an appointment type") {
      setError("");
    }
  };

  const updateActualTime = (pickerValue, isStartTime) => {
    const h24 = convertTo24Hour(pickerValue.hour, pickerValue.period);
    const minutes = parseInt(pickerValue.minute, 10);
    
    let baseDate;
    if (isStartTime) {
      baseDate = selectedDate || new Date();
    } else {
      baseDate = scheduledDate ? new Date(scheduledDate) : (selectedDate || new Date());
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
      
      if (!endDate) {
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
      }
      
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
                      appointmentType.trim() !== "" &&
                      scheduledDate && 
                      endDate && 
                      !error && 
                      !timeError &&
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
          <div style={{ position: 'relative' }} ref={autocompleteRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              onKeyDown={handleAutocompleteKeyDown}
              onFocus={() => {
                if (searchResults.length > 0 && searchQuery.length >= 2) {
                  setShowAutocomplete(true);
                }
              }}
              disabled={isProcessing}
              placeholder="Type to search (e.g., CT22-0000)"
              className={error && error.includes("student number") ? "error" : ""}
              aria-required="true"
              aria-invalid={error && error.includes("student number") ? "true" : "false"}
              style={{ width: '100%' }}
            />
            
            {/* Loading indicator for search */}
            {isSearching && (
              <div style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '12px',
                color: '#666'
              }}>
                Searching...
              </div>
            )}

            {showAutocomplete && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                zIndex: 1000
              }}>
                {searchResults.map((student, index) => (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student)}
                    onMouseEnter={() => setSelectedAutocompleteIndex(index)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      backgroundColor: selectedAutocompleteIndex === index ? '#f0f0f0' : 'white',
                      borderBottom: index < searchResults.length - 1 ? '1px solid #eee' : 'none',
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      color: '#333',
                      marginBottom: '4px'
                    }}>
                      {student.studentNumber}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#666',
                      marginBottom: '2px'
                    }}>
                      {student.person?.firstName || student.person?.firstname} {student.person?.middleName || ''} {student.person?.lastName || student.person?.lastname}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {student.person?.email} • {student.section?.organization || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: 0,
                right: 0,
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '13px',
                color: '#856404',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                zIndex: 1000
              }}>
                No students found matching "{searchQuery}"
              </div>
            )}
          </div>
        </label>

        <div className="create-name-row">
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
        </div>

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

        {timeError && (
          <div ref={timeErrorRef} className="create-error-messages" role="alert" aria-live="assertive" style={{ marginTop: 0, marginBottom: 12 }}>
            {timeError}
          </div>
        )}

        <div className="create-datetime-row">
          <label>
            Start Date: <span style={{ color: "red" }}>*</span>
            <div className="date-picker-wrapper">
              <DatePicker
                ref={datePickerRef}
                selected={selectedDate}
                onChange={handleDateChange}
                onCalendarOpen={() => setIsDatePickerOpen(true)}
                onCalendarClose={() => setIsDatePickerOpen(false)}
                minDate={new Date()}
                filterDate={filterAvailableDates}
                dateFormat="MM/dd/yyyy"
                placeholderText="Select date"
                disabled={isProcessing || isLoadingSlots}
                onChangeRaw={(e) => e.preventDefault()}  
                className={`date-picker-input ${error && error.includes("date") ? "error" : ""}`}
                calendarClassName="custom-calendar"
                popperPlacement="bottom-start"
                popperModifiers={[
                  {
                    name: 'preventOverflow',
                    options: {
                      boundary: 'viewport',
                      rootBoundary: 'viewport',
                      altAxis: true,
                      padding: 8
                    }
                  },
                  {
                    name: 'flip',
                    options: {
                      fallbackPlacements: ['top-start', 'bottom-start']
                    }
                  }
                ]}
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
            </div>
            {isLoadingSlots && (
              <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>
                Loading availability...
              </div>
            )}
          </label>

          <label>
            Start Time: <span style={{ color: "red" }}>*</span>
            <div className={`create-time-picker-wrapper ${showStartPicker ? 'picker-open' : ''}`} ref={startPickerRef}>
              <input
                type="text"
                value={scheduledDate ? formatTime(scheduledDate) : ""}
                onClick={() => {
                  if (selectedDate && !isProcessing && !isLoadingSlots) {
                    setShowStartPicker(!showStartPicker);
                    setShowEndPicker(false);
                    setIsDatePickerOpen(false);
                  }
                }}
                readOnly
                placeholder="--:-- --"
                className={timeError ? "time-input error" : "time-input"}
                disabled={!selectedDate || isProcessing || isLoadingSlots}
                aria-required="true"
                aria-invalid={timeError ? "true" : "false"}
              />
              {showStartPicker && selectedDate && !isDatePickerOpen && (
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

          <label>
            End Time: <span style={{ color: "red" }}>*</span>
            <div className={`create-time-picker-wrapper ${showEndPicker ? 'picker-open' : ''}`} ref={endPickerRef}>
              <input
                type="text"
                value={endDate ? formatTime(endDate) : ""}
                onClick={() => {
                  if (selectedDate && !isProcessing && !isLoadingSlots) {
                    setShowEndPicker(!showEndPicker);
                    setShowStartPicker(false);
                    setIsDatePickerOpen(false);
                  }
                }}
                readOnly
                placeholder="--:-- --"
                className={timeError ? "time-input error" : "time-input"}
                disabled={!selectedDate || isProcessing || isLoadingSlots}
                aria-required="true"
                aria-invalid={timeError ? "true" : "false"}
              />
              {showEndPicker && selectedDate && !isDatePickerOpen && (
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
        </div>

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
            className="button btn-color-secondary"
            disabled={isProcessing || isSearching}
          >
            Cancel
          </button>
          <button
            className="button btn-color-primary"
            onClick={sendNotification}
            disabled={!isFormValid || isProcessing || isSearching}
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