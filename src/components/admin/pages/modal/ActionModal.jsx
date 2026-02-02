import { useState } from "react";
import "./../../../../css/ActionModal.css"
import { deleteGuidanceStaffAccount, deleteStudentAccount } from "../../../../service/admin";
import UpdateModal from "./UpdateModal";
import "../../../../css/button/button.css";
import { X } from "lucide-react";
import { usePopUp } from "../../../../helper/message/pop/up/provider/PopUpModalProvider";
import ConfirmDialog from "../../../../helper/ConfirmDialog";

const ActionModal = ({ isOpen, onClose, selectedUserType, studentNumber,
                        employeeNumber, onDeleteSuccess, selectedUserData }) => {
                            
    const [isLoading, setIsLoading] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const {showSuccess, showError} = usePopUp();
    
    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setIsLoading(true);
            
            if (selectedUserType === "studentNumber") {
                await deleteStudentAccount(studentNumber);
                showSuccess("Student Deleted Successfully!", "The account has been removed", 2000);
            } else {
                await deleteGuidanceStaffAccount(employeeNumber);
                showSuccess("Guidance Staff Deleted Successfully!", "The account has been removed", 2000);
            }
            
            setIsLoading(false);
            setShowDeleteConfirm(false);
            onClose();
            
            if (onDeleteSuccess) {
                onDeleteSuccess();
            }
        } catch (error) {
            console.error("Delete Account Error:", error);
            showError("Cannot Delete Locked Account", "Please Try Again", 2000);
            setIsLoading(false);
            setShowDeleteConfirm(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <button className="close-btn" onClick={onClose} aria-label="Close">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="modal-body">
                        <p className="modal-warning">This action cannot be undone</p>
                        
                        {selectedUserData && (
                            <>
                                <div className="modal-info">
                                    <strong>Name</strong>
                                    <span>{selectedUserData.firstname} {selectedUserData.lastname}</span>
                                </div>
                                
                                {selectedUserType === "studentNumber" && (
                                    <div className="modal-info">
                                        <strong>Student Number</strong>
                                        <span>{studentNumber}</span>
                                    </div>
                                )}
                                
                                {selectedUserType === "guidanceStaffId" && (
                                    <div className="modal-info">
                                        <strong>Position</strong>
                                        <span>{selectedUserData.positionInRc}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    
                    <div className="modal-footer">
                        <button 
                            className="btn btn-delete btn-color-danger" 
                            disabled={selectedUserData?.isLocked}
                            onClick={handleDeleteClick}
                        > 
                            {selectedUserData?.isLocked ? "Locked" : "Delete"}
                        </button>
                        <button 
                            className="btn btn-update btn-color-primary" 
                            onClick={() => setShowUpdateModal(true)}
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>
            
            <UpdateModal
                isOpen={showUpdateModal}
                onClose={() => setShowUpdateModal(false)}
                selectedUserType={selectedUserType}
                studentNumber={studentNumber}
                employeeNumber={employeeNumber}
                selectedUserData={selectedUserData}
                onUpdateSuccess={onDeleteSuccess}
                initialEmail={selectedUserData?.email || ""}
                initialIsLocked={selectedUserData?.isLocked}
            />
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Account"
                message={`Are you sure you want to delete ${selectedUserData?.firstname} ${selectedUserData?.lastname}'s account? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="error"
                isLoading={isLoading}
            />
        </>
    );
};

export default ActionModal;