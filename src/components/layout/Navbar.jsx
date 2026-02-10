import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import '../../css/Navbar.css';
import NotificationModal from '../pages/modal/NotificationModal';
import ProfileModal from './../pages/modal/ProfileModal';
import { getUnreadNotification, getProfileByEmployeeNumber } from '../../service/counselor';

const POLL_INTERVAL = 15000; 

const Navbar = () => { 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState(null);

  const audioRef = useRef(new Audio("/bell/notification-bell.mp3"));
  const userId = localStorage.getItem("userId");
  const pollRef = useRef(null);
  const pendingSoundRef = useRef(false); // play sound when user returns to tab

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;
    const count = await getUnreadNotification(userId);
    setUnreadCount(count);
  }, [userId]);

  const fetchProfile = async () => {
    const employeeNumber = localStorage.getItem("guidanceStaffId");
    if (!employeeNumber) return;
    const data = await getProfileByEmployeeNumber(employeeNumber);
    setProfile(data);
  };

  const playSound = useCallback(() => {
    audioRef.current.play().catch(err => console.warn("Audio play failed:", err));
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(() => {
      fetchUnreadCount();
    }, POLL_INTERVAL);
  }, [fetchUnreadCount]);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    fetchProfile();
    startPolling();

    const unsubscribeFCM = listenForForegroundMessages((payload) => {
      console.log("Foreground FCM:", payload);
      playSound();
      fetchUnreadCount();
    });

    const handleSWMessage = (event) => {
      if (event.data?.type === "FCM_BACKGROUND_MESSAGE") {
        console.log("SW background message received");
        fetchUnreadCount();
        pendingSoundRef.current = true; // play sound on next focus
      }
    };

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", handleSWMessage);
    }

    return () => {
      unsubscribeFCM();
      stopPolling();
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      }
    };
  }, [fetchUnreadCount, startPolling, stopPolling, playSound]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount(); 
        startPolling();
        if (pendingSoundRef.current) {
          playSound();
          pendingSoundRef.current = false;
        }
      } else {
        stopPolling(); // save resources when tab is hidden
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchUnreadCount, startPolling, stopPolling, playSound]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchUnreadCount();
  };

  const getFullName = () => {
    if (!profile) return "Loading";
    return `${profile.firstName || ''}`.trim() || "User";
  };

  return (
    <nav className="navbar">
      <div className="navbar-actions">
        <button 
          className="notification-button"
          style={isModalOpen ? { backgroundColor: "rgba(255, 9, 9, 0.089)" } : {}}
          onClick={() => setIsModalOpen(!isModalOpen)}
          aria-label="Notifications"
        > 
          <Bell strokeWidth={1.5} size={20} />
          {unreadCount > 0 && (
            <span className='badge'>
              <span className='badgeText'>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </span>
          )}
        </button> 

        <div 
          className="profile-section"
          style={isProfileModalOpen ? { backgroundColor: "rgba(9, 255, 58, 0.089)" } : {}}
          onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
        >
          <div className="profile-info">
            <span className="profile-name">{getFullName()}</span>
          </div>
          <ChevronDown size={18} className="profile-chevron" />
        </div>

        <ProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
        
        <NotificationModal 
          isOpen={isModalOpen} 
          onClose={handleModalClose}
          fetchUnread={fetchUnreadCount} 
        />
      </div>
    </nav>
  );
};

export default Navbar;