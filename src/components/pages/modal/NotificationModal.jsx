import React, { useState, useEffect, useCallback, useRef } from "react";
import "../../../css/Navbar.css";
import { getNotificationByUser, markNotificationAsRead } from "../../../service/counselor";
import { getClass, getLabel } from "../../../helper/NotificationHelper";
import { listenForForegroundMessages } from "../../../utils/firebase";
import { API_BASE_URL } from "../../../../constants/api";
import { usePopUp } from "../../../helper/message/pop/up/provider/PopUpModalProvider";

const parseUTCToPH = (utcString) => {
  if (!utcString) return null;
  const date = new Date(utcString + "Z");
  return isNaN(date.getTime()) ? null : date;
};

export const formatAppointmentDateTime = (scheduledDate, endDate) => {
  const startDate = parseUTCToPH(scheduledDate);
  if (!startDate) return { date: "N/A", timeRange: "N/A" };

  const formattedDate = startDate.toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const startTime = startDate.toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (!endDate) return { date: formattedDate, timeRange: startTime };

  const actualEndDate = parseUTCToPH(endDate);
  if (!actualEndDate) return { date: formattedDate, timeRange: startTime };

  const endTime = actualEndDate.toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date: formattedDate, timeRange: `${startTime} - ${endTime}` };
};

const NotificationModal = ({ isOpen, fetchUnread }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [error, setError] = useState(null);
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const audioRef = useRef(new Audio("/bell/notification-bell.mp3"));
  
  const userIdRef = useRef(localStorage.getItem("userId"));
  const userId = userIdRef.current;
  
  const {showSuccess, showError} = usePopUp();
  
  const guidanceStaffAppointmentResponse = async (appointmentId, action) => {
    const JWT_TOKEN = localStorage.getItem("jwtToken"); 
    try {
      const response = await fetch(
        `http://localhost:8080/counselor/${appointmentId}/guidance/response`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${JWT_TOKEN}`,
          },
          body: JSON.stringify({ action }),
        }
      );
      if (!response.ok) throw new Error(await response.text());
      return await response.json();
    } catch (error) {
      console.error("Error responding to appointment:", error);
      throw error;
    }
  };

  const handleAcceptAppointment = async (appointmentId) => {
    try {
      setIsDisabled(true);
      await guidanceStaffAppointmentResponse(appointmentId, "ACCEPT");
      showSuccess("Appointment accepted successfully", "Please Check your Calendar", 2000);
      loadNotifications();
      fetchUnread();
      
      if (typeof window.refreshCalendar === 'function') {
        window.refreshCalendar();
      }
    } catch {
      alert("Failed to accept appointment");
    } finally {
      setIsDisabled(false);
    }
  };

  const handleDeclineAppointment = async (appointmentId) => {
    try {
      setIsDisabled(true);
      await guidanceStaffAppointmentResponse(appointmentId, "DECLINE");
      showError("Appointment declined successfully", "Not Today", 2000);
      loadNotifications();
      fetchUnread();
      
      if (typeof window.refreshCalendar === 'function') {
        window.refreshCalendar();
      }
    } catch {
      alert("Failed to decline appointment");
    } finally {
      setIsDisabled(false);
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
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications(data);
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
    const unreadCount = notifications.filter(n => !n.isRead).length;
    if (unreadCount === 0) return;
    try {
      setIsMarkingRead(true);
      await markNotificationAsRead(userId);
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
    loadNotifications();
    const unsubscribe = listenForForegroundMessages(() => {
      audioRef.current.play().catch(() => {});
      loadNotifications();
      fetchUnreadRef.current();
    });
    return () => unsubscribe();
  }, [isOpen, loadNotifications]);

  if (!isOpen) return null;
  const unreadCount = notifications.filter(n => !n.isRead).length;

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
          notifications.map((notif) => {
            const { date, timeRange } = formatAppointmentDateTime(notif.createdAt, notif.endDate);

            return (
              <div key={notif.notificationId} className={getClass(notif)} onClick={() => handleNotificationClick(notif)}>
                {!notif.isRead && <div className="notification-unread-dot"></div>}
                <div className="notification-item-content">
                  <p className="notification-type">{getLabel(notif.actionType)}</p>
                  <p className="notification-message">{notif.message || "New notification"}</p>

                  {notif.actionType === "APPOINTMENT_REQUEST" && notif.appointment?.status === "PENDING" && (
                    <div className="notification-actions">
                      <button
                        className="notification-accept-btn"
                        onClick={(e) => { e.stopPropagation(); handleAcceptAppointment(notif.appointment.appointmentId); }}
                        disabled={isDisabled}
                      >
                        {isDisabled ? "Processing..." : "Accept"}
                      </button>
                      <button
                        className="notification-decline-btn"
                        onClick={(e) => { e.stopPropagation(); handleDeclineAppointment(notif.appointment.appointmentId); }}
                        disabled={isDisabled}
                      >
                        {isDisabled ? "Processing..." : "Decline"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationModal;