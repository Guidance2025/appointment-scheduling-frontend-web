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
  const [globalError, setGlobalError] = useState("");
  const { showSuccess } = usePopUp();
  
  const CLUSTER_HEAD_OPTIONS = [
    "Ms Darlene Jane Neva Gener",
    "Angelo Nueva"
  ];

  const POSITION_IN_RC_OPTIONS = [
    "Guidance Counselor",
    "Guidance Facilitator",
  ];

  /**
   * Validates student number format: CT##-####
   * @param {string} studentNumber - The student number to validate
   * @returns {string|null} - Error message or null if valid
   */
  const validateStudentNumber = (studentNumber) => {
    if (!studentNumber || studentNumber.trim() === '') {
      return 'Student number is required';
    }

    const trimmed = studentNumber.trim().toUpperCase();

    // Check if it starts with CT
    if (!trimmed.startsWith('CT')) {
      return 'Student number must start with "CT"';
    }

    // Full regex pattern: CT + 2 digits + dash + 4 digits
    const pattern = /^CT\d{2}-\d{4}$/;
    
    if (!pattern.test(trimmed)) {
      // More specific error messages
      if (!trimmed.includes('-')) {
        return 'Student number must include a dash (e.g., CT22-0001)';
      }
      
      const parts = trimmed.split('-');
      
      if (parts.length !== 2) {
        return 'Invalid format. Use CT##-#### (e.g., CT22-0001)';
      }
      
      const prefix = parts[0]; // CT##
      const suffix = parts[1]; // ####
      
      // Check prefix (should be CT + 2 digits)
      if (prefix.length !== 4) {
        return 'Year must be 2 digits (e.g., CT22-0001)';
      }
      
      if (!/^CT\d{2}$/.test(prefix)) {
        return 'Invalid year format. Use CT## (e.g., CT22)';
      }
      
      // Check suffix (should be exactly 4 digits)
      if (suffix.length !== 4) {
        return 'Student ID must be exactly 4 digits (e.g., CT22-0001)';
      }
      
      if (!/^\d{4}$/.test(suffix)) {
        return 'Student ID must contain only numbers (e.g., 0001)';
      }
    }

    // Additional validation: Check if year is reasonable
    const yearPart = trimmed.substring(2, 4);
    const year = parseInt(yearPart, 10);
    const currentYear = new Date().getFullYear() % 100; // Get last 2 digits of current year
    
    if (year > currentYear + 1) {
      return `Year cannot be in the future (current year: ${currentYear})`;
    }
    
    if (year < 10) {
      return 'Year seems too old. Please verify the student number';
    }

    return null; // Valid
  };

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
    studentNumber: { 
      required: true,
      custom: validateStudentNumber
    },
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
      if (activeTab) {
        setCurrentRole(activeTab === "guidance" ? "GUIDANCE" : "STUDENT");
      }
      setFormKey(prev => prev + 1);
      setGlobalError("");
      
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

  /**
   * Format student number input as user types
   * Automatically adds dash after CT## and ensures uppercase
   */
  const handleStudentNumberChange = (e) => {
    let value = e.target.value.toUpperCase().trim();
    
    // Remove any existing dashes first
    value = value.replace(/-/g, '');
    
    // Ensure it starts with CT
    if (value && !value.startsWith('CT')) {
      if (value.startsWith('C')) {
        value = 'CT' + value.substring(1);
      } else if (value.startsWith('T')) {
        value = 'CT' + value;
      } else {
        value = 'CT' + value;
      }
    }
    
    // Auto-format: Add dash after CT##
    if (value.length > 4) {
      value = value.substring(0, 4) + '-' + value.substring(4, 8);
    }
    
    // Limit total length to CT##-#### (9 characters including dash)
    if (value.length > 9) {
      value = value.substring(0, 9);
    }
    
    // Update form with formatted value
    studentForm.handleChange({
      target: {
        name: 'studentNumber',
        value: value
      }
    });
    
    if (globalError) setGlobalError("");
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
          studentNumber: studentForm.formData.studentNumber.trim().toUpperCase(),
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
      setGlobalError("");
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
      const upperErrorMessage = errorMessage.toUpperCase();
      
      // Check for specific errors and highlight relevant fields
      if (upperErrorMessage.includes('EMAIL ALREADY EXISTS')) {
        currentForm.setErrors({ ...currentForm.errors, email: 'This email is already registered' });
        setGlobalError('Email already exists. Please use a different email.');
      } else if (upperErrorMessage.includes('USERNAME ALREADY EXISTS')) {
        // For guidance staff, username conflict typically relates to email
        guidanceForm.setErrors({ ...guidanceForm.errors, email: 'This account already exists' });
        setGlobalError('An account with this information already exists. Please check the email.');
      } else if (upperErrorMessage.includes('STUDENT NUMBER ALREADY EXISTS')) {
        studentForm.setErrors({ ...studentForm.errors, studentNumber: 'This student number is already registered' });
        setGlobalError('Student number already exists. Please use a different student number.');
      } else if (upperErrorMessage.includes('SECTION')) {
        studentForm.setErrors({ ...studentForm.errors, sectionName: 'Error with section information' });
        setGlobalError('There was an issue with the section. Please try again.');
      } else {
        // Handle cases where multiple errors are returned in the message
        let hasSetError = false;
        let newErrors = { ...currentForm.errors };
        
        if (upperErrorMessage.includes('EMAIL') && upperErrorMessage.includes('EXISTS')) {
          newErrors.email = 'This email is already registered';
          hasSetError = true;
        }
        
        if (upperErrorMessage.includes('STUDENT NUMBER') && upperErrorMessage.includes('EXISTS')) {
          newErrors.studentNumber = 'This student number is already registered';
          hasSetError = true;
        }
        
        if (hasSetError) {
          currentForm.setErrors(newErrors);
          setGlobalError('Some fields have errors. Please correct them and try again.');
        } else {
          setGlobalError(`Unable to create ${currentRole === "GUIDANCE" ? "guidance staff" : "student"} account. ${errorMessage}`);
        }
      }
      
      console.error("Error creating account:", error);
    }
  };

  const handleClose = () => {
    guidanceForm.resetForm();
    studentForm.resetForm();
    setGlobalError("");
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
    // Clear global error when user starts fixing issues
    if (globalError) setGlobalError("");
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
      <FormField label="Firstname" name="firstname" value={guidanceForm.formData.firstname || ""} onChange={(e) => { guidanceForm.handleChange(e); if (globalError) setGlobalError(""); }} error={guidanceForm.errors.firstname} />
      <FormField label="Lastname" name="lastname" value={guidanceForm.formData.lastname || ""} onChange={(e) => { guidanceForm.handleChange(e); if (globalError) setGlobalError(""); }} error={guidanceForm.errors.lastname} />
      <FormField label="MI" name="middlename" value={guidanceForm.formData.middlename || ""} onChange={(e) => { guidanceForm.handleChange(e); if (globalError) setGlobalError(""); }} error={guidanceForm.errors.middlename} options={{ small: true }} maxLength={1} />
      
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

      <FormField label="Gender" name="gender" type="select" value={guidanceForm.formData.gender || ""} onChange={(e) => { guidanceForm.handleChange(e); if (globalError) setGlobalError(""); }} error={guidanceForm.errors.gender} options={{ small: true }} selectOptions={["Male", "Female"]} />
      <FormField label="Contact Number" name="contactNumber" type="tel" value={guidanceForm.formData.contactNumber || ""} onChange={(e) => { guidanceForm.handleChange(e); if (globalError) setGlobalError(""); }} error={guidanceForm.errors.contactNumber} />
      <FormField label="Email" name="email" type="email" value={guidanceForm.formData.email || ""} onChange={(e) => { guidanceForm.handleChange(e); if (globalError) setGlobalError(""); }} error={guidanceForm.errors.email} />
      <FormField label="Address" name="address" value={guidanceForm.formData.address || ""} onChange={(e) => { guidanceForm.handleChange(e); if (globalError) setGlobalError(""); }} error={guidanceForm.errors.address} options={{ fullWidth: true }} />
      <FormField
          label="Position in Rogationist"
          name="positionInRc"
          type="select"
          value={guidanceForm.formData.positionInRc || ""}
          onChange={(e) => { guidanceForm.handleChange(e); if (globalError) setGlobalError(""); }}
          error={guidanceForm.errors.positionInRc}
          options={{ fullWidth: true }}
          selectOptions={POSITION_IN_RC_OPTIONS}
        />
    </div>
  );

  const renderStudentForm = () => (
    <div className="registration-form-grid">
      <FormField 
        label="Student Number" 
        name="studentNumber" 
        value={studentForm.formData.studentNumber || ""} 
        onChange={handleStudentNumberChange}
        error={studentForm.errors.studentNumber}
        maxLength={9}
      />
      <FormField label="Firstname" name="firstname" value={studentForm.formData.firstname || ""} onChange={(e) => { studentForm.handleChange(e); if (globalError) setGlobalError(""); }} error={studentForm.errors.firstname} />
      <FormField label="Lastname" name="lastname" value={studentForm.formData.lastname || ""} onChange={(e) => { studentForm.handleChange(e); if (globalError) setGlobalError(""); }} error={studentForm.errors.lastname} />
      <FormField label="MI" name="middlename" value={studentForm.formData.middlename || ""} onChange={(e) => { studentForm.handleChange(e); if (globalError) setGlobalError(""); }} error={studentForm.errors.middlename} options={{ small: true }} maxLength={1} />
      
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

      <FormField label="Gender" name="gender" type="select" value={studentForm.formData.gender || ""} onChange={(e) => { studentForm.handleChange(e); if (globalError) setGlobalError(""); }} error={studentForm.errors.gender} options={{ small: true }} selectOptions={["Male", "Female"]} />
      <FormField label="Contact Number" name="contactNumber" type="tel" value={studentForm.formData.contactNumber || ""} onChange={(e) => { studentForm.handleChange(e); if (globalError) setGlobalError(""); }} error={studentForm.errors.contactNumber} />
      <FormField label="Email" name="email" type="email" value={studentForm.formData.email || ""} onChange={(e) => { studentForm.handleChange(e); if (globalError) setGlobalError(""); }} error={studentForm.errors.email} />
      <FormField label="Address" name="address" value={studentForm.formData.address || ""} onChange={(e) => { studentForm.handleChange(e); if (globalError) setGlobalError(""); }} error={studentForm.errors.address} options={{ fullWidth: true }} />
      <FormField label="Section Name" name="sectionName" value={studentForm.formData.sectionName || ""} onChange={(e) => { studentForm.handleChange(e); if (globalError) setGlobalError(""); }} error={studentForm.errors.sectionName} />
      <FormField
        label="Cluster Head"
        name="clusterHead"
        type="select"
        value={studentForm.formData.clusterHead || ""}
        onChange={(e) => { studentForm.handleChange(e); if (globalError) setGlobalError(""); }}
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
        
        {globalError && (
          <div className="registration-error-message">
            {globalError}
          </div>
        )}
        
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