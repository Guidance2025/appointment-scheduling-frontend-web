import React, { useState } from 'react';
import "../../../../css/admin/CreateAccountModal.css"
import { register } from '../../../../service/admin';

const CreateAccountModal = ({ isOpen, onClose }) => {
  const [currentRole, setCurrentRole] = useState("GUIDANCE");
  const [showForm, setShowForm] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState({}); 

  const initialGuidanceData = {
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
  };

  const initialStudentData = {
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
  };

  const [guidanceFormData, setGuidanceFormData] = useState(initialGuidanceData);
  const [studentFormData, setStudentFormData] = useState(initialStudentData);

  const handleInputChange = (e, formType) => {
    const { name, value } = e.target;
    if (formType === "GUIDANCE") {
      setGuidanceFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setStudentFormData(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: "" })); 
  };

  const validateFields = () => {
    const formData = currentRole === "GUIDANCE" ? guidanceFormData : studentFormData;
    const newErrors = {};

    for (const [key, value] of Object.entries(formData)) {
      if (!value && key !== "middlename") { 
        newErrors[key] = "This field is required";
      } else if (key === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) newErrors[key] = "Invalid email address";
      } else if ((key === "contactNumber" || key === "age") && value && isNaN(value)) {
        newErrors[key] = "Must be a number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildSubmissionData = () => {
    if (currentRole === "GUIDANCE") {
      return {
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
      return {
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
  };

  const handleSubmit = async () => {
    if (!validateFields()) return; // stop submission if errors

    try {
      setIsProcessing(true);
      const dataToSubmit = buildSubmissionData();
      const result = await register(dataToSubmit);
      setIsProcessing(false);

      if (result) {
        alert("Registered Successfully");
        handleClose();
      }
    } catch (error) {
      console.error("Error creating account:", error);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCurrentRole("GUIDANCE");
    setShowForm(true);
    setGuidanceFormData(initialGuidanceData);
    setStudentFormData(initialStudentData);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const renderFormField = (label, name, type = "text", options = {}) => {
    const formData = currentRole === "GUIDANCE" ? guidanceFormData : studentFormData;
    const isSmall = options.small || false;
    const isFullWidth = options.fullWidth || false;
    
    return (
      <div className={`registration-form-group ${isSmall ? 'registration-form-group-small' : ''} ${isFullWidth ? 'registration-form-group-full' : ''}`}>
        <label>{label}</label>
        {type === "select" ? (
          <select
            name={name}
            value={formData[name]}
            onChange={(e) => handleInputChange(e, currentRole)}
          >
            <option value="">Select</option>
            {options.selectOptions?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={(e) => handleInputChange(e, currentRole)}
            maxLength={options.maxLength}
          />
        )}
        {errors[name] && <span className="field-error">{errors[name]}</span>}
      </div>
    );
  };

  const renderForm = () => {
    return currentRole === "GUIDANCE" ? (
      <div>
        <div className="registration-form-grid">
          {renderFormField("Username", "username")}
          {renderFormField("Password", "password", "password")}
          {renderFormField("Firstname", "firstname")}
          {renderFormField("Lastname", "lastname")}
          {renderFormField("MI", "middlename", "text", { small: true, maxLength: 1 })}
          {renderFormField("BirthDate", "birthDate", "date")}
          {renderFormField("Gender", "gender", "select", { small: true, selectOptions: ["Male", "Female"] })}
          {renderFormField("Contact Number", "contactNumber", "tel")}
          {renderFormField("Email", "email", "email", { fullWidth: true })}
          {renderFormField("Address", "address", "text", { fullWidth: true })}
          {renderFormField("Position in Rogationist", "positionInRc", "text", { fullWidth: true })}
        </div>
      </div>
    ) : (
      <div>
        <div className="registration-form-grid">
          {renderFormField("Username", "username")}
          {renderFormField("Password", "password", "password")}
          {renderFormField("Student Number", "studentNumber")}
          {renderFormField("Firstname", "firstname")}
          {renderFormField("Lastname", "lastname")}
          {renderFormField("MI", "middlename", "text", { small: true, maxLength: 1 })}
          {renderFormField("Age", "age", "number")}
          {renderFormField("Gender", "gender", "select", { small: true, selectOptions: ["Male", "Female", "Other"] })}
          {renderFormField("Email", "email", "email", { fullWidth: true })}
          {renderFormField("Address", "address", "text", { fullWidth: true })}
          {renderFormField("Section Name", "sectionName")}
          {renderFormField("Organization", "organization")}
          {renderFormField("Cluster Name", "clustName")}
          {renderFormField("Cluster Head", "clusterHead")}
          {renderFormField("Course", "course")}
        </div>
      </div>
    );
  };

  return (
    <div className="registration-modal-overlay" onClick={handleClose}>
      <div className="registration-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="registration-tabs">
          <button
            className={`registration-tab ${currentRole === "GUIDANCE" ? "active" : ""}`}
            onClick={() => setCurrentRole("GUIDANCE")}
          >Guidance</button>
          <button
            className={`registration-tab ${currentRole === "STUDENT" ? "active" : ""}`}
            onClick={() => setCurrentRole("STUDENT")}
          >Student</button>
        </div>

        <h2 className="registration-modal-title">
          Register {currentRole === "GUIDANCE" ? "Guidance" : "Student"}
        </h2>

        <div className="registration-form">
          {renderForm()}
          <div className="registration-form-actions">
            <button
              onClick={handleSubmit}
              className="registration-submit-btn"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing .." : "Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountModal;
