import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Trash2, Edit2, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, CalendarDays, CheckSquare } from 'lucide-react';
import { API_BASE_URL } from '../../../../constants/api';
import "../../../css/ManageAvailability.css";
import * as PHTimeUtils from '../../../utils/dateTime';
import { usePopUp } from '../../../helper/message/pop/up/provider/PopUpModalProvider';

const ManageAvailability = ({ isOpen, onClose }) => {
  const { showSuccess, showError, showWarning, showConfirm } = usePopUp();

  const [blockType, setBlockType] = useState('full');
  const [selectedDate, setSelectedDate] = useState(PHTimeUtils.getCurrentPHTime());
  const [startPickerValue, setStartPickerValue] = useState({ hour: "9", minute: "00", period: "AM" });
  const [endPickerValue, setEndPickerValue] = useState({ hour: "5", minute: "00", period: "PM" });
  const [reason, setReason] = useState('');
  const [bulkReason, setBulkReason] = useState(''); 
  const [blockedPeriods, setBlockedPeriods] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(PHTimeUtils.getCurrentPHTime());
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('block');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [dayFullyBlocked, setDayFullyBlocked] = useState(false);
  const [validationError, setValidationError] = useState('');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);

  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);

  const JWT_TOKEN = localStorage.getItem('jwtToken');
  const guidanceStaffId = localStorage.getItem("guidanceStaffId");

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/counselor/appointment/${guidanceStaffId}`,
        { headers: { 'Authorization': `Bearer ${JWT_TOKEN}` } }
      );

      if (!response.ok) {
        console.error('Failed to fetch appointments');
        return;
      }

      const appointmentData = await response.json();
      setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const fetchBlockedPeriods = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/counselor/availability/blocks/${guidanceStaffId}`,
        { headers: { 'Authorization': `Bearer ${JWT_TOKEN}` } }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load blocked periods (Status: ${response.status})`);
      }

      const blocks = await response.json();
      setBlockedPeriods(Array.isArray(blocks) ? blocks : []);
      
      const full = blocks.some(b => 
        b.scheduledDate && 
        (!b.endDate || b.endDate === "") &&
        PHTimeUtils.parseUTCToPH(b.scheduledDate)?.toDateString() === selectedDate.toDateString()
      );
      setDayFullyBlocked(full);
    } catch (error) {
      console.error("Error fetching blocked periods:", error);
      showError('Failed to Load Data', error.message || 'Unable to load blocked periods. Please try again.', 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const isDateFullyBlocked = (date) => {
    return blockedPeriods.some(block => {
      const blockDate = PHTimeUtils.parseUTCToPH(block.scheduledDate);
      return blockDate &&
        blockDate.getFullYear() === date.getFullYear() &&
        blockDate.getMonth() === date.getMonth() &&
        blockDate.getDate() === date.getDate() &&
        !block.endDate;
    });
  };

  // VALIDATION: Check if date has partial blocks
  const hasPartialBlock = (date) => {
    return blockedPeriods.some(block => {
      const blockDate = PHTimeUtils.parseUTCToPH(block.scheduledDate);
      return blockDate &&
        blockDate.getFullYear() === date.getFullYear() &&
        blockDate.getMonth() === date.getMonth() &&
        blockDate.getDate() === date.getDate() &&
        block.endDate;
    });
  };

  // VALIDATION: Check if date has appointments
  const hasAppointmentOnDate = (date) => {
    return appointments.some(apt => {
      const aptDate = PHTimeUtils.parseUTCToPH(apt.scheduledDate);
      return aptDate &&
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate() &&
        (apt.status === 'SCHEDULED' || apt.status === 'PENDING' || apt.status === 'CONFIRMED');
    });
  };

  // VALIDATION: Check time overlap
  const hasTimeOverlap = (date, startTime, endTime) => {
    return blockedPeriods.some(block => {
      const blockDate = PHTimeUtils.parseUTCToPH(block.scheduledDate);
      if (!blockDate || !block.endDate) return false;

      const isSameDate = blockDate.getFullYear() === date.getFullYear() &&
        blockDate.getMonth() === date.getMonth() &&
        blockDate.getDate() === date.getDate();

      if (!isSameDate) return false;

      const blockStart = PHTimeUtils.parseUTCToPH(block.scheduledDate);
      const blockEnd = PHTimeUtils.parseUTCToPH(block.endDate);

      return startTime < blockEnd && endTime > blockStart;
    });
  };

  const startBulkSelection = () => {
    setSelectionMode(true);
    setSelectedDates([]);
  };

  const cancelBulkSelection = () => {
    setSelectionMode(false);
    setSelectedDates([]);
    setBulkReason('');
  };

  const handleBulkDateSelect = (day) => {
    if (!day) return;
    
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    
    // Check if date is in the past
    const today = PHTimeUtils.getCurrentPHTime();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (selectedDateOnly < todayOnly) {
      showWarning('Past Date', 'Cannot block dates in the past.', 2000);
      return;
    }
    
    if (isDateFullyBlocked(date)) {
      showWarning('Already Blocked', 'This date is already blocked.', 2000);
      return;
    }

    if (hasPartialBlock(date)) {
      showWarning('Partial Block Exists', 'This date has a partial time block. Please remove it first.', 3000);
      return;
    }

    if (hasAppointmentOnDate(date)) {
      showWarning('Has Appointments', 'This date has scheduled appointments.', 2000);
      return;
    }

    setSelectedDates(prev => {
      if (prev.some(d => d.key === dateKey)) {
        return prev.filter(d => d.key !== dateKey);
      } else {
        return [...prev, { key: dateKey, date }];
      }
    });
  };

  const handleBulkBlock = async () => {
    if (selectedDates.length === 0) {
      showWarning('No Dates Selected', 'Please select at least one date to block.', 3000);
      return;
    }

    if (!bulkReason.trim()) {
      showWarning('Reason Required', 'Please provide a reason for blocking these dates.', 3000);
      return;
    }

    showConfirm({
      type: 'warning',
      title: 'Block Selected Dates?',
      message: `Are you sure you want to block ${selectedDates.length} date(s)?`,
      confirmText: 'Block All',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          
          const promises = selectedDates.map(({ date }) => {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            
            const payload = {
              guidanceStaffId: parseInt(guidanceStaffId),
              scheduledDate: PHTimeUtils.convertLocalToUTCISO(start),
              endDate: null,
              reason: `Bulk Block: ${bulkReason.trim()}`
            };

            return fetch(`${API_BASE_URL}/counselor/availability/block`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            }).then(async response => {
              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to block date');
              }
              return response;
            });
          });

          const results = await Promise.allSettled(promises);
          
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.length - successful;

          if (failed > 0) {
            const firstError = results.find(r => r.status === 'rejected');
            showError(
              'Partial Failure',
              `${successful} date(s) blocked successfully. ${failed} failed: ${firstError?.reason?.message || 'Unknown error'}`,
              6000
            );
          } else if (successful > 0) {
            showSuccess(
              'Dates Blocked!',
              `Successfully blocked ${successful} date(s).`,
              4000
            );
          }

          setSelectedDates([]);
          setSelectionMode(false);
          setBulkReason('');
          await fetchBlockedPeriods();
          if (typeof window.refreshCalendar === "function") {
            window.refreshCalendar();
          }
        } catch (error) {
          console.error('Error bulk blocking:', error);
          showError('Operation Failed', error.message || 'Unable to block dates.', 6000);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const groupBlockedPeriods = () => {
    const grouped = {
      monthLeaves: [],
      bulkBlocks: [],
      individualBlocks: [],
      pastBlocks: []  // NEW: Past/expired blocks
    };

    const monthLeaveMap = new Map();
    const bulkBlockMap = new Map();
    const pastMonthMap = new Map();
    const pastBulkMap = new Map();

    const nowPH = PHTimeUtils.getCurrentPHTime();

    blockedPeriods.forEach(block => {
      const blockDate = PHTimeUtils.parseUTCToPH(block.scheduledDate);
      const isPast = blockDate < nowPH || block.status === 'EXPIRED';
      
      // Partial blocks (with endDate)
      if (block.endDate) {
        if (isPast) {
          grouped.pastBlocks.push(block);
        } else {
          grouped.individualBlocks.push(block);
        }
        return;
      }

      const notes = block.notes || '';
      const date = blockDate;

      if (notes.startsWith('Month Leave:')) {
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        const targetMap = isPast ? pastMonthMap : monthLeaveMap;
        
        if (!targetMap.has(key)) {
          targetMap.set(key, {
            type: 'month',
            year: date.getFullYear(),
            month: date.getMonth(),
            reason: notes.replace('Month Leave: ', ''),
            blocks: [],
            isPast: isPast
          });
        }
        targetMap.get(key).blocks.push(block);
      } 
      else if (notes.startsWith('Bulk Block:')) {
        const key = `bulk-${notes}-${isPast}`;
        const targetMap = isPast ? pastBulkMap : bulkBlockMap;
        
        if (!targetMap.has(key)) {
          targetMap.set(key, {
            type: 'bulk',
            reason: notes.replace('Bulk Block: ', ''),
            blocks: [],
            isPast: isPast
          });
        }
        targetMap.get(key).blocks.push(block);
      } 
      
      else {
        if (isPast) {
          grouped.pastBlocks.push(block);
        } else {
          grouped.individualBlocks.push(block);
        }
      }
    });

    grouped.monthLeaves = Array.from(monthLeaveMap.values());
    grouped.bulkBlocks = Array.from(bulkBlockMap.values()).map(bulkBlock => {
      // Sort blocks by date for accurate date range display
      bulkBlock.blocks.sort((a, b) => {
        const dateA = PHTimeUtils.parseUTCToPH(a.scheduledDate);
        const dateB = PHTimeUtils.parseUTCToPH(b.scheduledDate);
        return dateA - dateB;
      });
      return bulkBlock;
    });
    
    // Add past grouped blocks
    const pastMonthLeaves = Array.from(pastMonthMap.values());
    const pastBulkBlocks = Array.from(pastBulkMap.values());
    grouped.pastBlocks = [
      ...pastMonthLeaves.flatMap(m => m.blocks),
      ...pastBulkBlocks.flatMap(b => b.blocks),
      ...grouped.pastBlocks
    ];

    return grouped;
  };

  const handleDeleteGroup = (blocks, groupName) => {
    showConfirm({
      type: 'error',
      title: `Delete ${groupName}?`,
      message: `Are you sure you want to delete these ${blocks.length} blocked days?`,
      confirmText: 'Delete All',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          
          const promises = blocks.map(block => 
            fetch(`${API_BASE_URL}/counselor/availability/block/${block.appointmentId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
            })
          );

          await Promise.all(promises);

          showSuccess(
            `${groupName} Deleted!`,
            `Successfully removed ${blocks.length} blocked days.`,
            4000
          );
          
          await fetchBlockedPeriods();
          
          // Check if any deleted block was for the selected date
          const deletedBlocksForSelectedDate = blocks.some(block => {
            const blockDate = PHTimeUtils.parseUTCToPH(block.scheduledDate);
            return blockDate &&
              blockDate.getFullYear() === selectedDate.getFullYear() &&
              blockDate.getMonth() === selectedDate.getMonth() &&
              blockDate.getDate() === selectedDate.getDate();
          });
          
          // If we deleted blocks for the selected date, reset to today
          if (deletedBlocksForSelectedDate) {
            const today = PHTimeUtils.getCurrentPHTime();
            setSelectedDate(today);
            setDayFullyBlocked(false);
          }
          
          if (typeof window.refreshCalendar === "function") {
            window.refreshCalendar();
          }
        } catch (error) {
          console.error('Error deleting group:', error);
          showError('Deletion Failed', 'Unable to delete. Please try again.', 5000);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const add30Minutes = (hour, minute, period) => {
    let h = parseInt(hour, 10);
    let m = parseInt(minute, 10);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    m += 30;
    if (m >= 60) {
      m -= 60;
      h += 1;
    }
    if (h >= 24) h = 0;
    const newPeriod = h >= 12 ? "PM" : "AM";
    let newHour = h % 12;
    if (newHour === 0) newHour = 12;
    return {
      hour: String(newHour),
      minute: String(m).padStart(2, "0"),
      period: newPeriod
    };
  };

  useEffect(() => {
    if (blockType !== "partial") return;
    const nextEnd = add30Minutes(startPickerValue.hour, startPickerValue.minute, startPickerValue.period);
    setEndPickerValue(nextEnd);
  }, [startPickerValue, blockType]);

  useEffect(() => {
    if (blockType !== 'partial') {
      setValidationError('');
      return;
    }

    const validation = validateTimeRange();
    if (!validation.isValid) {
      setValidationError(validation.message);
    } else {
      // Check for time overlap
      const hStart = convertTo24Hour(startPickerValue.hour, startPickerValue.period);
      const hEnd = convertTo24Hour(endPickerValue.hour, endPickerValue.period);
      const start = new Date(selectedDate);
      start.setHours(hStart, parseInt(startPickerValue.minute), 0, 0);
      const end = new Date(selectedDate);
      end.setHours(hEnd, parseInt(endPickerValue.minute), 0, 0);

      if (hasTimeOverlap(selectedDate, start, end)) {
        setValidationError('This time range overlaps with an existing block');
      } else {
        setValidationError('');
      }
    }
  }, [startPickerValue, endPickerValue, blockType, selectedDate, blockedPeriods]);

  useEffect(() => {
    if (isOpen) {
      fetchBlockedPeriods();
      fetchAppointments();
    }
  }, [isOpen, selectedDate]);

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

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      const today = PHTimeUtils.getCurrentPHTime();
      
      if (newDate.getFullYear() < today.getFullYear() ||
        (newDate.getFullYear() === today.getFullYear() && newDate.getMonth() < today.getMonth())) {
        return prev;
      }
      return newDate;
    });
  };

  const isDateBlocked = (day) => {
    if (!day) return false;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return blockedPeriods.some(period => {
      const periodDate = PHTimeUtils.parseUTCToPH(period.scheduledDate);
      return periodDate &&
        periodDate.getFullYear() === checkDate.getFullYear() &&
        periodDate.getMonth() === checkDate.getMonth() &&
        periodDate.getDate() === checkDate.getDate();
    });
  };

  const hasAppointment = (day) => {
    if (!day) return false;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return appointments.some(appointment => {
      const appointmentDate = PHTimeUtils.parseUTCToPH(appointment.scheduledDate);
      return appointmentDate &&
        appointmentDate.getFullYear() === checkDate.getFullYear() &&
        appointmentDate.getMonth() === checkDate.getMonth() &&
        appointmentDate.getDate() === checkDate.getDate() &&
        (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED');
    });
  };

  const getAppointmentCount = (day) => {
    if (!day) return 0;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return appointments.filter(appointment => {
      const appointmentDate = PHTimeUtils.parseUTCToPH(appointment.scheduledDate);
      return appointmentDate &&
        appointmentDate.getFullYear() === checkDate.getFullYear() &&
        appointmentDate.getMonth() === checkDate.getMonth() &&
        appointmentDate.getDate() === checkDate.getDate() &&
        (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED');
    }).length;
  };

  const isToday = (day) => {
    if (!day) return false;
    const today = PHTimeUtils.getCurrentPHTime();
    return day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear();
  };

  const isPastDate = (day) => {
    if (!day) return false;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = PHTimeUtils.getCurrentPHTime();
    
    // Set time to start of day for accurate comparison
    checkDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return checkDate < today;
  };

  const isSelected = (day) => {
    if (!day) return false;
    
    if (selectionMode) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      return selectedDates.some(d => d.key === dateKey);
    }
    
    return day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const handleDateSelect = (day) => {
    if (!day) return;
    
    if (selectionMode) {
      handleBulkDateSelect(day);
    } else {
      const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setSelectedDate(selected);
      setStartPickerValue({ hour: "9", minute: "00", period: "AM" });
      setEndPickerValue({ hour: "5", minute: "00", period: "PM" });
      setValidationError('');
    }
  };

  const convertTo24Hour = (hour, period) => {
    let h = parseInt(hour, 10);
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h;
  };

  const validateTimeRange = () => {
    const startHour = convertTo24Hour(startPickerValue.hour, startPickerValue.period);
    const endHour = convertTo24Hour(endPickerValue.hour, endPickerValue.period);
    const startMinutes = parseInt(startPickerValue.minute);
    const endMinutes = parseInt(endPickerValue.minute);

    const startTotalMinutes = startHour * 60 + startMinutes;
    const endTotalMinutes = endHour * 60 + endMinutes;

    // Create actual datetime objects for validation
    const start = new Date(selectedDate);
    start.setHours(startHour, startMinutes, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(endHour, endMinutes, 0, 0);

    const now = new Date();
    now.setSeconds(0, 0);

    if(dayFullyBlocked) {
      return {isValid: false , message: "This date is already fully blocked"};
    }

    if (start < now) {
      return { isValid: false, message: 'Start time cannot be in the past' };
    }
      if (endTotalMinutes <= startTotalMinutes) {
      return { isValid: false, message: 'End time must be after start time' };
    }

    const durationMinutes = (end - start) / (1000 * 60);
    // if (durationMinutes > 60) {
    //   return { isValid: false, message: 'Block duration cannot exceed 1 hour' };
    // }

    if (startHour < 8 || startHour >= 17) {
      return { isValid: false, message: 'Start time must be between 8:00 AM and 4:59 PM' };
    }

    if (endHour > 17 || (endHour === 17 && endMinutes > 0)) {
      return { isValid: false, message: 'End time must be no later than 5:00 PM' };
    }

    if (endHour < 8) {
      return { isValid: false, message: 'End time must be after 8:00 AM' };
    }

    return { isValid: true };
  };

  const handleAddBlock = async (selectedDate) => {
    try {
      if (blockType === 'full' && isDateFullyBlocked(selectedDate)) {
        showError('Already Blocked', 'This date is already fully blocked. Please choose another date.', 4000);
        return;
      }

      if (blockType === 'full' && hasPartialBlock(selectedDate)) {
        showError('Cannot Block Full Day', 'This date has partial time blocks. Please remove them first before blocking the full day.', 5000);
        return;
      }

      if (blockType === 'partial') {
        if (validationError) {
          showError('Invalid Time Range', validationError, 4000);
          return;
        }
      }

      setIsLoading(true);
      let start, end;
      
      if (blockType === 'full') {
        start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        end = null;
      } else {
        const hStart = convertTo24Hour(startPickerValue.hour, startPickerValue.period);
        const hEnd = convertTo24Hour(endPickerValue.hour, endPickerValue.period);
        start = new Date(selectedDate);
        start.setHours(hStart, parseInt(startPickerValue.minute), 0, 0);
        end = new Date(selectedDate);
        end.setHours(hEnd, parseInt(endPickerValue.minute), 0, 0);
      }

      const payload = {
        guidanceStaffId: parseInt(guidanceStaffId),
        scheduledDate: PHTimeUtils.convertLocalToUTCISO(start),
        endDate: end ? PHTimeUtils.convertLocalToUTCISO(end) : null,
        reason: reason.trim()
      };

      const url = editingId 
        ? `${API_BASE_URL}/counselor/availability/block/${editingId}` 
        : `${API_BASE_URL}/counselor/availability/block`;
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to ${editingId ? 'update' : 'create'} block`);
      }

      showSuccess(
        editingId ? 'Block Updated!' : 'Block Created!',
        editingId 
          ? 'Your availability block has been updated successfully.' 
          : 'The time slot has been blocked successfully.',
        4000
      );
      
      setEditingId(null);
      setReason('');
      setBlockType('full');
      setStartPickerValue({ hour: "9", minute: "00", period: "AM" });
      setEndPickerValue({ hour: "5", minute: "00", period: "PM" });
      setValidationError('');
      
      await fetchBlockedPeriods();
      if (typeof window.refreshCalendar === "function") {
        window.refreshCalendar();
      }
    } catch (error) {
      console.error('Error saving block:', error);
      showError('Operation Failed', error.message || 'Unable to save availability block. Please try again.', 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMonthLeave = async () => {
    try {
      if (!reason.trim()) {
        showWarning('Reason Required', 'Please provide a reason for the month leave.', 3000);
        return;
      }

      setIsLoading(true);

      const payload = {
        guidanceStaffId: parseInt(guidanceStaffId),
        year: selectedYear,
        month: selectedMonth,
        reason: reason.trim()
      };

      const response = await fetch(`${API_BASE_URL}/counselor/availability/month-leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.message || 'Failed to create month leave');
      }

      const responseData = await response.json();

      showSuccess(
        'Month Leave Created!',
        `Successfully blocked ${responseData.blockedDays} working days in ${monthsShort[selectedMonth - 1]} ${selectedYear}.`,
        5000
      );

      setReason('');
      await fetchBlockedPeriods();
      if (typeof window.refreshCalendar === "function") {
        window.refreshCalendar();
      }
    } catch (error) {
      console.error('Error creating month leave:', error);
      showError('Failed to Create Leave', error.message, 6000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (period) => {
    setEditingId(period.appointmentId);
    setSelectedDate(PHTimeUtils.parseUTCToPH(period.scheduledDate));
    
    if (period.endDate) {
      const start = PHTimeUtils.parseUTCToPH(period.scheduledDate);
      const end = PHTimeUtils.parseUTCToPH(period.endDate);
      setStartPickerValue({
        hour: String(start.getHours() % 12 || 12),
        minute: String(start.getMinutes()).padStart(2, '0'),
        period: start.getHours() >= 12 ? 'PM' : 'AM'
      });
      setEndPickerValue({
        hour: String(end.getHours() % 12 || 12),
        minute: String(end.getMinutes()).padStart(2, '0'),
        period: end.getHours() >= 12 ? 'PM' : 'AM'
      });
      setBlockType('partial');
    } else {
      setBlockType('full');
      setStartPickerValue({ hour: "9", minute: "00", period: "AM" });
      setEndPickerValue({ hour: "5", minute: "00", period: "PM" });
    }
    
    setReason(period.notes || '');
    setActiveTab('block');
  };

  const handleDelete = (id) => {
    showConfirm({
      type: 'error',
      title: 'Delete Blocked Period?',
      message: 'Are you sure you want to delete this blocked period? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setIsLoading(true);
          
          // Find the block being deleted to check if it's for the selected date
          const blockToDelete = blockedPeriods.find(b => b.appointmentId === id);
          
          const response = await fetch(
            `${API_BASE_URL}/counselor/availability/block/${id}`,
            {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${JWT_TOKEN}` }
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to delete block (Status: ${response.status})`);
          }

          showSuccess('Block Deleted!', 'The blocked period has been removed successfully.', 3000);
          
          // Refresh blocked periods
          await fetchBlockedPeriods();
          
          // Check if the deleted block was for the selected date
          if (blockToDelete) {
            const blockDate = PHTimeUtils.parseUTCToPH(blockToDelete.scheduledDate);
            const wasSelectedDate = blockDate &&
              blockDate.getFullYear() === selectedDate.getFullYear() &&
              blockDate.getMonth() === selectedDate.getMonth() &&
              blockDate.getDate() === selectedDate.getDate();
            
            // If we deleted a block for the selected date, check if there are any remaining blocks
            if (wasSelectedDate) {
              const updatedBlocks = blockedPeriods.filter(b => b.appointmentId !== id);
              const selectedDateStillBlocked = updatedBlocks.some(block => {
                const bDate = PHTimeUtils.parseUTCToPH(block.scheduledDate);
                return bDate &&
                  bDate.getFullYear() === selectedDate.getFullYear() &&
                  bDate.getMonth() === selectedDate.getMonth() &&
                  bDate.getDate() === selectedDate.getDate();
              });
              
              // If no blocks remain for selected date, reset to today
              if (!selectedDateStillBlocked) {
                const today = PHTimeUtils.getCurrentPHTime();
                setSelectedDate(today);
                setDayFullyBlocked(false);
              }
            }
          }
          
          if (typeof window.refreshCalendar === "function") {
            window.refreshCalendar();
          }
        } catch (error) {
          console.error('Error deleting block:', error);
          showError('Deletion Failed', error.message || 'Unable to delete blocked period. Please try again.', 5000);
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  const IOSTimePicker = ({ value, onChange, isStart }) => {
    const hourOptions = ["8", "9", "10", "11", "12", "1", "2", "3", "4", "5"];
    const minuteOptions = ["00", "15", "20", "30", "45", "50"];

    const increment = (type) => {
      const v = { ...value };
      if (type === "hour") {
        const idx = hourOptions.indexOf(v.hour);
        v.hour = hourOptions[(idx + 1) % hourOptions.length];
      } else if (type === "minute") {
        const idx = minuteOptions.indexOf(v.minute);
        v.minute = minuteOptions[(idx + 1) % minuteOptions.length];
      } else if (type === "period") {
        v.period = v.period === "AM" ? "PM" : "AM";
      }
      onChange(v);
    };

    const decrement = (type) => {
      const v = { ...value };
      if (type === "hour") {
        const idx = hourOptions.indexOf(v.hour);
        v.hour = hourOptions[(idx - 1 + hourOptions.length) % hourOptions.length];
      } else if (type === "minute") {
        const idx = minuteOptions.indexOf(v.minute);
        v.minute = minuteOptions[(idx - 1 + minuteOptions.length) % minuteOptions.length];
      } else if (type === "period") {
        v.period = v.period === "AM" ? "PM" : "AM";
      }
      onChange(v);
    };

    const fullDayBlocked = dayFullyBlocked;
    const blockedRanges = blockedPeriods
      .filter((s) => {
        const sDate = PHTimeUtils.parseUTCToPH(s.scheduledDate);
        if (!sDate) return false;
        return sDate.getFullYear() === selectedDate.getFullYear() &&
               sDate.getMonth() === selectedDate.getMonth() &&
               sDate.getDate() === selectedDate.getDate();
      })
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
      <div className="ios-time-picker">
        {fullDayBlocked && (
          <div className="full-day-blocked-warning">
            This entire day is blocked (8:00 AM - 5:00 PM)
          </div>
        )}
        
        <div className="ios-picker-columns">
          <div className="ios-picker-column">
            <button 
              className="ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); increment("hour"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronUp size={22} />
            </button>
            <div className="ios-picker-value">{value.hour}</div>
            <button 
              className="ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); decrement("hour"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronDown size={22} />
            </button>
          </div>
          <div className="ios-picker-separator">:</div>
          <div className="ios-picker-column">
            <button 
              className="ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); increment("minute"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronUp size={22} />
            </button>
            <div className="ios-picker-value">{value.minute}</div>
            <button 
              className="ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); decrement("minute"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronDown size={22} />
            </button>
          </div>
          <div className="ios-picker-column">
            <button 
              className="ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); increment("period"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronUp size={22} />
            </button>
            <div className="ios-picker-value">{value.period}</div>
            <button 
              className="ios-picker-arrow" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); decrement("period"); }} 
              onMouseDown={(e) => e.preventDefault()}
              disabled={fullDayBlocked}
              type="button"
            >
              <ChevronDown size={22} />
            </button>
          </div>
        </div>

        {blockedRanges.length > 0 && (
          <div className="blocked-times-info">
            <div className="blocked-times-label">Blocked times this day</div>
            {blockedRanges.map((r, i) => (
              <div key={i} className="blocked-time-item">{r}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  const groupedBlocks = groupBlockedPeriods();
  const totalBlocks = groupedBlocks.monthLeaves.length + groupedBlocks.bulkBlocks.length + groupedBlocks.individualBlocks.length;

  return (
    <div className="availability-overlay">
      <div className="availability-modal">
        <div className="availability-header">
          <div>
            <h2>Manage Availability</h2>
            <p>Block dates, manage leaves, and control your schedule</p>
          </div>
          <button onClick={onClose} className="close-btn1" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div className="availability-content">
          <div className="content-grid-tabbed">
            <div className="calendar-section">
              <div className="calendar-controls">
                <div className="calendar-header-nav">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="nav-btn"
                    disabled={
                      selectionMode ||
                      (currentMonth.getFullYear() === PHTimeUtils.getCurrentPHTime().getFullYear() &&
                      currentMonth.getMonth() === PHTimeUtils.getCurrentPHTime().getMonth())
                    }
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h3>{months[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                  <button 
                    onClick={() => navigateMonth(1)} 
                    className="nav-btn" 
                    disabled={selectionMode}
                    aria-label="Next month"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                
                {!selectionMode && (
                  <div className="bulk-selection-controls">
                    <button
                      onClick={startBulkSelection}
                      className="bulk-select-btn"
                    >
                      <CheckSquare size={18} />
                      Bulk Block Days
                    </button>
                  </div>
                )}

                {selectionMode && (
                  <div className="bulk-selection-controls">
                    <button
                      onClick={cancelBulkSelection}
                      className="bulk-select-btn cancel"
                    >
                      Cancel Selection
                    </button>
                    {selectedDates.length > 0 && (
                      <span className="selected-count">{selectedDates.length} selected</span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="calendar-days-header">
                {daysOfWeek.map(d => (
                  <div key={d} className="day-label">{d}</div>
                ))}
              </div>
              
              <div className="calendar-grid">
                {getDaysInMonth().map((day, i) => {
                  const appointmentCount = getAppointmentCount(day);
                  const hasAppt = hasAppointment(day);
                  const isBlocked = isDateBlocked(day);
                  const isPast = isPastDate(day);
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handleDateSelect(day)}
                      disabled={!day || (selectionMode && (isBlocked || hasAppt || isPast))}
                      className={`calendar-day ${isSelected(day) ? 'selected' : ''} ${
                        isToday(day) && !isSelected(day) ? 'today' : ''
                      } ${isBlocked && !isSelected(day) ? 'blocked' : ''} ${
                        hasAppt && !isSelected(day) && !isBlocked ? 'has-appointment' : ''
                      } ${selectionMode ? 'selection-mode' : ''}`}
                    >
                      <span className="calendar-day-number">{day}</span>
                      {hasAppt && appointmentCount > 0 && (
                        <div className="appointment-dots">
                          {[...Array(Math.min(appointmentCount, 3))].map((_, idx) => (
                            <span key={idx} className="appointment-dot"></span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectionMode && (
                <div className="bulk-action-panel">
                  <div className="form-group">
                    <label>Reason for blocking {selectedDates.length} day(s)</label>
                    <textarea
                      className="form-textarea"
                      placeholder="e.g., Vacation, Training, Conference..."
                      value={bulkReason}
                      onChange={e => setBulkReason(e.target.value)}
                      maxLength={200}
                    />
                  </div>
                  <button
                    onClick={handleBulkBlock}
                    className="bulk-block-submit-btn"
                    disabled={isLoading || selectedDates.length === 0 || !bulkReason.trim()}
                  >
                    {isLoading ? 'Processing...' : `Block ${selectedDates.length} Day(s)`}
                  </button>
                </div>
              )}
            </div>

            <div className="tabbed-section">
              <div className="tab-navigation">
                <button
                  onClick={() => !selectionMode && setActiveTab('block')}
                  className={`tab-btn ${activeTab === 'block' ? 'active' : ''} ${selectionMode ? 'disabled' : ''}`}
                  disabled={selectionMode}
                >
                  <Calendar size={16} /> Block Day/Time
                </button>
                <button
                  onClick={() => !selectionMode && setActiveTab('leave')}
                  className={`tab-btn ${activeTab === 'leave' ? 'active' : ''} ${selectionMode ? 'disabled' : ''}`}
                  disabled={selectionMode}
                >
                  <CalendarDays size={16} /> Month Leave
                </button>
                <button
                  onClick={() => !selectionMode && setActiveTab('list')}
                  className={`tab-btn ${activeTab === 'list' ? 'active' : ''} ${selectionMode ? 'disabled' : ''}`}
                  disabled={selectionMode}
                >
                  <Clock size={16} /> View All ({totalBlocks})
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'block' ? (
                  <div className="block-form">
                    <div className="form-group">
                      <label>Selected Date</label>
                      <div className="selected-date-display">
                        {PHTimeUtils.formatFullDateTimePH(selectedDate)}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Block Type</label>
                      <div className="block-type-selector">
                        <button
                          className={`block-type-btn ${blockType === 'full' ? 'active' : ''}`}
                          onClick={() => { setBlockType('full'); setValidationError(''); }}
                        >
                          Full Day
                        </button>
                        <button
                          className={`block-type-btn ${blockType === 'partial' ? 'active' : ''}`}
                          onClick={() => { setBlockType('partial'); setValidationError(''); }}
                        >
                          Time Range
                        </button>
                      </div>
                    </div>  

                        {validationError && (
                          <div className="validation-error" style={{ 
                            color: '#dc3545', 
                            fontSize: '15px', 
                            marginTop: '-8px',
                            borderRadius: '12px',
                            padding: '10px',
                            backgroundColor: '#f8d7da',
                            borderRadius: '4px',
                            border: '1px solid #f5c6cb'
                          }}>
                            {validationError}
                          </div>
                        )}

                    {blockType === 'partial' && (
                      <div className="time-inputs">
                        <div className="form-group">
                          <label>Start Time</label>
                          <div className="time-picker-wrapper" ref={startPickerRef}>
                            <input
                              type="text"
                              readOnly
                              value={`${startPickerValue.hour}:${startPickerValue.minute} ${startPickerValue.period}`}
                              onClick={() => !dayFullyBlocked && setShowStartPicker(!showStartPicker)}
                              className={`form-input ${validationError ? 'error' : ''}`}
                            />
                            {showStartPicker && (
                              <div className="time-picker-dropdown-ios">
                                <IOSTimePicker value={startPickerValue} onChange={setStartPickerValue} isStart={true} />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label>End Time</label>
                          <div className="time-picker-wrapper" ref={endPickerRef}>
                            <input
                              type="text"
                              readOnly
                              value={`${endPickerValue.hour}:${endPickerValue.minute} ${endPickerValue.period}`}
                              onClick={() => !dayFullyBlocked && setShowEndPicker(!showEndPicker)}
                              className={`form-input ${validationError ? 'error' : ''}`}
                            />
                            {showEndPicker && (
                              <div className="time-picker-dropdown-ios">
                                <IOSTimePicker value={endPickerValue} onChange={setEndPickerValue} isStart={false} />
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    <div className="form-group">
                      <label>Reason (Optional)</label>
                      <textarea
                        className="form-textarea"
                        placeholder="e.g., Meeting, Personal leave..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        maxLength={200}
                      />
                    </div>
                    <button
                      onClick={() => handleAddBlock(selectedDate)}
                      className="add-block-btn"
                      disabled={ dayFullyBlocked || hasAppointmentOnDate(selectedDate) || isLoading || (blockType === 'partial' && (dayFullyBlocked || validationError))}
                    >
                      {isLoading ? 'Processing...' : (editingId ? 'Update Block' : 'Add Block')}
                    </button>
                  </div>
                ) : activeTab === 'leave' ? (
                  <div className="leave-form">
                    <div className="form-group">
                      <label>Select Month & Year</label>
                      <div className="month-year-picker">
                        <select
                          className="form-input"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                          {monthsShort.map((m, idx) => (
                            <option key={idx} value={idx + 1}>{m}</option>
                          ))}
                        </select>
                        <select
                          className="form-input"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                          {[...Array(5)].map((_, idx) => {
                            const year = new Date().getFullYear() + idx;
                            return <option key={year} value={year}>{year}</option>;
                          })}
                        </select>
                      </div>
                    </div>

                    <div className="leave-info-box">
                      <p> This will block all working days (Mon-Fri) in <strong>{monthsShort[selectedMonth - 1]} {selectedYear}</strong></p>
                      <p className="leave-info-note">Weekends are automatically excluded. Already blocked dates will be skipped.</p>
                    </div>

                    <div className="form-group">
                      <label>Reason *</label>
                      <textarea
                        className="form-textarea"
                        placeholder="e.g., Vacation, Training, Conference..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        maxLength={200}
                        required
                      />
                    </div>

                    <button
                      onClick={handleCreateMonthLeave}
                      className="add-leave-btn"
                      disabled={isLoading || !reason.trim()}
                    >
                      {isLoading ? 'Creating Leave...' : 'Create Month Leave'}
                    </button>
                  </div>
                ) : (
                  <div className="blocked-periods-tab">
                    {isLoading ? (
                      <div className="empty-state">
                        <p>Loading...</p>
                      </div>
                    ) : totalBlocks === 0 ? (
                      <div className="empty-state">
                        <Clock size={48} />
                        <p>No blocked periods yet</p>
                      </div>
                    ) : (
                      <>
                        {totalBlocks > 0 && (
                          <div className="blocked-section">
                            <div className="blocked-items">
                              {groupedBlocks.monthLeaves.map((leave, idx) => (
                                <div key={`month-${idx}`} className="blocked-item">
                                  <div className="blocked-item-info">
                                    <div className="blocked-item-date">
                                      {months[leave.month]} {leave.year} ({leave.blocks.length} days)
                                    </div>
                                    <div className="blocked-item-type">
                                      Month Leave
                                    </div>
                                    {leave.reason && (
                                      <div className="blocked-item-reason">{leave.reason}</div>
                                    )}
                                  </div>
                                  <div className="blocked-item-actions">
                                    <button
                                      className="icon-btn delete"
                                      onClick={() => handleDeleteGroup(leave.blocks, 'Month Leave')}
                                      disabled={isLoading}
                                      aria-label="Delete"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {groupedBlocks.bulkBlocks.map((bulk, idx) => (
                                <div key={`bulk-${idx}`} className="blocked-item">
                                  <div className="blocked-item-info">
                                    <div className="blocked-item-date">
                                      {bulk.blocks.length === 1 
                                        ? PHTimeUtils.formatShortDatePH(bulk.blocks[0].scheduledDate)
                                        : `${PHTimeUtils.formatShortDatePH(bulk.blocks[0].scheduledDate)} - ${PHTimeUtils.formatShortDatePH(bulk.blocks[bulk.blocks.length - 1].scheduledDate)}`
                                      } ({bulk.blocks.length} {bulk.blocks.length === 1 ? 'day' : 'days'})
                                    </div>
                                    <div className="blocked-item-type">
                                      Bulk Block
                                    </div>
                                    {bulk.reason && (
                                      <div className="blocked-item-reason">{bulk.reason}</div>
                                    )}
                                  </div>
                                  <div className="blocked-item-actions">
                                    <button
                                      className="icon-btn delete"
                                      onClick={() => handleDeleteGroup(bulk.blocks, 'Bulk Block')}
                                      disabled={isLoading}
                                      aria-label="Delete"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}

                              {groupedBlocks.individualBlocks.map(period => (
                                <div key={period.appointmentId} className="blocked-item">
                                  <div className="blocked-item-info">
                                    <div className="blocked-item-date">
                                      {PHTimeUtils.formatShortDatePH(period.scheduledDate)}
                                    </div>
                                    <div className="blocked-item-type">
                                      {period.endDate
                                        ? `${PHTimeUtils.formatTimeForInput(
                                            PHTimeUtils.parseUTCToPH(period.scheduledDate)
                                          )} - ${PHTimeUtils.formatTimeForInput(
                                            PHTimeUtils.parseUTCToPH(period.endDate)
                                          )}`
                                        : 'Full Day'}
                                    </div>
                                    {period.notes && (
                                      <div className="blocked-item-reason">{period.notes}</div>
                                    )}
                                  </div>
                                  <div className="blocked-item-actions">
                                    {period.endDate && (
                                      <button
                                        className="icon-btn"
                                        onClick={() => handleEdit(period)}
                                        disabled={isLoading}
                                        aria-label="Edit"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                    )}
                                    <button
                                      className="icon-btn delete"
                                      onClick={() => handleDelete(period.appointmentId)}
                                      disabled={isLoading}
                                      aria-label="Delete"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAvailability;