import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, ChevronUp, ChevronDown, AlertCircle } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../../../css/UpdateAppointmentModal.css";
import * as PHTimeUtils from "../../../utils/dateTime";
import { usePopUp } from '../../../helper/message/pop/up/provider/PopUpModalProvider';
import { API_BASE_URL } from '../../../../constants/api';

const UpdateAppointmentModal = ({ isOpen, isClose, appointment, onSubmit }) => {
  const { showSuccess, showError } = usePopUp();

  const [selectedDate, setSelectedDate] = useState(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startPickerValue, setStartPickerValue] = useState({ hour: "9", minute: "00", period: "AM" });
  const [endPickerValue, setEndPickerValue] = useState({ hour: "9", minute: "30", period: "AM" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [blockedDates, setBlockedDates] = useState([]);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [fullyBlockedDates, setFullyBlockedDates] = useState([]);
  
  const [originalScheduledDate, setOriginalScheduledDate] = useState("");
  const [originalEndDate, setOriginalEndDate] = useState("");

  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);
  const errorRef = useRef(null);

  const JWT_TOKEN = localStorage.getItem('jwtToken');
  const guidanceStaffId = localStorage.getItem("guidanceStaffId");

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [error]);

  useEffect(() => {
    if (isOpen && guidanceStaffId) {
      fetchBlockedPeriods();
    }
  }, [isOpen, guidanceStaffId]);

  useEffect(() => {
    if (scheduledDate) {
      const date = new Date(scheduledDate);
      fetchBookedSlots(date);
    }
  }, [scheduledDate]);

  useEffect(() => {
    if (scheduledDate && endDate && hasTimesChanged()) {
      const validationError = validateDates(scheduledDate, endDate);
      setError(validationError);
    } else if (scheduledDate && endDate && !hasTimesChanged()) {
      setError("");
    }
  }, [scheduledDate, endDate, bookedSlots]);

  const fetchBlockedPeriods = async () => {
    try {
      setIsLoadingBlocks(true);
      const response = await fetch(
        `${API_BASE_URL}/counselor/availability/blocks/${guidanceStaffId}`,
        {
          headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch blocked periods');
        return;
      }

      const blocks = await response.json();
      
      const fullyBlocked = blocks
        .filter(block => !block.endDate || block.endDate === "")
        .map(block => {
          const date = PHTimeUtils.parseUTCToPH(block.scheduledDate);
          if (date) {
            return {
              year: date.getFullYear(),
              month: date.getMonth(),
              day: date.getDate()
            };
          }
          return null;
        })
        .filter(date => date !== null);

      setFullyBlockedDates(fullyBlocked);
      
      setBookedSlots(blocks);
    } catch (error) {
      console.error('Error fetching blocked periods:', error);
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  const fetchBookedSlots = async (date) => {
    if (!date) return;

    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateParam = `${year}-${month}-${day}`;

      const res = await fetch(`${API_BASE_URL}/counselor/booked-slots?date=${encodeURIComponent(dateParam)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT_TOKEN}`,
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch booked slots:", res.status);
        return;
      }

      const data = await res.json();
      const arr = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
      setBookedSlots(arr);
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    }
  };

  useEffect(() => {
    if (appointment && isOpen) {
      const startPH = PHTimeUtils.parseUTCToPH(appointment.scheduledDate);
      const endPH = PHTimeUtils.parseUTCToPH(appointment.endDate);

      if (startPH) {
        setSelectedDate(startPH);
        const formattedDate = PHTimeUtils.formatDateForInput(startPH);
        setScheduledDate(formattedDate);
        setOriginalScheduledDate(formattedDate);
        
        setStartPickerValue({
          hour: String(startPH.getHours() % 12 || 12),
          minute: String(startPH.getMinutes()).padStart(2, '0'),
          period: startPH.getHours() >= 12 ? 'PM' : 'AM'
        });
      }
      if (endPH) {
        const formattedEndDate = PHTimeUtils.formatDateForInput(endPH);
        setEndDate(formattedEndDate);
        setOriginalEndDate(formattedEndDate);
        
        setEndPickerValue({
          hour: String(endPH.getHours() % 12 || 12),
          minute: String(endPH.getMinutes()).padStart(2, '0'),
          period: endPH.getHours() >= 12 ? 'PM' : 'AM'
        });
      }

      setError("");
    }
  }, [appointment, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (startPickerRef.current && !startPickerRef.current.contains(e.target)) {
        setShowStartPicker(false);
      }
      if (endPickerRef.current && !endPickerRef.current.contains(e.target)) {
        setShowEndPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const convertTo24Hour = (hour, period) => {
    let h = parseInt(hour, 10);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h;
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

  const doesRangeConflict = (startISO, endISO) => {
    if (!startISO || !endISO || bookedSlots.length === 0) return false;
    const start = new Date(startISO);
    const end = new Date(endISO);
    
    return bookedSlots.some((slot) => {
      if (appointment && slot.appointmentId === appointment.appointmentId) {
        return false;
      }
      
      const bs = slot.scheduledDate ? new Date(slot.scheduledDate) : null;
      const be = slot.endDate ? new Date(slot.endDate) : null;
      if (!bs) return false;
      if (!be) return true;
      return start < be && end > bs;
    });
  };

  const hasTimesChanged = () => {
    if (!scheduledDate || !endDate || !originalScheduledDate || !originalEndDate) return false;
    
    const currentStart = new Date(scheduledDate);
    const startHour = convertTo24Hour(startPickerValue.hour, startPickerValue.period);
    currentStart.setHours(startHour, parseInt(startPickerValue.minute), 0, 0);
    
    const currentEnd = new Date(endDate);
    const endHour = convertTo24Hour(endPickerValue.hour, endPickerValue.period);
    currentEnd.setHours(endHour, parseInt(endPickerValue.minute), 0, 0);
    
    const originalStart = new Date(originalScheduledDate);
    const originalStartPH = PHTimeUtils.parseUTCToPH(appointment.scheduledDate);
    originalStart.setHours(originalStartPH.getHours(), originalStartPH.getMinutes(), 0, 0);
    
    const originalEnd = new Date(originalEndDate);
    const originalEndPH = PHTimeUtils.parseUTCToPH(appointment.endDate);
    originalEnd.setHours(originalEndPH.getHours(), originalEndPH.getMinutes(), 0, 0);
    
    return currentStart.getTime() !== originalStart.getTime() || 
           currentEnd.getTime() !== originalEnd.getTime();
  };

  const validateDates = (scheduled, end) => {
    if (!scheduled || !end) return "";

    const scheduledDateTime = new Date(scheduled);
    const endDateTime = new Date(end);
    const now = new Date();
    now.setSeconds(0, 0);


    if (scheduledDateTime < now) return "Start time cannot be in the past";
    
    if (endDateTime.getTime() === scheduledDateTime.getTime()) {
      return "Start time and end time cannot be the same";
    }
    
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
    
    const startHour = convertTo24Hour(startPickerValue.hour, startPickerValue.period);
    const startMinute = parseInt(startPickerValue.minute);
    const startDate = new Date(year, month - 1, day, startHour, startMinute);
    const localStartDate = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    
    const endHour = convertTo24Hour(endPickerValue.hour, endPickerValue.period);
    const endMinute = parseInt(endPickerValue.minute);
    const endDateObj = new Date(year, month - 1, day, endHour, endMinute);
    const localEndDate = new Date(endDateObj.getTime() - endDateObj.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setScheduledDate(localStartDate);
    setEndDate(localEndDate);
    
    await fetchBookedSlots(date);
  };

  const formatTime = (pickerValue) => {
    return `${pickerValue.hour}:${pickerValue.minute} ${pickerValue.period}`;
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
      
      let newEndHour = endTime.getHours() + 1;
      let newEndMinute = endTime.getMinutes();
      
      if (newEndHour > 17 || (newEndHour === 17 && newEndMinute > 0)) {
        newEndHour = 17;
        newEndMinute = 0;
      }
      
      endTime.setHours(newEndHour, newEndMinute, 0, 0);
      
      if (endTime <= newDate) {
        endTime.setTime(newDate.getTime() + 15 * 60 * 1000);
        
        if (endTime.getHours() > 17 || (endTime.getHours() === 17 && endTime.getMinutes() > 0)) {
          endTime.setHours(17, 0, 0, 0);
        }
      }
      
      const localEnd = new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setEndDate(localEnd);
      
      const endHour24 = endTime.getHours();
      const endHour12 = endHour24 % 12 || 12;
      const endPeriod = endHour24 >= 12 ? 'PM' : 'AM';
      setEndPickerValue({
        hour: String(endHour12),
        minute: String(endTime.getMinutes()).padStart(2, '0'),
        period: endPeriod
      });
      
    } else {
      setEndDate(localDate);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasTimesChanged()) {
      showError('No Changes', 'Please modify the date or time to update the appointment.', 3000);
      return;
    }

    const validationError = validateDates(scheduledDate, endDate);
    if (validationError) {
      setError(validationError);
      showError('Validation Error', validationError, 4000);
      return;
    }

    if (isFullDayBlocked()) {
      setError("This entire day is blocked. Please select another date.");
      showError('Validation Error', "This entire day is blocked. Please select another date.", 4000);
      return;
    }

    try {
      setIsSubmitting(true);

      const hStart = convertTo24Hour(startPickerValue.hour, startPickerValue.period);
      const hEnd = convertTo24Hour(endPickerValue.hour, endPickerValue.period);
      
      const startDateTime = new Date(scheduledDate);
      startDateTime.setHours(hStart, parseInt(startPickerValue.minute), 0, 0);
      
      const endDateTime = new Date(scheduledDate);
      endDateTime.setHours(hEnd, parseInt(endPickerValue.minute), 0, 0);

      const updatedData = {
        scheduledDate: PHTimeUtils.convertLocalToUTCISO(startDateTime),
        endDate: PHTimeUtils.convertLocalToUTCISO(endDateTime),
      };

      await onSubmit(appointment.appointmentId, updatedData);

      showSuccess(
        'Appointment Updated!',
        'The appointment has been rescheduled successfully.',
        4000
      );

      handleClose();
    } catch (err) {
      console.error('Error updating appointment:', err);
      
      let errorMessage = 'Unable to update appointment. Please try again.';
      
      if (err.message) {
        if (err.message.includes('No changes detected') || err.message.includes('same as the current time')) {
          errorMessage = 'No changes detected. The appointment time is the same as the current time.';
        } else if (err.message.includes('COUNSELOR NOT AVAILABLE FOR THIS TIME') || err.message.includes('unavailable')) {
          errorMessage = 'Counselor not available for this time. Please choose a different time.';
        } else if (err.message.includes('conflict') || err.message.includes('appointment during')) {
          errorMessage = 'There is a scheduling conflict. Another appointment exists at this time.';
        } else if (err.message.includes('past')) {
          errorMessage = 'Cannot schedule appointments in the past.';
        } else if (err.message.includes('APPOINTMENTS CANNOT BE UPDATED ON SATURDAYS OR SUNDAYS')) {
          errorMessage = "Can't Update On Saturdays Or Sundays.";
        } else if (err.message.includes('Student already has')) {
          errorMessage = 'The student already has an appointment on this day.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      showError('Update Failed', errorMessage, 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError("");
    setSelectedDate(null);
    setScheduledDate("");
    setEndDate("");
    setOriginalScheduledDate("");
    setOriginalEndDate("");
    setStartPickerValue({ hour: "9", minute: "00", period: "AM" });
    setEndPickerValue({ hour: "9", minute: "30", period: "AM" });
    setShowStartPicker(false);
    setShowEndPicker(false);
    setBlockedDates([]);
    setBookedSlots([]);
    setFullyBlockedDates([]);
    isClose();
  };

  const IOSTimePicker = ({ value, onChange, isStart }) => {
    const hourOptions = ["8", "9", "10", "11", "12", "1", "2", "3", "4", "5"];
    const minuteOptions = ["00", "15", "20", "30", "45", "50"];

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
      
      if (!isStart) {
        const startHour24 = convertTo24Hour(startPickerValue.hour, startPickerValue.period);
        const startMinute = parseInt(startPickerValue.minute);
        const endHour24 = convertTo24Hour(newValue.hour, newValue.period);
        const endMinute = parseInt(newValue.minute);
        
        const startTotalMinutes = startHour24 * 60 + startMinute;
        const endTotalMinutes = endHour24 * 60 + endMinute;
        
        if (endTotalMinutes <= startTotalMinutes) {
          return; 
        }
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
      
      if (!isStart) {
        const startHour24 = convertTo24Hour(startPickerValue.hour, startPickerValue.period);
        const startMinute = parseInt(startPickerValue.minute);
        const endHour24 = convertTo24Hour(newValue.hour, newValue.period);
        const endMinute = parseInt(newValue.minute);
        
        const startTotalMinutes = startHour24 * 60 + startMinute;
        const endTotalMinutes = endHour24 * 60 + endMinute;
        
        if (endTotalMinutes <= startTotalMinutes) {
          return; 
        }
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
      <div className="update-ios-time-picker">
        {fullDayBlocked && (
          <div className="update-full-day-blocked-warning">
            This entire day is blocked (8:00 AM - 5:00 PM)
          </div>
        )}
        
        <div className="update-ios-picker-columns">
          <div className="update-ios-picker-column">
            <button
              className="update-ios-picker-arrow"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                incrementValue("hour");
              }}
              onMouseDown={(e) => e.preventDefault()}
              type="button"
              disabled={fullDayBlocked}
            >
              <ChevronUp size={20} />
            </button>
            <div className="update-ios-picker-value">{value.hour}</div>
            <button
              className="update-ios-picker-arrow"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                decrementValue("hour");
              }}
              onMouseDown={(e) => e.preventDefault()}
              type="button"
              disabled={fullDayBlocked}
            >
              <ChevronDown size={20} />
            </button>
          </div>
          
          <div className="update-ios-picker-separator">:</div>
          
          <div className="update-ios-picker-column">
            <button
              className="update-ios-picker-arrow"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                incrementValue("minute");
              }}
              onMouseDown={(e) => e.preventDefault()}
              type="button"
              disabled={fullDayBlocked}
            >
              <ChevronUp size={20} />
            </button>
            <div className="update-ios-picker-value">{value.minute}</div>
            <button
              className="update-ios-picker-arrow"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                decrementValue("minute");
              }}
              onMouseDown={(e) => e.preventDefault()}
              type="button"
              disabled={fullDayBlocked}
            >
              <ChevronDown size={20} />
            </button>
          </div>
          
          <div className="update-ios-picker-column">
            <button
              className="update-ios-picker-arrow"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                incrementValue("period");
              }}
              onMouseDown={(e) => e.preventDefault()}
              type="button"
              disabled={fullDayBlocked}
            >
              <ChevronUp size={20} />
            </button>
            <div className="update-ios-picker-value">{value.period}</div>
            <button
              className="update-ios-picker-arrow"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                decrementValue("period");
              }}
              onMouseDown={(e) => e.preventDefault()}
              type="button"
              disabled={fullDayBlocked}
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </div>

        {blockedRanges.length > 0 && (
          <div className="update-blocked-times-info">
            <div className="update-blocked-times-label">Blocked times this day</div>
            {blockedRanges.map((r, i) => (
              <div key={i} className="update-blocked-time-item">{r}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen || !appointment) return null;

  const studentName = `${appointment.student?.person?.firstName || ""} ${appointment.student?.person?.lastName || ""}`.trim();
  const minDate = new Date();
  const timesHaveChanged = hasTimesChanged();

  const isFormValid = scheduledDate && 
                      endDate && 
                      timesHaveChanged && 
                      !error && 
                      !isFullDayBlocked();

  return (
    <div className="update-modal-overlay" onClick={handleClose}>
      <div className="update-modal-content2" onClick={(e) => e.stopPropagation()}>
        <div className="update-modal-header">
          <div>
            <h2>Update Appointment</h2>
            <p>Reschedule the appointment date and time</p>
          </div>
          <button className="update-close-button" onClick={handleClose} type="button">
            <X size={22} />
          </button>
        </div>

        <div className="update-modal-body">
          {isLoadingBlocks && (
            <div className="loading-indicator">
              <span>Loading availability...</span>
            </div>
          )}

          {error && (
            <div ref={errorRef} className="create-error-messages" role="alert" aria-live="assertive" style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <div className="update-info-section">
            <div className="update-info-item">
              <strong>Student:</strong> {studentName}
            </div>
            <div className="update-info-item">
              <strong>Type:</strong> {appointment.appointmentType}
            </div>
          </div>

          {fullyBlockedDates.length > 0 && (
            <div className="blocked-dates-info">
              <AlertCircle size={16} />
              <span>Some dates are blocked and unavailable for selection</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="date-time-fields-row">
              <div className="form-group date-field">
                <label htmlFor="scheduledDate">
                  Appointment Date: <span style={{ color: "red" }}>*</span>
                </label>
                <div className="date-picker-wrapper">
                  <DatePicker
                    selected={selectedDate}
                    onChange={handleDateChange}
                    minDate={minDate}
                    filterDate={filterAvailableDates}
                    dateFormat="MM/dd/yyyy"
                    placeholderText="Select date"
                    disabled={isLoadingBlocks}
                    className={`date-picker-input ${error && error.includes("date") ? 'error' : ''}`}
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
                  />
                  <Calendar className="calendar-icon" size={18} />
                </div>
                {isLoadingBlocks && (
                  <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>
                    Loading availability...
                  </div>
                )}
              </div>

              {scheduledDate && (
                <div className="form-group time-field">
                  <label htmlFor="scheduledTime">
                    Start Time: <span style={{ color: "red" }}>*</span>
                  </label>
                  <div className={`update-time-picker-wrapper ${showStartPicker ? 'picker-open' : ''}`} ref={startPickerRef}>
                    <input
                      type="text"
                      id="scheduledTime"
                      readOnly
                      value={formatTime(startPickerValue)}
                      onClick={() => {
                        if (!isLoadingBlocks && scheduledDate) {
                          setShowStartPicker(!showStartPicker);
                          setShowEndPicker(false);
                        }
                      }}
                      placeholder="--:-- --"
                      className={`form-input time-input ${error && (error.includes("time") || error.includes("Start time")) ? 'error' : ''}`}
                      disabled={isLoadingBlocks || !scheduledDate}
                    />
                    {showStartPicker && scheduledDate && (
                      <div className="update-time-picker-dropdown">
                        <IOSTimePicker
                          value={startPickerValue}
                          onChange={setStartPickerValue}
                          isStart={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {scheduledDate && (
              <div className="form-group">
                <label htmlFor="endTime">
                  End Time: <span style={{ color: "red" }}>*</span>
                </label>
                <div className={`update-time-picker-wrapper ${showEndPicker ? 'picker-open' : ''}`} ref={endPickerRef}>
                  <input
                    type="text"
                    id="endTime"
                    readOnly
                    value={formatTime(endPickerValue)}
                    onClick={() => {
                      if (!isLoadingBlocks && scheduledDate) {
                        setShowEndPicker(!showEndPicker);
                        setShowStartPicker(false);
                      }
                    }}
                    placeholder="--:-- --"
                    className={`form-input time-input ${error && (error.includes("End time") || error.includes("after")) ? 'error' : ''}`}
                    disabled={isLoadingBlocks || !scheduledDate}
                  />
                  {showEndPicker && scheduledDate && (
                    <div className="update-time-picker-dropdown">
                      <IOSTimePicker
                        value={endPickerValue}
                        onChange={setEndPickerValue}
                        isStart={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="button button-secondary"
                disabled={isSubmitting || isLoadingBlocks}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={!isFormValid || isSubmitting || isLoadingBlocks}
                title={!timesHaveChanged ? "Please modify the date or time to update" : ""}
              >
                {isSubmitting ? "Updating..." : "Update Appointment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateAppointmentModal;