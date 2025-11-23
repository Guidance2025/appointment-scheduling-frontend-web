import React, { useState, useEffect, useCallback, useRef } from "react";
import "../../../css/Navbar.css";
import { getNotificationByUser, markNotificationAsRead } from "../../../service/counselor";
import { getClass, getLabel } from "../../../helper/NotificationHelper";
import { formatDate } from "../../../helper/dateHelper";
import { listenForForegroundMessages } from "../../../utils/firebase";

const NotificationModal = ({ isOpen,fetchUnread }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(new Audio("/bell/notification-bell.mp3"));
  const userId = localStorage.getItem("userId");

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getNotificationByUser(userId);
      const data = Array.isArray(response) ? response : response?.notification || [];
      setNotifications(data);
    } catch (err) {
      console.error("Error loading notifications:", err);
      setError("Failed to load notifications. Please try again.");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const markAsRead = async () => {
    if (isMarkingRead) return;
    
    const unreadCount = notifications.filter(n => !n.isRead).length;
    if (unreadCount === 0) return;

    try {
      setIsMarkingRead(true);
      await markNotificationAsRead(userId);
      loadNotifications();
      fetchUnread();
    } catch (err) {
      console.error("Error marking as read:", err);
      setError("Failed to mark notifications as read");
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      console.log("Clicked notification:", notification);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    loadNotifications();

    const unsubscribe = listenForForegroundMessages(() => {
      audioRef.current.play().catch((err) => console.warn("Audio play failed:", err));
      loadNotifications();
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, loadNotifications]);

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="notification-modal">
      <div className="notification-modal-header">
        <h3>Notifications</h3>
        <div className="notification-modal-actions">
          {unreadCount > 0 && (
            <button 
              className="mark-as-read-button" 
              onClick={markAsRead}
              disabled={isMarkingRead}
            >
              {isMarkingRead ? "Marking..." : "Mark all as read"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="notification-error">
          {error}
        </div>
      )}

      <div className="notification-modal-content">
        {isLoading ? (
          <div className="notification-loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <p className="no-notifications">
            You're all caught up!<br />
            No new notifications
          </p>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.notificationId} 
              className={getClass(notif)}
              onClick={() => handleNotificationClick(notif)}
            >
              {!notif.isRead && <div className="notification-unread-dot"></div>}
              <div className="notification-item-content">
                <p className="notification-type">{getLabel(notif.actionType)}</p>
                <p className="notification-message">
                  {notif.message || "New notification"}
                </p>
                <p className="notification-date">{formatDate(notif.createdAt)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationModal;
