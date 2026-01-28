import React, { useEffect, useState, useMemo } from 'react';
import "../../../../css/admin/CreateAccountModal.css";
import { register } from '../../../../service/admin';
import { ArrowLeft } from 'lucide-react';
import { FormField } from '../../../../helper/validation/FormField';
import { useFormValidation } from '../../../../helper/validation/hooks/useFormValidation';
import { usePopUp } from '../../../../helper/message/pop/up/provider/PopUpModalProvider';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const CreateAccountModal = ({ isOpen, onClose, activeTab, onAccountCreated }) => {
  const [currentRole, setCurrentRole] = useState("GUIDANCE");
  const [isProcessing, setIsProcessing] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { showSuccess, showError } = usePopUp();
  
  const CLUSTER_HEAD_OPTIONS = [
    "Ms Darlene Jane Neva Gener",
    "Angelo Nueva"
];

  const POSITION_IN_RC_OPTIONS = [
  "Guidance Counselor",
  "Guidance Facilitator",

];

  const initialGuidanceData = useMemo(() => ({
    firstname: "",
    lastname: "",
    middlename: "",
    birthdate: null,  
    gender: "",
    contactNumber: "",
    email: "",
    address: "",
    positionInRc: ""
  }), [formKey]);

  const initialStudentData = useMemo(() => ({
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
    clusterHead: ""
  }), [formKey]);

  const guidanceForm = useFormValidation(initialGuidanceData);
  const studentForm = useFormValidation(initialStudentData);
  const currentForm = currentRole === "GUIDANCE" ? guidanceForm : studentForm;

  const guidanceValidationRules = {
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
    clusterHead: { required: true }
  };

  useEffect(() => {
    if (isOpen) {
      // Reset role first
      if (activeTab) {
        setCurrentRole(activeTab === "guidance" ? "GUIDANCE" : "STUDENT");
      }
      
      // Force form reset by updating key
      setFormKey(prev => prev + 1);
      
      // Reset forms immediately
      guidanceForm.resetForm();
      studentForm.resetForm();
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
            clusterHead: studentForm.formData.clusterHead.trim()
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
      setIsProcessing(false);
      
      // Parse error message from backend
      const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error occurred';
      
      // Check for specific errors and highlight relevant fields
      if (errorMessage.includes('Email already exists') || errorMessage.includes('email')) {
        currentForm.setFieldError('email', 'This email is already registered');
        showError('Registration Failed', 'Email already exists. Please use a different email.', 4000);
      } else if (errorMessage.includes('Student number already exists') || errorMessage.includes('student number')) {
        studentForm.setFieldError('studentNumber', 'This student number is already registered');
        showError('Registration Failed', 'Student number already exists. Please check the number.', 4000);
      } else if (errorMessage.includes('Section') || errorMessage.includes('section')) {
        studentForm.setFieldError('sectionName', 'Error with section information');
        showError('Registration Failed', 'There was an issue with the section. Please try again.', 4000);
      } else {
        // Generic error
        showError(
          'Registration Failed',
          `Unable to create ${currentRole === "GUIDANCE" ? "guidance staff" : "student"} account. ${errorMessage}`,
          4000
        );
      }
      
      console.error("Error creating account:", error);
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

  if (!isOpen) return null;

  // Check if form has any errors or empty required fields
  const hasErrors = () => {
    const form = currentRole === "GUIDANCE" ? guidanceForm : studentForm;
    const rules = currentRole === "GUIDANCE" ? guidanceValidationRules : studentValidationRules;
    
    // Check if there are any validation errors
    const hasValidationErrors = Object.keys(form.errors).some(key => form.errors[key]);
    
    // Check if any required field is empty
    const requiredFields = Object.keys(rules);
    const hasEmptyFields = requiredFields.some(field => {
      const value = form.formData[field];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    
    return hasValidationErrors || hasEmptyFields;
  };

  const renderGuidanceForm = () => (
    <div className="registration-form-grid">
      <FormField label="Firstname" name="firstname" value={guidanceForm.formData.firstname || ""} onChange={guidanceForm.handleChange} error={guidanceForm.errors.firstname} />
      <FormField label="Lastname" name="lastname" value={guidanceForm.formData.lastname || ""} onChange={guidanceForm.handleChange} error={guidanceForm.errors.lastname} />
      <FormField label="MI" name="middlename" value={guidanceForm.formData.middlename || ""} onChange={guidanceForm.handleChange} error={guidanceForm.errors.middlename} options={{ small: true }} maxLength={1} />
      
      <div className="form-field-wrapper">
        <label className="form-label">
          Birthdate <span className="required-asterisk">*</span>
        </label>
        {guidanceForm.errors.birthdate && (
          <span className="error-message">{guidanceForm.errors.birthdate}</span>
        )}
        <div className="date-picker-wrapper">
          <DatePicker
            selected={guidanceForm.formData.birthdate}
            onChange={(date) => handleBirthdateChange(date, "GUIDANCE")}
            dateFormat="MM/dd/yyyy"
            placeholderText="Select birthdate"
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            openToDate={new Date(2000, 0, 1)}
            maxDate={new Date(2010, 11, 31)}
            className={`date-picker-input ${guidanceForm.errors.birthdate ? 'error' : ''}`}
            onChangeRaw={(e) => e.preventDefault()}
          />
        </div>
      </div>

      <FormField label="Gender" name="gender" type="select" value={guidanceForm.formData.gender || ""} onChange={guidanceForm.handleChange} error={guidanceForm.errors.gender} options={{ small: true }} selectOptions={["Male", "Female"]} />
      <FormField label="Contact Number" name="contactNumber" type="tel" value={guidanceForm.formData.contactNumber || ""} onChange={guidanceForm.handleChange} error={guidanceForm.errors.contactNumber} />
      <FormField label="Email" name="email" type="email" value={guidanceForm.formData.email || ""} onChange={guidanceForm.handleChange} error={guidanceForm.errors.email} />
      <FormField label="Address" name="address" value={guidanceForm.formData.address || ""} onChange={guidanceForm.handleChange} error={guidanceForm.errors.address} options={{ fullWidth: true }} />
      <FormField
          label="Position in Rogationist"
          name="positionInRc"
          type="select"
          value={guidanceForm.formData.positionInRc || ""}
          onChange={guidanceForm.handleChange}
          error={guidanceForm.errors.positionInRc}
          options={{ fullWidth: true }}
          selectOptions={POSITION_IN_RC_OPTIONS}
        />

    </div>
  );

  const renderStudentForm = () => (
    <div className="registration-form-grid">
      <FormField label="Student Number" name="studentNumber" value={studentForm.formData.studentNumber || ""} onChange={studentForm.handleChange} error={studentForm.errors.studentNumber} />
      <FormField label="Firstname" name="firstname" value={studentForm.formData.firstname || ""} onChange={studentForm.handleChange} error={studentForm.errors.firstname} />
      <FormField label="Lastname" name="lastname" value={studentForm.formData.lastname || ""} onChange={studentForm.handleChange} error={studentForm.errors.lastname} />
      <FormField label="MI" name="middlename" value={studentForm.formData.middlename || ""} onChange={studentForm.handleChange} error={studentForm.errors.middlename} options={{ small: true }} maxLength={1} />
      
      <div className="form-field-wrapper">
        <label className="form-label">
          Birthdate <span className="required-asterisk">*</span>
        </label>
        {studentForm.errors.birthdate && (
          <span className="error-message">{studentForm.errors.birthdate}</span>
        )}
        <div className="date-picker-wrapper">
          <DatePicker
            selected={studentForm.formData.birthdate}
            onChange={(date) => handleBirthdateChange(date, "STUDENT")}
            dateFormat="MM/dd/yyyy"
            placeholderText="Select birthdate"
            showYearDropdown
            scrollableYearDropdown
            yearDropdownItemNumber={100}
            openToDate={new Date(2000, 0, 1)}
            maxDate={new Date(2010, 11, 31)}
            className={`date-picker-input ${studentForm.errors.birthdate ? 'error' : ''}`}
            onChangeRaw={(e) => e.preventDefault()}
          />
        </div>
      </div>

      <FormField label="Gender" name="gender" type="select" value={studentForm.formData.gender || ""} onChange={studentForm.handleChange} error={studentForm.errors.gender} options={{ small: true }} selectOptions={["Male", "Female"]} />
      <FormField label="Contact Number" name="contactNumber" type="tel" value={studentForm.formData.contactNumber || ""} onChange={studentForm.handleChange} error={studentForm.errors.contactNumber} />
      <FormField label="Email" name="email" type="email" value={studentForm.formData.email || ""} onChange={studentForm.handleChange} error={studentForm.errors.email} />
      <FormField label="Address" name="address" value={studentForm.formData.address || ""} onChange={studentForm.handleChange} error={studentForm.errors.address} options={{ fullWidth: true }} />
      <FormField label="Section Name" name="sectionName" value={studentForm.formData.sectionName || ""} onChange={studentForm.handleChange} error={studentForm.errors.sectionName} />
      <FormField
        label="Cluster Head"
        name="clusterHead"
        type="select"
        value={studentForm.formData.clusterHead || ""}
        onChange={studentForm.handleChange}
        error={studentForm.errors.clusterHead}
        options={{ fullWidth: true }}
        selectOptions={CLUSTER_HEAD_OPTIONS}
      />
    </div>
  );

  return (
    <div className="registration-modal-overlay">
      <div className="registration-modal-content">
        <h2 className="registration-modal-title">
          Register {currentRole === "GUIDANCE" ? "Guidance" : "Student"}
        </h2>
        <div className="registration-form">
          {currentRole === "GUIDANCE" ? renderGuidanceForm() : renderStudentForm()}
          <div className="registration-form-actions">
            <button onClick={handleClose} className="registration-cancel-btn" type="button">
              Cancel
            </button>
            <button onClick={handleSubmit} className="registration-submit-btn" disabled={isProcessing || hasErrors()}>
              {isProcessing ? "Processing ..." : "Register"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccountModal;