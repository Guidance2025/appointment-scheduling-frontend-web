import React, { useEffect, useState } from "react";
import "../../../css/ProfileModal.css";
import "../../../css/Navbar.css";
import { getProfileByEmployeeNumber } from "../../../service/counselor";
import { DoorClosedIcon } from "lucide-react";

const ProfileModal = ({ isOpen, onClose,}) => {
  const [profile, setProfile] = useState(null);
  const [loading, setIsLoading] = useState(false);

  const displayProfile = async (employeeNumber) => {
    try {
      setIsLoading(true);
      const data = await getProfileByEmployeeNumber(employeeNumber);
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (isOpen) {
      const employeeNumber = localStorage.getItem("guidanceStaffId");
      if (employeeNumber) {
        displayProfile(employeeNumber);
      }
    }
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("guidanceStaffId");
    window.location.href = "/GuidanceLogin";
  };


  const getFullName = () => {
    if (!profile) return "Loading...";
    const parts = [profile.firstName, profile.middleName, profile.lastName].filter(Boolean);
    return parts.join(" ") || "Unknown User";
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="profile-modal-backdrop" onClick={onClose}></div>
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
                <span className="profile-role">{profile?.positionInRc}</span>
              </div>

              <div className="profile-divider"></div>

              <div className="profile-details">
                <div className="profile-field">
                  <span className="field-label">Email Address</span>
                  <span className="field-value">{profile?.email || "Not provided"}</span>
                </div>
                <div className="profile-field">
                  <span className="field-label">Contact Number</span>
                  <span className="field-value">{profile?.contactNumber || "Not provided"}</span>
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
  );
};

export default ProfileModal;