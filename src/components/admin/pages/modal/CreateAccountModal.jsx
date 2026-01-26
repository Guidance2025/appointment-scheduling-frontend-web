import React, { useEffect, useState } from 'react';
import "../../../../css/admin/CreateAccountModal.css";
import { register } from '../../../../service/admin';
import { ArrowLeft, Calendar } from 'lucide-react';
import { FormField } from '../../../../helper/validation/FormField';
import { useFormValidation } from '../../../../helper/validation/hooks/useFormValidation';
import { usePopUp } from '../../../../helper/message/pop/up/provider/PopUpModalProvider';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CreateAccountModal = ({ isOpen, onClose, activeTab, onAccountCreated }) => {
  const [currentRole, setCurrentRole] = useState("GUIDANCE");
  const [isProcessing, setIsProcessing] = useState(false);
  const { showSuccess, showError } = usePopUp();

  const initialGuidanceData = {
    username: "",
    password: "",
    firstname: "",
    lastname: "",
    middlename: "",
    birthdate: null,  
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
    birthdate: null,
    gender: "",
    contactNumber: "",
    email: "",
    address: "",
    sectionName: "",
    organization: "",
    clustName: "",
    clusterHead: "",
    course: ""
  };

  const guidanceForm = useFormValidation(initialGuidanceData);
  const studentForm = useFormValidation(initialStudentData);
  const currentForm = currentRole === "GUIDANCE" ? guidanceForm : studentForm;

  const guidanceValidationRules = {
    username: { required: true, minLength: 4 },
    password: { required: true, minLength: 6 },
    firstname: { required: true },
    lastname: { required: true },
    birthdate: {
      required: true,
      custom: (value) => {
        if (!value) return "Birthdate is required";
        const birthDate = new Date(value);
        const today = new Date();
        const currentYear = today.getFullYear();
        const birthYear = birthDate.getFullYear();
        
        if (isNaN(birthDate.getTime())) return "Invalid date format";
        if (birthYear >= currentYear) return `Birthdate must be before ${currentYear}`;
        if (birthYear < 1924) return "Birthdate must be after 1924";
        
        const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18 || age > 100) return "Age must be between 18 and 100 years";
        
        return null;
      }
    },
    gender: { required: true },
    contactNumber: {
      required: true,
      number: true,
      custom: (value) => {
        const cleaned = value.replace(/\D/g, "");
        if (cleaned.length < 7 || cleaned.length > 15) return "Invalid contact number length";
        return null;
      },
    },
    email: { required: true, email: true },
    address: { required: true },
    positionInRc: { required: true }
  };

  const studentValidationRules = {
    username: { required: true, minLength: 4 },
    password: { required: true, minLength: 6 },
    studentNumber: { required: true },
    firstname: { required: true },
    lastname: { required: true },
    birthdate: {  
      required: true,
      custom: (value) => {
        if (!value) return "Birthdate is required";
        
        const birthDate = new Date(value);
        const today = new Date();
        const currentYear = today.getFullYear();
        const birthYear = birthDate.getFullYear();
        
        if (isNaN(birthDate.getTime())) return "Invalid date format";
        if (birthYear >= currentYear) return `Birthdate must be before ${currentYear}`;
        if (birthYear < 1924) return "Birthdate must be after 1924";
        
        const age = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 10 || age > 100) return "Age must be between 10 and 100 years";
        
        return null;
      }
    },
    gender: { required: true },
    contactNumber: {
      required: true,
      number: true,
      custom: (value) => {
        const cleaned = value.replace(/\D/g, "");
        if (cleaned.length < 7 || cleaned.length > 15) return "Invalid contact number length";
        return null;
      },
    },
    email: { required: true, email: true },
    address: { required: true },
    sectionName: { required: true },
    organization: { required: true },
    clustName: { required: true },
    clusterHead: { required: true },
    course: { required: true }
  };

  useEffect(() => {
    if (isOpen && activeTab) {
      setCurrentRole(activeTab === "guidance" ? "GUIDANCE" : "STUDENT");
    }
  }, [isOpen, activeTab]);

  const formatDateForBackend = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const buildSubmissionData = () => {
    if (currentRole === "GUIDANCE") {
      return {
        guidanceStaff: {
          person: {
            firstName: guidanceForm.formData.firstname.trim(),
            lastName: guidanceForm.formData.lastname.trim(),
            middleName: guidanceForm.formData.middlename.trim(),
            birthdate: formatDateForBackend(guidanceForm.formData.birthdate),
            gender: guidanceForm.formData.gender,
            contactNumber: guidanceForm.formData.contactNumber.trim(),
            email: guidanceForm.formData.email.trim(),
            address: guidanceForm.formData.address.trim(),
          },
          user: {
            username: guidanceForm.formData.username.trim(),
            password: guidanceForm.formData.password.trim(),
          },
          positionInRc: guidanceForm.formData.positionInRc.trim()
        }
      };
    } else {
      return {
        student: {
          studentNumber: studentForm.formData.studentNumber.trim(),
          person: {
            firstName: studentForm.formData.firstname.trim(),
            lastName: studentForm.formData.lastname.trim(),
            middleName: studentForm.formData.middlename.trim(),
            birthdate: formatDateForBackend(studentForm.formData.birthdate),
            gender: studentForm.formData.gender,
            contactNumber: studentForm.formData.contactNumber.trim(),
            email: studentForm.formData.email.trim(),
            address: studentForm.formData.address.trim(),
          },
          section: {
            sectionName: studentForm.formData.sectionName.trim(),
            organization: studentForm.formData.organization.trim(),
            clustName: studentForm.formData.clustName.trim(),
            clusterHead: studentForm.formData.clusterHead.trim(),
            course: studentForm.formData.course.trim()
          },
          user: {
            username: studentForm.formData.username.trim(),
            password: studentForm.formData.password.trim(),
          }
        }
      };
    }
  };

  const handleSubmit = async () => {
    const rules = currentRole === "GUIDANCE" ? guidanceValidationRules : studentValidationRules;
    
    if (!currentForm.validate(rules)) return;

    try {
      setIsProcessing(true);
      const dataToSubmit = buildSubmissionData();
      const result = await register(dataToSubmit);

      if (result) {
        showSuccess(
          'Registration Successful!',
          `${currentRole === "GUIDANCE" ? "Guidance staff" : "Student"} account has been created successfully.`,
          3000
        );
        if (onAccountCreated) onAccountCreated();
        handleClose();
      }

      setIsProcessing(false);
    } catch (error) {
      showError(
        'Registration Failed!',
        `${currentRole === "GUIDANCE" ? "Guidance staff" : "Student"} unable to create account. Please try again.`,
        3000
      );
      console.error("Error creating account:", error);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    guidanceForm.resetForm();
    studentForm.resetForm();
    setCurrentRole(activeTab === "guidance" ? "GUIDANCE" : "STUDENT");
    onClose();
  };

  const handleBirthdateChange = (date, formType) => {
    const form = formType === "GUIDANCE" ? guidanceForm : studentForm;
    form.handleChange({
      target: {
        name: 'birthdate',
        value: date
      }
    });
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  
  // // Max date is December 31 of last year (2025 if current year is 2026)
  // const maxDate = new Date(currentYear - 1, 11, 31);
  
  // // Min date is January 1, 1924 (100 years ago from 2024)
  // const minDate = new Date(1924, 0, 1);

  if (!isOpen) return null;

  const renderGuidanceForm = () => (
    <div className="registration-form-grid">
      <FormField label="Username" name="username" value={guidanceForm.formData.username} onChange={guidanceForm.handleChange} error={guidanceForm.errors.username} />
      <FormField label="Password" name="password" type="password" value={guidanceForm.formData.password} onChange={guidanceForm.handleChange} error={guidanceForm.errors.password} />
      <FormField label="Firstname" name="firstname" value={guidanceForm.formData.firstname} onChange={guidanceForm.handleChange} error={guidanceForm.errors.firstname} />
      <FormField label="Lastname" name="lastname" value={guidanceForm.formData.lastname} onChange={guidanceForm.handleChange} error={guidanceForm.errors.lastname} />
      <FormField label="MI" name="middlename" value={guidanceForm.formData.middlename} onChange={guidanceForm.handleChange} error={guidanceForm.errors.middlename} options={{ small: true }} maxLength={1} />
      
      <div className="form-field-wrapper">
        <label className="form-label">
          Birthdate <span className="required-asterisk">*</span>
        </label>
        <div className="date-picker-wrapper">
          <DatePicker
            selected={guidanceForm.formData.birthdate}
            onChange={(date) => handleBirthdateChange(date, "GUIDANCE")}
            dateFormat="MM/dd/yyyy"
            placeholderText="Select birthdate"
            // maxDate={maxDate}
            // minDate={minDate}
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            openToDate={new Date(2015, 0, 1)}
            className={`date-picker-input ${guidanceForm.errors.birthdate ? 'error' : ''}`}
            onChangeRaw={(e) => e.preventDefault()}
          />
          <Calendar className="calendar-icon" size={18} />
        </div>
        {guidanceForm.errors.birthdate && (
          <span className="error-message">{guidanceForm.errors.birthdate}</span>
        )}
      </div>

      <FormField label="Gender" name="gender" type="select" value={guidanceForm.formData.gender} onChange={guidanceForm.handleChange} error={guidanceForm.errors.gender} options={{ small: true }} selectOptions={["Male", "Female"]} />
      <FormField label="Contact Number" name="contactNumber" type="tel" value={guidanceForm.formData.contactNumber} onChange={guidanceForm.handleChange} error={guidanceForm.errors.contactNumber} />
      <FormField label="Email" name="email" type="email" value={guidanceForm.formData.email} onChange={guidanceForm.handleChange} error={guidanceForm.errors.email} options={{ fullWidth: true }} />
      <FormField label="Address" name="address" value={guidanceForm.formData.address} onChange={guidanceForm.handleChange} error={guidanceForm.errors.address} options={{ fullWidth: true }} />
      <FormField label="Position in Rogationist" name="positionInRc" value={guidanceForm.formData.positionInRc} onChange={guidanceForm.handleChange} error={guidanceForm.errors.positionInRc} options={{ fullWidth: true }} />
    </div>
  );

  const renderStudentForm = () => (
    <div className="registration-form-grid">
      <FormField label="Username" name="username" value={studentForm.formData.username} onChange={studentForm.handleChange} error={studentForm.errors.username} />
      <FormField label="Password" name="password" type="password" value={studentForm.formData.password} onChange={studentForm.handleChange} error={studentForm.errors.password} />
      <FormField label="Student Number" name="studentNumber" value={studentForm.formData.studentNumber} onChange={studentForm.handleChange} error={studentForm.errors.studentNumber} />
      <FormField label="Firstname" name="firstname" value={studentForm.formData.firstname} onChange={studentForm.handleChange} error={studentForm.errors.firstname} />
      <FormField label="Lastname" name="lastname" value={studentForm.formData.lastname} onChange={studentForm.handleChange} error={studentForm.errors.lastname} />
      <FormField label="MI" name="middlename" value={studentForm.formData.middlename} onChange={studentForm.handleChange} error={studentForm.errors.middlename} options={{ small: true }} maxLength={1} />
      
      <div className="form-field-wrapper">
        <label className="form-label">
          Birthdate <span className="required-asterisk">*</span>
        </label>
        <div className="date-picker-wrapper">
          <DatePicker
            selected={studentForm.formData.birthdate}
            onChange={(date) => handleBirthdateChange(date, "STUDENT")}
            dateFormat="MM/dd/yyyy"
            placeholderText="Select birthdate"
            maxDate={maxDate}
            minDate={minDate}
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            openToDate={new Date(2015, 0, 1)}
            className={`date-picker-input ${studentForm.errors.birthdate ? 'error' : ''}`}
            onChangeRaw={(e) => e.preventDefault()}
          />
          <Calendar className="calendar-icon" size={18} />
        </div>
        {studentForm.errors.birthdate && (
          <span className="error-message">{studentForm.errors.birthdate}</span>
        )}
      </div>

      <FormField label="Gender" name="gender" type="select" value={studentForm.formData.gender} onChange={studentForm.handleChange} error={studentForm.errors.gender} options={{ small: true }} selectOptions={["Male", "Female"]} />
      <FormField label="Contact Number" name="contactNumber" type="tel" value={studentForm.formData.contactNumber} onChange={studentForm.handleChange} error={studentForm.errors.contactNumber} />
      <FormField label="Email" name="email" type="email" value={studentForm.formData.email} onChange={studentForm.handleChange} error={studentForm.errors.email} options={{ fullWidth: true }} />
      <FormField label="Address" name="address" value={studentForm.formData.address} onChange={studentForm.handleChange} error={studentForm.errors.address} options={{ fullWidth: true }} />
      <FormField label="Section Name" name="sectionName" value={studentForm.formData.sectionName} onChange={studentForm.handleChange} error={studentForm.errors.sectionName} />
      <FormField label="Organization" name="organization" value={studentForm.formData.organization} onChange={studentForm.handleChange} error={studentForm.errors.organization} />
      <FormField label="Cluster Name" name="clustName" value={studentForm.formData.clustName} onChange={studentForm.handleChange} error={studentForm.errors.clustName} />
      <FormField label="Cluster Head" name="clusterHead" value={studentForm.formData.clusterHead} onChange={studentForm.handleChange} error={studentForm.errors.clusterHead} />
      <FormField label="Course" name="course" value={studentForm.formData.course} onChange={studentForm.handleChange} error={studentForm.errors.course} />
    </div>
  );

  return (
    <div className="registration-modal-overlay">
      <div className="registration-modal-content">
        <button className='back' onClick={handleClose}><ArrowLeft/></button>
        <h2 className="registration-modal-title">
          Register {currentRole === "GUIDANCE" ? "Guidance" : "Student"}
        </h2>
        <div className="registration-form">
          {currentRole === "GUIDANCE" ? renderGuidanceForm() : renderStudentForm()}
          <div className="registration-form-actions">
            <button onClick={handleClose} className="registration-cancel-btn" type="button">
              Cancel
            </button>
            <button onClick={handleSubmit} className="registration-submit-btn" disabled={isProcessing}>
              {isProcessing ? "Processing ..." : "Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountModal;