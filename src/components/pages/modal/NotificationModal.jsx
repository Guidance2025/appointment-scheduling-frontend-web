import React, { useState, useEffect, useCallback, useRef } from "react";
import "../../../css/Navbar.css";
import { getNotificationByUser, markNotificationAsRead } from "../../../service/counselor";
import { getClass, getLabel } from "../../../helper/NotificationHelper";
import { listenForForegroundMessages } from "../../../utils/firebase";
import { API_BASE_URL } from "../../../../constants/api";
import { usePopUp } from "../../../helper/message/pop/up/provider/PopUpModalProvider";
import * as PHTimeUtils from "../../../utils/dateTime"; 

const NotificationModal = ({ isOpen, fetchUnread }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [processingIds, setProcessingIds] = useState(new Set());
  
  const audioRef = useRef(new Audio("/bell/notification-bell.mp3"));
  const userIdRef = useRef(localStorage.getItem("userId"));
  const { showSuccess, showError } = usePopUp();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); 
    
    return () => clearInterval(timer);
  }, []);

  const getRelativeTime = (createdAt) => {
    const now = currentTime;
    const notificationTime = PHTimeUtils.parseUTCToPH(createdAt);
    const diffInSeconds = Math.floor((now - notificationTime) / 1000);
    
    if (diffInSeconds < 60) {
      return "Just now";
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return diffInDays === 1 ? "Yesterday" : `${diffInDays} days ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
    }
    
    return PHTimeUtils.formatDatePH(notificationTime);
  };

  const getLatestRescheduleNotifications = (notifications) => {
    const rescheduleGroups = {};
    
    notifications.forEach(notif => {
      if (notif.actionType === "RESCHEDULE REQUEST" && 
          notif.appointment?.appointmentId) {
        const appointmentId = notif.appointment.appointmentId;
        
        if (!rescheduleGroups[appointmentId]) {
          rescheduleGroups[appointmentId] = [];
        }
        rescheduleGroups[appointmentId].push(notif);
      }
    });
    
    const latestNotificationIds = new Set();
    
    Object.values(rescheduleGroups).forEach(group => {
      group.sort((a, b) => {
        const timeA = PHTimeUtils.parseUTCToPH(a.createdAt);
        const timeB = PHTimeUtils.parseUTCToPH(b.createdAt);
        return timeB - timeA;
      });
      
      if (group.length > 0 && group[0].appointment?.status === "RESCHEDULE_PENDING") {
        latestNotificationIds.add(group[0].notificationId);
      }
    });
    
    return latestNotificationIds;
  };

  const getLatestAppointmentRequests = (notifications) => {
    const appointmentGroups = {};
    
    notifications.forEach(notif => {
      if (notif.actionType === "APPOINTMENT_REQUEST" && 
          notif.appointment?.appointmentId) {
        const appointmentId = notif.appointment.appointmentId;
        
        if (!appointmentGroups[appointmentId]) {
          appointmentGroups[appointmentId] = [];
        }
        appointmentGroups[appointmentId].push(notif);
      }
    });
    
    const latestNotificationIds = new Set();
    
    Object.values(appointmentGroups).forEach(group => {
      group.sort((a, b) => {
        const timeA = PHTimeUtils.parseUTCToPH(a.createdAt);
        const timeB = PHTimeUtils.parseUTCToPH(b.createdAt);
        return timeB - timeA;
      });
      
      if (group.length > 0 && group[0].appointment?.status === "PENDING") {
        latestNotificationIds.add(group[0].notificationId);
      }
    });
    
    return latestNotificationIds;
  };

  const shouldShowActionButtons = (notification, latestRescheduleIds, latestAppointmentIds) => {
    if (notification.isRead) return false;
    
    if (notification.actionType === "APPOINTMENT_REQUEST") {
      return notification.appointment?.status === "PENDING" &&
             latestAppointmentIds.has(notification.notificationId);
    }
    
    if (notification.actionType === "RESCHEDULE REQUEST") {
      return notification.appointment?.status === "RESCHEDULE_PENDING" &&
             latestRescheduleIds.has(notification.notificationId);
    }
    
    return false;
  };

  const guidanceStaffAppointmentResponse = async (appointmentId, action) => {
    const JWT_TOKEN = localStorage.getItem("jwtToken");
    try {
      const response = await fetch(
        `${API_BASE_URL}/counselor/${appointmentId}/guidance/response`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${JWT_TOKEN}`,
          },
          body: JSON.stringify({ action }),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      return await response.json();
    } catch (error) {
      console.error("Error responding to appointment:", error);
      throw error;
    }
  };

  const handleAcceptAppointment = async (appointmentId) => {
    if (processingIds.has(appointmentId)) return;
    
    setProcessingIds(prev => new Set(prev).add(appointmentId));
    try {
      setIsDisabled(true);
      await guidanceStaffAppointmentResponse(appointmentId, "ACCEPT");
      showSuccess("Appointment accepted successfully", "Please check your calendar", 2000);
      loadNotifications();
      fetchUnread();
      if (typeof window.refreshCalendar === "function") window.refreshCalendar();
    } catch (error) {
      if (error.message.includes("not in PENDING status") || error.message.includes("already")) {
        showError("Already Processed", "This appointment has already been handled", 3000);
        loadNotifications();
        fetchUnread();
      } else {
        showError("Failed to accept appointment", error.message || "Please try again", 3000);
      }
    } finally {
      setIsDisabled(false);
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleDeclineAppointment = async (appointmentId) => {
    if (processingIds.has(appointmentId)) return;
    
    setProcessingIds(prev => new Set(prev).add(appointmentId));
    try {
      setIsDisabled(true);
      await guidanceStaffAppointmentResponse(appointmentId, "DECLINE");
      showSuccess("Appointment declined successfully", "Try again next time!", 2000);
      loadNotifications();
      fetchUnread();
      if (typeof window.refreshCalendar === "function") window.refreshCalendar();
    } catch (error) {
      if (error.message.includes("not in PENDING status") || error.message.includes("already")) {
        showError("Already Processed", "This appointment has already been handled", 3000);
        loadNotifications();
        fetchUnread();
      } else {
        showError("Failed to decline appointment", error.message || "Please try again", 3000);
      }
    } finally {
      setIsDisabled(false);
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleAcceptReschedule = async (appointmentId) => {
    if (processingIds.has(appointmentId)) return;
    
    setProcessingIds(prev => new Set(prev).add(appointmentId));
    try {
      setIsDisabled(true);
      const JWT_TOKEN = localStorage.getItem("jwtToken");
      
      const response = await fetch(
        `${API_BASE_URL}/counselor/${appointmentId}/reschedule/response`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${JWT_TOKEN}`,
          },
          body: JSON.stringify({ action: "ACCEPT" }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        
        if (errorText.includes("not pending reschedule approval") || 
            errorText.includes("already") ||
            errorText.includes("RESCHEDULE_PENDING")) {
          showError("Reschedule Already Processed", "This request has already been handled", 3000);
          loadNotifications();
          fetchUnread();
          return;
        }
        
        if (errorText.includes("TIME SLOT IS BLOCKED") || 
            errorText.includes("UNAVAILABLE FOR APPOINTMENTS")) {
          showError("Time Slot Unavailable", "The requested time slot is blocked. Please decline and ask student to choose another time.", 4000);
          loadNotifications();
          fetchUnread();
          return;
        }
        
        if (errorText.includes("CONFLICT") || response.status === 409) {
          showError("Schedule Conflict", "This time slot conflicts with another appointment", 3000);
          loadNotifications();
          fetchUnread();
          return;
        }
        
        throw new Error(errorText);
      }
      
      showSuccess("Reschedule approved successfully", "Appointment time updated", 2000);
      loadNotifications();
      fetchUnread();
      if (typeof window.refreshCalendar === "function") window.refreshCalendar();
    } catch (error) {
      console.error("Error approving reschedule:", error);
      
      if (!error.message.includes("not pending reschedule approval") && 
          !error.message.includes("already")) {
        showError("Failed to approve reschedule", error.message || "Please try again", 3000);
      }
    } finally {
      setIsDisabled(false);
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const handleDeclineReschedule = async (appointmentId) => {
    if (processingIds.has(appointmentId)) return;
    
    setProcessingIds(prev => new Set(prev).add(appointmentId));
    try {
      setIsDisabled(true);
      const JWT_TOKEN = localStorage.getItem("jwtToken");
      
      const response = await fetch(
        `${API_BASE_URL}/counselor/${appointmentId}/reschedule/response`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${JWT_TOKEN}`,
          },
          body: JSON.stringify({ action: "DECLINE" }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        
        if (errorText.includes("not pending reschedule approval") || 
            errorText.includes("already") ||
            errorText.includes("RESCHEDULE_PENDING")) {
          showError("Reschedule Already Processed", "This request has already been handled", 3000);
          loadNotifications();
          fetchUnread();
          return;
        }
        
        throw new Error(errorText);
      }
      
      showSuccess("Reschedule declined", "Original appointment time maintained", 2000);
      loadNotifications();
      fetchUnread();
      if (typeof window.refreshCalendar === "function") window.refreshCalendar();
    } catch (error) {
      console.error("Error declining reschedule:", error);
      
      if (!error.message.includes("not pending reschedule approval") && 
          !error.message.includes("already")) {
        showError("Failed to decline reschedule", error.message || "Please try again", 3000);
      }
    } finally {
      setIsDisabled(false);
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });
    }
  };

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const JWT_TOKEN = localStorage.getItem("jwtToken");
      const response = await fetch(`${API_BASE_URL}/notification/${userIdRef.current}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${JWT_TOKEN}` },
      });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const data = await response.json();
      
      const now = new Date();
      const filteredData = data.filter(notif => {
        if (notif.actionType === "APPOINTMENT_EXPIRED") {
          const notifTime = PHTimeUtils.parseUTCToPH(notif.createdAt);
          const hoursSinceExpired = (now - notifTime) / (1000 * 60 * 60);
          return hoursSinceExpired < 24;
        }
        
        return true;
      });
      
      filteredData.sort((a, b) => {
        const timeA = PHTimeUtils.parseUTCToPH(a.createdAt);
        const timeB = PHTimeUtils.parseUTCToPH(b.createdAt);
        return timeB - timeA;
      });
      
      setNotifications(filteredData);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("Failed to load notifications. Please try again.");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = async () => {
    if (isMarkingRead) return;
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    if (unreadCount === 0) return;
    try {
      setIsMarkingRead(true);
      await markNotificationAsRead(userIdRef.current);
      loadNotifications();
      fetchUnread();
    } catch {
      setError("Failed to mark notifications as read");
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) console.log("Clicked notification:", notification);
    setSelectedNotification(notification);
  };

  const fetchUnreadRef = useRef(fetchUnread);
  useEffect(() => { fetchUnreadRef.current = fetchUnread; }, [fetchUnread]);

  useEffect(() => {
    if (typeof window.refreshCalendar === "function") {
      window.refreshCalendar();
    }
    loadNotifications();
    const unsubscribe = listenForForegroundMessages(() => {
      if (typeof window.refreshCalendar === "function") {
        window.refreshCalendar();
      }
      audioRef.current.play().catch(() => {});
      loadNotifications();
      fetchUnreadRef.current();
    });
    return () => unsubscribe();
  }, [isOpen, loadNotifications]);

  if (!isOpen) return null;
  
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const latestRescheduleIds = getLatestRescheduleNotifications(notifications);
  const latestAppointmentIds = getLatestAppointmentRequests(notifications);

  const now = new Date();
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const newNotifications = notifications.filter(notif => {
    const notifTime = PHTimeUtils.parseUTCToPH(notif.createdAt);
    return notifTime && notifTime >= last24Hours;
  });
  
  const earlierNotifications = notifications.filter(notif => {
    const notifTime = PHTimeUtils.parseUTCToPH(notif.createdAt);
    return notifTime && notifTime < last24Hours;
  });

  return (
    <div className="notification-modal">
      <div className="notification-modal-header">
        <h3>Notifications</h3>
        <div className="notification-modal-actions">
          {unreadCount > 0 && (
            <button className="mark-as-read-button" onClick={markAsRead} disabled={isMarkingRead}>
              {isMarkingRead ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="notification-error">{error}</div>}

      <div className="notification-modal-content">
        {isLoading ? (
          <div className="notification-loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <p className="no-notifications">No new notifications</p>
        ) : (
          <>
            {newNotifications.length > 0 && (
              <>
                <div className="notification-section-header">New</div>
                {newNotifications.map((notif) => {
                  const isProcessing = processingIds.has(notif.appointment?.appointmentId);
                  
                  return (
                    <div
                      key={notif.notificationId}
                      className={getClass(notif)}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {!notif.isRead && <div className="notification-unread-dot"></div>}
                      <div className="notification-item-content">
                        <p className="notification-type">{getLabel(notif.actionType)}</p>
                        <p className="notification-message">{notif.message || "New notification"}</p>
                        
                        <p className="notification-time">{getRelativeTime(notif.createdAt)}</p>

                        {shouldShowActionButtons(notif, latestRescheduleIds, latestAppointmentIds) && 
                         notif.actionType === "APPOINTMENT_REQUEST" && (
                          <div className="notification-actions">
                            <button
                              className="notification-accept-btn"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleAcceptAppointment(notif.appointment.appointmentId); 
                              }}
                              disabled={isDisabled || isProcessing}
                            >
                              {isProcessing ? "Processing..." : "Accept"}
                            </button>
                            <button
                              className="notification-decline-btn"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeclineAppointment(notif.appointment.appointmentId); 
                              }}
                              disabled={isDisabled || isProcessing}
                            >
                              {isProcessing ? "Processing..." : "Decline"}
                            </button>
                          </div>
                        )}

                        {shouldShowActionButtons(notif, latestRescheduleIds, latestAppointmentIds) && 
                         notif.actionType === "RESCHEDULE REQUEST" && (
                          <div className="notification-actions">
                            <button
                              className="notification-accept-btn"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleAcceptReschedule(notif.appointment.appointmentId); 
                              }}
                              disabled={isDisabled || isProcessing}
                            >
                              {isProcessing ? "Processing..." : "Approve"}
                            </button>
                            <button
                              className="notification-decline-btn"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeclineReschedule(notif.appointment.appointmentId); 
                              }}
                              disabled={isDisabled || isProcessing}
                            >
                              {isProcessing ? "Processing..." : "Decline"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {earlierNotifications.length > 0 && (
              <>
                <div className="notification-section-header">Earlier</div>
                {earlierNotifications.map((notif) => {
                  const isProcessing = processingIds.has(notif.appointment?.appointmentId);
                  
                  return (
                    <div
                      key={notif.notificationId}
                      className={getClass(notif)}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      {!notif.isRead && <div className="notification-unread-dot"></div>}
                      <div className="notification-item-content">
                        <p className="notification-type">{getLabel(notif.actionType)}</p>
                        <p className="notification-message">{notif.message || "New notification"}</p>
                        
                        <p className="notification-time">{getRelativeTime(notif.createdAt)}</p>

                        {shouldShowActionButtons(notif, latestRescheduleIds, latestAppointmentIds) && 
                         notif.actionType === "APPOINTMENT_REQUEST" && (
                          <div className="notification-actions">
                            <button
                              className="notification-accept-btn"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleAcceptAppointment(notif.appointment.appointmentId); 
                              }}
                              disabled={isDisabled || isProcessing}
                            >
                              {isProcessing ? "Processing..." : "Accept"}
                            </button>
                            <button
                              className="notification-decline-btn"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeclineAppointment(notif.appointment.appointmentId); 
                              }}
                              disabled={isDisabled || isProcessing}
                            >
                              {isProcessing ? "Processing..." : "Decline"}
                            </button>
                          </div>
                        )}

                        {shouldShowActionButtons(notif, latestRescheduleIds, latestAppointmentIds) && 
                         notif.actionType === "RESCHEDULE REQUEST" && (
                          <div className="notification-actions">
                            <button
                              className="notification-accept-btn"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleAcceptReschedule(notif.appointment.appointmentId); 
                              }}
                              disabled={isDisabled || isProcessing}
                            >
                              {isProcessing ? "Processing..." : "Approve"}
                            </button>
                            <button
                              className="notification-decline-btn"
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                handleDeclineReschedule(notif.appointment.appointmentId); 
                              }}
                              disabled={isDisabled || isProcessing}
                            >
                              {isProcessing ? "Processing..." : "Decline"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationModal;