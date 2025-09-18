import "../../../css/CreateAppointmentModal.css";

const CreateAppointmentModal = ({ isOpen, isClose }) => {
  
  if (!isOpen) return null;
  return (
    <>
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Create Appointment</h2>
          <button onClick={isClose} className="set-appointment-button"> × </button>
          <label> Student Number : <input type="text" /></label>
          <label> FirstName : <input type="text" /></label>
          <label> LastName : <input type="text" /></label>

          <label> Appointment Type : <input type="text" /></label>
          <label> Start Date : <input type="text" /></label>
          <label> End Date : <input type="text" /></label>
          <label> Notes : <input type="text" /></label>

          <button className = "set-appointment-button"> Set Appointment </button>
        </div>
      </div>
    </>
  );
};
  export default CreateAppointmentModal;
