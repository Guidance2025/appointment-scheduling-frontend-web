import React, { useEffect, useState } from 'react';
import "../../../../css/admin/CreateAccountModal.css";
import { register } from '../../../../service/admin';
import { ArrowLeft } from 'lucide-react';
import { FormField } from '../../../../helper/validation/FormField';
import { useFormValidation } from '../../../../helper/validation/hooks/useFormValidation';
import { usePopUp } from '../../../../helper/message/pop/up/provider/PopUpModalProvider';

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

  const guidanceForm = useFormValidation(initialGuidanceData);
  const studentForm = useFormValidation(initialStudentData);
  const currentForm = currentRole === "GUIDANCE" ? guidanceForm : studentForm;

  // Validation Rules
  const guidanceValidationRules = {
    username: { required: true, minLength: 4 },
    password: { required: true, minLength: 6 },
    firstname: { required: true },
    lastname: { required: true },
    birthDate: {
      required: true,
      custom: (value) => {
        if (!value) return "Birthdate is required";
        const today = new Date();
        const birth = new Date(value);
        if (birth > today) return "Birthdate cannot be in the future";
        const age = today.getFullYear() - birth.getFullYear();
        if (age < 10) return "Age must be at least 10 years";
        if (age > 100) return "Age cannot be greater than 100 years";
        return null;
      },
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
    age: {
      required: true,
      number: true,
      custom: (value) => {
        if (value < 10 || value > 100) return "Age must be between 10 and 100";
        return null;
      }
    },
    gender: { required: true },
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

  const buildSubmissionData = () => {
    if (currentRole === "GUIDANCE") {
      return {
        guidanceStaff: {
          person: {
            firstName: guidanceForm.formData.firstname.trim(),
            lastName: guidanceForm.formData.lastname.trim(),
            middleName: guidanceForm.formData.middlename.trim(),
            birthDate: guidanceForm.formData.birthDate,
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
            age: studentForm.formData.age,
            gender: studentForm.formData.gender,
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

  if (!isOpen) return null;

  const renderGuidanceForm = () => (
    <div className="registration-form-grid">
      <FormField label="Username" name="username" value={guidanceForm.formData.username} onChange={guidanceForm.handleChange} error={guidanceForm.errors.username} />
      <FormField label="Password" name="password" type="password" value={guidanceForm.formData.password} onChange={guidanceForm.handleChange} error={guidanceForm.errors.password} />
      <FormField label="Firstname" name="firstname" value={guidanceForm.formData.firstname} onChange={guidanceForm.handleChange} error={guidanceForm.errors.firstname} />
      <FormField label="Lastname" name="lastname" value={guidanceForm.formData.lastname} onChange={guidanceForm.handleChange} error={guidanceForm.errors.lastname} />
      <FormField label="MI" name="middlename" value={guidanceForm.formData.middlename} onChange={guidanceForm.handleChange} error={guidanceForm.errors.middlename} options={{ small: true }} maxLength={1} />
      <FormField label="BirthDate" name="birthDate" type="date" value={guidanceForm.formData.birthDate} onChange={guidanceForm.handleChange} error={guidanceForm.errors.birthDate} />
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
      <FormField label="Age" name="age" type="number" value={studentForm.formData.age} onChange={studentForm.handleChange} error={studentForm.errors.age} />
      <FormField label="Gender" name="gender" type="select" value={studentForm.formData.gender} onChange={studentForm.handleChange} error={studentForm.errors.gender} options={{ small: true }} selectOptions={["Male", "Female"]} />
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
        <button className='back-button' onClick={handleClose}><ArrowLeft/></button>
        <h2 className="registration-modal-title">
          Register {currentRole === "GUIDANCE" ? "Guidance" : "Student"}
        </h2>
        <div className="registration-form">
          {currentRole === "GUIDANCE" ? renderGuidanceForm() : renderStudentForm()}
          <div className="registration-form-actions">
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
