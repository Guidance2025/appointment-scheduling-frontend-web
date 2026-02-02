import React, { useEffect, useState } from "react";
import "../../../css/ProfileModal.css";
import "../../../css/Navbar.css";
import "../../../css/button/button.css";
import { getProfileByEmployeeNumber, updateCounselorProfile } from "../../../service/counselor";
import { usePopUp } from "../../../helper/message/pop/up/provider/PopUpModalProvider";

const ProfileModal = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const {showSuccess, showError} = usePopUp(false);
  
  const [editForm, setEditForm] = useState({
    email: "",
    contactNumber: ""
  });

  const [originalForm, setOriginalForm] = useState({
    email: "",
    contactNumber: ""
  });

  const displayProfile = async (employeeNumber) => {
    try {
      setIsLoading(true);
      const data = await getProfileByEmployeeNumber(employeeNumber);
      setProfile(data);
      const formData = {
        email: data.email || "",
        contactNumber: data.contactNumber || ""
      };
      setEditForm(formData);
      setOriginalForm(formData);
    } catch (err) {
      console.error("Error fetching profile:", err);
      showError("Failed to load profile. Please try again.", "", 3000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const employeeNumber = localStorage.getItem("guidanceStaffId");
      if (employeeNumber) displayProfile(employeeNumber);
    } else {
      setIsEditing(false);
    }
  }, [isOpen]);

  const hasChanges = () => {
    return editForm.email.trim() !== originalForm.email.trim() || 
           editForm.contactNumber.trim() !== originalForm.contactNumber.trim();
  };

  const getChangedFields = () => {
    const changes = [];
    if (editForm.email.trim() !== originalForm.email.trim()) {
      changes.push('email');
    }
    if (editForm.contactNumber.trim() !== originalForm.contactNumber.trim()) {
      changes.push('contact number');
    }
    return changes;
  };

  const handleSaveProfile = async () => {
    try {
      if (!editForm.email.trim()) {
        showError('Email address is required.', '', 3000);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editForm.email.trim())) {
        showError('Please enter a valid email address.', '', 3000);
        return;
      }

      if (!editForm.contactNumber.trim()) {
        showError('Contact number is required.', '', 3000);
        return;
      }

      const phoneRegex = /\d{10,}/;
      if (!phoneRegex.test(editForm.contactNumber.trim().replace(/\D/g, ''))) {
        showError('Please enter a valid contact number (at least 10 digits).', '', 3000);
        return;
      }

      setIsSaving(true);
      const guidanceStaffId = localStorage.getItem("guidanceStaffId");
      if (!guidanceStaffId) throw new Error("Guidance Staff ID not found");

      const updatedStaff = await updateCounselorProfile(guidanceStaffId, editForm);

      const newProfileData = {
        ...profile,
        email: updatedStaff.person.email,
        contactNumber: updatedStaff.person.contactNumber
      };
      setProfile(newProfileData);

      const newFormData = {
        email: updatedStaff.person.email,
        contactNumber: updatedStaff.person.contactNumber
      };
      setOriginalForm(newFormData);
      setEditForm(newFormData);

      setIsEditing(false);

      const changedFields = getChangedFields();
      const fieldsText = changedFields.length === 1 
        ? changedFields[0] 
        : changedFields.join(' and ');
      
      showSuccess(
        "Profile Updated Successfully!", 
        `Your ${fieldsText} has been updated.`, 
        3000
      );
    } catch (err) {
      console.error('Profile update error:', err);
      if (err.message.includes('EMAIL ALREADY EXIST') || 
          err.message.includes('409') || 
          err.message.includes('CONFLICT')) {
        showError('This email address is already in use. Please try a different email.', '', 3000);
      } else if (err.message.includes('PHONE') || err.message.includes('CONTACT')) {
        showError('This contact number is already in use. Please try a different number.', '', 3000);
      } else {
        showError(err.message || 'Failed to update profile. Please try again.', '', 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({ 
        email: originalForm.email, 
        contactNumber: originalForm.contactNumber 
      });
    }
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("guidanceStaffId");
    window.location.href = "/GuidanceLogin";
  };
const getFullName = () => {
  if (!profile) return "Loading...";

  const capitalize = (str = "") =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const firstName = capitalize(profile.firstName);
  const lastName = capitalize(profile.lastName);

  const parts = [firstName, profile.middleName, lastName].filter(Boolean);
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
                  {isEditing ? (
                    <input
                      type="email"
                      className={`field-input ${!editForm.email.trim() ? 'error' : ''}`}
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      disabled={isSaving}
                      placeholder="Enter email address"
                    />
                  ) : (
                    <span className="field-value">{profile?.email || "Not provided"}</span>
                  )}
                </div>

                <div className="profile-field">
                  <span className="field-label">Contact Number</span>
                  {isEditing ? (
                    <input
                      type="tel"
                      className={`field-input ${!editForm.contactNumber.trim() ? 'error' : ''}`}
                      value={editForm.contactNumber}
                      onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                      disabled={isSaving}
                      placeholder="Enter contact number"
                    />
                  ) : (
                    <span className="field-value">{profile?.contactNumber || "Not provided"}</span>
                  )}
                </div>
              </div>

              <div className={`profile-actions ${isEditing ? 'editing' : ''}`}>
                {isEditing ? (
                  <>
                    <button 
                      className="save-profile" 
                      onClick={handleSaveProfile} 
                      disabled={isSaving || !hasChanges()}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                    <button 
                      className="cancel-edit" 
                      onClick={handleCancelEdit} 
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button className="edit-profile btn-color-primary" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </button>
                    <button className="logout " onClick={handleLogout} disabled={isEditing}>
                      Log Out
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileModal;