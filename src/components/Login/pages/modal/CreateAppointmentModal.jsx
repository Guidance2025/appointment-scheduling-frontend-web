import React from "react";
import "../../../../css/CreateAppointmentModal.css";

const CreateAppointmentModal = ({ isOpen, isClose }) => {
  
  if (!isOpen) return null;
  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Create Appointment</h2>
          <button onClick={isClose} className="set-appointment-button"> × </button>
          <label> Student Number : <input type="text" /></label>
          <label> First Name : <input type="text" /></label>
          <label> Last Name : <input type="text" /></label>
          
          <label> Section : <input type="text" /></label>
          <label> Status : <input type="text" /></label>
          <label> Status : <input type="text" /></label>
          <label> Status : <input type="text" /></label>
          <label> Status : <input type="text" /></label>
          <label> Status : <input type="text" /></label>
          <label> Status : <input type="text" /></label>
           <label>Status : <input type="text" /></label>

          <button className = "set-appointment-button"> Set Appointment </button>
        </div>
      </div>
    </>
  );
};
  export default CreateAppointmentModal;
