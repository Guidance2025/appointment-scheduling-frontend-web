import { useEffect, useState } from "react";
import "../../../../css/admin/UpdateModal.css";
import { UpdateGuidanceStaffCredentials, UpdateStudentCredentials } from "../../../../service/admin";

const UpdateModal = ({ 
    isOpen, 
    onClose, 
    selectedUserType, 
    studentNumber, 
    employeeNumber, 
    onUpdateSuccess,
    initialIsLocked = false, 
    initialEmail = "" 
}) => {
    const [newPassword, setNewPassword] = useState("");
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [isLockedStaff, setIsLockedStaff] = useState(false);
  
    useEffect(() => {
        if (isOpen) {
            if (selectedUserType === "studentNumber") {
                setIsLocked(initialIsLocked);
            } else {
                setIsLockedStaff(initialIsLocked);
                setEmail(initialEmail);
            }
        }
    }, [isOpen, initialIsLocked, initialEmail, selectedUserType]);

    const handleUpdate = async () => {
        try {
            setIsLoading(true);

            if (selectedUserType === "studentNumber") {
                await UpdateStudentCredentials(studentNumber, newPassword, isLocked);
                alert("Student account updated successfully.");
            } else {
                await UpdateGuidanceStaffCredentials(employeeNumber, email, isLockedStaff);
                alert("Guidance staff updated successfully.");
            }

            setIsLoading(false);
            setNewPassword("");
            setShowPassword(false);

            onClose();
            if (onUpdateSuccess) onUpdateSuccess();

        } catch (error) {
            console.error("Update Account Error:", error);
            alert("Failed to update account. Please try again.");
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setNewPassword("");
        setShowPassword(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="update-modal-overlay" onClick={handleClose}>
            <div className="update-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="update-close-btn" onClick={handleClose} aria-label="Close">
                    ×
                </button>

                <div className="update-modal-body">
                    <div className="update-user-id">
                        {selectedUserType === "studentNumber" ? studentNumber : employeeNumber}
                    </div>

                    <p className="update-warning-text">This action cannot be undone</p>

                    {selectedUserType === "studentNumber" ? (
                        <>
                            <div className="update-form-group">
                                <label htmlFor="newPassword" className="update-label">New Password</label>
                                <div className="update-password-wrapper">
                                    <input
                                        id="newPassword"
                                        type={showPassword ? "text" : "password"}
                                        className="update-input"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        disabled={isLoading}
                                    />
                                    <button
                                        type="button"
                                        className="update-toggle-password"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isLoading}
                                    >
                                        {showPassword ? "" : ""}
                                    </button>
                                </div>
                            </div>

                            <div className="update-lock-group">
                                <label htmlFor="lockToggle" className="update-lock-label">Lock</label>
                                <label className="update-toggle-switch">
                                    <input
                                        id="lockToggle"
                                        type="checkbox"
                                        checked={isLocked}
                                        onChange={(e) => setIsLocked(e.target.checked)}
                                        disabled={isLoading}
                                    />
                                    <span className="update-toggle-slider"></span>
                                </label>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="update-form-group">
                                <label htmlFor="email" className="update-label">New Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    className="update-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter new email"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="update-lock-group">
                                <label htmlFor="lockToggleStaff" className="update-lock-label">Lock</label>
                                <label className="update-toggle-switch">
                                    <input
                                        id="lockToggleStaff"
                                        type="checkbox"
                                        checked={isLockedStaff}
                                        onChange={(e) => setIsLockedStaff(e.target.checked)}
                                        disabled={isLoading}
                                    />
                                    <span className="update-toggle-slider"></span>
                                </label>
                            </div>
                        </>
                    )}

                    <div className="update-button-group">
                        <button
                            className="update-btn update-btn-confirm"
                            onClick={handleUpdate}
                            disabled={isLoading} 
                        >
                            {isLoading ? "Updating..." : "Yes"}
                        </button>
                        <button
                            className="update-btn update-btn-cancel"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;