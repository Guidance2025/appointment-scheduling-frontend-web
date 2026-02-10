import React, { useEffect, useState, useRef } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import '../../css/Navbar.css';
import NotificationModal from '../pages/modal/NotificationModal';
import ProfileModal from './../pages/modal/ProfileModal';
import { getUnreadNotification, getProfileByEmployeeNumber } from '../../service/counselor';
import { listenForForegroundMessages } from '../../utils/firebase';

// ✅ REMOVED: requestForToken import — only NotificationPrompt should call it

const Navbar = () => { 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState(null);
  const audioRef = useRef(new Audio("/bell/notification-bell.mp3"));
  const userId = localStorage.getItem("userId");

  const fetchUnreadCount = async () => {
    if (!userId) return;
    const count = await getUnreadNotification(userId);
    setUnreadCount(count);
  };

  const fetchProfile = async () => {
    const employeeNumber = localStorage.getItem("guidanceStaffId");
    if (!employeeNumber) return;
    const data = await getProfileByEmployeeNumber(employeeNumber);
    setProfile(data);
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchProfile();

    // ✅ REMOVED: requestForToken() call here
    // Token is already registered in NotificationPrompt after login
    // We only need to LISTEN for foreground messages here

    const unsubscribe = listenForForegroundMessages((payload) => {
      console.log("Foreground notification:", payload);
      audioRef.current.play().catch(err => console.warn("Audio play failed:", err));
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      unsubscribe();
    };
  }, []);

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
          className={`notification-button`}
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
          className={`profile-section`}
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