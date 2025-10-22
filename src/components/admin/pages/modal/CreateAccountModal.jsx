import React, { useState } from 'react'
import { register } from '../../../../service/admin';
import "./../../../../css/CreateAccountModal.css"
const CreateAccountModal = ({isOpen, onClose}) => {
  const [isSelected, setIsSelected] = useState("CHOICE");
  const [currentRole, setCurrentRole] = useState("");

  const [guidanceFormData, setGuidanceFormData] = useState({
    username: "",
    password: "",
    firstname: "",
    lastname: "",
    middlename: "",
    birthDate: "",
    gender: "",
    contactNumber: "",
    email: "",
    address: "",
    positionInRc: ""
  });

  const [studentFormData, setStudentFormData] = useState({
    username: "",
    password: "",
    studentNumber: "",
    firstname: "",
    lastname: "",
    middlename: "",
    age: "",
    gender: "",
    email: "",
    address: "",
    sectionName: "",
    organization: "",
    clustName: "",
    clusterHead: "",
    course: ""
  });

  const handleGuidanceInputChange = (e) => {
    const { name, value } = e.target;
    setGuidanceFormData(prev => ({...prev, [name]: value}));
  };

  const handleStudentInputChange = (e) => {
    const { name, value } = e.target;
    setStudentFormData(prev => ({...prev, [name]: value}));
  };

  const handleGuidanceRole = () => {
    setIsSelected("FORM");
    setCurrentRole("GUIDANCE");
  };

  const handleRegisterStudentRole = () => {
    setIsSelected("FORM");
    setCurrentRole("STUDENT");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let dataToSubmit;
      
      if (currentRole === "GUIDANCE") {
        dataToSubmit = {
          guidanceStaff: {
            person: {
              firstName: guidanceFormData.firstname,
              lastName: guidanceFormData.lastname,
              middleName: guidanceFormData.middlename,
              birthDate: guidanceFormData.birthDate,
              gender: guidanceFormData.gender,
              contactNumber: guidanceFormData.contactNumber,
              email: guidanceFormData.email,
              address: guidanceFormData.address,
            },
            user: {
              username: guidanceFormData.username,
              password: guidanceFormData.password,
            },
            positionInRc: guidanceFormData.positionInRc
          }
        };
      } else {
        dataToSubmit = {
          student: {
            studentNumber: studentFormData.studentNumber,
            person: {
              firstName: studentFormData.firstname,
              lastName: studentFormData.lastname,
              middleName: studentFormData.middlename,
              age: studentFormData.age,
              gender: studentFormData.gender,
              email: studentFormData.email,
              address: studentFormData.address,
            },
            section: {
              sectionName: studentFormData.sectionName,
              organization: studentFormData.organization,
              clustName: studentFormData.clustName,
              clusterHead: studentFormData.clusterHead,
              course: studentFormData.course
            },
            user: {
              username: studentFormData.username,
              password: studentFormData.password,
            }
          }
        };
      }
      
      const result = await register(dataToSubmit); 

      if (result) {
        console.log("Registered Successfully");
        handleClose();
      }
    } catch (error) {
      console.error("Error creating account:", error);
    }
  };

  const handleBack = () => {
    setIsSelected("CHOICE");
    setCurrentRole("");
  };

  const handleClose = () => {
    setIsSelected("CHOICE");
    setCurrentRole("");
    
    setGuidanceFormData({
      username: "",
      password: "",
      firstname: "",
      lastname: "",
      middlename: "",
      birthDate: "",
      gender: "",
      contactNumber: "",
      email: "",
      address: "",
      positionInRc: ""
    });
    
    setStudentFormData({
      username: "",
      password: "",
      studentNumber: "",
      firstname: "",
      lastname: "",
      middlename: "",
      age: "",
      gender: "",
      email: "",
      address: "",
      sectionName: "",
      organization: "",
      clustName: "",
      clusterHead: "",
      course: ""
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {isSelected === "CHOICE" ? (
          <div className="role-selection">
            <h2 className="modal-title">Create Account</h2>
            <p className="modal-subtitle">Select account type to register</p>
            
            <div className="role-cards">
              <button
                className="role-card"
                onClick={handleGuidanceRole}
              >
                <h3>Guidance</h3>
              </button>

              <button
                className="role-card"
                onClick={handleRegisterStudentRole}
              >
                <h3>Student</h3>
              </button>
            </div>

            <button className="back-button2" onClick={handleClose}>
              X
            </button>
          </div>
        ) : (
          <div className="registration-form">
            <div className="form-header">
              <button className="back-button" onClick={handleBack}>
                X
              </button>
              <h2 className="modal-title">
                Register {currentRole === "GUIDANCE" ? "Guidance" : "Student"}
              </h2>
            </div>

            {currentRole === "GUIDANCE" ? (
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={guidanceFormData.username}
                      onChange={handleGuidanceInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={guidanceFormData.password}
                      onChange={handleGuidanceInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Firstname</label>
                    <input
                      type="text"
                      name="firstname"
                      value={guidanceFormData.firstname}
                      onChange={handleGuidanceInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Lastname</label>
                    <input
                      type="text"
                      name="lastname"
                      value={guidanceFormData.lastname}
                      onChange={handleGuidanceInputChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-small">
                    <label>MI</label>
                    <input
                      type="text"
                      name="middlename"
                      value={guidanceFormData.middlename}
                      onChange={handleGuidanceInputChange}
                      maxLength="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>BirthDate</label>
                    <input
                      type="date"
                      name="birthDate"
                      value={guidanceFormData.birthDate}
                      onChange={handleGuidanceInputChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-small">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={guidanceFormData.gender}
                      onChange={handleGuidanceInputChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>ContactNumber</label>
                    <input
                      type="tel"
                      name="contactNumber"
                      value={guidanceFormData.contactNumber}
                      onChange={handleGuidanceInputChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={guidanceFormData.email}
                      onChange={handleGuidanceInputChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={guidanceFormData.address}
                      onChange={handleGuidanceInputChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Position In Rogationist </label>
                    <input
                      type="text"
                      name="positionInRc"
                      value={guidanceFormData.positionInRc}
                      onChange={handleGuidanceInputChange}
                      required
                    />
                  </div>
                  
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">
                    Register
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      name="username"
                      value={studentFormData.username}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={studentFormData.password}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Student Number</label>
                    <input
                      type="text"
                      name="studentNumber"
                      value={studentFormData.studentNumber}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Firstname</label>
                    <input
                      type="text"
                      name="firstname"
                      value={studentFormData.firstname}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Lastname</label>
                    <input
                      type="text"
                      name="lastname"
                      value={studentFormData.lastname}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-small">
                    <label>MI</label>
                    <input
                      type="text"
                      name="middlename"
                      value={studentFormData.middlename}
                      onChange={handleStudentInputChange}
                      maxLength="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      name="age"
                      value={studentFormData.age}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-small">
                    <label>Gender</label>
                    <select
                      name="gender"
                      value={studentFormData.gender}
                      onChange={handleStudentInputChange}
                      required
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group form-group-full">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={studentFormData.email}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={studentFormData.address}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Section Name</label>
                    <input
                      type="text"
                      name="sectionName"
                      value={studentFormData.sectionName}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Organization</label>
                    <input
                      type="text"
                      name="organization"
                      value={studentFormData.organization}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Cluster Name</label>
                    <input
                      type="text"
                      name="clustName"
                      value={studentFormData.clustName}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Cluster Head</label>
                    <input
                      type="text"
                      name="clusterHead"
                      value={studentFormData.clusterHead}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Course</label>
                    <input
                      type="text"
                      name="course"
                      value={studentFormData.course}
                      onChange={handleStudentInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-actions">
                 
                  <button type="submit" className="submit-btn">
                    Register
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAccountModal;