import { useEffect, useState } from "react";
import "../../../../css/admin/UpdateModal.css";
import { UpdateGuidanceStaffCredentials, UpdateStudentCredentials } from "../../../../service/admin";
import { usePopUp } from "../../../../helper/message/pop/up/provider/PopUpModalProvider";
import "../../../../css/button/button.css";

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
    const {showSuccess,showError} = usePopUp();
    
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

            console.log("Update initiated:", {
                selectedUserType,
                studentNumber,
                employeeNumber,
                hasPassword: !!newPassword,
                isLocked,
                email,
                isLockedStaff
            });

            if (selectedUserType === "studentNumber") {
                console.log("Updating student credentials...");
                await UpdateStudentCredentials(studentNumber, newPassword, isLocked);
                showSuccess("Student account updated successfully!", "Changes saved successfully.", 3000);
            } else if (selectedUserType === "guidanceStaffId") {
                console.log("Updating guidance staff credentials...");
                
                // Determine what to send based on what changed
                const emailChanged = email.trim() !== "" && email !== initialEmail && email.includes("@");
                const lockChanged = isLockedStaff !== initialIsLocked;
                
                // Send email only if it was changed and is valid, otherwise send null
                const emailToSend = emailChanged ? email.trim() : null;
                
                console.log("Sending update:", {
                    email: emailToSend,
                    isLocked: isLockedStaff,
                    emailChanged,
                    lockChanged
                });
                
                await UpdateGuidanceStaffCredentials(employeeNumber, emailToSend, isLockedStaff);
                showSuccess("Guidance staff account updated successfully!", "Changes saved successfully.", 3000);
            } else {
                throw new Error(`Invalid user type: ${selectedUserType}`);
            }

            // Reset form state after successful update
            setIsLoading(false);
            setNewPassword("");
            setShowPassword(false);

            // Call success callback and close modal
            if (onUpdateSuccess) onUpdateSuccess();
            onClose();

        } catch (error) {
            console.error("Update Account Error:", error);
            console.error("Error details:", {
                selectedUserType,
                studentNumber,
                employeeNumber,
                email,
                errorMessage: error.message
            });
            showError("Failed to update account.", error.message || "Something went wrong", 3000);
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setNewPassword("");
        setShowPassword(false);
        onClose();
    };

    // Check if anything has changed
    const hasChanges = () => {
        if (selectedUserType === "studentNumber") {
            // Student: Enable if password is filled OR lock status changed
            return newPassword.trim() !== "" || isLocked !== initialIsLocked;
        } else {
            // Guidance: Enable if email changed OR lock status changed
            const emailChanged = email.trim() !== "" && email !== initialEmail && email.includes("@");
            const lockChanged = isLockedStaff !== initialIsLocked;
            
            // Enable if either email changed (with valid email) OR lock status changed
            return emailChanged || lockChanged;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="update-modal-overlay" onClick={handleClose}>
            <div className="update-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="update-close-btn" onClick={handleClose} aria-label="Close">
                    ×
                </button>

                <div className="update-modal-body">

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
                            className="update-btn update-btn-confirm btn-color-primary "
                            onClick={handleUpdate}
                            disabled={isLoading || !hasChanges()}
                        >
                            {isLoading ? "Updating..." : "Yes"}
                        </button>
                        <button
                            className="update-btn update-btn-cancel btn-color-secondary"
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