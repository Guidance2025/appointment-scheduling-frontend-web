import React, { useState, useEffect } from 'react';
import '../../../css/Navbar.css';
import { getNotificationByUser, markNotificationAsRead } from '../../../service/counselor';


const NotificationModal = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = async () => {
    try {
      const userId = localStorage.getItem("userId");
      setIsLoading(true);
      
      const response = await getNotificationByUser(userId);
      const data = Array.isArray(response) ? response : response?.notification || [];
      console.log(JSON.stringify(data));
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("Error marking as read:", error);
      loadNotifications();
    }
  };
  // TODO : Lilipat sa helper class
  const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getLabel = (type) => {
    const labels = {
      'APPOINTMENT_ACCEPTED': 'Appointment Accepted',
      'APPOINTMENT_DECLINED': 'Appointment Declined',
      'APPOINTMENT_REQUEST': 'New Appointment Request',
      'APPOINTMENT_CANCELLED': 'Appointment Cancelled',
      'ACCEPT': 'Accepted',
      'DECLINE': 'Declined'
    };
    return labels[type] || type;
  };

  const getClass = (notif) => {
    let className = 'notification-item';
    
    if (notif.isRead === 0 || notif.isRead === false) {
      className += ' unread';
    }
    
    if (notif.actionType?.includes('ACCEPT')) {
      className += ' notification-accepted';
    } else if (notif.actionType?.includes('DECLINE')) {
      className += ' notification-declined';
    } else if (notif.actionType === 'APPOINTMENT_REQUEST') {
      className += ' notification-request';
    }
    
    return className;
  };

  if (!isOpen) return null;

  return (
    <div className='notification-modal'>
      <div className='notification-modal-header'>
        <h3>Notifications</h3>
        <button className='close-button' onClick={onClose}>×</button>
      </div>
      <div className='notification-modal-content'>
        {isLoading ? (
          <div className='notification-loading'>
            <p>Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <p className='no-notifications'>No notifications yet</p>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.notificationId}
              className={getClass(notif)}
              onClick={() => markAsRead(notif.notificationId)} 
            >
              <div className='notification-item-content'>
                <p className='notification-type'>{getLabel(notif.actionType)}</p>
                <p className='notification-message'>{notif.message || "New notification"}</p>
                <p className='notification-date'>{formatDate(notif.createdAt)}</p>
              </div>
              {(notif.isRead === 0 || notif.isRead === false) && (
                <div className='notification-unread-dot'></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationModal;
