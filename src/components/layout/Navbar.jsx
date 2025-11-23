import React, { useEffect, useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import '../../css/Navbar.css';
import NotificationModal from '../pages/modal/NotificationModal';
import ProfileModal from './../pages/modal/ProfileModal';
import { getUnreadNotification, getProfileByEmployeeNumber } from '../../service/counselor';

const Navbar = () => { 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState(null);

  const fetchUnreadCount = async () => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const count = await getUnreadNotification(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const fetchProfile = async () => {
    try {
      const employeeNumber = localStorage.getItem("guidanceStaffId");
      if (!employeeNumber) return;

      const data = await getProfileByEmployeeNumber(employeeNumber);
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    fetchProfile();
  }, []);

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchUnreadCount();
  };

  const getFullName = () => {
    if (!profile) return "Loading";
    return `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || "User";
  };

  return (
    <nav className="navbar">
      <div className="navbar-actions">
        <button 
          className={`notification-button ${isModalOpen ? 'active' : ''}`}
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
          className={`profile-section ${isProfileModalOpen ? 'active' : ''}`}
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
          onNotificationRead={fetchUnreadCount}
        />
      </div>
    </nav>
  );
};

export default Navbar;