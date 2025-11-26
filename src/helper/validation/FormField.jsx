import React from 'react';

export const FormField = ({ 
  label, 
  name, 
  type = "text", 
  value, 
  onChange, 
  error,
  options = {},
  selectOptions = [],
  className = "",
  ...props 
}) => {
  const hasError = !!error;
  const isSmall = options.small || false;
  const isFullWidth = options.fullWidth || false;

  const inputStyle = {
    borderColor: hasError ? '#f07a7aff' : '', 
    borderWidth: hasError ? '2px' : '',
    outline: hasError ? 'none' : '',
    boxShadow: hasError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : '' 
  };

  const errorStyle = {
    color: '#dc2626', 
    fontSize: '0.875rem',
    marginTop: '0.25rem',
    display: 'block'
  };

  return (
    <div className={`registration-form-group ${isSmall ? 'registration-form-group-small' : ''} ${isFullWidth ? 'registration-form-group-full' : ''} ${className}`}>
      <label>{label}</label>
      {type === "select" ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          style={inputStyle}
          {...props}
        >
          <option value="">Select</option>
          {selectOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          style={inputStyle}
          {...props}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          style={inputStyle}
          {...props}
        />
      )}
      {error && <span className="field-error" style={errorStyle}>{error}</span>}
    </div>
  );
};