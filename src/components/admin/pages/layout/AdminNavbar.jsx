import { ChevronDown } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import '../../../../css/Navbar.css'
import { getAdminProfile } from '../../../../service/admin';
import AdminProfileModal from './modal/AdminProfileModal';

const AdminNavbar = () => {
const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
const [profile, setProfile] = useState(null);
const [loading,setIsLoading] = useState(false);

  const fetchAdminProfile = async () => {
    const userId = localStorage.getItem("userId");
    if(!userId) {
      alert("No UserId Provided");
    }
    try {
      setIsLoading(true);
      const data = await getAdminProfile(userId);

      setProfile(data);

      setIsLoading(false);

    }catch {
      console.error("Error Fetching on Layout Admin Profile");
    }
  }

  useEffect(() => {
    fetchAdminProfile();
  },[])

  const getFullName  = () => {
       if(!profile) {
      return "Loading..";
    }
    return `${profile.firstname || ''} ${profile.lastname || ''}`.trim() || "User";
  } 

  return (
       <nav className="navbar">
      <div className="navbar-actions">
        <div 
          className={`profile-section ${isProfileModalOpen ? 'active' : ''}`}
          onClick={() => setIsProfileModalOpen(!isProfileModalOpen)}
        >
          <div className="profile-info">
            <span className="profile-name">{getFullName()}</span>
          </div>
          <ChevronDown size={18} className="profile-chevron" />
        </div>
        <AdminProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)}/>
      </div>
    </nav>
  )
}

export default AdminNavbar
