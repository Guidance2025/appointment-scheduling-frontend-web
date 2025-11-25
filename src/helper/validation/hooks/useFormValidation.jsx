import { useState } from 'react';

export const useFormValidation = (initialData = {}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name]; 
        return newErrors;
      });
    }
  };

  const setFieldValue = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name]; 
        return newErrors;
      });
    }
  };

  const validateField = (name, value, rules) => {
    if (rules.required && !value) {
      return "This field is required";
    }

    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return "Invalid email address";
      }
    }

    if (rules.number && value && isNaN(value)) {
      return "Must be a number";
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      return `Must be at most ${rules.maxLength} characters`;
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      return rules.patternMessage || "Invalid format";
    }

    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  };

  const validate = (validationRules) => {
    const newErrors = {};

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, formData[fieldName], validationRules[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors); 
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(initialData);
    setErrors({});
  };

  const setFormErrors = (newErrors) => {
    setErrors(newErrors);
  };

  return {
    formData,
    errors,
    handleChange,
    setFieldValue,
    validate,
    resetForm,
    setErrors: setFormErrors,
    hasErrors: Object.keys(errors).length > 0
  };
};