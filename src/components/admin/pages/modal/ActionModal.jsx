import { useState } from "react";
import "./../../../../css/ActionModal.css"
import { deleteGuidanceStaffAccount, deleteStudentAccount, UpdateStudentCredentials } from "../../../../service/admin";
import UpdateModal from "./UpdateModal";
import { X } from "lucide-react";
import { usePopUp } from "../../../../helper/message/pop/up/provider/PopUpModalProvider";

const ActionModal = ({ isOpen,  onClose,  selectedUserType,studentNumber,
                        employeeNumber, onDeleteSuccess, selectedUserData }) => {
                            
    const [isLoading, setIsLoading] = useState(false);
    const [showUpdateModal,setShowUpdateModal] = useState(false);
    const {showSuccess, showError} = usePopUp();
    
    const handleDelete = async () => {
        try {
            setIsLoading(true);
            
            if (selectedUserType === "studentNumber") {
                await deleteStudentAccount(studentNumber);
                showSuccess("Student Deleted Successfully!","The account has been removed",2000)
                onClose();
            } else {
                await deleteGuidanceStaffAccount(employeeNumber);
                showSuccess("Guidance Staff Deleted Successfully!","The account has been removed",2000)
                onClose();

            }
            
            setIsLoading(false);
            
            if (onDeleteSuccess) {
                onDeleteSuccess();
            }
        } catch (error) {
            console.error("Delete Account Error:", error);
            showError("Cannot Deleted Locked Account" , "Please Try Again", 2000)
            setIsLoading(false);
        }
    }

    if (!isOpen) return null;

   return (
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
                         className="btn btn-delete" 
                        disabled={isLoading || selectedUserData?.isLocked}
                        onClick={handleDelete}
                    > 
                        {isLoading ? "Deleting..." : (selectedUserData?.isLocked ? "Locked" : "Delete")}
                    </button>
                <button 
                    className="btn btn-update" 
                    disabled={isLoading}
                    onClick={() => setShowUpdateModal(true)}
                >
                    Update
                </button>
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

            
        </div>
    </div>
);
};

export default ActionModal;