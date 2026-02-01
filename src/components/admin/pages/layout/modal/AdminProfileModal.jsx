import React, { useEffect , useState } from 'react'
import "../../../../../css/ProfileModal.css";
import "../../../../../css/Navbar.css";
import { getAdminProfile } from '../../../../../service/admin';

const AdminProfileModal = ({isOpen}) => {
     const [profile, setProfile] = useState(null);
      const [loading, setIsLoading] = useState(false);
    
      const displayProfile = async (userId) => {
        try {
          setIsLoading(true);
          const data = await getAdminProfile(userId);
          setProfile(data);
        } catch (err) {
          console.error("Error fetching profile:", err);
        } finally {
          setIsLoading(false); 
        }
      };
    const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("guidanceStaffId");
    window.location.href = "/GuidanceLogin";
  };

  const getFullName = () => {
        if(!profile) {
            return "Loading ..";
        }

      const firstname = profile.firstname.charAt(0).toUpperCase() + profile.firstname.slice(1);
      const lastname = profile.lastname.charAt(0).toUpperCase() + profile.lastname.slice(1);
      return `${firstname} ${lastname}`.trim() || "User";
  }

  useEffect(() => {
    if(isOpen) {
        const userId = localStorage.getItem("userId");
        if(userId) {
         displayProfile(userId);
        }
    }
  },[isOpen])

  if(!isOpen) {return;}  
  return (
    <>
      <div className="profile-modal-backdrop"></div>
      <div className="profile-modal">
        <div className="profile-modal-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading profile...</p>
            </div>
          ) : (
            <>
              <div className="profile-header">
                <h3 className="profile-name">{getFullName()}</h3>
                <span className="profile-role">Admin</span>
              </div>

              <div className="profile-divider"></div>

              <div className="profile-details">
                  <div className="profile-field">
                    <span className="field-label">Email Address</span>
                    <span className="field-value">{profile?.email || "Not provided"}</span>
                  </div>
              </div>

              <div className="profile-actions">
                <button className="logout" onClick={handleLogout}>
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default AdminProfileModal
